# Design audit

Run 2026-07-31 with `/impeccable audit` against `main` at `845fe3e`, measured on
the live app at 1280x800, 390x844 and 320x740.

**10/20 — Acceptable (significant work needed).** 1 P0, 4 P1, 4 P2, 2 P3.

| # | Dimension | Score | Key finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2/4 | Zero headings on the page; a screen reader has no structure to navigate |
| 2 | Performance | 2/4 | One 517KB chunk, and every store write re-renders every story part |
| 3 | Responsive | 1/4 | Header content overflows its fixed 60px box at every mobile width, clipping Reset off-screen |
| 4 | Theming | 2/4 | Dark mode works, but via hand-written `colorScheme === "dark"` branches rather than tokens |
| 5 | Implementation integrity | 3/4 | Coherent and product-specific; detector found nothing |

Integrity verdict: **pass**. The detector returns `[]` on `frontend/src`, and the
interface is not generic Mantine — the story is a conversation with per-turn
avatars, the Ending action grows sparkles at resolution, and illustration format
is tuned against the sessionStorage ceiling. The gap is that none of it is
written down: there is no DESIGN.md and no token layer, so each decision lives
component-local.

## P0

### Header content overflows its fixed height on mobile

`App.tsx:60-78` — `AppShell.Header p="md"` with `header={{ height: 60 }}`.

Measured: header box 60px, `scrollHeight` 80px. Controls land at `y=-20..24`
(clipped above the viewport) and `y=36..80` (spilling into content). Reproduced
at 390px and 320px, on both the entry screen and the story view.

`p="md"` is 16px a side, leaving 28px of usable height for 36px buttons, so the
`Group` wraps to a second row the fixed header cannot show. Reset ends up partly
off-screen and unclickable; the theme toggle floats over the story.

Fix direction: let the header grow on small screens, or collapse Reset / About /
Preference into the burger navbar below `sm`. The `Burger` and `AppShell.Navbar`
are already wired and currently hold only the character and premise cards.

## P1

### No headings anywhere in the page flow

`InstructionView.tsx:46` uses `Title order={3}`; story parts render as `Paper` +
`Text`. Measured `h1` count 0, total headings 0 at both viewports. WCAG 1.3.1 (A)
and 2.4.6 (AA).

A screen-reader user cannot jump between story parts. For an app whose co-play
model depends on reading aloud, structural navigation is not a nicety.

### Hebrew ships without right-to-left

`dir` is never set on `<html>`; `preferencesStore.ts:8` offers `he`. Measured
`htmlDir: (none)` with a non-English language selected. WCAG 1.3.2.

One of four shipped languages renders in an LTR layout. The avatar-left /
actions-right conversation structure is directional, so this is a layout audit,
not just an attribute.

### Four of seven images have no alt text

`StoryPart.tsx:208-215` (bot avatar), `:287` (user avatar). WCAG 1.1.1 (A).

The bot avatar encodes the part's sentiment (`bot${part.sentiment}.png`), so it
is content rather than decoration and is currently invisible to assistive tech.
The user avatar is decorative and should be explicitly `alt=""`.

### "Reset" fails contrast

`App.tsx:70` — `<Button color="orange">`. Measured 3.58:1 at 14px against a
4.5:1 requirement. WCAG 1.4.3 (AA). The only contrast failure found anywhere.

The one destructive control in the app is the hardest to read.

## P2

- **Touch targets below 44px throughout.** Header `ActionIcon`s 42x30,
  `ActionButton` 36px tall, footer link 100x26. 15 undersized on desktop, 16 on
  mobile. Passes WCAG 2.5.8 (AA, 24x24), fails 2.5.5 (AAA, 44x44). The standard
  understates this: the primary user is a child tapping a phone.
- **Single 517KB bundle, no code splitting.** `vite.config.ts` has no
  `manualChunks` and no dynamic imports. 517.52 kB JS (165.34 kB gzip) plus
  194.39 kB CSS; Vite warns on every build. Webcam capture, charts and devtools
  deps all load before the first screen renders.
- **Every store write re-renders every story part.** `StoryView.tsx:14` does
  `const { id, character, premise, story } = useAdventureStore()`, subscribing to
  the whole store; `StoryPart` is not memoized. Use the `createSelectors` helper
  the rest of the codebase already uses (`useAdventureStore.use.story()`).
- **Dark mode is hand-branched, not tokenised.** `StoryPart.tsx:264,292` —
  `bg={colorScheme === "dark" ? "violet.8" : "violet.4"}`. Every new surface must
  remember to branch.

## P3

- No lazy loading on avatar images. Illustrations are data URLs so they are
  unaffected; avatars are network files.
- Hard-coded sparkle colours at `ActionButton.module.css:35-48`. **Verified
  intentional**, with documented reasoning. Belongs in DESIGN.md rather than
  being refactored away.

## Systemic patterns

- **The design system is undocumented, not absent.** Real decisions exist and are
  well-reasoned in comments, but with no DESIGN.md each is re-derived per
  component. The dark-mode branching is the symptom.
- **Accessibility is strong where it was consciously addressed and absent where
  it was not.** `aria-label` on every icon button, correct `alt` on both content
  images, an exemplary reduced-motion block — alongside zero headings and no RTL.
  The gaps are unexamined areas, not neglect.
- **Mobile was designed for, then not verified on a phone.** Breakpoints, `isSm`
  and a collapsing navbar all exist; the header still breaks at every width
  tested.

## What is already right

Worth preserving through any redesign:

- **Reduced motion is handled properly.** `ActionButton.module.css:110-119` stops
  the animation while keeping the sparkle visible, with a comment explaining that
  hiding it outright left those users with no signal at all. This is the exact
  failure mode the audit criteria warn about, already avoided.
- **Colour is never the sole signal.** The Ending affordance is deliberately not
  a colour change, for stated colourblind reasons.
- Complete landmarks: `main`, `nav`, `header`, `footer`.
- Every icon-only control carries an `aria-label`.
- Visible focus rings via Mantine's `focus-auto`.
- Devtools are dev-gated (`main.tsx:43`); they used to ship to production.
- No horizontal overflow at 1280, 390 or 320.

## Suggested order

1. `/impeccable adapt` — P0 header overflow, plus touch targets.
2. `/impeccable harden` — headings, avatar alt, `dir` for RTL.
3. `/impeccable polish` — Reset contrast.
4. `/impeccable optimize` — bundle split, store selectors.
5. `/impeccable document` — capture the incumbent system so dark-mode branching
   stops being re-decided per component.
6. `/impeccable polish` — final pass.

## Method notes

The detector's URL scanning needs puppeteer, which was not installed: `browse` is
already the shared Chromium and a second one is what its own docs warn against.
Live measurements were taken against the DOM directly instead. Static
`detect.mjs` over `frontend/src` returns `[]`.

To reproduce: start the frontend against a mock backend, seed a two-part story
into `sessionStorage`, then measure `document.documentElement.scrollWidth`,
per-element contrast, and interactive element bounding boxes at each viewport.

## Also open (engineering, not design)

**The backend is unauthenticated.** Every generation endpoint is publicly
reachable and spends OpenAI credit per call. The repo is public and the Cloud Run
URL is in both the README and the JS bundle, so the URL cannot be treated as a
secret. `CORS_ORIGINS` constrains browsers only, not scripted callers. This is an
auth design decision — shared secret header, Cloud Run ingress restriction, or
rate limiting — and is the top of the engineering backlog.
