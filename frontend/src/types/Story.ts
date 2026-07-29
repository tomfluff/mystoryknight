import { TEntity } from "./Entity";

export type TAnalytics = {
  entities: TEntity[];
  intensity: string;
  emotion: string;
  positioning: string;
  complexity: string;
};

export type TMotion = {
  title: string;
  description: string;
  emotion: string;
  action: string;
  keywords: string[];
};

export type TEntityKind = "character" | "place" | "object";

export type TStoryEntity = {
  name: string; // canonical name, exact spelling
  kind: TEntityKind;
  note: string; // one clause: who/what this is + current status
};

export type TBeatPhase = "rising" | "climax" | "resolution";

export type TStoryBeat = {
  index: number; // parts generated so far (opening part = 1)
  target: number; // planned total parts, fixed at /story/init
  phase: TBeatPhase; // server-computed from index/target
};

export type TRecentPart = {
  text: string; // verbatim part text
  recap: string; // one past-tense sentence, model-written at generation time
};

/*
 * Client-carried story memory. The server advances it as a pure function on
 * every /story/part call and returns the new state alongside the part.
 */
export type TStoryState = {
  summary: string; // recaps of everything before the window, joined
  recentParts: TRecentPart[];
  entities: TStoryEntity[];
  openThreads: string[];
  beat: TStoryBeat;
};

export type TActionKind = "choice" | "motion_capture" | "ending";

export type TAction = {
  id: string;
  // Optional on purpose: stories persisted to sessionStorage before this field
  // existed rehydrate without it. See actionKind() in StoryPart.
  kind?: TActionKind;
  title: string;
  desc: string;
  active: boolean;
  used: boolean;
};

export type TStoryImage = {
  promt: string;
  url: string;
};

export type TStoryPart = {
  id: string;
  text: string;
  sentiment?: "happy" | "sad" | "neutral" | "shocking";
  keymoment?: string;
  actions?: TAction[];
  image?: string;
  imageSeconds?: number; // how long the illustration took to generate
  analytics?: TAnalytics;
};

export type TStory = {
  id: string;
  start: number;
  parts: TStoryPart[];
};
