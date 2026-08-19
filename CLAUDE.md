# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Everything runs through Docker Compose, driven by the root `Makefile` (`--project-directory src`):

```bash
make            # update-hostname + docker compose up -d  → https://<hostname>:8080
make down       # compose down -t 0
make re         # remove images, then rebuild and start
make fclean     # down + remove images + remove volumes (destroys the DB)
make refclean   # fclean + start
make debug      # start + follow all container logs
```

There are **no bind mounts**: every Dockerfile `COPY`s the source at build time. Any change to Python,
JS, `.mjs`, CSS, nginx conf, or Prometheus/Grafana config requires `make re` (or `docker compose
--project-directory src up -d --build <service>`) to take effect. Restarting a container is not enough.

Logs / shell for a single service:

```bash
docker compose --project-directory src logs -f django
docker exec -it django sh
```

Django management commands must run inside the container with the venv activated
(`/app/.env`, not to be confused with `src/.env`):

```bash
docker exec -it django sh -c 'source /app/.env/bin/activate && python manage.py <cmd>'
```

Migrations are applied automatically by `conf/entrypoint.sh` on every container start
(`makemigrations` + `migrate` + `collectstatic`).

### Tests

`src/requirements/django/src/pong/tests.py` is the only test file and it is stale — it creates users
via `django.contrib.auth.models.User` while the project's `AUTH_USER_MODEL` is `pong.CustomUser`, so
the login/register cases exercise the wrong table. There is no JS test setup. To run it:

```bash
docker exec -it django sh -c 'source /app/.env/bin/activate && python manage.py test pong'
docker exec -it django sh -c 'source /app/.env/bin/activate && python manage.py test pong.ViewsTestCase.test_login_view'
```

## Architecture

Five application containers plus a monitoring stack, on three Docker networks (`42nice`, `db_network`,
`monitoring_network`). Only nginx publishes a port: **8080 → 443**. Every internal service also speaks
HTTPS on 443 with a self-signed certificate generated at image build time, so internal calls are
HTTPS-to-HTTPS.

```
browser ──8080/TLS──> nginx ─┬─ /            → django (gunicorn, TLS 443)
                             ├─ /static      → shared `static_files` volume
                             ├─ /monitoring  → grafana:3000
                             ├─ /game_server + /g_socket.io/ → game_server (node, TLS 443)
                             └─ /chat_server + /c_socket.io/ → chat_server (node, TLS 443)
django ── db_network ──> postgresql
```

### Django (`src/requirements/django`)

Single app `pong`, project `ft_trans`. It is both the REST API and the SPA host:
`pong/urls.py` ends with a `<path:path>` catch-all that renders `templates/index.html`, so any
unmatched URL returns the SPA shell and the client-side router takes over.

- Auth is **JWT** (`rest_framework_simplejwt`) with `AUTH_USER_MODEL = 'pong.CustomUser'`; all API
  views are function-based with `@api_view` + `@permission_classes([IsAuthenticated])`. `views.py`
  (~670 lines) holds every endpoint; there is a `CustomUserViewSet` defined but the routed URLs are
  the plain function views, not the router.
- Models: `CustomUser` (table `users`), `UserToken`, `Friendship`, `FriendRequest`, `MatchHistory`,
  `BlockedUser`. Friendship is stored asymmetrically — accepting a request creates two `Friendship`
  rows.
- 42 OAuth (`auth_42_login` / `auth_42_callback`) redirects back to `/login?auth_success=true&access=…`,
  i.e. **the JWT pair is passed through URL query parameters** and read by the login view.

### Frontend SPA (`django/src/pong/templates/`)

Vanilla ES modules, no bundler, no framework; Bootstrap 5 + Chart.js + socket.io client come from CDNs
in `index.html`. Django `collectstatic` copies `templates/` into the `static_files` volume, which nginx
serves at `/static`.

- `js/app.js` — the router: reads `window.location.pathname`, switches on it, guards
  `/dashboard`, `/settings`, `/profile/*`. `navigateTo()` is the only way to change route.
  "Logged in" means `sessionStorage.getItem('username') !== null`.
- `js/utils/api.js` — `fetchWithToken()`, the single wrapper adding `Authorization: Bearer` from
  `sessionStorage.accessToken` plus the `X-CSRFToken` cookie. New API calls should go through it.
- `js/utils/token.js` — refresh/logout; `js/utils/socketManager.js` — the chat socket.io connection
  and friend/presence events; `js/views/dashboard.js` (~1400 lines) is the main screen.

### Game (`src/requirements/game_server/game/`)

Server and browser code live side by side in the same directory; the split is by import graph, not by
folder:

- **Server** (`node server.mjs`): `server.mjs` → `routes.mjs` (static + `/main.mjs`) and
  `sockets.mjs` → `game.mjs`, `tournament.mjs`, `socketUtils.mjs`, `client.mjs`. Physics and scoring are
  authoritative on the server; state lives in module-level maps in `sockets.mjs`
  (`rooms`, `roomsTypes`, `clients`, `keysPressedMap`) — in-memory only, nothing is persisted, so a
  restart drops all matches. Modes: `solo`, `multi-2-local`, `multi-2-online`, `multi-four`,
  `semi-tournament`, `final-tournament`. Win score comes from the `WIN_SCORE` env var.
- **Client** (`main.mjs`, loaded by `game/index.html`): Three.js scene, `socketEvent.mjs`, plus
  `ball/pad/camera/light/logo/clouds/loadIsland/animation/sounds`. `ball.mjs`, `pad.mjs` and
  `config.mjs` are shared by both sides.
- Three.js is served **straight from the committed `node_modules/`** at `/game_server/node_modules/…`
  — that directory is intentionally tracked in git; do not delete it.

**Dashboard ↔ game handshake**: the dashboard embeds the game in an `<iframe src=".../game_server">`
and `postMessage`s `{username, token, csrfToken, avatar}` to it on load; `main.mjs` validates
`event.origin`, then `socket.emit('username', …)`. Game invitations travel the same way
(`{type: 'gameInvitation', to, from}`). A message with no `type` field is the credentials handshake —
that discriminator is load-bearing.

**Stats**: written from the game *client* (`game/api.mjs`) to the Django REST API
(`/api/users/display_name/<name>/update_stats/` and `/api/save-match-result/`) using the token
received over `postMessage`.

### Chat (`src/requirements/chat_server/src/index.js`)

CommonJS, single file, socket.io over HTTPS. Keeps `userConnections` / `userTokens` / `users` maps in
memory and enforces **one session per username** — registering a second socket emits
`force_disconnect` to the old one. Also relays friend-request notifications and an inactivity timeout
(`session_expired`) that the SPA turns into a logout.

### Monitoring

Grafana (proxied at `/monitoring`), Prometheus (scrapes itself, node-exporter, cadvisor), Alertmanager
(rules in `prometheus/config/alert_rules.yml`, routed to a Discord webhook via
`alertmanager/config/config.sh` + `DISCORD_WEBHOOK_URL`). Separate `monitoring_network`; none of these
ports are published.

## Gotchas

- **Hardcoded hostname.** `https://c1r4p6.42nice.fr:8080` is baked into `src/.env`,
  `game/server.mjs`, `game/main.mjs`, `js/views/dashboard.js`, `js/utils/socketManager.js` and
  `pong/views.py` (the 42 OAuth `redirect_uri`). `make update-hostname` — run automatically by `make` —
  `sed`s all six files to `https://$(hostname -A | cut -d' ' -f1):8080`. It **rewrites tracked files in
  place**, so `git status` is dirty after every `make`; never revert those edits without re-running the
  target, and if you add a new file with an absolute URL, add it to the `update-hostname` rule too.
  Note `main.mjs`/`socketManager.js` also compare `event.origin` against that literal.
- **`src/.env` is tracked in git and there is no `.gitignore`.** It holds the Django secret key, DB
  credentials, Grafana credentials, the Discord webhook and the 42 OAuth client secret. Assume those
  are compromised; do not add new secrets to it.
- **Two databases.** `postgresql/conf/django.sql` creates `django` (used by Django) and `user.sql`
  creates `users` with its own `user` table. That second schema belongs to `src/requirements/user_api/`,
  a Node service that is **not referenced by `compose.yaml` or the Makefile** — dead code. Do not extend
  it; user data lives in Django's `users` table (the `CustomUser` model).
- CORS/CSRF trusted origins in `settings.py` are built from `FT_TRANSCENDENCE_HOST` plus two literals;
  a new origin needs to be added there *and* in the game/chat servers' own `cors` options.
- Both `README.md` and `Readme.md` exist with near-identical content.
