# ft_transcendence

![Transcendence Miniature](docs/ft_transcendence.png)

Pong en 3D jouable dans le navigateur, avec comptes, amis, chat et historique de
parties. Projet final du cursus web de l'école 42, remasterisé sur la branche
`remaster` pour être hébergeable ailleurs qu'en local.

## Fonctionnalités

- Pong 3D (three.js) en solo contre l'IA, en local à deux, en ligne à deux ou à
  quatre, et en tournoi
- Chat entre amis et demandes d'ami en temps réel (socket.io)
- Comptes, profils, avatars, statistiques de victoires et défaites
- Connexion par mot de passe ou via l'OAuth de l'intra 42

## Technologies

| Couche     | Choix                                            |
| ---------- | ------------------------------------------------ |
| Frontend   | Vite, JavaScript, Bootstrap 5, three.js          |
| API        | Django 5.2 + Django REST framework, JWT          |
| Temps réel | Node + socket.io (namespaces `/game` et `/chat`) |
| Base       | PostgreSQL                                       |
| Local      | Docker Compose, nginx en terminaison TLS         |
| Assets 3D  | Blender, glTF                                    |

## Arborescence

```
frontend/        application Vite : SPA et client du jeu
src/
  compose.yaml   pile locale
  django/        API : app/ (projet Django), conf/, Dockerfile
  realtime/      service socket.io : src/, Dockerfile
  nginx/         proxy TLS, local uniquement
  postgresql/    base locale uniquement
scripts/         vérifications (check-*) et outils d'assets (bake-*)
```

Un répertoire par cible de déploiement : le frontend part sur un hébergeur
statique, `django/` et `realtime/` sur leurs plateformes respectives, `nginx/`
et `postgresql/` ne servent qu'en local.

## Installation

Node 22 ou plus récent est nécessaire (Vite 8, gltf-transform).

```bash
git clone https://github.com/phudyka/ft_transcendence.git
cd ft_transcendence

cp src/.env.example src/.env               # secrets et adresses du backend
cp frontend/.env.example frontend/.env     # adresses vues par le navigateur

make                                       # nginx, django, postgresql, realtime
cd frontend && npm install && npm run dev  # Vite sur http://localhost:5173
```

Vite relaie `/api`, `/media` et `/socket.io` vers la pile Docker : le frontend
n'est servi ni par nginx ni par Django.

## Vérifications

```bash
make check   # six scripts, sans conteneur
make lint    # ESLint sur frontend/, realtime/ et scripts/
```

Les scripts couvrent les assets, l'échappement HTML, l'accord des boîtes de
collision entre client et serveur, le routage des touches, le système de design
et le rejet des jetons invalides au handshake. `npm install` est requis à la
racine, dans `frontend/` et dans `src/realtime/`.

## Documentation

| Fichier           | Contenu                                           |
| ----------------- | ------------------------------------------------- |
| `docs/HANDOFF.md` | état des travaux, ce qui reste à faire            |
| `docs/PLAN.md`    | architecture cible et journal des décisions       |
| `docs/PRODUCT.md` | public visé et intention du produit               |
| `docs/DESIGN.md`  | système de design, vérifié par `check-design.mjs` |
| `CLAUDE.md`       | repères pour travailler dans le dépôt             |

## Sécurité

Les jetons JWT sont vérifiés par signature au handshake socket.io, toute
interpolation atteignant `innerHTML` passe par un gabarit qui échappe, et les
appels REST restent relatifs pour garder les cookies CSRF en même origine.

**Les secrets présents dans l'historique git sont compromis** (clé Django,
identifiants de base, secret OAuth 42) : les faire tourner avant tout
déploiement public.

## Auteurs

- [faperac](https://github.com/faperac)
- [dtassel](https://github.com/Freiko789)
- [efirmino](https://github.com/EdsonFirmino)
- [phudyka](https://github.com/phudyka)
