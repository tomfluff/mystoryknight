import {
  Center,
  Paper,
  Stack,
  Title,
  rem,
  Text,
  Button,
  Box,
  Group,
  ThemeIcon,
} from "@mantine/core";
import { FaCheck } from "react-icons/fa";
import { useAdventureStore } from "../stores/adventureStore";
import { initSession, useSessionStore } from "../stores/sessionStore";
import getAxiosInstance from "../utils/axiosInstance";
import { useMutation } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import DrawingUploadModal from "./DrawingUploadModal";
import HeroGallery from "./HeroGallery";
import PremisePicker from "./PremisePicker";
import { useUiStrings } from "../i18n/strings";

type TStepState = "current" | "locked" | "done";

/*
 * One setup step. A finished step collapses to its marker and a one-line
 * summary: keeping the full paragraph and a dead button gave completed work
 * the same visual weight as the thing the child still has to do, so nothing
 * on the card read as primary.
 */
const Step = ({
  n,
  state,
  title,
  done,
  children,
}: {
  n: number;
  state: TStepState;
  title: string;
  done: string;
  children?: React.ReactNode;
}) => (
  <Group align="flex-start" gap="sm" wrap="nowrap">
    <ThemeIcon
      radius="xl"
      size={26}
      variant={state === "current" ? "filled" : "light"}
      color={state === "done" ? "green" : state === "current" ? undefined : "gray"}
      aria-hidden="true"
    >
      {state === "done" ? (
        <FaCheck size={11} />
      ) : (
        <Text size="xs" fw={700}>
          {n}
        </Text>
      )}
    </ThemeIcon>
    <Box flex={1} miw={0} opacity={state === "locked" ? 0.55 : 1}>
      {state === "done" ? (
        <Text size="sm" c="dimmed">
          {done}
        </Text>
      ) : (
        <>
          <Text size="sm" mb={8}>
            {title}
          </Text>
          {children}
        </>
      )}
    </Box>
  </Group>
);

const InstructionView = () => {
  const instance = getAxiosInstance();
  const t = useUiStrings();
  const session = useSessionStore.use.id();
  const character = useAdventureStore.use.character();
  const premise = useAdventureStore.use.premise();

  const [captureModal, { open: openCapture, close: closeCapture }] =
    useDisclosure();

  const newSession = useMutation({
    mutationKey: ["session"],
    mutationFn: () => {
      return instance.get("/session").then((res) => res.data);
    },
    onSuccess: (data) => {
      initSession(data.data.id);
    },
  });

  const step1: TStepState = session ? "done" : "current";
  const step2: TStepState = character ? "done" : session ? "current" : "locked";
  const step3: TStepState = premise
    ? "done"
    : session && character
    ? "current"
    : "locked";

  return (
    <>
      <Center>
        {/* Fixed measure rather than "as wide as the longest sentence": the
            card used to size itself to its copy, so it stretched to ~650px
            and left the hero gallery adrift in an empty right half. */}
        <Paper withBorder p="lg" radius="md" mt={rem(16)} w="100%" maw={rem(544)}>
          <Title order={1} size="h4" ta="center" mb="lg">
            Your Adventure Awaits
          </Title>
          <Stack align="stretch" gap="md">
            <Step
              n={1}
              state={step1}
              done={t("stepDoneSession")}
              title="Start a new session to set up the system. You can change the settings afterwards."
            >
              <Button
                size="sm"
                onClick={() => newSession.mutate()}
                loading={newSession.isPending}
              >
                Start New Session
              </Button>
              {newSession.isPending && (
                <Text size="xs" c="dimmed" mt={6}>
                  Waking up the server. The first start can take up to a minute.
                </Text>
              )}
              {newSession.isError && (
                <Text size="xs" c="red" mt={6}>
                  Could not reach the server. Check your connection and press the
                  button again.
                </Text>
              )}
            </Step>

            <Step
              n={2}
              state={step2}
              done={t("stepDoneHero")}
              title="Upload a drawing of a character to be the hero of your story."
            >
              <Button size="sm" onClick={openCapture} disabled={session == null}>
                Capture your Drawing
              </Button>
              {/* Second route to the same character pipeline, for children
                  without a camera or a drawing to hand. */}
              {session != null && <HeroGallery />}
            </Step>

            <Step
              n={3}
              state={step3}
              done={t("stepDonePremise")}
              title="Select a premise to set the stage for your story."
            >
              {/* Inline, not a modal: the last setup step now works like the
                  first two, and its generation wait is visible in place. */}
              {character && <PremisePicker character={character} />}
            </Step>
          </Stack>
        </Paper>
      </Center>
      <DrawingUploadModal display={captureModal} finalAction={closeCapture} />
    </>
  );
};

export default InstructionView;
