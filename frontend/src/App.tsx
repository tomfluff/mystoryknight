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
import { useUiStrings } from "./i18n/strings";

function App() {
  const [opened, { toggle: toggleNavbar }] = useDisclosure(false);
  const t = useUiStrings();
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

  /* Rendered twice (header from `sm` up, navbar below) because
     visibleFrom/hiddenFrom are CSS-only; defined once so the two spots
     cannot drift. */
  const controls = (
    <>
      <Button
        disabled={!isSession}
        onClick={reset}
        color="orange.6"
        autoContrast
        h={44}
      >
        Reset
      </Button>
      <AboutModal />
      <PreferenceModal />
      <ColorSchemeToggle />
    </>
  );

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      navbar={{
        width: 320,
        breakpoint: "xs",
        /* The rail only ever holds the character and premise cards, so on
           desktop it stays collapsed until a character exists — otherwise an
           empty 320px column sits beside the entry card. `!opened` keeps the
           xs–sm band working: there the burger is visible but the navbar
           still counts as "desktop", so the burger must be able to open it. */
        collapsed: { mobile: !opened, desktop: !isCharacter && !opened },
      }}
      padding="sm"
    >
      <AppShell.Header px="md" py={8}>
        <Flex justify="space-between" align="center" direction="row" h="100%">
          <Burger
            opened={opened}
            onClick={toggleNavbar}
            hiddenFrom="sm"
            size="sm"
            /* 44px touch target (DESIGN.md, Interaction); glyph stays size="sm". */
            w={44}
            h={44}
            aria-label={opened ? t("closeMenu") : t("openMenu")}
          />
          <Group gap={8} wrap="nowrap">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt=""
              width={28}
              height={28}
              style={{ objectFit: "contain", display: "block" }}
            />
            <Text size="md">MyStoryKnight.</Text>
          </Group>
          {/* Below `sm` these controls move to the navbar; the fixed 60px
              header cannot fit them next to the burger on small screens. */}
          <Group gap="sm" visibleFrom="sm">
            {controls}
          </Group>
        </Flex>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section hiddenFrom="sm">
          <Group gap="sm">{controls}</Group>
        </AppShell.Section>
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
      {/* pb clears the fixed 60px footer: without it the footer sits over the
          end of a long entry card (the hero gallery ran 148px underneath it). */}
      <AppShell.Main w={rem("99vw")} pb={rem(76)}>
        {(!isSession || !isCharacter || !isPremise) && <InstructionView />}
        {isSession && isCharacter && isPremise && <StoryView />}
      </AppShell.Main>
      {/* py=8 leaves 44px of usable height inside the fixed 60px footer, so
          the author link can meet the 44px touch target. */}
      <AppShell.Footer px="sm" py={8}>
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
              h={44}
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
