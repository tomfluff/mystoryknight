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
} from "@mantine/core";
import { useAdventureStore } from "../stores/adventureStore";
import { initSession, useSessionStore } from "../stores/sessionStore";
import getAxiosInstance from "../utils/axiosInstance";
import { useMutation } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import DrawingUploadModal from "./DrawingUploadModal";
import PremiseSelectModal from "./PremiseSelectModal";

const InstructionView = () => {
  const instance = getAxiosInstance();
  const session = useSessionStore.use.id();
  const character = useAdventureStore.use.character();
  const premise = useAdventureStore.use.premise();

  const [captureModal, { open: openCapture, close: closeCapture }] =
    useDisclosure();
  const [premiseModal, { open: openPremise, close: closePremise }] =
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

  return (
    <>
      <Center>
        <Paper withBorder p="xl" radius="lg" mt={rem(20)}>
          <Stack align="center" mb={rem(20)}>
            <Title order={3} fs="italic">
              Your Adventure Awaits
            </Title>
            <Divider size="sm" w={rem(128)} />
          </Stack>
          <Stack align="stretch" gap="lg">
            <Box opacity={!session ? 1 : 0.5}>
              <Text mb="xs">
                1. Start a new session to set up the system. You can change the
                settings afterwards.
              </Text>
              <Button
                size="md"
                onClick={() => newSession.mutate()}
                loading={newSession.isPending}
                disabled={session != null}
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
                  Could not reach the server. Check your connection and press
                  the button again.
                </Text>
              )}
            </Box>

            <Box opacity={session != null && !character ? 1 : 0.5}>
              <Text mb="xs">
                2. Upload a drawing of a character to be the hero of your story.
              </Text>
              <Button
                size="md"
                onClick={openCapture}
                disabled={session == null || character != null}
              >
                Capture your Drawing
              </Button>
            </Box>
            <Box
              opacity={
                session != null && character != null && !premise ? 1 : 0.5
              }
            >
              <Text mb="xs">
                3. Select a premise to set the stage for your story.
              </Text>
              <Button
                size="md"
                onClick={openPremise}
                disabled={character == null || premise != null}
              >
                Select a Premise
              </Button>
            </Box>
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
