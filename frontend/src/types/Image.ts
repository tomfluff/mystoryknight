import { TEntity } from "./Entity";

export type TColorUsage = {
  color: string;
  // A short note on where the color is used, e.g. "the cat's fur".
  usage: string;
};

export type TImage = {
  src: string;
  content?: string;
  style?: string;
  items?: TEntity[];
  colors?: TColorUsage[];
};
