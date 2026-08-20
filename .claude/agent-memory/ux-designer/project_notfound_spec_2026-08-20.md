---
name: notfound-spec-2026-08-20
description: design/ux/not-found.md was written 2026-08-20; documents a screen that is largely already correct, plus one stale accessibility doc and one infra gap
metadata:
  type: project
---

Wrote `design/ux/not-found.md` (2026-08-20), covering
`frontend/src/views/notfound.js` (35 lines) against `UI-NAV-3`, `UI-NAV-1`,
`UI-NAV-2`.

**Why this session is different from [[hud-spec-2026-08-20]]:** the code for
this screen was mostly already fixed before I read it — the session-dependent
back path (logged-in → `/dashboard`, logged-out → `/`) and the alert contrast
(white-on-orange → `--on-accent`) are both already correct in
`notfound.js:12-14` and `tokens.css:267-274`, with comments in the file
describing the old bug in past tense. Don't assume every screen in this repo
still has open defects — verify before writing a spec that repeats a stale
complaint.

**The route-change screen-reader announcement gap is fixed, contradicting
`design/accessibility-requirements.md:57`.** That table still says "Changement
de route SPA → absent, écart connu", but `announceRoute()`
(`frontend/src/app.js:18-24`) sets `document.title` and moves focus to the
view's `h1` on every route render, and `notFound()` calls it (`notfound.js:34`).
`docs/HANDOFF.md` Lot 6 (line 59-60) documents this as shipped the same day the
accessibility doc was dated. I did not correct the requirements doc myself (out
of scope, only write my own spec file) — flagged it in Open Questions instead.
If asked to fix `design/accessibility-requirements.md`, this is the line to
update, and check whether other in-flight specs (e.g. [[hud-spec-2026-08-20]])
repeated the same stale claim before trusting it there too.

**Real open gap found, not previously documented anywhere I could find:** no
SPA-fallback rewrite config exists in the repo (`vercel.json`, `_redirects`,
etc. — searched, none), and `docs/HANDOFF.md:229-245` (Lot 7 deployment target,
Vercel) only documents `/api/*` rewrites, not a catch-all to `index.html`.
Without it, an unknown path in production may never reach this client-side
router at all and would get the host's generic 404 instead — this screen
wouldn't render. Also flagged that unmatched paths almost certainly return HTTP
200 today (SPA serving `index.html` regardless of path), which undermines
indexing and link-preview behavior for a portfolio product. Both are
infrastructure/product decisions, not mine to make.

**Distinguishing near-miss entries mattered for this screen.** `/profile/:name`
for a mistyped or deleted friend name does **not** reach `notfound.js` — it's a
valid route pattern, and `profile.js:276-303` renders its own "No account with
that name." state (`UI-PROF-6`). Likewise a protected route (`/dashboard`,
`/settings`, `/profile`) without a session redirects to `/login`, never to
`notFound()`. Worth remembering next time a brief asks to trace "where does X
actually land" — the answer is sometimes "nowhere near the screen you'd assume."

See [[reference-grounding-docs]] for the docs this spec was grounded against.
