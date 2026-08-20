# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Branch `remaster` re-hosted the project: monitoring stack, `user_api` and the two Node servers are
gone, the frontend moved out of Django into a Vite app. `HANDOFF.md` is the current state of the work
(what is done, what is not, open decisions); `PLAN.md` holds the target architecture and the decision
log; `AUDIT.md` the starting diagnosis. Read `HANDOFF.md` before resuming work.

## Commands

Backend runs in Docker Compose via the root `Makefile` (`--project-directory src`); the frontend runs
under Vite and is **not** served by nginx or Django.

```bash
make            # update-hostname + compose up -d  → nginx/django/postgresql/realtime on https://<hostname>:8080
cd frontend && npm run dev   # Vite on :5173, proxies /api, /media, /socket.io to :8080
make check      # the 5 verification scripts (see below)
make down / re / fclean / refclean / debug
```

Node **22+ required** (system `node` is v19, too old for Vite 8 and gltf-transform) —
use `~/.nvm/versions/node/v24.18.1/bin`. `npm install` is needed in `frontend/` **and**
`src/requirements/realtime/`.

**No bind mounts.** Every Dockerfile `COPY`s at build time, so Python, nginx conf or realtime changes
need `make re` (or `docker compose --project-directory src up -d --build <service>`). Frontend changes
do not — Vite serves `frontend/` from disk.

```bash
docker compose --project-directory src logs -f django
docker exec -it django sh -c 'source /app/.env/bin/activate && python manage.py <cmd>'   # /app/.env is the venv
```

Migrations run automatically from `conf/entrypoint.sh` on every container start.

### Tests

`make check` is the real test entry point. It needs no containers, only Node 22+ and the deps above
(`check_django.py` also needs `src/requirements/django/conf/requirements.txt` in a venv):

| Script | Guards |
|---|---|
| `scripts/check-assets.mjs` | no missing/orphan asset, meshopt decoder wired, shadow-receiving nodes still in the GLB |
| `scripts/check-escaping.mjs` | HTML escaping in text **and** attribute context, no interpolated `innerHTML` outside the `html` template |
| `scripts/check-physics.mjs` | client/server bounding boxes agree, rewritten ball behaviour |
| `scripts/check-controls.mjs` | which pad each key drives, across the six game modes |
| `scripts/check-realtime.mjs` | boots the service, checks 2 namespaces + 4 token-rejection cases |
| `scripts/check_django.py` | migrations, `display_name` claim on every token, name validation |

`src/requirements/django/src/pong/tests.py` is stale and excluded from `make check` — it creates users
via `django.contrib.auth.models.User` while `AUTH_USER_MODEL` is `pong.CustomUser`. There is no JS test
setup.

The stack was run in a browser on 20 Aug 2026: SPA, 3D scene, sound and the solo AI pad all work.
**42 OAuth is the one path never exercised** — the intra key is expired and the flow is left as is.
Everything else is verified by the scripts above, not by hand; do not claim untested runtime behaviour.

## Architecture

Four containers, two networks (`42nice`, `db_network`); only nginx publishes a port (**8080 → 443**).
TLS terminates at nginx (self-signed, built into the image) — Django and realtime speak plain HTTP
behind it, as they will behind the platform router in production.

```
Vite :5173 (dev) / static host (prod) ── frontend
        │ /api, /media, /socket.io
        ▼
nginx :8080 ─┬─ /api, /admin, /media → django:8000 (gunicorn)
             ├─ /static              → shared `static_files` volume (admin assets)
             └─ /socket.io/          → realtime:3000
django ── db_network ──> postgresql
```

### Frontend (`frontend/`)

Vite, two entry points: `index.html` (SPA) and `game.html` (the 3D game). ES modules, Bootstrap 5 +
Chart.js + socket.io-client + three r185 as npm deps — no CDN, no committed `node_modules`.

- `src/js/app.js` — router on `window.location.pathname`; `navigateTo()` is the only way to change
  route; "logged in" means `sessionStorage.getItem('username') !== null`.
- `src/js/utils/api.js` — `fetchWithToken()`, the single wrapper adding `Authorization: Bearer` +
  `X-CSRFToken`. REST calls stay **relative** (`/api/…`) so the static host rewrites them same-origin:
  no CORS, CSRF cookies preserved.
- `src/js/utils/html.js` — the `html` tagged template that escapes every interpolation, and `raw()` for
  deliberate markup. Anything reaching `innerHTML` goes through it; `check-escaping.mjs` enforces it.
- `src/config.js` — socket.io namespaces; `VITE_REALTIME_URL` when the service is off-origin.
- `src/game/` — three.js client (`main.mjs`, `socketEvent.mjs`, ball/pad/camera/light/loadIsland/…).
- `src/game/controls.mjs` — which pad a key drives; keyboard and the touch zones both go through it.
- `src/js/views/dashboard.js` (~1400 lines) is the main screen.

### Realtime (`src/requirements/realtime/`)

One Node service replacing the old game and chat servers: socket.io namespaces **`/game`** and
**`/chat`** on the default path (`/socket.io`), plain HTTP on 3000, `/health` for the healthcheck.

- `src/auth.mjs` — `requireAuth` verifies the JWT signature with `DJANGO_SECRET_KEY` at handshake and
  takes the identity from it. No valid token → no connection, and the client goes silent.
- `src/game/` — authoritative physics and scoring, **without three.js**; state lives in module-level
  maps in `sockets.mjs` (in-memory, a restart drops all matches). Modes: `solo`, `multi-2-local`,
  `multi-2-online`, `multi-four`, `semi-tournament`, `final-tournament`. `WIN_SCORE` from env.
- `src/chat/index.mjs` — one session per username (`force_disconnect`), friend-request relay,
  inactivity timeout (`session_expired`).

`ball.mjs`, `pad.mjs` and `config.mjs` exist **twice** (client renders, server simulates). The copies
diverged on purpose — do not deduplicate them.

### Django (`src/requirements/django`)

API only: `pong/urls.py` is a flat list of `/api/…` routes plus `/media/…`; the SPA catch-all and the
templates are gone. Django 5.2, JWT (`rest_framework_simplejwt`), `AUTH_USER_MODEL = 'pong.CustomUser'`,
function-based views with `@api_view` + `@permission_classes([IsAuthenticated])` in `views.py` (~670
lines). Config comes from the environment (`dj_database_url`, `env_list`) — nothing host-specific in code.

- Models: `CustomUser` (table `users`), `UserToken`, `Friendship`, `FriendRequest`, `MatchHistory`,
  `BlockedUser`. Friendship is asymmetric — accepting creates two rows.
- 42 OAuth (`auth_42_login` / `auth_42_callback`) redirects to `FRONTEND_URL`, not to the API.
- Game stats are written from the game *client* (`frontend/src/game/api.mjs`) to
  `/api/users/display_name/<name>/update_stats/` and `/api/save-match-result/`.

## Gotchas

- **All token issuance must go through `pong/tokens.py`.** A token without the `display_name` claim is
  rejected at the socket handshake, which shows up as a silent, dead chat and game — no API error.
- **`PAD_HALF` / `BALL_HALF`** in the server physics are measured on the client geometry. Change one
  without the other and collisions break; `check-physics.mjs` catches it.
- **Secrets are compromised.** `src/.env` is now untracked and `.gitignore` exists, but the real values
  (42 OAuth client secret, Discord webhook, Django key, DB credentials) are still in git history.
  Rotate before any public deploy; purging needs `git filter-repo`.
- **Hostname.** Only `src/.env` still carries the host; `make update-hostname` (run by `make`) seds it.
  Frontend URLs come from `frontend/.env` (`VITE_*`). Do not reintroduce hardcoded URLs in code.
- `ALLOWED_ORIGINS`, `DJANGO_ALLOWED_HOSTS`, `FRONTEND_URL`, `PUBLIC_API_URL` are env-driven; a new
  origin is added there, not in `settings.py`.
- `src/requirements/postgresql/conf/user.sql` still creates a `users` database for the deleted
  `user_api`. Dead — user data lives in Django's `users` table (`CustomUser`).
- `avatar_url` is inconsistent in DB (`https://…` vs `url("…")` depending on signup / 42 OAuth / upload).
  Deliberately not validated server-side; escaping closes the XSS. Clients handle both forms.
- Avatar uploads land in `MEDIA_ROOT` on a `media_files` volume — **ephemeral on free hosting tiers**,
  which is an open Lot 7 decision (see `HANDOFF.md`).
- Both `README.md` and `Readme.md` exist with near-identical, now outdated content.
