# Plan de remaster — ft_transcendence

Branche : `remaster`. Suite de `AUDIT.md`.

## Décisions actées

- **Périmètre** : tout garder — jeu, comptes, stats, chat, amis. Seuls la CI et le
  monitoring (Grafana, Prometheus, Alertmanager, node-exporter, cAdvisor) sont supprimés.
- **Ordre** : tout d'un coup, un seul déploiement à l'arrivée.

## Architecture cible

```
Cloudflare Pages / Vercel ──── frontend statique (Vite : SPA + client de jeu réunis)
        │
        ├── HTTPS ──► Render (free) ......... API Django : auth, profils, amis, stats
        │                                          │
        │                                          └──► Neon (free) : PostgreSQL
        └── WSS ────► Koyeb (free) .......... service temps réel Node
                                              namespaces socket.io /game et /chat
```

**Pourquoi cette répartition.** Koyeb ne donne qu'un service gratuit mais *ne met pas en
veille* : il revient au temps réel, où une seconde de latence se voit. Render met en veille
après 15 min (réveil ~1 min) : acceptable pour l'API, qui n'est sollicitée qu'au login et sur
les écrans profil — un ping cron toutes les 14 min le maintient éveillé si la latence gêne.
Neon plutôt que Supabase ou Render Postgres : le tier gratuit Neon ne met pas le projet en
pause et ne supprime pas les données, là où Supabase suspend après une semaine d'inactivité
et où le Postgres gratuit de Render expire à 30 jours.

*Repli si le découpage en trois plateformes devient pénible* : une VM Oracle Cloud Always Free
fait tourner le `docker-compose` quasi tel quel, sans veille — au prix d'une VM à maintenir.

## Lots de travail

### Lot 0 — Hygiène et purge
- `.gitignore` (absent du dépôt aujourd'hui)
- suppression des 89 Mo d'assets jamais référencés
- suppression du monitoring et de `user_api` (code mort, non référencé par `compose.yaml`)
- nettoyage du `Makefile`

### Lot 1 — Secrets
- `src/.env` retiré du suivi Git, remplacé par `.env.example`
- purge de l'historique Git
- suppression du couple `admin`/`admin` en dur dans `js/utils/token.js`
- **à faire côté utilisateur** : révoquer et régénérer le client secret OAuth 42, le webhook
  Discord, la clé Django et les identifiants Grafana

### Lot 2 — Assets (209 Mo ➜ ~10-15 Mo)
- audio ré-encodé (Opus/AAC ~128 kbps) et surtout **chargé paresseusement** — aujourd'hui les
  14 pistes partent au premier écran
- `pongScene_V6.glb` compressé (Draco ou meshopt) + textures internes redimensionnées
- écran de chargement avec progression

### Lot 3 — Frontend unifié sous Vite
- SPA Django et client de jeu réunis dans un seul build ; **l'iframe et le handshake
  `postMessage` disparaissent** — le jeu devient une vue de la SPA
- suppression des `node_modules` versionnés (1 964 fichiers) et des imports en chemin brut
- hostname en dur remplacé par des variables d'environnement de build
- `three` r166 ➜ version courante (le seul point à valider à l'œil : colorimétrie, GLTF, lumières)

### Lot 4 — Service temps réel unique
- fusion `game_server` + `chat_server` en un service Node, namespaces `/game` et `/chat`
- physique réécrite sans `three` (vecteurs 2D en arithmétique simple), tick 62 Hz ➜ 30 Hz
- JWT **vérifié** au handshake (aujourd'hui le serveur de chat croit le `username` sur parole)
- express 5, socket.io 4.8, Node 22, `node-fetch` supprimé au profit du `fetch` natif

### Lot 5 — API Django
- Django 5.2, gunicorn 23, Pillow 11
- plus de TLS auto-signé ni de nginx : la plateforme termine le TLS
- Django devient une API pure — plus de templates, plus de catch-all SPA
- CORS et `ALLOWED_HOSTS` restreints aux origines réelles
- bascule sur Neon

### Lot 6 — Interface
- retravail visuel sans refonte : typographie, espacements, transitions entre menus
- responsive
- **contrôles tactiles** — absents aujourd'hui, le jeu est injouable sur mobile

### Lot 7 — Déploiement
- Pages/Vercel, Koyeb, Render, Neon
- `docker-compose` conservé pour le développement local, réduit à trois services

---

## Avancement

- **Lot 0 — fait.** `.gitignore` créé, 89 Mo d'assets orphelins supprimés, monitoring et
  `user_api` retirés, `compose.yaml` / `Makefile` / `nginx.conf` nettoyés.
- **Lot 1 — fait côté code.** `src/.env` retiré du suivi Git, `src/.env.example` ajouté,
  `generateToken()` et son couple `admin`/`admin` supprimés (fonction jamais appelée).
  *Reste à faire par l'utilisateur* : révoquer le client secret OAuth 42, le webhook Discord
  et la clé Django, puis purger `src/.env` de l'historique.
- **Lot 2 — fait.** Audio ré-encodé et chargé paresseusement, scène 3D compressée.
  209 Mo ➜ 25,4 Mo au total, ~9,4 Mo au premier chargement.
  Vérification : `node scripts/check-assets.mjs`.
- **Lot 3 — fait.** Frontend unifié sous Vite dans `frontend/`, SPA et jeu réunis
  dans un seul build à deux pages. `three` passé de r166 à r185.
- **Sécurité (hors lots) — fait.** XSS stockée fermée côté client et côté serveur,
  après signalement par la revue automatique. Voir plus bas.
- **Lot 4 — fait.** Jeu et chat fusionnés en un service `realtime`, physique
  serveur réécrite sans `three`, JWT vérifié au handshake.
- **Lot 5 — fait.** Django à jour, configuration par variables d'environnement,
  Neon prêt, régression avatar réparée.
- **Lots 6 et 7 — à faire.**

### Détail du Lot 2

| | avant | après |
|---|---|---|
| `pongScene_V6.glb` | 30,8 Mo | **5,2 Mo** — meshopt + textures WebP |
| audio (15 fichiers) | 169 Mo | **20 Mo** — MP3 128 kbps (musiques) / 96 kbps (effets) |
| dont chargé au démarrage | 169 Mo | **3,5 Mo** — les musiques de partie sont différées |

La compression meshopt impose `setMeshoptDecoder()` sur le `GLTFLoader`
(`loadIsland.mjs`) : sans lui la scène ne se charge pas du tout.
`scripts/check-assets.mjs` échoue si cet appel disparaît, si un asset référencé
n'existe pas, ou si un fichier traîne sans être chargé par personne.

Les gros blobs restent dans l'historique Git (pack de 702 Mo) : seul le checkout
et le déploiement s'allègent. À traiter au moment de la purge des secrets, qui
réécrit l'historique de toute façon.

### Détail du Lot 3

Arborescence : `frontend/` (Vite, build à deux pages `index.html` + `game.html`),
`frontend/src/js` pour la SPA, `frontend/src/game` pour le client du jeu,
`frontend/public` pour les assets.

**L'iframe est conservée, le handshake `postMessage` de session ne l'est pas.**
La page du jeu étant désormais servie par le même hôte que la SPA, elle lit
`display_name`, `accessToken` et `avatar_url` directement dans `sessionStorage`.
Le `postMessage` ne sert plus qu'aux invitations de partie, avec un contrôle
d'origine sur `window.location.origin` au lieu du nom d'hôte 42 en dur.
Supprimer l'iframe elle-même aurait imposé de transformer `main.mjs` (script de
page, écouteurs DOM au chargement) en cycle de vie `start`/`stop` : beaucoup de
risque pour un gain nul, l'iframe isolant en prime le CSS du jeu de celui de la SPA.

**Les appels REST restent en chemin relatif** (`/api/...`). En production c'est
l'hébergeur statique qui les réécrit vers l'API (`rewrites` Vercel), ce qui évite
CORS et garde les cookies CSRF en same-origin — sinon il aurait fallu reprendre
une trentaine de sites d'appel. Seuls les websockets pointent vers une adresse
absolue, lue dans `frontend/src/config.js` (`VITE_GAME_WS_URL`, `VITE_CHAT_WS_URL`).

Trois globales que fournissait le template Django sont réinstallées dans
`src/main.js` (`staticUrl`, `bootstrap`, `Chart`) plutôt que de réécrire les vues.

Django a été ramené au strict rôle d'API dans la foulée, sinon le conteneur ne
démarrait plus : `STATICFILES_DIRS` pointait sur le dossier `templates/` déplacé.
Les vues `index`, `serve_content` et `save_avatar_image` (jamais appelée) sont
supprimées, ainsi que les routes catch-all.

Nettoyage : 1 964 fichiers de `node_modules` versionnés, 2,8 Mo d'images jamais
référencées dans `content/` (dont `pong_photo.png`, 2,6 Mo), `temp.css`.

Vérifié : `npm run build` passe (138 modules), `node scripts/check-assets.mjs`
ne trouve ni asset manquant ni orphelin, et `vite preview` sert les deux pages
et les assets en 200. **Non vérifié : l'exécution réelle dans un navigateur** —
elle demande la pile complète, qui change encore au Lot 4.

### Correction XSS stockée

Signalée par la revue de sécurité automatique sur 3 fichiers ; l'exposition
réelle en couvrait 5. `display_name` et `avatar_url` partaient tels quels de la
base dans du `innerHTML`, et le pseudo du toast de demande d'ami vient du socket
de chat, qui ne vérifie pas le JWT du handshake. Avec les JWT en
`sessionStorage`, cela donnait une prise de compte complète.

Correctif : un gabarit balisé `html` (`frontend/src/js/utils/html.js`) échappe
toutes les interpolations, y compris les guillemets — indispensable en contexte
d'attribut, où `<img src="${url}">` se laissait échapper d'un simple `"`. Le
balisage volontaire passe par `raw()`. Préfixer un gabarit coûte un jeton par
site au lieu d'un appel par interpolation : on ne peut plus en oublier une.

`sanitizeHTML` est supprimée : elle n'échappait ni `"` ni `'`, n'était appliquée
qu'à 2 sites sur ~30, et était employée à contresens — dans des contextes
`textContent` (déjà sûrs, où elle affichait des entités littérales) et **à
l'émission** d'un message privé, si bien que le destinataire stockait et
affichait `&lt;` tel quel.

Côté serveur, `clean_display_name()` valide le jeu de caractères à
l'inscription et à la mise à jour des paramètres : ni `create_user()` ni
`save()` ne déclenchent les validateurs de champs Django, donc `username` et
`display_name` n'étaient contrôlés nulle part.

`avatar_url` n'est volontairement pas validé : sa forme est incohérente en base
(tantôt `https://…`, tantôt `url("…")` selon qu'elle vient de l'inscription, de
l'OAuth 42 ou d'un envoi de fichier), et l'échappement suffit à fermer la faille.
À démêler au Lot 6.

Vérification : `node scripts/check-escaping.mjs` teste l'échappement en contexte
texte et attribut, et refuse tout `innerHTML` interpolé sans gabarit `html`.

Deux bogues préexistants corrigés au passage : le toast de demande d'ami
utilisait `onclick="acceptFriendRequest(...)"` alors que ces fonctions sont
importées et non globales — les boutons ne faisaient donc rien ; et il
s'insérait via `document.body.innerHTML +=`, ce qui reconstruisait tout le DOM
et faisait sauter chaque écouteur déjà posé sur la page.

### Régression avatar — réparée au Lot 5

L'envoi d'avatar, cassé depuis le Lot 3, écrit désormais dans `MEDIA_ROOT` et
est servi par une route `/media/`. Voir la réserve sur le disque éphémère
plus bas.

### Détail du Lot 4

`game_server` et `chat_server` deviennent un seul service `src/requirements/realtime`,
deux namespaces socket.io (`/game`, `/chat`) sur le chemin par défaut au lieu de
deux serveurs sur `/g_socket.io` et `/c_socket.io`. Motif : les hébergeurs
gratuits ne donnent qu'un service qui ne s'endort pas.

**Le tick reste à ~60 Hz.** Le plan prévoyait 30 Hz pour ménager les 0,1 vCPU de
Koyeb ; la lecture du client l'a écarté. `socketEvent.mjs` écrit directement
`ball.position` à la réception, sans interpolation : diviser la fréquence par
deux rendrait le mouvement visiblement saccadé. L'économie est prise ailleurs,
sans rien coûter à l'image : `movePad` n'est plus diffusé que si une raquette a
bougé, au lieu de ~60 fois par seconde en permanence.

**Physique sans `three`.** Le serveur chargeait `three` pour faire ses collisions
avec `Box3.setFromObject()` à chaque tick. Les demi-extents ne dépendant que de
la géométrie, ils sont figés dans `config.mjs` — mesurés avec three, pas devinés :
raquette `(0.045, 0.048182, 0.295469)`, balle `0.07`.
`scripts/check-physics.mjs` les recalcule et échoue s'ils dérivent.

Deux bizarreries d'origine sont conservées telles quelles, parce qu'elles
changent le ressenti : le service initial part à plat sur x (le `Vector3(±1, ±1)`
d'origine omettait la 3ᵉ composante, donc `direction.z` valait 0), alors que le
service après un point tire trois composantes et tombe à ±1/√3. Le second test
de `checkCollision`, lui, n'est pas reconduit : il comparait la distance des
centres à 1,07 alors que deux boîtes en contact sont à moins de 0,4 — toujours vrai.

**JWT vérifié au handshake.** Les deux serveurs croyaient le nom annoncé par le
client : n'importe qui pouvait jouer, discuter et faire créditer des statistiques
sous l'identité d'un autre. Un middleware de namespace vérifie maintenant la
signature (HS256, `DJANGO_SECRET_KEY`, algorithme imposé pour fermer la confusion
d'algorithme) et le reste du code lit `socket.data.user`. Côté Django, toutes les
émissions de jeton passent par `pong/tokens.py` pour porter la revendication
`display_name` — sinon le service n'aurait que `user_id` et devrait interroger la
base à chaque connexion.

**Plus de TLS interne.** Django écoute en clair sur 8000, le service temps réel
sur 3000 ; nginx termine le TLS en local, la plateforme en production. Cela
supprime les certificats auto-signés générés au build et évite d'avoir à
désactiver la vérification TLS pour les appels internes.

Dépendances : Node 22, express 5, socket.io 4.8, `jsonwebtoken`. `three`,
`three-orbitcontrols` et `node-fetch` retirés du serveur (`fetch` est natif).

Vérifié : `node scripts/check-realtime.mjs` démarre réellement le service et
contrôle les deux namespaces plus quatre refus (aucun jeton, jeton de
rafraîchissement, jeton sans `display_name`, signature invalide) ;
`node scripts/check-physics.mjs` valide les boîtes et le comportement de la balle.
**Toujours pas vérifié : une partie réelle dans un navigateur.**

### Détail du Lot 5

**Dépendances.** Django 5.1.2 ➜ 5.2 LTS, DRF 3.16, simplejwt 5.5, gunicorn 23,
Pillow 11, `psycopg2-binary` ➜ `psycopg[binary]` (psycopg 3). Toutes résolues et
installées pour de bon avant d'être figées, pas choisies au jugé.

Au passage : `ENGINE` valait `django.db.backends.postgresql_psycopg2`, qui
**n'existe plus** dans Django 5.2 — vérifié par import. C'est maintenant
`django.db.backends.postgresql`, qui détecte psycopg 3 seul.

**Configuration par l'environnement.** `ALLOWED_HOSTS = ['*']` acceptait
n'importe quel en-tête `Host` ; la liste vient désormais de
`DJANGO_ALLOWED_HOSTS`, et `*` n'est toléré qu'avec `DJANGO_DEBUG`. Les origines
CORS/CSRF viennent d'`ALLOWED_ORIGINS` au lieu d'être en dur. `DEBUG` est
pilotable. `SECURE_PROXY_SSL_HEADER` est posé, sans quoi Django, derrière nginx
ou le routeur de la plateforme, croit toutes les requêtes en clair.
Un `DJANGO_SECRET_KEY` absent lève maintenant une erreur explicite au démarrage.

**Neon.** `DATABASE_URL` prend le pas sur les variables séparées quand elle est
présente, avec `conn_max_age=600` — Neon facturant au temps de calcul, rouvrir
une connexion à chaque requête coûte cher. `ssl_require` n'est imposé que pour
les URL Postgres, ce qui permet aux contrôles de tourner sur SQLite.

**OAuth 42.** Le `redirect_uri` était en dur sur l'hôte 42 de l'école, et le
retour redirigeait vers `/login` — une route que Django ne sert plus depuis le
Lot 3, donc un cul-de-sac. Deux variables corrigent cela : `PUBLIC_API_URL`
(l'URL déclarée dans l'application OAuth) et `FRONTEND_URL` (où renvoyer le
navigateur). C'était le dernier hôte en dur du dépôt.

**Avatars.** L'envoi écrit dans `MEDIA_ROOT/avatars`, servi par
`django.views.static.serve` sur `/media/`. Le nom de fichier est construit à
partir de la clé primaire, jamais du nom envoyé, et l'extension comme la taille
(2 Mo) sont contrôlées — l'ancienne version reprenait l'extension du fichier
client sans filtre.

> **Réserve à trancher au Lot 7.** Le disque du tier gratuit Render est éphémère :
> les avatars envoyés disparaîtront à chaque redémarrage. Trois issues possibles —
> un disque payant, un stockage objet (Cloudinary, S3), ou se limiter aux avatars
> prédéfinis et à celui de l'intra 42, ce que font déjà trois des quatre chemins
> de code. Le choix vous revient ; rien n'est verrouillé.

**Contrôles.** `scripts/check_django.py` monte une base SQLite jetable, applique
les migrations et vérifie ce dont le service temps réel dépend : tout jeton émis
porte `display_name`, la revendication survit au renouvellement, et un jeton
d'accès se vérifie en HS256 avec `SECRET_KEY` — exactement comme le fait
`auth.mjs`. Il a d'ailleurs attrapé un écart réel : simplejwt sérialise
`user_id` en **chaîne**, pas en nombre ; `auth.mjs` a été aligné.

`make check` enchaîne les cinq contrôles.
