---
name: hud-spec-2026-08-20
description: design/ux/hud.md was written 2026-08-20; lists real HUD defects awaiting a product decision, not yet fixed
metadata:
  type: project
---

Wrote `design/ux/hud.md` (2026-08-20), covering the game HUD in
`frontend/game.html` / `frontend/src/css/game.css` / `frontend/src/game/`,
against `UI-GAME-1..11` and `UI-TOUR-1..5`. The center-of-field constraint holds
today (every centered panel is hidden by the `start-game` socket handler before
the ball moves), but it holds by construction of the state machine, not by a CSS
rule — worth re-checking if a new `showPanel()` call is ever added.

**Why this matters for future sessions:** several open defects were found during
that audit that are not yet fixed and would affect any follow-up UX or
implementation work on the game screen:

- `#space` / the `tournament-full` → `player_ready` ready-up flow is dead code —
  the client listens for `tournament-full` but nothing in
  `src/realtime/app/game/` emits it; tournaments auto-start once 4 seats fill.
  `#space` is currently never painted.
- Quitting a tournament (`#quit-tournament`) tells the server but never hides
  `#tournament-details` or reopens `#menu` client-side — the person is left
  staring at a stale bracket with no path back.
- `UI-TOUR-3`'s cited evidence (`#notReady`/`#not-ready-text`) is not actually
  wired to "tournament seat not filled" — those nodes only fire from the
  direct-invite flow (`refuse-invit`, `not-ready`, `connect_error`).
- A second invitation arriving before the first is answered silently overwrites
  `pendingInvite` in `frontend/src/game/socketEvent.mjs` — no queue, the first
  inviter gets no response.
- Touch-zone safe-area insets are swapped left/right in
  `frontend/src/css/game.css`
  (`padding: 0 max(12px, env(safe-area-inset-left)) 0 max(12px, env(safe-area-inset-right))`)
  — invisible in portrait (both insets are 0 on the 390×844 reference), would
  misplace a control in landscape on a notched phone.

None of these were fixed — this session only documented them in
`design/ux/hud.md` § Open Questions with `fichier:ligne` pointers. If asked to
fix the game HUD, start there rather than re-deriving the same findings from
scratch.

See [[reference-grounding-docs]] for the docs this spec was grounded against.
