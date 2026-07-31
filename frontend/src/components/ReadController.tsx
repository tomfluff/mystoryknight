import { useRef } from "react";
import { useDisclosure, useOs } from "@mantine/hooks";
import getAxiosInstance from "../utils/axiosInstance";
import { useUiStrings } from "../i18n/strings";
import classes from "./paper.module.css";

/*
 * Read-aloud controls in the paper say-sticker grammar: a 44px round
 * play/pause sticker plus a kingfisher restart sticker. Same /read endpoint
 * and audio handling as before the paper-craft reskin — only the shell
 * changed; play/pause/restart behaviour, autoPlay and the localized
 * aria-labels are unchanged. Playing state is glyph + colour (green + pause
 * bars), never colour alone.
 */

type Props = {
  id?: string;
  text: string;
  autoPlay?: boolean;
};

const ReadController = ({ text, autoPlay }: Props) => {
  const instance = getAxiosInstance();
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const os = useOs();
  const t = useUiStrings();

  const [playing, { open, close }] = useDisclosure(false, {
    onOpen: () => {
      if (audioRef.current) {
        audioRef.current.play();
      }
    },
    onClose: () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    },
  });

  const reset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  if (!text) return null;

  return (
    <div className={classes.sayGroup}>
      <button
        type="button"
        className={`${classes.say} ${playing ? classes.saying : ""}`}
        onClick={playing ? close : open}
        aria-label={playing ? t("pauseReading") : t("readAloud")}
      >
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
      <button
        type="button"
        className={`${classes.say} ${classes.sayRestart}`}
        disabled={!playing}
        onClick={reset}
        aria-label={t("restartReading")}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M12 5a7 7 0 1 1-6.3 4"
            fill="none"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M5 4v5h5"
            fill="none"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <audio
        ref={audioRef}
        autoPlay={autoPlay}
        preload="none"
        // Encoded, not interpolated raw: story text carries `&`, `#` and `+`,
        // each of which silently truncates or corrupts the query string, so the
        // narration read back a fragment of the passage or none of it.
        src={`${instance.defaults.baseURL}/read?os=${encodeURIComponent(
          os
        )}&text=${encodeURIComponent(text)}`}
        onEnded={close}
        onPlay={open}
        onPause={close}
      />
    </div>
  );
};

export default ReadController;
