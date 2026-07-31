import { useRef } from "react";
import { ActionIcon, Group } from "@mantine/core";
import { useDisclosure, useOs } from "@mantine/hooks";
import getAxiosInstance from "../utils/axiosInstance";
import { FaPause, FaPlay } from "react-icons/fa";
import { FaRotateLeft } from "react-icons/fa6";
import { useUiStrings } from "../i18n/strings";

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
    <Group justify="space-between" align="center">
      {/* ActionIcon, not Button: a Button carries horizontal padding, so
          forcing one to 32px square squeezed the icon out entirely. */}
      <Group gap="xs">
        <ActionIcon
          variant="filled"
          size="lg"
          radius="xl"
          onClick={playing ? close : open}
          color="gray"
          aria-label={playing ? t("pauseReading") : t("readAloud")}
        >
          {playing ? <FaPause size={14} /> : <FaPlay size={14} />}
        </ActionIcon>

        <ActionIcon
          variant="subtle"
          size="lg"
          radius="xl"
          color="gray"
          disabled={!playing}
          onClick={reset}
          aria-label={t("restartReading")}
        >
          <FaRotateLeft size={14} />
        </ActionIcon>
      </Group>
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
    </Group>
  );
};

export default ReadController;
