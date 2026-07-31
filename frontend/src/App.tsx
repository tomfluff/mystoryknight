import "./App.css";
import { AppShell, Burger, Button, Flex, Group, ScrollArea } from "@mantine/core";
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
import PaperFilters from "./components/PaperFilters";
import { useUiStrings } from "./i18n/strings";
import classes from "./App.module.css";
import paperClasses from "./components/paper.module.css";

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
     cannot drift. The sticker grammar they wear lives in App.module.css. */
  const controls = (
    <>
      <Button
        disabled={!isSession}
        onClick={reset}
        className={classes.resetBtn}
        h={44}
      >
        {t("reset")}
      </Button>
      <AboutModal />
      <PreferenceModal />
      <ColorSchemeToggle />
    </>
  );

  return (
    <>
      {/* Torn-edge filters for every paper surface (entry mat, story mat,
          navbar cards, the footer scrap) — mounted exactly once. */}
      <PaperFilters />
      <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      navbar={{
        width: 320,
        breakpoint: "xs",
        /* Desktop: the navbar only holds character/premise cards, so it stays
           collapsed until a character exists — no empty 320px rail beside the
           entry screen. `!opened` keeps the xs–sm band working: there the
           burger is still visible but the navbar counts as "desktop", so the
           burger must be able to open it. Mobile key is unchanged. */
        collapsed: { mobile: !opened, desktop: !isCharacter && !opened },
      }}
      /* The craft ground runs edge to edge: no gutter around the world, and
         no Mantine hairlines framing it. */
      padding={0}
      withBorder={false}
    >
      <AppShell.Header px="md" py={8} className={classes.header}>
        <Flex justify="space-between" align="center" direction="row" h="100%" gap="sm">
          <Burger
            opened={opened}
            onClick={toggleNavbar}
            hiddenFrom="sm"
            size="sm"
            /* 44px touch target (DESIGN.md, Interaction); glyph stays size="sm". */
            w={44}
            h={44}
            className={classes.burger}
            aria-label={opened ? t("closeMenu") : t("openMenu")}
          />
          {/* The one wordmark in the app: the entry masthead's lockup moves
              here, so the brand is not stated twice in two design languages. */}
          <div className={classes.lockup}>
            <span className={classes.logoArt} aria-hidden="true">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt=""
                loading="eager"
              />
            </span>
            <p className={classes.wordmark}>MyStoryKnight.</p>
          </div>
          {/* Below `sm` these controls move to the navbar; the fixed 60px
              header cannot fit them next to the burger on small screens. */}
          <Group gap="sm" visibleFrom="sm" className={classes.controls}>
            {controls}
          </Group>
        </Flex>
      </AppShell.Header>
      <AppShell.Navbar p="md" className={classes.navbar}>
        <AppShell.Section hiddenFrom="sm">
          <Group gap="sm" className={classes.controls}>
            {controls}
          </Group>
        </AppShell.Section>
        <AppShell.Section
          grow
          mt="xs"
          component={ScrollArea}
          type="scroll"
          scrollHideDelay={500}
        >
          {/* The rail is the ground; the cards borrow the mat's scene without
              its floating-card silhouette — see App.module.css. */}
          {(isCharacter || isPremise) && (
            <div className={classes.navMat}>
              <div className={paperClasses.grain} aria-hidden="true" />
              {isCharacter && (
                <CharacterCard image={image!} character={character!} />
              )}
              {isPremise && <PremiseCard premise={premise!} />}
            </div>
          )}
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main className={classes.main}>
        {(!isSession || !isCharacter || !isPremise) && <InstructionView />}
        {isSession && isCharacter && isPremise && <StoryView />}
      </AppShell.Main>
      {/* py=8 leaves 44px of usable height inside the fixed 60px footer, so
          the author link can meet the 44px touch target. */}
      <AppShell.Footer px="sm" py={8} className={classes.footer}>
        <Flex w="100%" h="100%" justify="center" align="center">
          {/* A torn scrap lying on the ground, not a dark bar. */}
          <p className={classes.credit}>
            <span className={classes.creditMark}>MyStoryKnight.</span> is a
            project by{" "}
            <Link
              className={classes.creditLink}
              to="https://github.com/tomfluff"
              replace={false}
            >
              <FaStar aria-hidden="true" />
              tomfluff
            </Link>
          </p>
        </Flex>
      </AppShell.Footer>
      </AppShell>
    </>
  );
}

export default App;
