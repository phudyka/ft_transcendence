# Accessibility Requirements

**Palier engagé : Comprehensive.** Décidé le 20 août 2026. Aucun standard
n'avait été imposé au projet (`docs/PRODUCT.md` § Accessibility & Inclusion) ;
ce document est la décision qui manquait. Toute spec UX de `design/ux/` doit
atteindre ou dépasser ce palier, et `/ux-review` s'en sert comme référence de
contrôle.

## Pourquoi ce palier

Le produit est d'abord une pièce de portfolio lue par des recruteurs et des
développeurs. Une interface qui s'annonce correctement est une preuve technique
au même titre que la scène 3D. Le socle est par ailleurs déjà en place — anneau
de focus unique, `prefers-reduced-motion`, régions `aria-live` sur le score, le
chat et l'état de match — donc le palier décrit surtout un existant à tenir, pas
un chantier à ouvrir.

## Ce que Comprehensive exige ici

### 1. Socle Basic — aucune information par la couleur seule

Tout état signalé par une couleur porte un second signal : texte, icône, forme
ou position. Concerne au minimum le point de présence en ligne, l'issue
victoire/défaite dans l'historique, la validité des champs de formulaire, et
l'attribution des raquettes par couleur d'équipe.

### 2. Socle Standard

- **Ordre de focus documenté** dans chaque spec, section Accessibility.
- **Navigation au clavier seul** sur toute la SPA, sans piège de focus.
- **Anneau de focus unique**, défini une seule fois dans
  `frontend/src/css/tokens.css` (`:focus-visible`) — jamais redéfini par une
  feuille de vue. Vérifié par `scripts/check-design.mjs`.
- **Contrastes chiffrés** : 4,5:1 minimum pour le texte courant, 3:1 pour le
  texte large (≥ 24 px ou ≥ 19 px gras) et pour les bordures d'éléments
  interactifs. Chaque spec annonce les ratios de ses paires texte/fond.
- **Cibles ≥ 44 × 44 px**, champs de saisie ≥ 16 px de corps.
- **`prefers-reduced-motion: reduce`** neutralise toute animation décorative.
  L'animation de la scène 3D est du contenu, pas de la décoration : elle
  continue, mais aucune transition d'interface ne s'y ajoute.

### 3. Exigences propres à Comprehensive — annonces lecteur d'écran

Chaque changement d'état significatif est annoncé sans déplacer le focus. Un
changement est significatif s'il modifie ce que la personne peut faire, ou s'il
constitue le résultat qu'elle attendait.

| Changement d'état              | Annonce attendue                              | Politesse                    | Existant                                    |
| ------------------------------ | --------------------------------------------- | ---------------------------- | ------------------------------------------- |
| Point marqué                   | Score complet des deux camps                  | `polite`                     | `#score-announce` dans `frontend/game.html` |
| Fin de partie / de match       | Issue et vainqueur                            | `polite`                     | `#match-info`                               |
| Attente d'adversaire           | Progression de l'attente                      | `polite`                     | `#waiting-elapsed`                          |
| Invitation reçue               | Émetteur et nature de l'invitation            | `assertive` (`role="alert"`) | `#invite`                                   |
| Message de chat reçu           | Auteur et contenu                             | `polite`                     | conteneurs `aria-live` de `dashboard.js`    |
| Demande d'ami reçue / acceptée | Nom et nouvel état de la relation             | `polite`                     | à vérifier par spec                         |
| Erreur de formulaire           | Message d'erreur, champ marqué `aria-invalid` | `assertive` (`role="alert"`) | `#loginError`, `#registerError`             |
| Changement de route SPA        | Titre du nouvel écran                         | `polite`                     | absent — écart connu                        |
| Toast / notification           | Contenu du toast                              | `polite`                     | via `utils/feedback.js`                     |

**Règle d'écriture pour les specs.** Une région live encadre un seul nœud dont
le texte est remplacé en entier. Encadrer trois nœuds frères et n'en modifier
qu'un produit des annonces partielles ou muettes — la correction est déjà
commentée dans `frontend/game.html`.

**Règle de focus.** Une annonce ne vole jamais le focus. Le focus ne se déplace
que sur action explicite : ouverture de modale, soumission de formulaire en
erreur, changement de route.

### 4. Écarts connus, non couverts par ce palier

- **Pas de remappage des touches.** Limite assumée (`docs/PRODUCT.md`), pas un
  défaut à signaler dans chaque spec.
- **Pas de sous-titrage des effets sonores.** Les quatorze pistes audio sont de
  l'ambiance ; aucune information de jeu n'est portée par le son seul, ce qui
  rend le sous-titrage non bloquant. À réexaminer si un signal sonore devient
  informatif.
- **Le mode deux joueurs en local partage un clavier.** Aucune adaptation
  lecteur d'écran n'est prévue pour deux personnes sur une même machine.

## Vérification

`scripts/check-design.mjs` couvre l'anneau de focus, le plancher 16 px, les
couleurs codées en dur et les jetons orphelins. Le reste — ordre de focus,
annonces, contrastes — se vérifie spec par spec via `/ux-review`, pas
automatiquement.
