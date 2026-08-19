# Audit de faisabilité — remaster ft_transcendence

Branche : `remaster` (créée depuis `main`, aucun fichier de `main` modifié).
Date : 2026-08-19.
Objectif évalué : refaire tourner **le jeu** seul, hébergé gratuitement et durablement,
jouable en un lien, interface retravaillée sans refonte.

---

## 1. Verdict court

**Faisable.** Aucun blocage technique de fond. Trois obstacles réels, dans l'ordre :

1. **Le poids des assets** — ~209 Mo téléchargés par partie. C'est le vrai bloqueur, avant
   même la question de l'hébergeur. Réductible à ~10-15 Mo sans toucher au rendu.
2. **La boucle de jeu est côté serveur** (`setInterval` à 16 ms) — cela interdit
   l'hébergement 100 % serverless type Vercel pour la partie multijoueur, et impose
   un process qui tourne en permanence.
3. **Les secrets sont dans le dépôt** — `src/.env` est versionné. À purger et faire tourner
   avant toute mise en ligne publique.

Le reste (mise à jour des paquets, retravail de l'UI, suppression de Grafana/Prometheus/CI)
est du travail mécanique, sans risque architectural.

---

## 2. Ce que fait vraiment le code aujourd'hui

Points relevés en lisant le code, qui conditionnent tout le reste :

| Constat | Conséquence |
|---|---|
| Le client de jeu **ne dépend pas de l'authentification** pour démarrer. Le bouton START fonctionne seul ; `username` sert uniquement à savoir quel pad on contrôle | On peut déployer le jeu sans Django, sans base, sans comptes. C'est la bonne nouvelle du dossier. |
| **Tous les modes passent par le serveur**, y compris `solo_vs_ia` et `multi-2-local` (`socketEvent.mjs:41-61`) | Solo et local-2-joueurs sont rapatriables côté client sans réécriture : la physique (`ball.mjs`, `pad.mjs`, `game.mjs`) est déjà en modules partagés client/serveur. |
| Le serveur importe `three` pour la physique (`ball.mjs:13`) et garde l'état en RAM (`rooms`, `clients`, `keysPressedMap` dans `sockets.mjs`) | Un redémarrage tue toutes les parties. Et `three` côté serveur pour du calcul de vecteurs 2D est du poids inutile. |
| Boucle à 16 ms émettant `moveBall` + `movePad` à toute la room | ~62 messages/s/room sortants. Impose un process persistant, exclut le serverless classique. |
| Le jeu est intégré en `<iframe>` dans le dashboard Django, credentials passés par `postMessage` | Ce couplage disparaît si on sort Django. |
| Le hostname `c1r4p6.42nice.fr:8080` est en dur dans 6 fichiers, réécrit par `make update-hostname` | À remplacer par une variable d'environnement / URL relative. Blocage direct pour un déploiement. |

---

## 3. Le poids des assets — le vrai sujet

Mesuré sur `src/requirements/game_server/game/` :

**Chargé à chaque partie : 209 Mo.**

| Ressource | Poids | Remarque |
|---|---|---|
| `scenes/pongScene_V6.glb` | 31 Mo | Non compressé (ni Draco ni meshopt) |
| 14 fichiers audio, **tous chargés d'un coup** dans le constructeur `Sound` (`sounds.mjs:12-25`) | ~175 Mo | 6 WAV non compressés dont `song1.wav` (37 Mo), `lobby.wav` (26 Mo), `ambient.wav` (21 Mo) |
| `png/logoScreen.png` + `png/clouds.png` | 0,6 Mo | OK |
| `three` servi depuis `node_modules/` versionné | ~1 Mo | Non minifié, non tree-shaké |

**En plus : 89 Mo d'assets jamais référencés** par aucun `.mjs`, `.css` ou `.html` :
`pongScene_V4.glb` (32 Mo), `pongScene_V5.glb` (32 Mo), `explosive.jpg` (13 Mo),
`tournamentMode.png` (5,2 Mo), `sable.jpg` (4,8 Mo), `sand-texture.jpg`, `mer.jpg`.

**Cible réaliste : ~10-15 Mo au premier chargement**, sans changer le rendu :
- suppression des 89 Mo morts → gratuit, aucun risque ;
- GLB compressé (Draco/meshopt + redimensionnement des textures internes) → 31 Mo ➜ 3-5 Mo ;
- audio ré-encodé en Opus/AAC ~128 kbps + **chargement paresseux** (la musique de partie n'a
  aucune raison d'être téléchargée sur l'écran titre) → 175 Mo ➜ 6-8 Mo, dont ~1 Mo au démarrage.

Sans ça, aucun hébergeur gratuit ne tient : la bande passante Vercel Hobby (100 Go/mois)
serait consommée en ~500 visites.

Note connexe : le dépôt Git pèse **702 Mo** de pack. Les plateformes clonent le dépôt pour builder.
Les optimiser sur la branche n'allège pas l'historique — à traiter séparément si les builds
deviennent pénibles (dépôt neuf, ou `git-lfs`).

---

## 4. Hébergement gratuit : ce qui marche et ce qui ne marche pas

### Vercel

- **Frontend statique : oui, parfait.** C'est le bon usage.
- **Serveur de jeu : non.** Vercel a bien du WebSocket natif (bêta publique depuis juin 2026,
  Socket.IO listé comme supporté), mais la connexion est coupée à la durée max de la fonction,
  et **rien ne garantit que deux joueurs tombent sur la même instance de fonction**. Or l'état
  des rooms vit en mémoire dans un seul process. C'est rédhibitoire pour ce code.

### Options pour le serveur de jeu (process persistant)

| Plateforme | Gratuit ? | WebSocket | Réserve |
|---|---|---|---|
| **Koyeb** nano | Oui, 1 service, 0,1 vCPU / 512 Mo | Oui | 0,1 vCPU est juste pour une boucle 62 Hz — passer le tick à 30 Hz et virer `three` du serveur |
| **Render** free | Oui | Oui | **Se met en veille après 15 min sans trafic**, ~1 min de réveil. Les WebSockets ouverts sont coupés à la mise en veille |
| **Cloudflare Workers + Durable Objects** | Oui — 100 k requêtes/jour, 313 000 GB-s/mois | Oui, natif | Le meilleur choix technique à terme (1 Durable Object = 1 room, état en mémoire, zéro cold start), mais **c'est un portage** du serveur |
| **Fly.io / Railway** | Non | Oui | Plus de vrai tier gratuit, carte bancaire requise |

### Recommandation

Une approche en deux temps, qui donne quelque chose de jouable très vite :

**Phase 1 — statique pur, zéro serveur.**
Rapatrier `solo_vs_ia` et `multi-2-local` côté client (la physique est déjà partagée, c'est
du câblage, pas de la réécriture). Déployer sur Vercel ou Cloudflare Pages.
Résultat : un lien, ça charge, on joue. Gratuit indéfiniment, aucun cold start, aucune latence.

**Phase 2 — modes en ligne.**
Serveur Socket.IO sur **Koyeb** (pas de veille) ou **Render** (accepter le réveil d'1 min).
Les modes en ligne (2 joueurs online, 4 joueurs, tournoi) se rebranchent dessus.
Si le besoin de robustesse arrive, portage vers Durable Objects.

Cette découpe a un bénéfice : la Phase 1 est livrable seule et rend le projet "jouable
facilement" au sens demandé, même si la Phase 2 n'est jamais faite.

---

## 5. Paquets à mettre à jour

| Paquet | Actuel | Risque de migration |
|---|---|---|
| `three` | r166 (juin 2024) | **Moyen** — le seul point délicat. Le rendu (espace colorimétrique, éclairage, chargement GLTF) peut changer visuellement. À valider à l'œil, pas au compilateur. |
| `three-orbitcontrols` | 2.110.3 | Déclaré mais **inutilisé** — l'import vient de `three/examples/jsm`. À supprimer. |
| `express` | 4.19 | Faible (5.x change le routage `path-to-regexp`) |
| `socket.io` | 4.7 / 4.8 | Faible |
| Node | 18 (via `alpine:3.18`) | Faible — passer en 22/24 |
| `node-fetch` | 2 et 3 selon les services | À supprimer, `fetch` est natif depuis Node 18 |

Si le backend Django est conservé : Django 5.1.2 ➜ 5.2, gunicorn 20.0.4 ➜ 23, Pillow 10.4 ➜ 11.
Aucun de ces sauts n'est risqué.

**Changement structurant recommandé : introduire Vite.** Il apporte d'un coup le bundling,
le hashing des assets, un serveur de dev avec rechargement à chaud, et rend le déploiement
Vercel/Pages trivial. Il permet surtout de **supprimer les `node_modules` versionnés**
(1 964 fichiers dans Git) et les imports en chemin brut `/game_server/node_modules/three/...`.

---

## 6. Interface

L'UI du jeu est un `index.html` de 186 lignes + `style.css` de 761 lignes, en HTML/CSS simple.
La retravailler sans la refondre est peu risqué : typographie, espacements, états de survol,
transitions entre menus, écran de chargement (utile vu le GLB), et surtout **responsive +
contrôles tactiles**, aujourd'hui absents — le jeu est clavier uniquement (`w`/`s`,
flèches), donc injouable sur mobile.

Question ouverte : le SPA Django (login, dashboard, profil, paramètres, chat) est réutilisé
ou abandonné ? Cela dépend du périmètre choisi (§8).

---

## 7. Sécurité — à traiter avant toute mise en ligne

`src/.env` **est versionné dans Git** (aucun `.gitignore` dans le dépôt). Il contient la clé
secrète Django, les identifiants PostgreSQL, les identifiants Grafana, le webhook Discord et
le **client secret OAuth 42**. Si le dépôt est public, ou le devient, tout est à considérer
comme compromis.

À faire : révoquer et régénérer ces secrets côté 42 / Discord, purger le fichier de
l'historique, ajouter un `.gitignore`.

Autres points relevés, moins urgents mais réels si le projet devient public :
- `generateToken()` (`js/utils/token.js`) contient un couple `admin`/`admin` en dur ;
- le serveur de chat accepte le `username` du handshake **sans vérifier le JWT** — n'importe
  qui peut se déclarer n'importe qui ;
- `ALLOWED_HOSTS = ['*']` et `cors origin: "*"` sur le serveur de chat.

---

## 8. Ce qui reste à décider

Une seule question change l'architecture :

**Périmètre — jeu seul, ou jeu + comptes ?**

- *Jeu seul* : plus de Django, plus de PostgreSQL, plus de chat, plus de profils. Reste un
  frontend statique + un serveur de jeu. Pseudo saisi à l'écran, parties par code de salon.
  Gratuit et sans entretien, indéfiniment.
- *Jeu + comptes* : il faut garder une API et une base. Le tier gratuit devient plus fragile
  (bases Postgres gratuites qui expirent, service qui s'endort). Django peut être conservé
  ou remplacé par quelque chose de plus léger.

Le reste des choix (hébergeur exact, ampleur du retravail UI) découle de celle-là.
