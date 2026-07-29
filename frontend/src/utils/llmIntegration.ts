import { usePreferencesStore } from "../stores/preferencesStore";
import { useAdventureStore } from "../stores/adventureStore";
import { TStory, TStoryState } from "../types/Story";

type TComplexity = {
  value: number;
  label: string;
  prompt: string;
};

export const languageOptions = [
  { label: "English", value: "en" },
  { label: "Hebrew", value: "he" },
  { label: "Japanese", value: "ja" },
  { label: "Spanish", value: "es" },
];

export const complexityOptions: TComplexity[] = [
  {
    value: 0,
    label: "Easy",
    prompt:
      "Kindergarden to 2nd grade level of language and concepts. No complex words or ideas. Short sentences and paragraphs.",
  },
  {
    value: 1,
    label: "Medium",
    prompt:
      "3rd grade to 6th grade level of language and concepts. No complex words or ideas. Short sentences and paragraphs.",
  },
  {
    value: 2,
    label: "Hard",
    prompt:
      "7th grade to 12th grade level of language and concepts. Some complex words and ideas. Long sentences and paragraphs.",
  },
  {
    value: 3,
    label: "Expert",
    prompt:
      "Professional level of language and concepts. Many complex words and ideas. Long sentences and paragraphs.",
  },
];

export const getComplexityPrompt = (complexity: number) => {
  return complexityOptions.find((d) => d.value === complexity)?.prompt;
};

/*
 * Legacy sessions have parts but no storyState. Build a degenerate state from
 * the raw parts; it self-heals on the next /story/part call (the piggyback
 * regenerates entities/threads and the server returns a real state).
 */
const degenerateState = (story: TStory): TStoryState => {
  const texts = story.parts.map((p) => p.text);
  const index = texts.length;
  const target = Math.max(index + 4, 8); // legacy story gets >=4 more parts of runway
  // Mirrors compute_phase in backend/story_state.py.
  const r = (index + 1) / target;
  return {
    summary: texts.slice(0, -3).join(" "), // verbatim, not compacted -- one-time cost
    recentParts: texts.slice(-3).map((text) => ({ text, recap: text })),
    entities: [], // prompt tolerates empty; repopulated next turn
    openThreads: [],
    beat: {
      index,
      target,
      phase: r < 0.7 ? "rising" : r < 1.0 ? "climax" : "resolution",
    },
  };
};

/*
 * The story prompts all expect the same shape: the premise being worked toward,
 * the protagonist to stay in character as, and the story memory. Building it in
 * one place keeps the three story endpoints consistent.
 */
export const buildStoryContext = () => {
  const { character, premise, story, storyState } = useAdventureStore.getState();
  const state = story ? storyState ?? degenerateState(story) : null;
  return {
    premise: premise?.desc,
    protagonist: {
      name: character?.fullname,
      shortname: character?.shortname,
      about: character?.backstory,
      personality: character?.personality,
      likes: character?.likes,
      dislikes: character?.dislikes,
      fears: character?.fears,
    },
    // Full state object: the server advances it and returns the successor.
    // The server flattens the prompt-facing fields out of it per endpoint.
    state,
    // Without this the model happily re-offers a choice the child already took.
    // Only real choices -- the reserved Motion Capture / Ending entries are not
    // story actions and would just be noise in the prompt.
    past_actions:
      story?.parts.flatMap(
        (p) =>
          p.actions
            ?.filter((a) => a.used && (a.kind ?? "choice") === "choice")
            .map((a) => a.title) ?? []
      ) ?? [],
  };
};

export const createCallContext = (data: any) => {
  const complexity = usePreferencesStore.getState().storyComplexity;
  const complexityPrompt = getComplexityPrompt(complexity);
  return {
    complexity: complexityPrompt,
    context: data,
  };
};
