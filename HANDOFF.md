# Reprise — remaster ft_transcendence

Point d'entrée pour reprendre le travail. Les deux autres documents restent la
référence de fond : `AUDIT.md` (constat de départ, options d'hébergement) et
`PLAN.md` (architecture cible, lots, journal détaillé des décisions).

État au 20 août 2026, branche `remaster`.

---

## À faire en premier : Lot 6

Tout est commité sur `remaster` (`main` intact) et la pile tourne. Le premier essai
en navigateur a eu lieu le 20 août 2026 : c'est fait, il reste l'interface.

```bash
make                                    # nginx, django, postgresql, realtime
cd frontend && npm run dev              # Vite sur http://localhost:5173
```

Deux comptes d'essai existent en base : `alice` / `bob`, mot de passe `pong1234`.

---

## Où en est le projet

| Lot | État | Ce qui a été fait |
|---|---|---|
| 0 — purge | fait | `.gitignore`, 89 Mo d'assets orphelins, monitoring et `user_api` supprimés |
| 1 — secrets | fait côté code | `src/.env` retiré du suivi, `admin`/`admin` en dur supprimé |
| Sécurité | fait | XSS stockée fermée (échappement + validation serveur) |
| 2 — assets | fait | 209 Mo ➜ 25,6 Mo, dont ~9,4 Mo au premier chargement |
| 3 — frontend | fait | Vite, SPA et jeu réunis, `three` r166 ➜ r185 |
| 4 — temps réel | fait | jeu + chat fusionnés, physique sans `three`, JWT au handshake |
| 5 — API Django | fait | Django 5.2, config par environnement, Neon prêt, avatars réparés |
| **6 — interface** | **à faire** | retravail visuel, responsive, contrôles tactiles |
| **7 — déploiement** | **à faire** | Vercel + Koyeb + Render + Neon |

Architecture cible et justification du découpage : `PLAN.md`.

---

## Ce qui a été essayé en vrai

Le trou est comblé. Vérifié en ligne de commande sur la pile réelle :

- l'API répond à travers nginx (`/api/content/` en 200, `/admin/` en 302) ;
- l'inscription passe de bout en bout par le proxy Vite, jeton CSRF compris ;
- le handshake socket.io aboutit sur `/game` **et** `/chat` en WSS à travers nginx,
  avec un jeton réellement émis par Django.

Vérifié dans un navigateur, le 20 août 2026 :

- la SPA s'affiche et le routeur répond ;
- la scène 3D se charge, malgré le saut de `three` r166 à r185 ;
- le son démarre et les musiques s'enchaînent ;
- la raquette de l'IA bouge en solo.

Il a fallu une correction pour y arriver : `main.js` charge le routeur derrière un
`await import()`, et l'évaluation d'un module à `await` de premier niveau se termine
**après** `DOMContentLoaded`. `app.js` posait son écouteur sur un événement déjà
passé, `initRouter()` ne partait jamais et la page restait blanche, sans erreur en
console. Le démarrage teste désormais `document.readyState`.

**Seul chemin jamais exercé : le retour de l'OAuth 42.** La clé de l'application sur
l'intra est périmée et l'application déclarée pointe encore vers
`c1r4p6.42nice.fr:8080`. Décision prise de laisser en l'état ; pour l'essayer un
jour, il faudra une clé neuve et l'ajout de
`https://localhost:8080/api/auth/42/callback/` aux URL de rappel.

---

## Ce qui est vérifié, et comment

```bash
make check
```

Enchaîne cinq contrôles. Ils ne remplacent pas un essai réel mais ils tiennent
les régressions les plus faciles à réintroduire :

| Script | Ce qu'il garantit |
|---|---|
| `check-assets.mjs` | aucun asset référencé manquant, aucun fichier orphelin, décodeur meshopt branché |
| `check-escaping.mjs` | échappement HTML en contexte texte **et** attribut, aucun `innerHTML` interpolé hors gabarit |
| `check-physics.mjs` | boîtes englobantes conformes à three, comportement de la balle réécrite |
| `check-realtime.mjs` | démarre le service et contrôle 2 namespaces + 4 cas de refus de jeton |
| `check_django.py` | migrations, revendication `display_name` sur tout jeton, validation des noms |

Prérequis d'environnement, à connaître avant de s'étonner :

- **Node 22 minimum.** Le `node` du système est en v19, trop ancien pour Vite 8
  et pour `gltf-transform`. Utiliser `~/.nvm/versions/node/v24.18.1/bin`.
- `npm install` dans `frontend/` **et** dans `src/requirements/realtime/`.
- `check_django.py` demande les dépendances de
  `src/requirements/django/conf/requirements.txt` dans un environnement virtuel ;
  `make check` prend automatiquement `.venv/bin/python` s'il existe à la racine.
- `src/.env` était resté dans sa forme d'avant le remaster (variables
  `GAME_SERVER_HOST`, `CHAT_SERVER_HOST`, Grafana, Discord) et il manquait tout ce
  que le Lot 5 attend. Il a été réécrit sur `src/.env.example`, avec une clé
  Django neuve de 48 octets — l'ancienne faisait 23 octets, sous le minimum HS256.
  `make update-hostname` a disparu avec elle : plus aucun hôte n'est en dur.

---

## Décisions qui vous reviennent

### Stockage des avatars (bloque le Lot 7)

L'envoi de fichier fonctionne et écrit dans `MEDIA_ROOT`, mais **le disque du
tier gratuit Render est éphémère** : les avatars disparaîtront à chaque
redémarrage. Trois issues :

1. se limiter aux avatars prédéfinis et à celui de l'intra 42 — ce que font déjà
   trois des quatre chemins de code, et la seule option gratuite sans dépendance ;
2. un stockage objet (Cloudinary, S3) — un compte et une dépendance de plus ;
3. un disque payant chez l'hébergeur.

Rien n'est verrouillé dans un sens ou dans l'autre.

### Rotation des secrets (bloque toute mise en ligne publique)

`src/.env` a été versionné dans l'historique Git avec des valeurs réelles. Tout
ce qu'il contient est à considérer comme compromis :

- le client secret OAuth 42 — déjà périmé, donc sans danger, mais une clé neuve
  sera nécessaire pour rouvrir ce chemin (https://profile.intra.42.fr/oauth/applications) ;
- le webhook Discord ;
- la clé secrète Django et les identifiants PostgreSQL et Grafana.

Le fichier n'est plus suivi, mais il reste dans l'historique. Le purger
(`git filter-repo`) réécrit l'historique — c'est aussi le bon moment pour
alléger le pack de 702 Mo, que la compression des assets n'a pas réduit
puisqu'elle ne touche que le checkout.

---

## Ce qui reste à construire

### Lot 6 — Interface

Le jeu est **injouable sur mobile** : les contrôles sont exclusivement clavier
(`w`/`s` et les flèches). C'est le manque le plus visible.

Retravail visuel sans refonte : typographie, espacements, transitions entre
menus, écran de chargement avec progression — le GLB fait encore 5,2 Mo.

Deux corrections repérées mais pas faites, à traiter ici :

- dans `frontend/src/game/loadIsland.mjs`, quatre des cinq noms de meshes testés
  pour `receiveShadow` (`socle_sable_parfait`, `ile_sable_imparfait`,
  `socle_turquoise_scene`, `Plan001`) et le clip d'animation `Palmier2`
  **n'existent pas dans le GLB** — conditions mortes d'origine, pas une
  régression, mais les ombres n'ont jamais été celles prévues ;
- `avatar_url` est incohérent en base : tantôt `https://…`, tantôt `url("…")`
  selon qu'il vient de l'inscription, de l'OAuth 42 ou d'un envoi de fichier.
  Le client rattrape les deux formes au coup par coup. Ce champ n'est
  volontairement pas validé côté serveur — l'échappement suffit à fermer la
  faille XSS, et durcir maintenant casserait des comptes existants.

### Lot 7 — Déploiement

Cible retenue et justifiée dans `PLAN.md` :

```
Vercel (statique) ──── frontend, avec rewrites /api/* vers Render
        └── WSS ─────► Koyeb : service realtime (ne s'endort pas)
Render ──────────────► API Django ──► Neon : PostgreSQL
```

Koyeb prend le temps réel parce qu'il ne met pas en veille ; Render peut
s'endormir (réveil ~1 min) sans gêner autre chose que le premier login. Les
`rewrites` Vercel évitent CORS et gardent les cookies CSRF en same-origin, ce
qui a permis de laisser les ~30 appels REST en chemin relatif.

Variables à renseigner : `src/.env.example` et `frontend/.env.example` listent
tout, avec les valeurs attendues en production.

---

## Repères dans le code

| Où | Quoi |
|---|---|
| `frontend/src/js/` | SPA : routeur, vues, utilitaires |
| `frontend/src/game/` | client du jeu (rendu three) |
| `frontend/src/config.js` | adresses des namespaces socket.io |
| `frontend/src/js/utils/html.js` | gabarit `html` qui échappe les interpolations |
| `src/requirements/realtime/src/game/` | physique et salles côté serveur, sans three |
| `src/requirements/realtime/src/auth.mjs` | vérification des JWT au handshake |
| `src/requirements/django/src/pong/tokens.py` | émission des jetons, revendication `display_name` |

`ball.mjs`, `pad.mjs` et `config.mjs` existent en deux exemplaires : côté client
pour le rendu, côté serveur pour la physique. Ce n'est pas une duplication à
résorber — les deux versions ont divergé volontairement au Lot 4.

Deux invariants à ne pas casser sans le savoir :

- toute émission de jeton doit passer par `pong/tokens.py`, sinon la
  revendication `display_name` manque et le handshake socket.io est refusé
  **sans erreur visible côté API** ;
- les constantes `PAD_HALF` et `BALL_HALF` de la physique serveur sont mesurées
  sur la géométrie du client. Modifier l'une sans l'autre casse les collisions ;
  `check-physics.mjs` le détecte.
