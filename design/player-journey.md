# Player Journey

Parcours réels, tracés depuis le code livré et depuis les deux publics de
`docs/PRODUCT.md`. Sert de contexte d'arrivée aux specs de `design/ux/` :
chacune déclare dans quelle phase son écran apparaît et dans quel état
émotionnel la personne y arrive.

Deux parcours coexistent et ne se ressemblent pas. Les confondre est l'erreur
que ce document existe pour éviter.

---

## Parcours A — Le visiteur de portfolio

**Qui.** Recruteur, développeur, curiosité venue d'un CV ou d'un message.
Ordinateur, quelques minutes, aucun compte, aucune intention de revenir.

| Phase                | Écran                            | État à l'arrivée                           | Ce qui peut tuer la visite                               |
| -------------------- | -------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 1. Atterrissage      | `/` (accueil)                    | Curiosité tiède, jugement déjà commencé    | Une page qui n'a rien à montrer avant plusieurs secondes |
| 2. Première preuve   | `/` — démonstration jouable      | Veut voir la 3D, pas lire une présentation | Un mur d'inscription avant toute image                   |
| 3. Essai             | `/game.html` en solo contre l'IA | Teste si « ça marche vraiment »            | Commandes non expliquées ; attente sans explication      |
| 4. Sortie ou bascule | Fermeture, ou `/register`        | Convaincu ou non                           | Formulaire long alors que l'intention est faible         |

**Conséquence de conception.** La démonstration sans compte n'est pas une
fonction de confort : c'est la phase 2 de ce parcours. Elle porte le premier
jugement technique, et c'est le seul moment où l'API endormie sur son tier
gratuit ne pénalise pas la visite — rien n'y est appelé.

## Parcours B — Le joueur

**Qui.** Ami, camarade de promo. Vient pour jouer, revient, veut un tournoi.

| Phase            | Écran                       | État à l'arrivée                               | Ce qui peut tuer la session                      |
| ---------------- | --------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| 1. Retour        | `/login`                    | Impatience : la partie est le but, pas l'écran | Réveil de l'API jusqu'à une minute, sans le dire |
| 2. Première fois | `/register`                 | Accepte un coût d'entrée court                 | Choix d'avatar noyé dans le reste du formulaire  |
| 3. Base          | `/dashboard`                | Cherche qui est en ligne                       | Liste d'amis vide sans indication de quoi faire  |
| 4. Engagement    | Invitation ou choix de mode | Veut jouer maintenant                          | Invitation qui n'arrive pas jusqu'à la personne  |
| 5. Partie        | `/game.html`                | Concentration ; l'interface doit disparaître   | Élément d'interface au centre du terrain         |
| 6. Après         | Fin de match, `/profile`    | Veut savoir si ça a compté                     | Statistiques non mises à jour au retour          |
| 7. Rituel        | Tournoi à quatre            | Sociabilité, enchaînement                      | Tableau qui n'indique pas qui manque             |

**Conséquence de conception.** Les phases 4 à 7 sont un cycle, pas une ligne :
le tableau de bord est traversé plusieurs fois par session. Un écran conçu comme
une destination unique y sera lent au deuxième passage.

---

## États émotionnels par écran

| Écran        | Parcours A          | Parcours B                    |
| ------------ | ------------------- | ----------------------------- |
| `/` accueil  | jugement            | traversée rapide              |
| `/login`     | —                   | impatience                    |
| `/register`  | intention faible    | coût accepté                  |
| `/dashboard` | —                   | recherche, puis retour répété |
| `/game.html` | curiosité technique | concentration                 |
| `/profile`   | —                   | vérification                  |
| `/settings`  | —                   | intention précise et rare     |
| 404          | égarement           | égarement                     |

## Points de friction connus

1. **Réveil de l'API.** Le premier appel après quinze minutes d'inactivité peut
   demander une minute. Frappe la phase B1, jamais A2. Toute spec d'écran qui
   appelle l'API à l'ouverture doit décrire cet état d'attente ; c'est pour lui
   que l'état « chargement » existe.
2. **Session unique par nom.** Se connecter ailleurs déconnecte la session
   précédente sans que la personne l'ait demandé. Concerne les phases B3 à B7.
3. **Coupure d'inactivité de dix minutes.** Côté client, non réarmée : un
   spectateur silencieux d'un tournoi peut être coupé. Concerne la phase B7.
4. **Aucun classement, aucun historique public.** Rien à comparer entre joueurs
   au-delà de son propre profil : la phase B6 se referme vite.
