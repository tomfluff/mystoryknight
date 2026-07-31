import {
  Button,
  Container,
  Modal,
  Select,
  Stack,
  Textarea,
} from "@mantine/core";
import { useState } from "react";
import { useAdventureStore } from "../stores/adventureStore";

type Props = {
  display: boolean;
  // "Say to <character>: <message>" -- becomes the story action.
  handleChat: (characterName: string, message: string) => void;
  finalAction: () => void;
};

/*
 * Lets the child speak to a story character. The exchange is submitted as a
 * regular /story/part action (action_source: "chat"), so the character's reply
 * arrives woven into the next story part -- no separate chat endpoint.
 */
const ChatUploadModal = ({ display, handleChat, finalAction }: Props) => {
  const [character, setCharacter] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const protagonist = useAdventureStore.getState().character?.fullname;
  const characters = (
    useAdventureStore.getState().storyState?.entities ?? []
  ).filter((e) => e.kind === "character" && e.name !== protagonist);

  const handleSend = () => {
    if (!character || !message.trim()) return;
    handleChat(character, message.trim());
    setMessage("");
    finalAction();
  };

  return (
    <Modal
      opened={display}
      onClose={finalAction}
      size="lg"
      title="Chat with..."
      centered
    >
      <Container>
        <Stack>
          <Select
            size="md"
            data={characters.map((c) => ({ value: c.name, label: c.name }))}
            value={character}
            onChange={(value) => value && setCharacter(value)}
            placeholder={
              characters.length === 0
                ? "No one else is in the story yet"
                : "Who do you want to talk to?"
            }
            disabled={characters.length === 0}
            allowDeselect={false}
          />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
            placeholder="What do you want to say?"
            autosize
            minRows={2}
            maxRows={4}
            maxLength={280}
          />
          <Button
            onClick={handleSend}
            disabled={!character || !message.trim()}
            fullWidth
            h={44}
          >
            Say it!
          </Button>
        </Stack>
      </Container>
    </Modal>
  );
};

export default ChatUploadModal;
