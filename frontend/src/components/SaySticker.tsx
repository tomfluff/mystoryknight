import { useRef } from "react";
import { useDisclosure, useOs } from "@mantine/hooks";
import getAxiosInstance from "../utils/axiosInstance";
import { useUiStrings } from "../i18n/strings";
import classes from "./InstructionView.module.css";

/*
 * Paper-sticker variant of ReadController for the entry view: one 44px round
 * play/pause sticker per line of copy. Same real /read endpoint and audio
 * handling as ReadController; only the shell differs (the story view keeps
 * ReadController untouched).
 */

type Props = {
  text: string;
};

/* Module-level "currently narrating" handle: only one sticker may play at a
   time. Starting one pauses (and visually resets, via its close) whichever
   other sticker was playing. */
let activeSticker: { close: () => void } | null = null;

const SaySticker = ({ text }: Props) => {
  const instance = getAxiosInstance();
  const audioRef = useRef<HTMLAudioElement>(null);
  const os = useOs();
  const t = useUiStrings();

  /* Stable per-instance identity for the activeSticker handle; `close` is
     assigned after useDisclosure returns. */
  const selfRef = useRef({ close: () => {} });

  const [playing, { open, close }] = useDisclosure(false, {
    onOpen: () => {
      if (activeSticker && activeSticker !== selfRef.current) {
        activeSticker.close();
      }
      activeSticker = selfRef.current;
      audioRef.current?.play();
    },
    onClose: () => {
      audioRef.current?.pause();
      if (activeSticker === selfRef.current) {
        activeSticker = null;
      }
    },
  });
  selfRef.current.close = close;

  if (!text) return null;

  return (
    <>
      <button
        type="button"
        className={`${classes.say} ${playing ? classes.saying : ""}`}
        onClick={playing ? close : open}
        aria-label={playing ? t("pauseReading") : t("readAloud")}
      >
        {/* Playing state is glyph + colour, never colour alone: the speaker
            swaps for chunky rounded pause bars in the same sticker style. */}
        {playing ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="6" y="5.5" width="4.4" height="13" rx="2.2" fill="#fff" />
            <rect x="13.6" y="5.5" width="4.4" height="13" rx="2.2" fill="#fff" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 9.5v5h3.2L12 19V5L7.2 9.5z" fill="#fff" />
            <path
              d="M15 9q2 3 0 6M18 7q3.4 5 0 10"
              stroke="#fff"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      <audio
        ref={audioRef}
        preload="none"
        // Encoded, not interpolated raw (see ReadController): text with `&`,
        // `#` or `+` would silently truncate or corrupt the query string.
        src={`${instance.defaults.baseURL}/read?os=${encodeURIComponent(
          os
        )}&text=${encodeURIComponent(text)}`}
        onEnded={close}
        onPlay={open}
        onPause={close}
      />
    </>
  );
};

export default SaySticker;
