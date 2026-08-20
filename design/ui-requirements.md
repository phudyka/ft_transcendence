# UI Requirements

Source de vérité des exigences d'interface, par système. Remplace l'arbre
`design/gdd/` du pipeline studio : ce projet a déjà des documents qui font
autorité (`docs/PRODUCT.md`, `docs/DESIGN.md`, `docs/PLAN.md`, `CLAUDE.md`) et
un second arbre les dupliquerait sans rien ajouter.

Les exigences ci-dessous sont **extraites du code livré** sur la branche
`remaster`, pas rédigées à l'avance : le périmètre fonctionnel est gelé
(`docs/PRODUCT.md`, principe n° 3). Chaque spec de `design/ux/` référence en
en-tête les identifiants qui la concernent, et `/ux-review` vérifie qu'aucun
n'est resté sans traitement.

Convention d'identifiant : `UI-<SYSTÈME>-<n>`.

---

## AUTH — Comptes et session

| ID        | Exigence                                                                                            | Preuve dans le code                    |
| --------- | --------------------------------------------------------------------------------------------------- | -------------------------------------- |
| UI-AUTH-1 | Inscription : nom d'affichage, mot de passe, choix d'un avatar parmi sept                           | `views/register.js`, `public/avatars/` |
| UI-AUTH-2 | Connexion par nom d'affichage et mot de passe, jeton JWT stocké côté client                         | `views/login.js`, `utils/token.js`     |
| UI-AUTH-3 | Bascule de visibilité du mot de passe sur les deux formulaires                                      | `utils/unmask.js`                      |
| UI-AUTH-4 | Erreurs d'authentification affichées dans l'écran, jamais en `alert()`                              | `#loginError`, `#registerError`        |
| UI-AUTH-5 | Entrée « connexion 42 » présente, chemin jamais exercé (clé d'intra périmée)                        | `api/auth/42/login/`                   |
| UI-AUTH-6 | Démonstration jouable sans compte depuis l'accueil, sans accès aux écrans protégés                  | `views/home.js`, `PROTECTED_ROUTES`    |
| UI-AUTH-7 | Déconnexion accessible depuis le menu de profil du tableau de bord                                  | `#logoutLink`                          |
| UI-AUTH-8 | Toute tentative d'accès à `/dashboard`, `/settings`, `/profile` sans session redirige vers `/login` | `app.js`                               |

## GAME — Pong 3D

| ID         | Exigence                                                                                                             | Preuve dans le code                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| UI-GAME-1  | Six modes offerts : solo contre l'IA, deux en local, deux en ligne, quatre joueurs, demi-finale et finale de tournoi | `#solo-ia`, `#multi-2-local`, `#multi-2-online`, `#multi-four`, `src/realtime/app/game/` |
| UI-GAME-2  | Écran de chargement avec barre de progression avant la première image de la scène                                    | `#loading`, `#loading-bar`                                                               |
| UI-GAME-3  | Bouton de démarrage explicite ; la partie ne commence jamais toute seule                                             | `#start-game-button`, `#space`                                                           |
| UI-GAME-4  | Bandeau de score visible en jeu, mis à jour à chaque point                                                           | `updateScores`, `docs/DESIGN.md` § Signature                                             |
| UI-GAME-5  | Rappel des commandes avant la partie                                                                                 | `#controls-brief`                                                                        |
| UI-GAME-6  | Attente d'adversaire signalée, avec durée écoulée                                                                    | `#waiting`, `#waiting-elapsed`                                                           |
| UI-GAME-7  | Fin de partie annoncée avec le vainqueur, puis retour possible au menu                                               | `#match-info`, `#back`, `gameOver`                                                       |
| UI-GAME-8  | Zones tactiles pour piloter la raquette, affichées uniquement sur pointeur grossier                                  | `css/game.css` `@media (pointer: coarse)`                                                |
| UI-GAME-9  | La raquette pilotée dépend du mode ; une touche qui ne pilote rien n'émet rien                                       | `game/controls.mjs`, `scripts/check-controls.mjs`                                        |
| UI-GAME-10 | Couleur d'équipe distinguant les raquettes, doublée d'un second signal                                               | `docs/DESIGN.md`, `design/accessibility-requirements.md`                                 |
| UI-GAME-11 | Issue du match remontée au serveur ; le client ne rapporte que le résultat, jamais les totaux                        | `game/api.mjs`, `api/save-match-result/`                                                 |

## TOURNAMENT — Tournoi à quatre

| ID        | Exigence                                                                                  | Preuve dans le code                                                    |
| --------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| UI-TOUR-1 | Liste des tournois ouverts, et création d'un tournoi                                      | `#tournament-list`, `#create-tournament`                               |
| UI-TOUR-2 | Tableau des quatre participants, des deux vainqueurs de demi-finale et du vainqueur final | `#player-1`…`#player-4`, `#Gagnant-1`, `#Gagnant-2`, `#Gagnant-Finale` |
| UI-TOUR-3 | État « pas prêt » signalé tant que les quatre places ne sont pas tenues                   | `#notReady`, `#not-ready-text`                                         |
| UI-TOUR-4 | Abandon possible à tout moment                                                            | `#quit-tournament`                                                     |
| UI-TOUR-5 | Enchaînement demi-finale puis finale sans retour au menu principal                        | `src/realtime/app/game/tournament.mjs`                                 |

## SOCIAL — Amis, blocage, chat

| ID        | Exigence                                                                             | Preuve dans le code                                        |
| --------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| UI-SOC-1  | Ajout d'un ami par nom d'affichage                                                   | `#addFriendForm`                                           |
| UI-SOC-2  | Trois onglets de relation : en ligne, en attente, bloqués                            | `#tab-online`, `#tab-pending`, `#tab-blocked`              |
| UI-SOC-3  | Demande d'ami : accepter ou refuser depuis l'onglet « en attente »                   | `api/accept-friend-request/`, `api/reject-friend-request/` |
| UI-SOC-4  | Relation asymétrique : accepter crée deux enregistrements                            | `Friendship`, `CLAUDE.md`                                  |
| UI-SOC-5  | Menu contextuel sur un ami : message privé, inviter à jouer, voir le profil, bloquer | `#friendDropdown`                                          |
| UI-SOC-6  | Chat général et conversations privées en panneaux latéraux                           | `#chat-log`, `#private-chats-container`                    |
| UI-SOC-7  | Invitation à jouer reçue en jeu, avec accepter et annuler                            | `#invite`, `#accept`, `#cancel`                            |
| UI-SOC-8  | Une seule session par nom d'affichage ; la précédente est déconnectée                | `force_disconnect`                                         |
| UI-SOC-9  | Présence en ligne visible, portée par un second signal que la couleur                | `api/update-online-status/`                                |
| UI-SOC-10 | Tout contenu utilisateur est échappé avant d'atteindre le DOM                        | `utils/html.js`, `scripts/check-escaping.mjs`              |

## PROFILE — Profil et statistiques

| ID        | Exigence                                                                                       | Preuve dans le code                        |
| --------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------ |
| UI-PROF-1 | Profil personnel et profil d'un ami sur la même vue, en deux variantes                         | `views/profile.js`, route `/profile/:name` |
| UI-PROF-2 | Avatar, nom d'affichage, totaux de victoires et de défaites                                    | `views/profile.js`                         |
| UI-PROF-3 | Ratio victoires/défaites en anneau, rendu en `conic-gradient`, sans bibliothèque de graphiques | `css/profile.css`                          |
| UI-PROF-4 | Historique des matchs récents                                                                  | `api/get-recent-matches/`                  |
| UI-PROF-5 | Issue de chaque match lisible sans recours à la couleur seule                                  | `design/accessibility-requirements.md`     |
| UI-PROF-6 | Profil introuvable traité comme un état de la vue, pas comme une erreur muette                 | `views/profile.js` ligne ~278              |
| UI-PROF-7 | Les noms longs sont tronqués sans casser la mise en page                                       | `css/profile.css`                          |

## SETTINGS — Paramètres

| ID       | Exigence                                                                  | Preuve dans le code                              |
| -------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| UI-SET-1 | Modification du nom d'affichage, du courriel, du mot de passe             | `views/settings.js`, `api/update-user-settings/` |
| UI-SET-2 | Envoi d'un avatar, plafonné à 2 Mo                                        | `views/settings.js`                              |
| UI-SET-3 | Valeurs existantes pré-remplies à l'ouverture                             | `views/settings.js`                              |
| UI-SET-4 | Confirmation ou erreur après enregistrement, dans l'écran                 | `utils/feedback.js`                              |
| UI-SET-5 | Le nom d'affichage est validé côté serveur ; l'interface reflète le refus | `scripts/check_django.py`                        |

## NAV — Navigation et cadre applicatif

| ID       | Exigence                                                                            | Preuve dans le code                                  |
| -------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------- |
| UI-NAV-1 | Application à page unique : toute navigation passe par `navigateTo()`               | `app.js`                                             |
| UI-NAV-2 | Retour et avance du navigateur fonctionnels (`popstate`)                            | `app.js`                                             |
| UI-NAV-3 | Route inconnue : écran 404 avec chemin de retour                                    | `views/notfound.js`                                  |
| UI-NAV-4 | Changement de route annoncé aux lecteurs d'écran : titre d'onglet réécrit, focus porté sur le `h1` | `announceRoute()`, `frontend/src/app.js:18-24` |
| UI-NAV-5 | Le jeu est chargé en `iframe` dans le tableau de bord, et autonome sur `/game.html` | `#pong`, `frontend/game.html`                        |
| UI-NAV-6 | Coupure d'inactivité de dix minutes côté client                                     | `utils/socketManager.js` — non réarmée, écart connu  |
