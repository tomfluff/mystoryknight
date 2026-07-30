import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { createSelectors } from "../utils/createSelectors";
import { TImage } from "../types/Image";
import { TCharacter } from "../types/Character";
import { TPremise } from "../types/Premise";
import { TAction, TStory, TStoryPart, TStoryState } from "../types/Story";

const initialState = {
  id: null as string | null,
  image: null as TImage | null,
  character: null as TCharacter | null,
  premise: null as TPremise | null,
  story: null as TStory | null,
  // Optional on purpose: sessions persisted before this field existed
  // rehydrate without it; buildStoryContext falls back to a degenerate state.
  storyState: null as TStoryState | null,
  finished: false,
};

export const useAdventureStore = createSelectors(
  create<typeof initialState>()(
    devtools(
      persist(() => initialState, {
        name: "adventure",
        storage: createJSONStorage(() => sessionStorage),
      }),
      {
        name: "Adventure",
      }
    )
  )
);

export const clearStore = () => {
  useAdventureStore.setState(initialState);
};

export const setStoryState = (storyState: TStoryState) => {
  useAdventureStore.setState(() => ({ storyState }));
};

export const setCharacter = (
  id: string,
  image: TImage,
  character: TCharacter
) => {
  useAdventureStore.setState(() => {
    return {
      id,
      image,
      character,
    };
  });
};

export const setPremise = (premise: TPremise) => {
  useAdventureStore.setState(() => {
    return {
      premise,
    };
  });
};

export const startStory = (story: TStory) => {
  useAdventureStore.setState(() => {
    return {
      story,
    };
  });
};

export const appendStory = (part: TStoryPart) => {
  useAdventureStore.setState((state) => {
    if (!state.story) return state;
    return {
      story: {
        ...state.story,
        parts: [...state.story.parts, part],
      },
    };
  });
};

/*
 * Every part update goes through here, addressed by id rather than by
 * `parts[parts.length - 1]`. An illustration takes 12-30s, every StoryPart
 * stays mounted, and nothing cancels the request when the child picks an
 * action -- so a response routinely lands after the next part was appended,
 * and the last element is no longer the part that asked for it.
 *
 * Rebuilds the part instead of assigning into it: the old version mutated
 * objects that were already in the persisted state.
 */
const updatePart = (partId: string, fn: (part: TStoryPart) => TStoryPart) => {
  useAdventureStore.setState((state) => {
    if (!state.story) return state;
    return {
      story: {
        ...state.story,
        parts: state.story.parts.map((p) => (p.id === partId ? fn(p) : p)),
      },
    };
  });
};

export const updateActions = (partId: string, actions: TAction[]) => {
  updatePart(partId, (part) => ({ ...part, actions }));
};

export const chooseAction = (partId: string, action: TAction) => {
  updatePart(partId, (part) => ({
    ...part,
    actions: part.actions?.map((a) => ({
      ...a,
      active: false,
      // Match on id, not title: two actions can share a title.
      used: a.id === action.id ? true : a.used,
    })),
  }));
};

/*
 * Undo of chooseAction, for a continuation that failed. Without it the part
 * keeps every action disabled, handleActionClick refuses to fire again, and
 * because the store is persisted the dead end survives a reload.
 */
export const restoreActions = (partId: string) => {
  updatePart(partId, (part) => ({
    ...part,
    actions: part.actions?.map((a) => ({ ...a, active: true, used: false })),
  }));
};

export const getStoryText = () => {
  return useAdventureStore.getState().story?.parts.map((part) => part.text);
};

export const canChooseAction = () => {
  return useAdventureStore
    .getState()
    .story?.parts[
      useAdventureStore.getState().story!.parts.length - 1
    ].actions?.every((a) => !a.used);
};

export const updateStoryImage = (
  partId: string,
  image_url: string,
  seconds?: number
) => {
  updatePart(partId, (part) => ({
    ...part,
    image: image_url,
    imageSeconds: seconds,
  }));
};

export const setFinished = () => {
  useAdventureStore.setState((state) => {
    return {
      ...state,
      finished: true,
    };
  });
};
