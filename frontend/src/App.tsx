import "./App.css";
import {
  AppShell,
  Box,
  Burger,
  Button,
  Flex,
  Group,
  ScrollArea,
  Text,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import StoryView from "./components/StoryView";
import { ColorSchemeToggle } from "./components/ColorSchemeToggle/ColorSchemeToggle";
import { resetSession, useSessionStore } from "./stores/sessionStore";
import { useAdventureStore, clearStore } from "./stores/adventureStore";
import CharacterCard from "./components/CharacterCard";
import { useMemo } from "react";
import PremiseCard from "./components/PremiseCard";
import PreferenceModal from "./components/PreferenceModal/PreferenceModal";
import { resetPreferences } from "./stores/preferencesStore";
import AboutModal from "./components/AboutModal/AboutModal";
import InstructionView from "./components/InstructionView";

function App() {
  const [opened, { toggle: toggleNavbar }] = useDisclosure(false);
  const sessionId = useSessionStore.use.id();
  const isSession = useMemo(() => sessionId !== null, [sessionId]);

  const reset = () => {
    clearStore();
    resetSession();
    resetPreferences();
  };

  const image = useAdventureStore.use.image();
  const character = useAdventureStore.use.character();
  const isCharacter = useMemo(
    () => image !== null && character !== null,
    [image, character]
  );

  const premise = useAdventureStore.use.premise();
  const isPremise = useMemo(() => premise !== null, [premise]);

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      navbar={{
        width: 320,
        breakpoint: "xs",
        collapsed: { mobile: !opened },
      }}
      padding="sm"
    >
      <AppShell.Header p="md">
        <Flex justify="space-between" align="center" direction="row" h="100%">
          <Burger
            opened={opened}
            onClick={toggleNavbar}
            hiddenFrom="sm"
            size="sm"
          />
          <Text size="md">MyStoryKnight.</Text>
          <Group gap="sm">
            <Button disabled={!isSession} onClick={reset} color="orange">
              Reset
            </Button>
            <AboutModal />
            <PreferenceModal />
            <ColorSchemeToggle />
          </Group>
        </Flex>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section
          grow
          mt="xs"
          component={ScrollArea}
          type="scroll"
          scrollHideDelay={500}
        >
          <Flex direction="column">
            {isCharacter && (
              <CharacterCard image={image!} character={character!} />
            )}
            {isPremise && <PremiseCard premise={premise!} />}
          </Flex>
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main w={rem("99vw")}>
        {(!isSession || !isCharacter || !isPremise) && <InstructionView />}
        {isSession && isCharacter && isPremise && <StoryView />}
      </AppShell.Main>
      <AppShell.Footer p="sm">
        <Flex w="100%" h="100%" justify="center" align="center" gap="sm">
          <Box>
            <Text component="span" fw={500} fs="italic" ff="heading">
              MyStoryKnight.
            </Text>{" "}
            is a project by{" "}
            <Button
              component={Link}
              to="https://github.com/tomfluff"
              replace={false}
              radius="lg"
              size="compact-sm"
              variant="gradient"
              gradient={{ from: "violet", to: "grape", deg: 90 }}
              c="white"
              px="sm"
              leftSection={<FaStar />}
            >
              tomfluff
            </Button>
          </Box>
        </Flex>
      </AppShell.Footer>
    </AppShell>
  );
}

export default App;
