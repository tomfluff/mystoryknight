import base64
import json
import os
from dotenv import load_dotenv
import requests
import sys
import random

from langcodes import Language

from openai import OpenAI

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import logger_setup
from config import *
from story_state import STAGE_GUIDELINES, EARLY_STAGES

DEBUG = LLM_DEBUG

load_dotenv()
LOGGER = os.environ.get("LOGGER", "False").lower() in ("true", "1", "t")

if LOGGER:
    logger = logger_setup("llm", os.path.join(LOG_FOLDER, "llm.log"), debug=DEBUG)
else:
    logger = None


class LLMError(RuntimeError):
    pass


class LLMRefusal(LLMError):
    """The model declined to answer -- distinct from the service being broken."""

    pass


def _unwrap_choice(choice):
    """Parsed JSON body of a chat choice, or raise. Never returns None."""
    if getattr(choice.message, "refusal", None):
        raise LLMRefusal(choice.message.refusal)
    if choice.finish_reason == "length":
        raise LLMError("model reply was truncated (max_completion_tokens)")
    if logger:
        logger.debug(f"Data string: '{choice.message.content}'")
    return json.loads(choice.message.content)


# Structured-output schemas. These MUST stay module constants: the API compiles
# each distinct schema into a decoding grammar and caches it, so building one
# per call would pay that cost on every request.
#
# Strict mode rules: every object needs "additionalProperties": false, and every
# property must be listed in "required". Length/range keywords (minItems,
# maxLength, minimum, ...) are rejected outright -- those constraints stay in the
# prompt text.

_SENTIMENT = {"type": "string", "enum": ["happy", "sad", "neutral", "shocking"]}

_PART_PROPS = {
    "text": {"type": "string", "description": "The story text for this part."},
    "keymoment": {
        "type": "string",
        "description": "One sentence describing a single scene from this part as a picture.",
    },
    "sentiment": _SENTIMENT,
}

_PART_OBJECT = {
    "type": "object",
    "properties": _PART_PROPS,
    "required": ["text", "keymoment", "sentiment"],
    "additionalProperties": False,
}


def _titled_list_schema(name, title_desc, desc_desc):
    return {
        "name": name,
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "list": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": title_desc},
                            "desc": {"type": "string", "description": desc_desc},
                        },
                        "required": ["title", "desc"],
                        "additionalProperties": False,
                    },
                }
            },
            "required": ["list"],
            "additionalProperties": False,
        },
    }


# Story-memory piggyback: the same call that writes a part also returns the
# state bookkeeping. The model never emits the full StoryState -- beat, window
# and summary are server-computed in story_state.py; the model only reports
# what it just wrote (recap) and what the story now contains (entities/threads).
_ENTITY = {
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "Canonical name, exact spelling. Never rename.",
        },
        "kind": {"type": "string", "enum": ["character", "place", "object"]},
        "note": {
            "type": "string",
            "description": "One short clause: who or what this is and their current status.",
        },
    },
    "required": ["name", "kind", "note"],
    "additionalProperties": False,
}

_STATE_UPDATE = {
    "type": "object",
    "properties": {
        "recap": {
            "type": "string",
            "description": "One past-tense sentence summarizing only the new part.",
        },
        "entities": {
            "type": "array",
            "items": _ENTITY,
            "description": "Every character, place and important object in the story so far. Start from the input entities, keep their exact names, update notes, append new ones. At most 12.",
        },
        "open_threads": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Unresolved plot threads, one short sentence each. Drop threads this part resolved. At most 5.",
        },
    },
    "required": ["recap", "entities", "open_threads"],
    "additionalProperties": False,
}

# initialize_story returns the part keys flat; the other two nest under "part".
# Kept as-is so app.py needs no change -- see app.py:323 vs :270 and :347.
SCHEMA_INITIALIZE_STORY = {
    "name": "initialize_story",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {**_PART_PROPS, "state_update": _STATE_UPDATE},
        "required": ["text", "keymoment", "sentiment", "state_update"],
        "additionalProperties": False,
    },
}

SCHEMA_GENERATE_STORY_PART = {
    "name": "generate_story_part",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {"part": _PART_OBJECT, "state_update": _STATE_UPDATE},
        "required": ["part", "state_update"],
        "additionalProperties": False,
    },
}

SCHEMA_COMPACT_SUMMARY = {
    "name": "compact_summary",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {"summary": {"type": "string"}},
        "required": ["summary"],
        "additionalProperties": False,
    },
}

SCHEMA_TERMINATE_STORY = {
    "name": "terminate_story",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {"part": _PART_OBJECT},
        "required": ["part"],
        "additionalProperties": False,
    },
}

SCHEMA_GENERATE_ACTIONS = _titled_list_schema(
    "generate_actions",
    "A plain instruction starting with a verb, at most four words. Never a name or a label.",
    "One sentence naming the character and what they do.",
)

SCHEMA_GENERATE_PREMISE = _titled_list_schema(
    "generate_premise",
    "At most four words, naming the place or the quest.",
    "One or two sentences: where the story happens and what the character must do.",
)

_STRING_LIST = {"type": "array", "items": {"type": "string"}}

SCHEMA_GENERATE_CHARACTER = {
    "name": "generate_character",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "image": {
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "One sentence describing what is drawn.",
                    },
                    "style": {
                        "type": "string",
                        "description": "Short style phrase, under ten words. Reused as an image-generation prompt.",
                    },
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "importance": {
                                    "type": "number",
                                    "description": "Between 0 and 1.",
                                },
                            },
                            "required": ["name", "importance"],
                            "additionalProperties": False,
                        },
                    },
                    "colors": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "color": {"type": "string"},
                                "usage": {
                                    "type": "string",
                                    "description": "Short note on where the color is used.",
                                },
                            },
                            "required": ["color", "usage"],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["content", "style", "items", "colors"],
                "additionalProperties": False,
            },
            "character": {
                "type": "object",
                "properties": {
                    "fullname": {"type": "string"},
                    "shortname": {"type": "string"},
                    "likes": _STRING_LIST,
                    "dislikes": _STRING_LIST,
                    "fears": _STRING_LIST,
                    "personality": _STRING_LIST,
                    "backstory": {
                        "type": "string",
                        "description": "Two or three sentences about who the character is.",
                    },
                },
                "required": [
                    "fullname",
                    "shortname",
                    "likes",
                    "dislikes",
                    "fears",
                    "personality",
                    "backstory",
                ],
                "additionalProperties": False,
            },
        },
        "required": ["image", "character"],
        "additionalProperties": False,
    },
}

SCHEMA_TRANSLATE_TEXT = {
    "name": "translate_text",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "translation": {
                "type": "string",
                "description": "The input text rendered in the target language, nothing else.",
            }
        },
        "required": ["translation"],
        "additionalProperties": False,
    },
}


class Storyteller:
    def __init__(self, key, org) -> None:
        # Placeholder rather than None when the key is absent: OpenAI() raises on
        # a missing key, and this runs at import, so the container would never
        # bind its port -- Cloud Run then reports only "failed to start and
        # listen on PORT" with no mention of the real cause. Starting up and
        # returning a 401 per request is far easier to diagnose.
        if not key and logger:
            logger.error(
                "OPENAI_API_KEY is not set -- every LLM call will fail with 401."
            )
        self.llm = OpenAI(api_key=key or "OPENAI_API_KEY_NOT_SET", organization=org or None)
        self.gpt4 = MODEL_GPT4
        self.gpt3 = MODEL_GPT3
        self.vision = MODEL_VISION
        self.image_gen = MODEL_IMAGE_GEN
        self.stt = MODEL_STT
        self.tts = MODEL_TTS

        if logger:
            logger.info(f"LLM storyteller initialized.")
        if logger:
            logger.debug(
                f"Modes: {self.gpt4}, {self.gpt3}, {self.vision}, {self.image_gen}, {self.stt}, {self.tts}"
            )

    # -- Storyteller Functions --

    def initialize_story(self, context, complexity):
        # Min 2: a 1-sentence cap produced 40-word run-ons at kindergarten level.
        length = random.choice([2, 2, 3, 3, 4])
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a great storyteller for children.
1. Read the input context: a premise and a protagonist.
2. Write the opening part of the story.
    - No more than %d sentences.
    - The protagonist from the context is the main character.
    - Call the protagonist by their shortname after the first mention, or use a pronoun.
    - Stay true to the protagonist's personality, likes, dislikes and fears. Show these through what they do, never by listing them.
    - Establish the setting and hint at what is at stake.
3. Language level: %s
4. Write "keymoment": one sentence describing a single scene from this part as a picture.
    - Show the main event of the part, in the place where it happens.
    - Mention every character present in the scene, and no one else.
    - Do not use any character's name; describe each by what they look like instead.
    - Never call anyone a child, kid, boy or girl. Describe what they actually are.
5. Set "sentiment" to the mood of this part.
6. Keep the content safe and age-appropriate. No violence, gore, or frightening imagery.
7. Write "state_update":
    - "recap": one past-tense sentence summarizing only this opening part.
    - "entities": every character, place and important object this opening introduced, with canonical names. At most 12.
    - "open_threads": the unresolved plot threads this opening set up, one short sentence each. At most 5.

Example JSON object:
{
    "text": "Once upon a time there was a cat named Johnny who loved to eat tuna. One day, while Johnny was playing with his toys, he heard a noise coming from the kitchen.",
    "keymoment": "A kitchen at night with an overturned tuna can spilling across the tiled floor.",
    "sentiment": "neutral",
    "state_update": {
        "recap": "Johnny the cat heard a strange noise coming from the kitchen.",
        "entities": [
            {"name": "Johnny", "kind": "character", "note": "the protagonist cat, loves tuna"},
            {"name": "the kitchen", "kind": "place", "note": "source of the strange noise"}
        ],
        "open_threads": ["What made the noise in the kitchen?"]
    }
}
"""
                        % (length, complexity),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(context, ensure_ascii=False, indent=2),
                    },
                ],
            },
        ]
        return self.send_gpt4_request(messages, SCHEMA_INITIALIZE_STORY)

    def terminate_story(self, context, complexity):
        endings = [
            "Ends in a plot twist.",
            "Ends with a moral lesson.",
            "Ends with a happy ending.",
            "Ends with a sad ending.",
        ]
        ending = random.choice(endings)
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a great storyteller for children.
1. Read the input: "summary" and "recent_parts" are the story so far, "entities" are its characters, places and objects, "open_threads" are the unresolved plot threads, plus the premise and the protagonist.
2. Write the final part of the story.
    - Resolve the problem set up by the premise AND every thread listed in open_threads. Leave nothing open.
    - Stay true to the protagonist's personality, likes, dislikes and fears.
    - Refer to other characters, places and things by their exact entity names. Never rename or reinvent them.
    - Call the protagonist by their shortname, or use a pronoun -- vary it naturally. Never repeat the full name.
    - %s
    - No more than 4 sentences.
3. Language level: %s
4. Write "keymoment": one sentence describing a single scene from this final part as a picture.
    - Show the main event of the part, in the place where it happens.
    - Mention every character present in the scene, and no one else.
    - Do not use any character's name; describe each by what they look like instead.
    - Never call anyone a child, kid, boy or girl. Describe what they actually are.
5. Set "sentiment" to the mood of this part.
6. Keep the content safe and age-appropriate. No violence, gore, or frightening imagery.

Example JSON object:
{
    "part": {
        "text": "Johnny followed the trail of crumbs and found the neighbour's puppy asleep beside the empty can. He laughed, shared his last tin with her, and after that the two of them ate dinner together every evening.",
        "keymoment": "A kitchen floor at dusk with an empty tuna can between two bowls and a puppy curled up asleep nearby.",
        "sentiment": "happy"
    }
}
"""
                        % (ending, complexity),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(context, ensure_ascii=False, indent=2),
                    },
                ],
            },
        ]
        return self.send_gpt3_request(messages, SCHEMA_TERMINATE_STORY)

    # Rotated per part so the prose does not settle into one skeleton. Left to
    # the model, every part opened "<name> decided to ..."; given a list to pick
    # from, it opened three parts in a row with onomatopoeia. Pick for it.
    OPENING_STYLES = [
        "with someone speaking -- a line of dialogue.",
        "with a sound effect.",
        "by describing the place the part happens in.",
        "with what another character does or says.",
        "with something the hero notices or feels.",
        "in the middle of the action, already underway.",
        "with a short question the hero asks themselves.",
    ]

    ACTION_FLAVORS = [
        "BOLD: a brave, daring move with a real risk that could go wrong.",
        "SNEAKY: a clever trick, disguise, or quiet plan nobody expects.",
        "KIND: talking, helping, or making an unlikely friend.",
        "SILLY: a funny, playful, slightly ridiculous idea that might just work.",
        "CURIOUS: poking at a mystery -- a strange detail worth investigating.",
        "IMAGINATIVE: an inventive use of an object or place from the story.",
        "FACE-A-FEAR: doing something that touches one of the character's fears, a chance to be brave.",
    ]

    def generate_actions(self, context, complexity, n=2):
        # Draw a different flavor per action, per turn -- without this the model
        # settles into the same safe explore/talk pair every time.
        flavors = random.sample(self.ACTION_FLAVORS, n)
        flavor_lines = "\n".join(
            f"    - Action {i + 1} must be {f}" for i, f in enumerate(flavors)
        )
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a great storyteller for children.
1. Read the input: the premise, the protagonist, the story summary, the recent parts, the entities, and the current phase.
2. Write exactly %d different actions the main character could take next, one per flavor:
%s
3. Each action must:
    - Be concrete and vivid: name the specific thing the character does, not a generic verb.
    - Have a consequence a child can picture -- something changes if you pick it.
    - Fit what this character would plausibly do, given their personality and fears.
    - Move the story towards the premise.
    - Refer to other characters, places and things by their exact entity names.
    - Have a "title" that is a plain instruction to the hero: start with a verb, at most four words, using everyday words a young child knows. For example: "Go to the tunnel", "Ask the frog", "Hide in the log", "Run away", "Open the door".
    - Never make the "title" a name, a label or a clever phrase. It must say what the hero does.
    - Have a "desc" of one sentence, using the protagonist's shortname, saying what they do.
4. Do not repeat any action listed in "past_actions".
5. If "phase" is "resolution", the story is nearly over: every action must move toward resolving the premise or an open thread, but keep its flavor.
6. Never title an action "Ending" or "Motion Capture". Those titles are reserved.
7. Language level: %s
8. Keep the content safe and age-appropriate. No violence, gore, or frightening imagery. Risky may mean embarrassing or tricky, never dangerous.

Example JSON object (flavors BOLD and SILLY):
{
    "list": [
        {
            "title": "Jump at the shadow",
            "desc": "Johnny leaps at the moving shadow behind the curtain, even though it might be bigger than him."
        },
        {
            "title": "Set a tuna trap",
            "desc": "Johnny balances his last tuna can on the door so whoever sneaks in gets a fishy surprise."
        }
    ]
}
"""
                        % (n, flavor_lines, complexity),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(context, ensure_ascii=False, indent=2),
                    },
                ],
            },
        ]
        return self.send_gpt4_request(messages, SCHEMA_GENERATE_ACTIONS)

    def generate_story_part(self, context, complexity):
        # Generate a story part based on the given context
        # Min 2: a 1-sentence cap produced 40-word run-ons at kindergarten level.
        length = random.choice([2, 2, 3, 3, 4])
        settings = [
            "Something bad happens to the main character.",
            "Introduce a new villain.",
            "Introduce a new friendly character.",
            "Move the story to a new location.",
            "End in a cliffhanger.",
        ]
        # Arc control: the hero's-journey stage (computed in story_state.py)
        # provides a GUIDELINE for this part -- explicitly framed as optional so
        # the child's choices keep directing the story. Random "spice" only in
        # the early stages; past the ordeal, extra complications fight the arc.
        # The resolution phase keeps a hard wrap-up directive on top.
        phase = context.get("phase", "rising")
        stage = context.get("journey_stage", "")
        guideline = STAGE_GUIDELINES.get(stage, "")
        directive = ""
        if stage in EARLY_STAGES:
            directive = random.choice(settings) + " "
        if guideline:
            stage_name = stage.replace("_", " ")
            directive += (
                f"Story guideline (hero's journey -- {stage_name}): {guideline} "
                "Connect to this beat only if it fits the way the story is "
                "evolving; never force it."
            )
        if phase == "resolution":
            directive += (
                " Begin wrapping up: move the story toward resolving the premise "
                "and the open_threads. Do not introduce new characters, places, "
                "or problems."
            )
        directive = directive.strip() or "Nudge the story gently toward the premise."
        opening = random.choice(self.OPENING_STYLES)

        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a great storyteller for children.
1. Read the input object:
    - "summary": the story so far, compacted.
    - "recent_parts": the latest parts, verbatim. The story continues from the end of the last one.
    - "entities": the characters, places and objects in the story, with their canonical names.
    - "open_threads": unresolved plot threads.
    - "action": what the main character does now.
2. Continue the story from the end of the last item in recent_parts, with the main character performing the given action.
    - If "action_source" is "chat", the action is words the hero says out loud to another character. Write the hero speaking them, and that character's reply, as dialogue. Do not add anyone new to the scene.
3. The new part must be:
    - A direct continuation. Never restate or summarize what already happened.
    - Showing the character carrying out the action, but NOT by announcing it. Never open with "<name> decided to ..." or "<name> did ...".
    - Opened this way: %s
    - True to the protagonist's personality, likes, dislikes and fears.
    - Referring to other characters, places and things by their exact entity names. Never rename or reinvent them.
    - Calling the protagonist by their shortname, or a pronoun -- vary it naturally. Never repeat the full name.
    - %s
    - No more than %d sentences.
4. Language level: %s
5. Write "keymoment": one sentence describing a single scene from this part as a picture.
    - Show the main event of the part, in the place where it happens.
    - Mention every character present in the scene, and no one else.
    - Do not use any character's name; describe each by what they look like instead.
    - Never call anyone a child, kid, boy or girl. Describe what they actually are.
6. Set "sentiment" to the mood of this part.
7. Keep the content safe and age-appropriate. No violence, gore, or frightening imagery.
8. Write "state_update":
    - "recap": one past-tense sentence summarizing only the new part.
    - "entities": every character, place and important object in the story so far. Start from the input entities, keep their exact names, update their notes, append anything new this part introduced. At most 12.
    - "open_threads": unresolved plot threads as short sentences. Drop any this part resolved. At most 5.

Example JSON object:
{
    "part": {
        "text": "Johnny decided to investigate the noise. He padded into the kitchen and found his tuna can lying empty on the floor.",
        "keymoment": "A kitchen at night with an empty tuna can on the tiled floor beside a knocked-over stool.",
        "sentiment": "sad"
    },
    "state_update": {
        "recap": "Johnny investigated the kitchen and found his tuna can empty.",
        "entities": [
            {"name": "Johnny", "kind": "character", "note": "the protagonist cat, hungry and suspicious"},
            {"name": "the kitchen", "kind": "place", "note": "scene of the tuna theft"}
        ],
        "open_threads": ["Who stole Johnny's tuna?"]
    }
}
"""
                        # Order matters: the text has the opening-style slot
                        # BEFORE the stage directive slot.
                        % (opening, directive, length + 1, complexity),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(context, ensure_ascii=False, indent=2),
                    },
                ],
            },
        ]
        return self.send_gpt4_request(messages, SCHEMA_GENERATE_STORY_PART)

    def generate_premise(self, character, complexity, n=2):
        # Generate a premise based on the given character
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a great storyteller for children.
1. Read the input: the main character's name, backstory and traits.
2. Write exactly %d different story premises for this character.
3. Each premise must:
    - Use a distinct place and pose a distinct problem, clearly different from the others.
    - Suit this character's personality, likes, dislikes and fears.
    - Have a "title" of at most four words naming the place or the quest.
    - Have a "desc" of one or two sentences saying where the story happens and what the character must do.
4. Language level: %s
5. Keep the content safe and age-appropriate. No violence, gore, or frightening imagery.

Example JSON object:
{
    "list": [
        {
            "title": "Sky Kingdom",
            "desc": "A kingdom floating above the clouds where the queen has been carried off by a dragon. The hero must climb the cloud stairs and bring her home."
        }
    ]
}
"""
                        % (n, complexity),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(character, ensure_ascii=False, indent=2),
                    },
                ],
            },
        ]
        return self.send_gpt3_request(messages, SCHEMA_GENERATE_PREMISE)

    def generate_character(self, drawing_url, complexity):
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a great storyteller for children. Describe the character drawn in this photo.
1. "image.content": one sentence describing what is drawn.
2. "image.style": a short phrase describing the visual style. It is reused as an
   image-generation style prompt, so keep it under ten words.
3. "image.items": each object drawn, with "name" and an "importance" between 0 and 1.
4. "image.colors": the main colors used, each with "color" and a short "usage" note.
5. "character.fullname" and "character.shortname": invent a friendly, age-appropriate
   name. Never use the name of a real or trademarked person or character.
6. "character.likes", "character.dislikes", "character.fears", "character.personality":
   three short entries each.
7. "character.backstory": two or three sentences about who the character is.
8. Language level: %s
9. Keep the content safe and age-appropriate. No violence, gore, or frightening imagery.
10. If the drawing is unclear, invent plausible details. Never reply that you cannot tell.

Example JSON object:
{
    "image": {
        "items": [
            {"name": "cat", "importance": 0.9},
            {"name": "food bowl", "importance": 0.4}
        ],
        "content": "A cat sitting in front of a food bowl.",
        "style": "simple crayon drawing, bright colors",
        "colors": [
            {"color": "black", "usage": "the cat's fur"},
            {"color": "red", "usage": "the food bowl"}
        ]
    },
    "character": {
        "fullname": "Johnny the Cat",
        "shortname": "Johnny",
        "likes": ["tuna", "playing", "sunny windows"],
        "dislikes": ["dogs", "water", "closed doors"],
        "fears": ["being hungry", "being alone", "thunder"],
        "personality": ["friendly", "greedy", "playful"],
        "backstory": "Johnny is a small black cat who lives in a busy kitchen. He is always hungry and always looking for his next snack. He is friendly to anyone who scratches his ears."
    }
}
"""
                        % (complexity),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": drawing_url},
                    },
                ],
            },
        ]
        return self.send_vision_request(messages, SCHEMA_GENERATE_CHARACTER)

    def generate_story_image(self, story_part):
        content = story_part["content"]
        style = story_part["style"]
        character = story_part.get("character") or {}
        reference_b64 = story_part.get("reference_image")
        story_text = story_part.get("story_text")

        # Prompt anatomy per the cookbook's prompting fundamentals: short
        # labeled segments in a consistent order (scene -> subject -> key
        # details -> constraints -> intended use), explicit composition and
        # lighting, and a preserve list repeated on every call.
        sentiment = story_part.get("sentiment")
        mood = {
            "happy": "warm, bright, cheerful lighting",
            "sad": "soft, gentle blue-tinted lighting",
            "shocking": "dramatic lighting with strong contrast",
            "neutral": "soft, even daylight",
        }.get(sentiment, "soft, even daylight")

        lines = [f"Scene: {content}"]
        if story_text:
            # Ground the scene in the passage the child just read -- the
            # keymoment alone is one sentence and often under-specifies who is
            # present and what is happening.
            lines.append(f'Story context: "{story_text}"')
        if reference_b64:
            # Multi-image rule: reference inputs by index; "same character, new
            # scene"; restate the preserve list each call to prevent drift.
            # Image 1 is the permanent identity anchor (the child's drawing);
            # Image 2, when present, is the latest illustration -- it carries
            # the rendering style and the character's current look, so the
            # character can evolve with the story without compounding drift.
            # NB: do not describe Image 1 as "the child's drawing" -- the image
            # model read "child" as a subject and drew a human child into the
            # scene.
            lines.append(
                "Subject: the main character from Image 1 (the reference "
                "drawing), mid-action in the scene, interacting with the things "
                "the scene mentions. Include every character the scene "
                "mentions, and no one else."
            )
            if story_part.get("previous_image"):
                lines.append(
                    "Image 2: the previous illustration of this story. Match its "
                    "rendering style and the character's current look."
                )
            lines.append(
                "Preserve: only the character's identity -- the shapes, colors "
                "and face from Image 1 must stay recognizable. The character's "
                "appearance may change with the story (pose, expression, props, "
                "clothing, getting wet or muddy)."
            )
            lines.append(
                "New scene: invent a fresh composition, camera angle and "
                "background for this scene. The input images are character "
                "references only -- do not copy their layout, background or "
                "composition."
            )
        else:
            # No reference image available -- fall back to a prose character sheet.
            desc = character.get("content")
            if desc:
                lines.append(
                    f"Subject: the main character -- {desc} -- mid-action in the "
                    "scene. Include every character the scene mentions."
                )
            colors = ", ".join(
                f"{c.get('color')} ({c.get('usage')})"
                for c in character.get("colors") or []
                if c.get("color")
            )
            if colors:
                lines.append(f"Preserve: the character's colors -- {colors}.")
        lines.append(
            "Composition: wide shot, eye-level, the whole character visible, "
            f"centered on the action. Lighting: {mood}."
        )
        lines.append(f"Style: {style}. Vivid colors, friendly, for young children.")
        lines.append(
            "Constraints: no text, no lettering, no watermark, no logos, "
            "nothing frightening. Do not add any people or characters that the "
            "scene does not mention."
        )
        lines.append("Intended use: a children's storybook illustration page.")
        prompt = "\n".join(lines)

        references = None
        if reference_b64:
            references = [reference_b64]
            if story_part.get("previous_image"):
                references.append(story_part["previous_image"])

        return {
            "prompt": prompt,
            "image_b64": self.send_image_request(prompt, references),
        }

    def compact_summary(self, summary, open_threads):
        # Safety valve only: fires when the recap-fold summary passes
        # MAX_SUMMARY_CHARS (roughly once per ~20 parts). Normal-path compaction
        # is free concatenation in story_state.advance_state.
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You compress a children's story summary. Rewrite the input summary in at most 8 sentences.
You MUST keep: every named character, every place, and every unresolved plot thread listed in open_threads.
Keep it in story order, past tense, plain prose.
""",
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(
                            {"summary": summary, "open_threads": open_threads},
                            ensure_ascii=False,
                        ),
                    }
                ],
            },
        ]
        return self.send_gpt3_request(messages, SCHEMA_COMPACT_SUMMARY)["summary"]

    def translate_text(self, text, source_language="en", target_language="en"):
        source = Language.get(source_language)
        target = Language.get(target_language)
        # Translate the given text to the target language using LLM
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
Translate text from %s to %s.
1. Translate the given text.
2. Return the translated text in the target language.

Example JSON object:
{
    "translation": "..."
}
"""
                        % (source, target),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Original text: '%s'." % text,
                    },
                ],
            },
        ]

        response = self.send_gpt3_request(messages, SCHEMA_TRANSLATE_TEXT)
        data = response["translation"]
        if logger:
            logger.debug(f"Translated text: {data}")
        return data

    def send_vision_request(self, request, schema=None):
        response = None
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.llm.api_key}",
            }
            # Only send the org header when one is configured. Interpolating a
            # missing value sends the literal string "None", which OpenAI
            # rejects with 401 mismatched_organization.
            if self.llm.organization:
                headers["OpenAI-Organization"] = self.llm.organization
            payload = {
                "model": self.vision,
                "messages": request,
                "max_completion_tokens": 1024,
                "reasoning_effort": LLM_REASONING_EFFORT,
            }
            if schema:
                payload["response_format"] = {
                    "type": "json_schema",
                    "json_schema": schema,
                }
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=(5, 120),
            )
            if logger:
                logger.debug(
                    f"Successfuly sent 'vision' LLM request with model={self.vision}"
                )

            # Check the status first: on a 400 the old code went straight for
            # ["choices"] and raised KeyError: 'choices', throwing away the API's
            # actual error message.
            if response.status_code != 200:
                raise LLMError(
                    f"vision request failed ({response.status_code}): {response.text[:500]}"
                )
            choice = response.json()["choices"][0]
            if choice["message"].get("refusal"):
                raise LLMRefusal(choice["message"]["refusal"])
            if choice["finish_reason"] == "length":
                raise LLMError("vision reply was truncated")
            return json.loads(choice["message"]["content"])
        except Exception as e:
            if logger:
                logger.error(str(e) + str(response))
            raise e

    def send_gpt4_request(
        self, request, schema=None, temperature=1.0, presence_penalty=0.0
    ):
        try:
            response = self.llm.chat.completions.create(
                model=self.gpt4,
                messages=request,
                response_format=(
                    {"type": "json_schema", "json_schema": schema}
                    if schema
                    else {"type": "json_object"}
                ),
                max_completion_tokens=1024,
                reasoning_effort=LLM_REASONING_EFFORT,
                temperature=temperature,
                presence_penalty=presence_penalty,
            )
            if logger:
                logger.debug(
                    f"Successfuly sent 'chat' LLM request with model={self.gpt4}"
                )
            return _unwrap_choice(response.choices[0])
        except Exception as e:
            if logger:
                logger.error(e)
            raise e

    def send_gpt3_request(
        self, request, schema=None, temperature=1.0, presence_penalty=0.0
    ):
        try:
            response = self.llm.chat.completions.create(
                model=self.gpt3,
                messages=request,
                response_format=(
                    {"type": "json_schema", "json_schema": schema}
                    if schema
                    else {"type": "json_object"}
                ),
                max_completion_tokens=1024,
                reasoning_effort=LLM_REASONING_EFFORT,
                temperature=temperature,
                presence_penalty=presence_penalty,
            )
            if logger:
                logger.debug(
                    f"Successfuly sent 'fast chat' LLM request with model={self.gpt3}"
                )
            return _unwrap_choice(response.choices[0])
        except Exception as e:
            if logger:
                logger.error(e)
            raise e

    def send_image_request(self, request, references=None):
        try:
            if references:
                # images.edit with the child's drawing as the reference anchors
                # the character to actual pixels -- the cookbook recipe for
                # children's-book consistency. There is no seed/gen_id in the
                # public API, so prompt-only consistency does not exist.
                # `references` order matters: it defines Image 1, Image 2, ...
                # as the prompt names them.
                files = []
                for i, ref_b64 in enumerate(references):
                    # The inline pipeline hands us WebP, so labelling every
                    # reference PNG lies about the bytes and the edit API's
                    # validation can reject them. The data: header carries the
                    # real type; without one the bytes came from url mode, which
                    # stores PNG.
                    media_type = "image/png"
                    if "," in ref_b64[:64]:  # strip a data: URL header if present
                        data_header, ref_b64 = ref_b64.split(",", 1)
                        if data_header.startswith("data:") and "/" in data_header:
                            media_type = data_header[len("data:") :].split(";", 1)[0]
                    files.append(
                        (
                            "image[]",
                            (
                                f"ref{i + 1}.{media_type.rsplit('/', 1)[-1]}",
                                base64.b64decode(ref_b64),
                                media_type,
                            ),
                        )
                    )
                headers = {"Authorization": f"Bearer {self.llm.api_key}"}
                if self.llm.organization:
                    headers["OpenAI-Organization"] = self.llm.organization
                response = requests.post(
                    "https://api.openai.com/v1/images/edits",
                    headers=headers,
                    files=files,
                    data={
                        "model": self.image_gen,
                        "prompt": request,
                        "size": IMAGE_GEN_RESOLUTION,
                        "quality": IMAGE_GEN_QUALITY,
                        "n": 1,
                        # Identity preservation for the reference character.
                        # Only send when configured -- mini rejects the param.
                        **(
                            {"input_fidelity": IMAGE_GEN_INPUT_FIDELITY}
                            if IMAGE_GEN_INPUT_FIDELITY
                            else {}
                        ),
                    },
                    timeout=(5, 180),
                )
                if response.status_code != 200:
                    raise LLMError(
                        f"image edit failed ({response.status_code}): {response.text[:500]}"
                    )
                if logger:
                    logger.debug(
                        f"Successfuly sent 'image edit' request with model={self.image_gen}"
                    )
                return response.json()["data"][0]["b64_json"]

            response = self.llm.images.generate(
                model=self.image_gen,
                prompt=request,
                size=IMAGE_GEN_RESOLUTION,
                quality=IMAGE_GEN_QUALITY,
                n=1,
            )
            if logger:
                logger.debug(
                    f"Successfuly sent 'image' LLM request with model={self.image_gen}"
                )

            # gpt-image-* always returns base64, never a URL.
            return response.data[0].b64_json
        except Exception as e:
            if logger:
                logger.error(e)
            raise e

    def send_tts_request(self, text, os="undetermined"):
        # Based on this answer: https://github.com/openai/openai-python/issues/864#issuecomment-1872681672
        url = "https://api.openai.com/v1/audio/speech"
        headers = {
            "Authorization": f"Bearer {self.llm.api_key}",
        }
        # See send_vision_request: interpolating a missing org sends "None".
        if self.llm.organization:
            headers["OpenAI-Organization"] = self.llm.organization
        data = {
            "model": self.tts,
            "input": text,
            "voice": "echo",
            "response_format": "mp3" if os == "ios" else "opus",
        }

        # Deliberately NOT a generator: the status check has to run before Flask
        # starts streaming, otherwise a failure raises after the headers are
        # flushed and the route's `except` can no longer turn it into a 500 --
        # the client just gets zero bytes under an audio mimetype.
        response = requests.post(
            url, headers=headers, json=data, stream=True, timeout=(5, 60)
        )
        if response.status_code != 200:
            detail = response.text[:500]
            response.close()
            if logger:
                logger.error(f"TTS request failed {response.status_code}: {detail}")
            raise RuntimeError(f"TTS request failed ({response.status_code})")

        if logger:
            logger.debug(f"Successfuly sent 'speech' LLM request with model={self.tts}")

        def stream():
            with response:
                for chunk in response.iter_content(chunk_size=4096):
                    yield chunk

        return stream()
