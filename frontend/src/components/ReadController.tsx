import { useRef } from "react";
import { Group, Button } from "@mantine/core";
import { useDisclosure, useOs } from "@mantine/hooks";
import getAxiosInstance from "../utils/axiosInstance";
import { FaPause, FaPlay } from "react-icons/fa";
import { FaRotateLeft } from "react-icons/fa6";

type Props = {
  id?: string;
  text: string;
  autoPlay?: boolean;
};

const ReadController = ({ text, autoPlay }: Props) => {
  const instance = getAxiosInstance();
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const os = useOs();

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
      <Group gap="xs">
        <Button
          variant="filled"
          size="xs"
          radius="xl"
          onClick={playing ? close : open}
          color={"gray"}
        >
          {playing ? <FaPause /> : <FaPlay />}
        </Button>

        <Button
          variant="filled"
          size="xs"
          radius="xl"
          color="gray"
          disabled={!playing}
          onClick={reset}
        >
          <FaRotateLeft />
        </Button>
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
