import {
  Center,
  Paper,
  Stack,
  Title,
  Divider,
  rem,
  Text,
  Button,
  Box,
  Group,
  ThemeIcon,
  Loader,
} from "@mantine/core";
import { FaCheck } from "react-icons/fa";
import { useAdventureStore } from "../stores/adventureStore";
import { initSession, useSessionStore } from "../stores/sessionStore";
import getAxiosInstance from "../utils/axiosInstance";
import { useIsFetching, useMutation } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import DrawingUploadModal from "./DrawingUploadModal";
import PremiseSelectModal from "./PremiseSelectModal";
import HeroGallery from "./HeroGallery";
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
      size={32}
      variant={state === "current" ? "filled" : "light"}
      color={state === "done" ? "green" : state === "current" ? undefined : "gray"}
      aria-hidden="true"
    >
      {state === "done" ? <FaCheck size={14} /> : <Text fw={700}>{n}</Text>}
    </ThemeIcon>
    <Box flex={1} miw={0} opacity={state === "locked" ? 0.55 : 1}>
      {state === "done" ? (
        <Text c="dimmed">{done}</Text>
      ) : (
        <>
          <Text mb="xs">{title}</Text>
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
  const [premiseModal, { open: openPremise, close: closePremise }] =
    useDisclosure();

  /* Premise generation starts the moment a character exists -- the modal is
     mounted but closed, so the whole wait happens out here and used to look
     like nothing was happening. Read it from the query cache. */
  const premisesPending = useIsFetching({ queryKey: ["premise"] }) > 0;

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
        <Paper withBorder p="xl" radius="lg" mt={rem(20)}>
          <Stack align="center" mb={rem(20)}>
            <Title order={1} size="h3" fs="italic">
              Your Adventure Awaits
            </Title>
            <Divider size="sm" w={rem(128)} />
          </Stack>
          <Stack align="stretch" gap="lg">
            <Step
              n={1}
              state={step1}
              done={t("stepDoneSession")}
              title="Start a new session to set up the system. You can change the settings afterwards."
            >
              <Button
                size="md"
                h={44}
                onClick={() => newSession.mutate()}
                loading={newSession.isPending}
              >
                Start New Session
              </Button>
              {newSession.isPending && (
                <Text size="sm" c="dimmed" mt="xs">
                  Waking up the server. The first start can take up to a minute.
                </Text>
              )}
              {newSession.isError && (
                <Text size="sm" c="red" mt="xs">
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
              <Button
                size="md"
                h={44}
                onClick={openCapture}
                disabled={session == null}
              >
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
              <Button
                size="md"
                h={44}
                onClick={openPremise}
                disabled={character == null}
                /* Not `loading`: that swaps the label out for the spinner and
                   leaves an unlabelled button. Keep the label, add the loader
                   beside it. */
                leftSection={
                  premisesPending ? <Loader size="xs" color="white" /> : undefined
                }
              >
                Select a Premise
              </Button>
              {premisesPending && (
                <Text size="sm" c="dimmed" mt="xs" role="status">
                  {t("premiseNoteWaiting")}
                </Text>
              )}
            </Step>
          </Stack>
        </Paper>
      </Center>
      <DrawingUploadModal display={captureModal} finalAction={closeCapture} />
      <PremiseSelectModal
        character={character}
        display={premiseModal}
        finalAction={closePremise}
      />
    </>
  );
};

export default InstructionView;
