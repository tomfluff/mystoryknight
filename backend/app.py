import os, sys
import random
import time
import uuid
from base64 import b64encode
from flask import Flask, jsonify, request, send_file, Response, stream_with_context
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import save_base64_image, logger_setup, get_mimetype
from config import *
from llm import Storyteller
import storage
import story_state

load_dotenv()

# Specify the static folder path
app = Flask(__name__)

# Cloud Run terminates TLS and forwards over plain HTTP. Without this,
# `request.host_url` builds http:// image URLs that an https:// page refuses to
# load as mixed content.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

# The largest payload we legitimately receive is a child's drawing as a base64
# data URL, which fits well inside this. Without a cap, anyone can make us
# decode an arbitrarily large body before a single validation runs.
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

# Only allow the frontend origins we actually deploy. A wildcard here lets any
# site in a visitor's browser spend our OpenAI credit.
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
CORS(app, origins=CORS_ORIGINS, methods=["GET", "POST"])


# Get the environment variables
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_ORG_ID = os.environ.get("OPENAI_ORG_ID")

PORT = os.environ.get("PORT", 5000)

HOST = os.environ.get("HOST", "0.0.0.0")
DEBUG = os.environ.get("DEBUG", "False").lower() in ("true", "1", "t")
LOGGER = os.environ.get("LOGGER", "False").lower() in ("true", "1", "t")
STORAGE_PATH = "static"

# /translate and /read are unauthenticated and spend OpenAI credit per call, so
# the text they accept is bounded. A generated story part runs a few hundred
# characters, so 5000 leaves room for the longest one plus a title.
MAX_TEXT_LENGTH = 5000

if LOGGER:
    logger = logger_setup("app", os.path.join(LOG_FOLDER, "app.log"), debug=DEBUG)
else:
    logger = None


# Initialize the storyteller
llm = Storyteller(OPENAI_API_KEY, OPENAI_ORG_ID)


def server_error(e):
    """The reply every route gives when it hits an unexpected exception.

    The exception text names the provider and our internals, and every endpoint
    here is reachable without authentication, so the caller only learns that
    something broke. The detail has to survive somewhere, though: `logger` is
    None unless LOGGER is set, which it is not in production, so app.logger
    carries the traceback to stderr and from there to Cloud Logging.
    """
    app.logger.exception("Unhandled error in %s", request.path)
    if logger:
        logger.error(str(e))
    return jsonify(type="error", message="Internal server error!", status=500), 500


@app.route("/api")
def index():
    # Return a json response representing the API, with the available endpoints
    response = dict(
        {
            "prefix": "/api",
            "endpoints": {
                "image": {
                    "methods": ["POST", "GET"],
                    "description": "Save and retrieve images",
                },
                "character": {
                    "methods": ["POST", "GET"],
                    "description": "Generate and retrieve characters",
                },
                "session": {
                    "methods": ["GET"],
                    "description": "Initialize and retrieve sessions",
                },
                "story/premise": {
                    "methods": ["POST"],
                    "description": "Generate a story premise",
                },
                "story/part": {
                    "methods": ["POST"],
                    "description": "Generate a story part",
                },
                "story": {
                    "methods": ["GET"],
                    "description": "Initialize a story",
                },
                "story/actions": {
                    "methods": ["POST"],
                    "description": "Generate story actions",
                },
                "read": {
                    "methods": ["POST"],
                    "description": "Read text using the API",
                },
            },
        }
    )
    # Sort the endpoints by name
    response["endpoints"] = dict(sorted(response["endpoints"].items()))
    return jsonify(type="success", message="API available", status=200, data=response)


@app.route("/api/image", methods=["POST"])
def image_save():
    # Read and validate before touching the payload. The old order indexed
    # data["image"] and split it BEFORE the guards below could run, so a
    # missing key raised KeyError and an empty or comma-less value raised
    # IndexError -- and with no handler on this route, both surfaced as 500s.
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(type="error", message="No data found!", status=400), 400

    base64_url = data.get("image")
    img_type = data.get("type")

    if not isinstance(base64_url, str) or not base64_url:
        if logger:
            logger.error("No image found in the request!")
            logger.debug(data)
        return jsonify(type="error", message="No image found!", status=400), 400

    if img_type not in APP_IMAGE_EXT:
        if logger:
            logger.error("Invalid image type!")
            logger.debug(data)
        return jsonify(type="error", message="Invalid image type!", status=400), 400

    # [-1] rather than [1]: takes the payload after a data: header when there is
    # one, the whole string when there is not, and cannot IndexError either way.
    img_data = base64_url.split(",", 1)[-1]
    img_fname = f"img_{uuid.uuid4().hex}.{img_type}"
    img_path = os.path.join(STORAGE_PATH, img_fname)
    try:
        os.makedirs(STORAGE_PATH, exist_ok=True)
        save_base64_image(img_data, img_path)
    except Exception as e:
        # Undecodable base64, a non-image payload, a truncated file: all of them
        # are the caller's mistake, so answer 400 rather than 500.
        if logger:
            logger.error(f"Image could not be saved: {e}")
        return jsonify(type="error", message="Invalid image data!", status=400), 400

    if logger:
        logger.info(f"Image saved: {img_path}")
    return jsonify(type="success", message="Image saved!", status=200, name=img_fname)


@app.route("/api/image/<img_name>", methods=["GET"])
def image_get(img_name):
    # Get the base64 image. Strip any directory part first, the same way
    # storage.read_story_image does, so the name can only ever resolve inside
    # STORAGE_PATH.
    img_name = os.path.basename(img_name)
    img_path = os.path.join(STORAGE_PATH, img_name)
    img_type = img_name.split(".")[-1]

    if not os.path.exists(img_path):
        if logger:
            logger.error(f"Image not found: {img_path}")
        return jsonify(type="error", message="Image not found!", status=404), 404

    if logger:
        logger.info(f"Image sent: {img_path}")
    return send_file(img_path, mimetype=f"image/{img_type}")


@app.route("/api/character", methods=["POST"])
def character_gen():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400), 400

        complexity = data.get("complexity", None)
        context = data.get("context", None)
        image = context["image"]
        if not image:
            if logger:
                logger.error("No image found in the request!")
                logger.debug(data)
            return jsonify(type="error", message="No image found!", status=400), 400

        result = llm.generate_character(image, complexity)
        return jsonify(
            type="success",
            message="Character generated!",
            status=200,
            data={
                "id": uuid.uuid4(),
                "image": {"src": image, **result["image"]},
                "character": {**result["character"]},
            },
        )
    except Exception as e:
        return server_error(e)


@app.route("/api/session", methods=["GET"])
def session_init():
    try:
        session_id = uuid.uuid4()
        if logger:
            logger.info(f"Session initialized: {session_id}")
        return jsonify(
            type="success",
            message="Session initialized!",
            status=200,
            data={"id": session_id},
        )
    except Exception as e:
        return server_error(e)


@app.route("/api/story/premise", methods=["POST"])
def premise_gen():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400), 400

        complexity = data.get("complexity", None)
        context = data.get("context", None)

        # The premise prompt is told to suit the character's traits, so send them.
        context = {
            "name": context.get("fullname"),
            "shortname": context.get("shortname"),
            "about": context.get("backstory"),
            "personality": context.get("personality"),
            "likes": context.get("likes"),
            "dislikes": context.get("dislikes"),
            "fears": context.get("fears"),
        }

        result = llm.generate_premise(
            context,
            complexity,
            PREMISE_GEN_COUNT,
        )
        if logger:
            logger.debug(f"Story premise generated: {result}")
        return jsonify(
            type="success",
            message="Story premise generated!",
            status=200,
            data={**result},
        )
    except Exception as e:
        return server_error(e)


@app.route("/api/story/part", methods=["POST"])
def part_gen():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400), 400

        complexity = data.get("complexity", None)
        context = data.get("context", None)

        # Client carries the story state; server advances it as a pure function.
        # Legacy sessions (or old frontends) send only the prose blob -- build a
        # degenerate state that self-heals on this very call.
        state = context.get("state")
        if not isinstance(state, dict) or "beat" not in state:
            state = story_state.degenerate_from_blob(context.get("story", ""))
        prompt_context = {
            k: v
            for k, v in context.items()
            # past_actions only matters to /story/actions; here it is noise.
            if k not in ("state", "story", "past_actions")
        }
        prompt_context.update(story_state.prompt_fields(state))

        result = llm.generate_story_part(prompt_context, complexity)
        part = result["part"]
        state = story_state.advance_state(state, part["text"], result.get("state_update", {}) or {})
        if story_state.needs_compaction(state):
            state["summary"] = llm.compact_summary(
                state["summary"], state["openThreads"]
            )

        part_id = uuid.uuid4()
        if logger:
            logger.debug(f"Story part generated: {result}")
        return jsonify(
            type="success",
            message="Story part generated!",
            status=200,
            data={"id": part_id, **part, "state": state},
        )
    except Exception as e:
        return server_error(e)


@app.route("/api/story/init", methods=["POST"])
def story_init():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400), 400

        complexity = data.get("complexity", None)
        context = data.get("context", None)

        # The frontend sends character and premise merged flat. Reshape, and keep
        # the full trait set -- the story prompts are told to stay true to it.
        context = {
            "premise": {
                "title": context.get("title"),
                "desc": context.get("desc"),
            },
            "protagonist": {
                "name": context.get("fullname"),
                "shortname": context.get("shortname"),
                "about": context.get("backstory"),
                "personality": context.get("personality"),
                "likes": context.get("likes"),
                "dislikes": context.get("dislikes"),
                "fears": context.get("fears"),
            },
        }

        result = llm.initialize_story(context, complexity)
        state = story_state.initial_state(
            result.pop("state_update", {}) or {}, result.get("text", "")
        )
        story_id = uuid.uuid4()
        part_id = uuid.uuid4()
        if logger:
            logger.info(f"Story initialized!")

        return jsonify(
            type="success",
            message="Story initialized!",
            status=200,
            data={"id": story_id, "parts": [{"id": part_id, **result}], "state": state},
        )
    except Exception as e:
        return server_error(e)


@app.route("/api/story/end", methods=["POST"])
def story_end():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400), 400

        complexity = data.get("complexity", None)
        context = data.get("context", None)

        # Replace the carried state object with the prompt-facing fields; keep
        # the legacy `story` blob only when no state exists.
        state = context.pop("state", None)
        context.pop("past_actions", None)  # actions-endpoint concern, noise here
        if isinstance(state, dict) and "beat" in state:
            context.pop("story", None)
            context.update(story_state.prompt_fields(state))
            context.pop("phase", None)  # the ending is unconditional
        result = llm.terminate_story(context, complexity)
        if logger:
            logger.info(f"Story ended!")
        part = result["part"]
        part_id = uuid.uuid4()
        return jsonify(
            type="success",
            message="Story ended!",
            status=200,
            data={"id": part_id, **part},
        )
    except Exception as e:
        return server_error(e)


@app.route("/api/story/actions", methods=["POST"])
def actions_gen():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400), 400

        complexity = data.get("complexity", None)
        context = data.get("context", None)

        # Same state normalization as /story/part and /story/end.
        state = context.pop("state", None)
        if isinstance(state, dict) and "beat" in state:
            context.pop("story", None)
            context.update(story_state.prompt_fields(state))
        result = llm.generate_actions(context, complexity, ACTION_GEN_COUNT)
        actions = result.get("list") or []
        # The prompt asks for exactly ACTION_GEN_COUNT, but never trust the count:
        # sampling more than the model returned raises ValueError.
        actions = random.sample(actions, min(ACTION_GEN_COUNT, len(actions)))
        # Stamp the kind in its own pass. Folding it into the comprehension below
        # would let a model-emitted "kind" key override the server's classification.
        actions = [{**a, "kind": "choice"} for a in actions]
        # Only offer chat when there is actually someone to talk to: a character
        # entity other than the protagonist.
        protagonist_name = (context.get("protagonist") or {}).get("name")
        chat_partners = [
            e
            for e in (state.get("entities") if isinstance(state, dict) else None) or []
            if e.get("kind") == "character" and e.get("name") != protagonist_name
        ]
        if chat_partners:
            actions.append(
                {
                    "kind": "chat",
                    "title": "Chat with...",
                    "desc": "Say something to one of the characters!",
                }
            )
        actions.append(
            {
                "kind": "ending",
                "title": "Ending",
                "desc": "Bring the story to an end and see what happens!",
            }
        )
        actions = [{"id": uuid.uuid4(), **a, "active": True} for a in actions]
        if logger:
            logger.debug(f"Story actions generated: {actions}")
        return jsonify(
            type="success",
            message="Story actions generated!",
            status=200,
            data={"list": actions},
        )
    except Exception as e:
        return server_error(e)


@app.route("/api/story/image", methods=["POST"])
def storyimage_gen():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400), 400

        # `previous_image` arrives either as a data URL (inline mode: the client
        # holds the bytes, since nothing is stored) or as a filename (url mode:
        # we read it back so the browser does not re-upload megabytes).
        prev = data.get("previous_image")
        if prev:
            if str(prev).startswith("data:"):
                pass  # already base64; llm.py strips the data: header
            else:
                prev_bytes = storage.read_story_image(prev, STORAGE_PATH)
                if prev_bytes:
                    data["previous_image"] = b64encode(prev_bytes).decode()
                else:
                    data.pop("previous_image", None)

        t_start = time.time()
        result = llm.generate_story_image(data)
        gen_seconds = round(time.time() - t_start, 1)

        # The model returns base64. Persist it and hand back a URL instead:
        # a ~2MB data URL per part would blow the client's sessionStorage quota.
        image_url, _ = storage.store_story_image(
            result["image_b64"], STORAGE_PATH, request.host_url.rstrip("/")
        )

        if logger:
            logger.debug(f"Story image generated: {image_url}")
        return jsonify(
            type="success",
            message="Story image generated!",
            status=200,
            data={
                "prompt": result["prompt"],
                "image_url": image_url,
                "seconds": gen_seconds,
            },
        )
    except Exception as e:
        return server_error(e)


@app.route("/api/translate", methods=["GET"])
def translate_text():
    try:
        text = request.args.get("text")
        src_lang = request.args.get("src_lang")
        tgt_lang = request.args.get("tgt_lang")

        if not text or len(text) > MAX_TEXT_LENGTH:
            if logger:
                logger.error("Missing or oversized text!")
            return jsonify(type="error", message="Invalid text!", status=400), 400

        if src_lang == tgt_lang:
            if logger:
                logger.debug("No translation needed!")
            return jsonify(
                type="success",
                message="No translation needed!",
                status=200,
                data={"text": text},
            )

        if logger:
            logger.debug(f"Translating text from {src_lang} to {tgt_lang}")
        result = llm.translate_text(text, src_lang, tgt_lang)
        return jsonify(
            type="success",
            message="Text translated!",
            status=200,
            data={"text": result},
        )
    except Exception as e:
        return server_error(e)


@app.route("/api/read", methods=["GET"])
def read_text():
    try:
        text = request.args.get("text")
        os = request.args.get("os", "undetermined")

        if not text or len(text) > MAX_TEXT_LENGTH:
            if logger:
                logger.error("Missing or oversized text!")
            return jsonify(type="error", message="Invalid text!", status=400), 400

        if logger:
            logger.debug(f"Generating speech for: {text}")

        mimetype = get_mimetype(os)
        return Response(
            stream_with_context(llm.send_tts_request(text, os)),
            mimetype=mimetype,
        )
    except Exception as e:
        return server_error(e)


@app.errorhandler(404)
def not_found(e):
    return jsonify(type="error", message="Not found!", status=404), 404


@app.errorhandler(413)
def too_large(e):
    # MAX_CONTENT_LENGTH makes Flask reject the body itself, but its default
    # reply is an HTML page the frontend's axios cannot read like the rest.
    return jsonify(type="error", message="Request too large!", status=413), 413


if __name__ == "__main__":
    app.run(host=HOST, port=int(PORT), debug=DEBUG)
