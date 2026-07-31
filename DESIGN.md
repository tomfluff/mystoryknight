# Design system

The incumbent design system of the frontend (`frontend/`, React + Mantine 7).
These decisions already exist in the code; this file writes them down so they
stop being re-derived per component. When adding a component, follow this file;
when a decision here has a WHY, do not undo it without addressing the WHY.

## Stack and theme setup

- Mantine 7 with a minimal theme (`frontend/src/main.tsx`):
  `createTheme({ primaryColor: "violet" })`, `defaultColorScheme="dark"`.
- The app is wrapped in Mantine's `DirectionProvider`; `useLanguageDirection`
  (`frontend/src/hooks/useLanguageDirection.ts`) syncs `<html lang>` and text
  direction with the language preference on load and on every change.
- Layout shell is Mantine `AppShell` (header 60px, footer 60px, navbar 320px,
  navbar breakpoint `xs`) in `frontend/src/App.tsx`.
- Component-specific styles live in CSS Modules next to the component
  (`ActionButton.module.css` etc.), not in global CSS. Global CSS is a
  body-margin reset only.

## Colour

Palette roles (Mantine palette names — never raw hex in components; the only
sanctioned hex is the sparkle block, see below):

| Role | Colour | Where | Why |
|---|---|---|---|
| Primary / story voice | `violet` | Theme `primaryColor`; story-part bubbles; action buttons | The app's identity colour; storyteller surfaces and story choices read as one voice |
| Destructive | `orange.6` + `autoContrast` | Reset button (`App.tsx`) | `color="orange"` alone measured 3.58:1 at 14px and failed WCAG AA; `orange.6` with `autoContrast` keeps the destructive signal at AA contrast |
| Inactive action | `gray` | `ActionButton` when `!action.active && !action.used` | Used-but-taken actions stay `violet` so the story's history keeps its colour |
| Error | `red` (`c="red"`, `variant="light" color="red"`) | Inline failure text and retry buttons | Errors are always accompanied by text, never colour alone |
| Brand flourish | gradient `violet → grape` | Footer author button | Decorative; only place a gradient is used |

**Colour is never the sole signal.** The Ending affordance is deliberately NOT
a colour change: the button stays violet and gains sparkles instead, because
yellow/orange reads as a warning and a colour-only change is invisible to
colourblind users (`ActionButton.module.css` header comment). Apply the same
rule to any new state signal: pair colour with a shape, icon, text, or motion
cue.

### Sparkle colours (sanctioned hard-coded hex)

`ActionButton.module.css:35-48` hard-codes gold `#ffd23d`, warm pink
`#ff7ac0`, violet `#a97bff`. Verified intentional — do not tokenise or
refactor away:

- The glyph itself carries the hue: a near-white core with only a coloured halo
  looked uniformly white, so the colour has to be in the star, not just around
  it (hence `color` + matching `text-shadow` per star).
- The trio is gold / warm pink / violet — picks up the app's violet without
  becoming a rainbow. Two stars per hue, spread around the ring.
- Geometry is deliberate too: `inset: -12px -5px` keeps stars clear of the
  button vertically (at -7px the button painted over them) but tight
  horizontally so stars do not land on the neighbouring action button.

## Dark mode

**Current approach (incumbent):** components branch by hand on
`useMantineColorScheme()`, e.g. `StoryPart.tsx`:
`bg={colorScheme === "dark" ? "violet.8" : "violet.4"}` with `c="white"` in
both schemes. This works but every new surface must remember to branch — the
audit flagged it as the symptom of the undocumented system.

**Target convention (upcoming refactor — follow it for new code where
possible):** surfaces must not re-decide colours per component. Move the
scheme pair into the theme layer so components name a role once:

- Prefer Mantine CSS variables / `light-dark()` in CSS Modules, or theme-level
  component `defaultProps` / `vars`, over inline `colorScheme` ternaries.
- Encode the existing pair as the token: story-bubble background is
  `violet.4` (light) / `violet.8` (dark), text white in both. New surfaces
  define their pair the same way, in one place.
- Inline `colorScheme === "dark"` branches are legacy; do not add new ones.

## Typography and headings

- Default Mantine type scale; no custom fonts. Footer wordmark uses
  `ff="heading"` italic.
- Button labels use `tt="none"`, not `capitalize`: action titles are
  sentence-style instructions, and Title Casing produced "Follow The Red
  Smudge" (`ActionButton.tsx`).
- **Exactly one `h1` per view.** Entry view: `Title order={1} size="h3"`
  ("Your Adventure Awaits", `InstructionView.tsx` — visual size decoupled from
  semantic level). Story view: `VisuallyHidden component="h1"` ("Your story").
- **One visually-hidden `h2` per story part** (`VisuallyHidden component="h2"`
  in `StoryView.tsx`), so a screen-reader user can jump between story parts.
  The app's co-play model depends on reading aloud, so structural navigation
  is a requirement, not a nicety.

## Layout, spacing, breakpoints

- Spacing uses Mantine scale tokens (`gap="sm"`, `p="md"`, `p="sm"`), not
  pixel values. `rem()` for one-off sizes.
- Breakpoints in use:
  - `xs` — AppShell navbar collapse point.
  - `sm` — the mobile/desktop split. Header controls (Reset, About,
    Preferences, theme toggle) are `visibleFrom="sm"` in the header and
    duplicated `hiddenFrom="sm"` in the navbar: the fixed 60px header cannot
    fit them next to the burger on small screens, so below `sm` they live in
    the burger navbar instead.
  - `48em` — `isSm = useMediaQuery("(max-width: 48em)")` flips story-part
    layout from row (avatar left, actions row-reversed right) to column.
- Story column: `Grid.Col span={{ sm: 12, md: 8 }} offset={{ sm: 0, md: 2 }}`
  — full width on small screens, centred 8/12 on desktop.
- Story parts are a conversation: bot avatar + bubble on one side, user avatar
  + action buttons on the other. Note this structure is directional and must
  mirror correctly under RTL (see below).

## Interaction

- **Touch targets: 44x44px minimum.** The primary user is a child on a phone;
  WCAG 2.5.8's 24px floor understates the need — hold to 2.5.5 (44px)
  instead. Reset already sets `h={44}`; header icons use `ActionIcon
  size="xl"`. New interactive elements must not ship below 44px.
- **Reduced motion: reduce the motion, not the information.**
  `ActionButton.module.css:110-119` is the reference implementation: under
  `prefers-reduced-motion: reduce` the sparkle animation stops but the stars
  stay visible at full opacity — they were previously hidden outright, which
  left reduced-motion users with no signal at all. Any animated state signal
  must keep a static form under reduced motion.
- **Motion is calm by default.** The sparkle brightens on arrival then settles
  to a quiet twinkle (`settle` animation, 6s ease-out to 0.5 opacity) so it
  does not compete with the story text a child is reading. It is a suggestion,
  not a call to action — the child always decides. Scroll-into-view uses a
  500ms duration.
- Loading states are inline `Loader`s (dots) in place of the pending content;
  failures render an inline retry affordance next to where the content would
  be ("Choices did not load. Try again"), never a silent stop.

## RTL and language direction

- `he` renders right-to-left. `useLanguageDirection` sets both the DOM `dir`
  attribute and Mantine's `DirectionProvider` direction from the language
  preference; `<html lang>` is kept in sync at the same time.
- **Prefer logical properties for new code**: `ps`/`pe`, `ms`/`me`,
  `margin-inline-start`, `inset-inline` — not physical `ml`/`mr`/`left`/
  `right` — so layouts mirror for free. The avatar-left / actions-right
  conversation layout is directional; anything positional must be checked in
  both directions.

## Accessibility checklist for new components

- One `h1` per view; story-like repeated content gets a (visually hidden if
  needed) `h2` per item. Use `VisuallyHidden` rather than omitting structure.
- Landmarks are complete (`header`, `nav`, `main`, `footer` via AppShell) —
  keep new top-level content inside them.
- **Alt text policy:** content images get meaningful alt; decorative images
  get explicit `alt=""`. The bot avatar is content — it encodes the part's
  sentiment (`bot${sentiment}.png`), so it gets "Storyteller looking shocked/
  happy/..." (`StoryPart.tsx`). The user avatar is decorative: `alt=""`.
  Purely visual flourishes (sparkle stars) get `aria-hidden="true"`.
- Every icon-only control carries an `aria-label` (see `ColorSchemeToggle`,
  `AboutModal`, `PreferenceModal`). No exceptions.
- Focus: rely on Mantine's default `focus-auto` visible focus rings; do not
  suppress outlines.
- Colour never the sole signal; 44px touch targets; reduced-motion fallback —
  see the sections above.

## i18n

- Four languages: English (`en`), Hebrew (`he`), Japanese (`ja`), Spanish
  (`es`) — `languageOptions` in `frontend/src/utils/llmIntegration.ts`.
- Story content is generated in the target language by the backend; existing
  English content is translated on demand via `useTranslation` (backed by
  `/translate`, cached forever per string). Translation is a nicety, the
  passage is not: on translation failure, render the original text rather than
  an empty bubble.
- UI chrome strings are currently static English; they are being moved to
  `frontend/src/i18n/`. New UI strings should go there rather than being
  hard-coded in components.

## Persistence constraint on imagery

Illustrations are inline WebP data URLs stored in the adventure store, which
persists to sessionStorage (~5MB quota). The format/size is tuned against that
ceiling, and persistence is best-effort: `quotaSafeStorage`
(`frontend/src/stores/adventureStore.ts`) swallows over-quota `setItem` so a
story that outgrows the quota keeps playing in memory instead of crashing out
of a `setState`. Implications:

- Do not switch illustrations to a heavier format or larger dimensions without
  re-checking a full-length story against the quota.
- Avatars are network files (lazy-loaded); illustrations are data URLs — keep
  that split.
