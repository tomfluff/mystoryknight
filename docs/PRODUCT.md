# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a child, with an adult sitting beside them. The adult reads aloud, helps
with the drawing upload, and talks through the choices; the child decides what
happens next. Neither is a spectator, and the design has to work for both at
once on a single screen.

The reading-level control spans kindergarten to professional, so the same
interface is expected to serve a five-year-old being read to and an older child
reading independently.

## Product Purpose

A child draws a character. The app turns that drawing into a story hero, then
tells an illustrated, narrated story that advances one part at a time from the
choices the child makes. Each illustration is generated from the child's own
drawing, so their character stays recognizably theirs throughout.

The project serves two goals at once, and both are live:

- **Now: a research instrument.** It exists to run sessions that produce clean,
  comparable data. Changes that alter what a participant experiences are changes
  to the protocol, not just to the UI.
- **Later: a real product.** It is public, deployed, and AGPL-licensed for reuse.
  Decisions should avoid closing off the path to families using it unattended.

When the two goals conflict, that is a decision for the owner, not something to
resolve silently in either direction.

## Positioning

The child's own drawing is the generative seed, not decoration. The drawing
becomes a character sheet, the character sheet produces the premises, and the
drawing is then carried forward as a reference image into every illustration so
the hero stays the same character from part to part. A storytelling app that
merely illustrates prose cannot truthfully claim this.

## Operating Context

Sessions are short and self-contained. A story runs a planned 6-10 parts, chosen
once at the start, and is steered through a simplified hero's-journey arc so it
builds and then resolves rather than wandering.

Each turn offers two generated choices, optionally a chat action for speaking to
another character in the story, and an ending the child can take at any time.
Every piece of text -- story parts, premises, actions, the character card -- can
be read aloud.

Nothing survives the session. There are no accounts and no server-side story
storage: the story state travels with the client and is replayed to the server on
each request, and the server advances it as a pure function. Closing the tab ends
the story.

## Capabilities and Constraints

Confirmed:

- React + Vite frontend on GitHub Pages; Flask backend on Cloud Run. The frontend
  is deployed by CI on every push to `main`; the backend is deployed by hand.
- OpenAI throughout: text generation, image generation for the illustrations, and
  text-to-speech for the narration.
- Illustrations are returned inline as WebP data URLs and held in
  `sessionStorage`, which caps the whole session at roughly 5MB. Image size and
  quality are tuned against that ceiling, not against how good they could look.
- Image generation takes roughly 12-30 seconds per part, which is the dominant
  wait in the experience.
- The backend is stateless. All story memory is client-carried.
- Four interface languages are implemented today: English, Hebrew, Japanese,
  Spanish. Translation is a live call per string.

Explicitly undecided or unresolved:

- **The four-language set is not a commitment.** It is what exists now. Hebrew is
  offered but the layout does not handle right-to-left, so that language is
  currently served worse than the other three.
- **The three-step entry flow (session, drawing, premise) is not a commitment**
  either. It is the current shape, open to change.
- **The backend is unauthenticated.** Every generation endpoint is publicly
  reachable and spends API credit per call. How to close this is an open
  decision.
- Whether stories should ever persist beyond a session is undecided.

## Brand Commitments

Name: MyStoryKnight. Author: Yotam Sechayk (`tomfluff`). Licensed AGPL-3.0 or
later, which obliges any deployed modified version to offer its users the source.

## Evidence on Hand

- Public repository and live deployment at
  <https://tomfluff.github.io/mystoryknight/>.
- Icons by Icon.doit, Smashicons and Freepik, via flaticon, credited in-app.

No user research, testimonials, usage data, or study results are recorded in this
repository. Future work must not imply any exist.

## Product Principles

1. **The child's drawing is the hero.** It anchors every illustration and must
   stay recognizable as the story goes on. Anything that weakens that link
   weakens the product.
2. **Safety is not negotiable.** No violence, gore, or frightening imagery. It is
   enforced in every generation prompt, and anything touching generation keeps it.
3. **Two people, one screen.** The adult reads and the child decides. Both roles
   are served at the same moment, not in separate modes.
4. **Never strand the child.** A failed request must not end the story. The
   experience degrades to something still playable rather than to a dead end.
5. **The session is the unit.** Short, complete, and self-contained, with a real
   ending rather than an open loop.

## Accessibility & Inclusion

Read-aloud is available on every piece of story text and is the main
accessibility affordance in the product; it also carries the co-play model, so it
is load-bearing rather than optional.

Hebrew is offered without right-to-left layout support, which is a known
inclusion gap rather than an accepted constraint.
