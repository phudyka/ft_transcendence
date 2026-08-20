# Technical Preferences

Source de vérité pour les décisions transverses que les skills de conception
lisent avant d'écrire quoi que ce soit. Les faits ci-dessous sont extraits du
code livré sur la branche `remaster`, pas d'une intention.

Documents liés : `docs/PRODUCT.md` (positionnement, principes), `docs/DESIGN.md`
(système visuel), `docs/PLAN.md` (architecture cible),
`design/accessibility-requirements.md` (palier engagé).

## Input & Platform

**Cible plateforme : web uniquement.** Aucun build natif, aucune console. Le
frontend est une application Vite servie en statique ; il n'existe pas de
version installable.

| Entrée                      | Statut                                                                                       | Où c'est implémenté                               |
| --------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Clavier                     | **Principal** — le jeu sérieux se joue au clavier                                            | `frontend/src/game/controls.mjs`                  |
| Souris / pointeur fin       | **Principal** pour la SPA (formulaires, navigation, chat)                                    | vues DOM standard                                 |
| Tactile / pointeur grossier | **Secondaire** — zones tactiles du jeu, affichées uniquement sous `@media (pointer: coarse)` | `frontend/src/css/game.css`, `frontend/game.html` |
| Manette / gamepad           | **Non supporté** — aucune API Gamepad n'est lue                                              | —                                                 |
| Lecteur d'écran             | **Engagé** au palier Comprehensive, voir `design/accessibility-requirements.md`              | partiellement implémenté                          |

**Navigation au clavier seul : obligatoire sur toute la SPA.** Chaque écran doit
être traversable au `Tab` seul, avec un ordre de focus documenté dans sa spec et
un anneau de focus unique défini une seule fois dans
`frontend/src/css/tokens.css`.

**Pas de remappage des touches.** Les affectations de `controls.mjs` sont figées
et diffèrent selon le mode de jeu ; c'est une limite connue, documentée dans
`design/ux/hud.md`, pas un oubli à combler en douce.

**Aucune interaction ne doit exiger une précision de pointeur.** Toute cible
tactile mesure au moins 44 × 44 px ; les champs de saisie ne descendent jamais
sous 16 px de corps (plancher anti-zoom iOS, vérifié par
`scripts/check-design.mjs`).

**Résolutions de référence.** 1440 × 900 pour l'ordinateur (cas portfolio), 390
× 844 pour le téléphone (cas « utilisable »). Le principe produit est «
ordinateur d'abord, téléphone utilisable » : sur téléphone, jouer reste
possible, gagner un tournoi n'est pas un objectif de conception.

## Rendering & Performance

- Scène 3D three.js r185, GLB unique décodé via meshopt, chargée par
  `frontend/src/game/loadIsland.mjs`.
- Cible : 60 images/seconde sur ordinateur de bureau ; la physique fait autorité
  côté serveur à 60 Hz, le client n'interpole que le rendu.
- Budget d'entrée de la SPA : rien dans l'interface ne doit retarder l'affichage
  de la scène (principe produit n° 1).

## State & Session

- « Connecté » se lit dans `sessionStorage` (`username`), jamais ailleurs.
- Toute navigation passe par `navigateTo()` dans `frontend/src/app.js`.
- Routes protégées : `/dashboard`, `/settings`, `/profile`.
- Les appels REST restent en chemin relatif (`/api/…`) : pas de CORS, cookies
  CSRF préservés.
