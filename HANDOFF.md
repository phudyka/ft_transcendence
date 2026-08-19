# Reprise — remaster ft_transcendence

Point d'entrée pour reprendre le travail. Les deux autres documents restent la
référence de fond : `AUDIT.md` (constat de départ, options d'hébergement) et
`PLAN.md` (architecture cible, lots, journal détaillé des décisions).

État au 20 août 2026, branche `remaster`.

---

## À faire en premier : rien n'est commité

**2 138 fichiers modifiés attendent en zone d'index, sur zéro commit.** Un
`git checkout` ou un `git stash` malheureux efface plusieurs heures de travail,
dont 89 Mo d'assets supprimés et 2 000 fichiers déplacés.

```bash
git status --short | head        # 44 ajouts, 2 042 suppressions, 43 renommages, 9 modifications
git commit -m "remaster: lots 0 à 5"
```

`main` est intact et n'a pas été touché.

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

## Le trou dans les vérifications

**Aucune partie n'a jamais été jouée depuis le début du remaster.** Tout ce qui
est affirmé plus bas est vérifié par des contrôles automatiques ; le
comportement réel dans un navigateur, lui, ne l'est pas. C'est le premier
travail à faire avant d'entamer le Lot 6 — la pile est désormais dans sa forme
cible, donc l'essai est possible :

```bash
make                       # docker compose : nginx, django, postgresql, realtime
cd frontend && npm run dev # Vite sur :5173, proxifie /api, /media et /socket.io
```

Points à observer en priorité, ce sont les endroits les plus retouchés :

- la scène 3D se charge (GLB recompressé en meshopt, `three` passé de r166 à r185 —
  colorimétrie, éclairage et GLTF sont les points sensibles de ce saut) ;
- le son démarre et les musiques de partie s'enchaînent (chargement paresseux) ;
- la connexion socket aboutit sur `/game` et `/chat` (le JWT est désormais exigé
  au handshake : sans jeton valide, tout est muet et rien ne s'affiche) ;
- la raquette de l'IA bouge en solo (`movePad` n'est plus émis qu'au changement) ;
- le retour de l'OAuth 42 atterrit sur le frontend et non sur l'API.

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
  `src/requirements/django/conf/requirements.txt` dans un environnement virtuel.

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

- le client secret OAuth 42 — à révoquer sur https://profile.intra.42.fr/oauth/applications ;
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
