---
name: reference-grounding-docs
description: Which documents ground any UX spec in ft_transcendence, and the shared authoring rules that govern design/ux/*.md
metadata:
  type: reference
---

Before writing or revising anything in `design/ux/`, read in this order:
`docs/PRODUCT.md` (public, principles, constraints — principle n°1 is "la 3D
porte le produit ; l'interface la sert"), `docs/DESIGN.md` (visual system:
colors/typography/components/Named Rules, front-matter is the token source),
`.claude/docs/technical-preferences.md` (platform, input hierarchy: keyboard
primary, touch secondary under `pointer:coarse` only, no gamepad),
`design/accessibility-requirements.md` (palier **Comprehensive**, engaged
2026-08-20 — the announcement table and the "écarts connus" list are
load-bearing), `design/ui-requirements.md` (numbered `UI-<SYSTÈME>-<n>`
requirements extracted from shipped code, not aspirational),
`design/player-journey.md` (Parcours A = portfolio visitor, Parcours B =
returning player — the two must not be conflated).

`design/ux/` specs are written against a shared "brief" (rules for prose
language — French prose, English section headers verbatim — code fidelity, and
the mandatory `Open Questions` section with `fichier:ligne` pointers for real
gaps). That brief is supplied per-session by the orchestrator, not a permanent
repo file — do not assume a fixed path for it, re-read whatever is handed over
each time.

See [[hud-spec-2026-08-20]] for the first spec written against this convention.
