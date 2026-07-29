import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { createSelectors } from "../utils/createSelectors";

const initialState = {
  id: null as string | null,
  start: Date.now(),
  update: Date.now(),
  avatar: "user1.png",
};

export type TSession = typeof initialState;

export const useSessionStore = createSelectors(
  create<TSession>()(
    devtools(
      persist(() => initialState, {
        name: "session",
        storage: createJSONStorage(() => sessionStorage),
      }),
      {
        name: "Session",
      }
    )
  )
);

export const initSession = (id: string) => {
  useSessionStore.setState(() => {
    return {
      id,
      start: Date.now(),
      update: Date.now(),
      avatar: `user${Math.floor(Math.random() * 6) + 1}.png`,
    };
  });
};

export const resetSession = () => {
  useSessionStore.setState(initialState);
};
