# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

Branch `remaster` re-hosted the project: monitoring stack, `user_api` and the
two Node servers are gone, the frontend moved out of Django into a Vite app.
`docs/HANDOFF.md` is the current state of the work (what is done, what is not,
open decisions) and `docs/PLAN.md` holds the target architecture and the
decision log. Read `docs/HANDOFF.md` before resuming work.

## Commands

Backend runs in Docker Compose via the root `Makefile`
(`--project-directory src`); the frontend runs under Vite and is **not** served
by nginx or Django.

```bash
make            # compose up -d → nginx/django/postgresql/realtime on https://<hostname>:8080
cd frontend && npm run dev   # Vite on :5173, proxies /api, /media, /socket.io to :8080
make check      # the 7 verification scripts (see below)
make lint       # npx eslint . (skips src/django/ and frontend/public/)
make down / re / fclean / refclean / debug
```

Node **22+ required** (system `node` is v19, too old for Vite 8 and
gltf-transform) — use `~/.nvm/versions/node/v24.18.1/bin`. `npm install` is
needed in `frontend/` **and** `src/realtime/`.

**No bind mounts.** Every Dockerfile `COPY`s at build time, so Python, nginx
conf or realtime changes need `make re` (or
`docker compose --project-directory src up -d --build <service>`). Frontend
changes do not — Vite serves `frontend/` from disk.

```bash
docker compose --project-directory src logs -f django
docker exec -it django sh -c 'source /app/.env/bin/activate && python manage.py <cmd>'   # /app/.env is the venv
```

Migrations run automatically from `conf/entrypoint.sh` on every container start.

### Tests

`make check` is the real test entry point. It needs no containers, only Node 22+
and the deps above (`check_django.py` needs `src/django/conf/requirements.txt`
installed in `.venv/` **at the repo root** — `make check` falls back to the
system `python3` and fails on imports otherwise):

| Script                       | Guards                                                                                                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/check-assets.mjs`   | no missing/orphan asset, meshopt decoder wired, shadow-receiving nodes still in the GLB                                                                                                                                                                                              |
| `scripts/check-escaping.mjs` | HTML escaping in text **and** attribute context, no interpolated `innerHTML` outside the `html` template                                                                                                                                                                             |
| `scripts/check-physics.mjs`  | client/server bounding boxes agree, rewritten ball behaviour                                                                                                                                                                                                                         |
| `scripts/check-controls.mjs` | which pad each key drives, across the six game modes                                                                                                                                                                                                                                 |
| `scripts/check-design.mjs`   | the design-system claims in `docs/DESIGN.md`: orphan tokens, focus-ring uniqueness, hardcoded colours **and literal tints on surface properties**, the 16px input floor, `vh` anchoring **in CSS and in JS templates**, gold never used as a fill (tokens.css included), font stacks |
| `scripts/check-realtime.mjs` | boots the service, checks 2 namespaces, the guest path on `/game`, and 4 token-rejection cases on `/chat`                                                                                                                                                                            |
| `scripts/check_django.py`    | migrations, `display_name` claim on every token, name validation                                                                                                                                                                                                                     |

`make check` is the only test suite. The old `pong/tests.py` was deleted with
the remaster — it created users via `django.contrib.auth.models.User` while
`AUTH_USER_MODEL` is `pong.CustomUser`, so it could not run. There is no JS test
setup.

The stack was run in a browser on 20 Aug 2026: SPA, 3D scene, sound and the solo
AI pad all work. **42 OAuth is the one path never exercised** — the intra key is
expired and the flow is left as is. Everything else is verified by the scripts
above, not by hand; do not claim untested runtime behaviour.

## Architecture

Four containers, two networks (`42nice`, `db_network`); only nginx publishes a
port (**8080 → 443**). TLS terminates at nginx (self-signed, built into the
image) — Django and realtime speak plain HTTP behind it, as they will behind the
platform router in production.

```
Vite :5173 (dev) / static host (prod) ── frontend
        │ /api, /media, /socket.io
        ▼
nginx :8080 ─┬─ /api, /admin → django:8000 (gunicorn)
             ├─ /static     → shared `static_files` volume (admin assets)
             ├─ /media      → shared `media_files` volume, read-only (avatars)
             └─ /socket.io/ → realtime:3000
django ── db_network ──> postgresql
```

Layout — one directory per deploy target, nothing nested for the sake of the old
42 `requirements/` convention:

```
frontend/            Vite app (SPA + game)  → static host
  src/               app.js (router), views/, utils/, css/, game/
  public/            brand/, textures/, avatars/, scenes/, sound/
src/
  compose.yaml       local stack, project directory (volumes are `src_*`)
  django/            app/ (Django project), conf/, Dockerfile  → API host
  realtime/          app/, Dockerfile                          → socket host
  nginx/             local TLS + routing only
  postgresql/        local DB only (managed Postgres in production)
scripts/             check-*.mjs, check_django.py, bake-*.mjs
docs/                HANDOFF, PLAN, PRODUCT, DESIGN
```

### Frontend (`frontend/`)

Vite, two entry points: `index.html` (SPA) and `game.html` (the 3D game). ES
modules, Bootstrap 5 + socket.io-client + three r185 as npm deps — no CDN, no
committed `node_modules`. The one chart on the site (wins/losses) is a
`conic-gradient` in `profile.css`, not a charting library.

- `src/main.js` — the real `index.html` entry: imports the six stylesheets, puts
  `{ Offcanvas, Toast }` on `window.bootstrap` (the views expect the global the
  old Django template provided), then `await import('./app.js')`. The dynamic
  import is deliberate — a static one is hoisted above the global assignment and
  the router boots without it.
- `src/app.js` — router on `window.location.pathname`; `navigateTo()` is the
  only way to change route; "logged in" means
  `sessionStorage.getItem('username') !== null`. `announceRoute(title)` sets the
  document title and moves focus to the view's `h1`; every view calls it last,
  because `innerHTML` replaces the whole document and drops focus on `<body>`.
- **`/` is the playable demo** (`src/views/home.js`), not the login form: the
  game iframe fills the page and runs solo against the AI without an account.
  `/login` holds the form. A signed-out visitor never meets a field before the
  island.
- `src/utils/api.js` — `fetchWithToken()`, the single wrapper adding
  `Authorization: Bearer` + `X-CSRFToken`. REST calls stay **relative**
  (`/api/…`) so the static host rewrites them same-origin: no CORS, CSRF cookies
  preserved.
- `src/css/tokens.css` — the design-system layer (colors, radii, spacing,
  shadows, `:focus-visible`, `prefers-reduced-motion`, and the shared `.btn` /
  `.field-input` components). Both entry points import it; **no color, radius or
  spacing value of the system is written literally in a stylesheet any more**.
  Four of the six other sheets are scoped to their view's root class
  (`.login-container`, `.register-container`, `.profile-view`, `.settings-view`)
  — they all used to style bare `body`, `.container`, `input[type=…]` and
  `.btn*` while being loaded on every route. `dashboard.css` and `game.css` are
  **not** scoped: they still declare bare utility classes (`.flex`, `.hidden`,
  `.container`), so a new rule there leaks across every route.
- `src/utils/html.js` — the `html` tagged template that escapes every
  interpolation, and `raw()` for deliberate markup. Anything reaching
  `innerHTML` goes through it; `check-escaping.mjs` enforces it.
- `src/config.js` — socket.io namespaces; `VITE_REALTIME_URL` when the service
  is off-origin.
- `src/game/` — three.js client (`main.mjs`, `socketEvent.mjs`,
  ball/pad/camera/light/loadIsland/…).
- `src/game/controls.mjs` — which pad a key drives; keyboard and the touch zones
  both go through it. The keys are printed in the menus (`.controls-legend`) and
  recalled at kick-off (`#controls-brief`).
- `src/game/panels.mjs` — `showPanel` / `hidePanel`: an overlay that opens takes
  focus, one that closes gives it back. Do not toggle `.hidden` by hand on a
  panel holding buttons.
- `src/game/sounds.mjs` — short effects go through `THREE.Audio` (decoded
  buffers); the seven long loops go through `HTMLAudioElement` (**streamed**).
  `AudioLoader` decodes to Float32 PCM and never frees it: the music alone
  reached roughly 300 MB of RAM over a session.
- `src/views/dashboard.js` is the main screen and the largest file in the app.
- `public/` — `brand/` (favicon, logos), `textures/` (game planes), `avatars/`,
  `scenes/` (the GLB), `sound/`. `check-assets.mjs` walks exactly those five.

### Realtime (`src/realtime/`)

One Node service replacing the old game and chat servers: socket.io namespaces
**`/game`** and **`/chat`** on the default path (`/socket.io`), plain HTTP on
3000, `/health` for the healthcheck.

- `src/auth.mjs` — `requireAuth` verifies the JWT signature with
  `DJANGO_SECRET_KEY` at handshake and takes the identity from it. No valid
  token → no connection, and the client goes silent. `allowGuest` (namespace
  **`/game` only**) admits a token-less visitor as a guest so the landing demo
  can run; `sockets.mjs` returns before registering any online handler for them,
  so a guest gets solo and 2-players-local and nothing else. `/chat` stays under
  `requireAuth`.
- `src/game/` — authoritative physics and scoring, **without three.js**; state
  lives in module-level maps in `sockets.mjs` (in-memory, a restart drops all
  matches). Modes: `solo`, `multi-2-local`, `multi-2-online`, `multi-four`,
  `semi-tournament`, `final-tournament`. `WIN_SCORE` from env.
- `src/chat/index.mjs` — one session per username (`force_disconnect`) and
  friend-request relay. The client also listens for `session_expired`, which no
  server emits: the 10-minute idle cut-off is client-side, in
  `socketManager.js`, and nothing rearms it.

`ball.mjs`, `pad.mjs` and `config.mjs` exist **twice** (client renders, server
simulates). The copies diverged on purpose — do not deduplicate them.

### Django (`src/django`)

API only: `pong/urls.py` is a flat list of `/api/…` routes plus `/media/…`; the
SPA catch-all and the templates are gone. Django 5.2, JWT
(`rest_framework_simplejwt`), `AUTH_USER_MODEL = 'pong.CustomUser'`,
function-based views with `@api_view` + `@permission_classes([IsAuthenticated])`
in `views.py` (~550 lines). Config comes from the environment
(`dj_database_url`, `env_list`) — nothing host-specific in code.

- Models: `CustomUser` (table `users`), `Friendship`, `FriendRequest`,
  `MatchHistory`, `BlockedUser`. Friendship is asymmetric — accepting creates
  two rows.
- 42 OAuth (`auth_42_login` / `auth_42_callback`) redirects to `FRONTEND_URL`,
  not to the API.
- Game stats: the client only reports the outcome, to `/api/save-match-result/`
  (`frontend/src/game/api.mjs`). The view writes the `MatchHistory` row **and**
  increments `wins`/`losses` on `request.user` with `F()`. The client used to
  read the totals and send them back through an `update_stats` route, which let
  any account rewrite anyone's counters.

## Gotchas

- **All token issuance must go through `pong/tokens.py`.** A token without the
  `display_name` claim is rejected at the socket handshake, which shows up as a
  silent, dead chat and game — no API error.
- **`PAD_HALF` / `BALL_HALF`** in the server physics are measured on the client
  geometry. Change one without the other and collisions break;
  `check-physics.mjs` catches it.
- **Secrets are compromised.** `src/.env` is now untracked and `.gitignore`
  exists, but the real values (42 OAuth client secret, Discord webhook, Django
  key, DB credentials) are still in git history. Rotate before any public
  deploy; purging needs `git filter-repo`.
- **Hostname.** Only `src/.env` still carries the host — there is no
  `update-hostname` target in the `Makefile`, edit the file. Frontend URLs come
  from `frontend/.env` (`VITE_*`). Do not reintroduce hardcoded URLs in code.
- `ALLOWED_ORIGINS`, `DJANGO_ALLOWED_HOSTS`, `FRONTEND_URL`, `PUBLIC_API_URL`
  are env-driven; a new origin is added there, not in `settings.py`.
- **The realtime service refuses to boot with an empty `ALLOWED_ORIGINS`.** It
  used to fall back to `origin: true` alongside `credentials: true`, and
  `src/.env.example` ships the variable empty — a deploy copied from the example
  was fail-open. `scripts/check-realtime.mjs` sets it before importing the
  service; anything else that boots it must too.
- `avatar_url` is inconsistent in DB (`https://…` vs `url("…")` depending on
  signup / 42 OAuth / upload). Deliberately not validated server-side; escaping
  closes the XSS. Clients handle both forms.
- Avatar uploads land in `MEDIA_ROOT` on a `media_files` volume — **ephemeral on
  free hosting tiers**, which is an open Lot 7 decision (see `docs/HANDOFF.md`).
- `README.md` content is outdated.
