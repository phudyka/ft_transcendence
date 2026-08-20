# UX Spec: Not Found (404)

> **Status**: In Design **Author**: phudyka + ux-designer **Last Updated**:
> 2026-08-20 **Platform Target**: Web — ordinateur (clavier + souris) d'abord,
> téléphone utilisable (tactile, pointeur grossier). Pas de manette.
> **Accessibility Tier**: Comprehensive (`design/accessibility-requirements.md`)
> **UI Requirements**: UI-NAV-3, UI-NAV-1, UI-NAV-2
> (`design/ui-requirements.md`) **Journey Phase(s)**: Hors des sept phases
> numérotées des deux parcours — un état d'égarement qui peut survenir à tout
> moment, dans le Parcours A comme dans le Parcours B
> (`design/player-journey.md` § États émotionnels par écran) **Template**: UX
> Spec

---

## Purpose & Player Need

La personne arrive en voulant quelque chose de précis — reprendre une session,
ouvrir un profil, retrouver une page vue ailleurs — et se retrouve sur un chemin
qui ne correspond à rien. Elle veut savoir en une seconde que ce n'est pas une
panne de son côté, et repartir vers un endroit connu sans avoir à réfléchir à
où.

---

## Player Context on Arrival

**Parcours A (visiteur de portfolio).** Souvent le tout premier contact avec le
site : un lien de CV ou de message mal recopié, ou une faute de frappe pendant
qu'elle explore l'URL à la main. Aucune session, aucun investissement, un clic
suffit pour qu'elle referme l'onglet. Ce qu'elle porte : rien — ni formulaire
commencé, ni état à perdre.

**Parcours B (joueur).** Arrive ici plus rarement et dans deux cas distincts :
un ancien favori pointant vers une route qui n'existe plus depuis le remaster
(l'ancien Django servait d'autres chemins), ou un retour navigateur vers une
entrée d'historique devenue invalide. Elle porte sa session telle qu'elle était
— `sessionStorage` n'est jamais touché par le routeur, donc si elle était
connectée avant d'atterrir ici, elle l'est toujours.

Dans les deux parcours, l'état émotionnel est le même : l'égarement, pas la
frustration d'un formulaire perdu — rien n'a été saisi sur cet écran.

---

## Navigation Position

Pas une route déclarée : c'est la branche `default` du `switch (path)` de
`frontend/src/app.js:84-85`, atteinte pour tout chemin qui n'est ni `/`,
`/login`, `/dashboard`, `/register`, `/settings`, ni préfixé par `/profile/` ou
égal à `/profile`. Feuille du routeur — rien n'y mène délibérément par un lien
du produit, et elle ne mène nulle part d'autre qu'à l'action de retour qu'elle
propose.

---

## Entry & Exit Points

| Entry Source                                                                        | Trigger                                                                                                                                                                                                       | Player carries this context                                                                                               |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| URL saisie à la main                                                                | faute de frappe dans le chemin (`/dashbord`, `/setting`)                                                                                                                                                      | Aucune — chargement de document neuf, session relue normalement depuis `sessionStorage`                                   |
| Lien mort partagé (CV, message, ancien signet)                                      | ouverture d'un lien vers une route qui n'a jamais existé sur `remaster`, ou qui existait avant lui                                                                                                            | Aucune — souvent premier contact avec le site (Parcours A)                                                                |
| Retour/avance navigateur (`popstate`) vers une entrée d'historique devenue invalide | l'onglet a survécu à un déploiement qui a changé les routes, ou l'historique contient un chemin jamais valide                                                                                                 | La session en cours si elle existe encore : `router()` relit `sessionStorage` à chaque `popstate` (`app.js:90`, UI-NAV-2) |
| Faute de frappe dans un nom d'ami (`/profile/alise`)                                | **N'atteint pas cet écran.** `/profile/:name` est un chemin que le routeur reconnaît ; `profile.js` affiche son propre état "No account with that name." (`frontend/src/views/profile.js:276-303`, UI-PROF-6) | —                                                                                                                         |
| `/profile/` d'un compte supprimé                                                    | **N'atteint pas cet écran**, même mécanisme que ci-dessus                                                                                                                                                     | —                                                                                                                         |
| Route protégée sans session (`/dashboard`, `/settings`, `/profile`)                 | **N'atteint pas cet écran non plus** : redirection directe vers `/login` (`app.js:34-37`, UI-AUTH-8), jamais vers `notFound()`                                                                                | —                                                                                                                         |

| Exit Destination            | Trigger                                                 | Notes                                                                        |
| --------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/dashboard`                | clic/activation sur le bouton de retour, session active | `sessionStorage.getItem("username") !== null` au rendu (`notfound.js:12-14`) |
| `/` (accueil, démo jouable) | clic/activation sur le bouton de retour, aucune session | même condition, branche inverse                                              |
| Fermeture de l'onglet       | abandon sans cliquer                                    | coût de sortie nul — rien n'a été saisi sur cet écran, aucune donnée perdue  |

---

## Layout Specification

### Information Hierarchy

1. Le verdict ("404: Page Not Found") — un `h1`, seul titre de l'écran.
2. L'explication en une phrase ("The page you are looking for does not exist.").
3. Une seule action de sortie.

Pas de barre de recherche, pas de liste de liens suggérés, pas de chrome
applicatif : c'est délibérément le plus petit écran du produit.

### Layout Zones

Une seule zone : `#ft_transcendence` est entièrement remplacé (pas de header ni
de footer persistants — comme toutes les vues de la SPA, chaque écran possède sa
propre mise en page complète). Contenu centré horizontalement et verticalement
sur `min-height: 100dvh` (`tokens.css:263-265`).

### Component Inventory

| Composant                           | Motif de référence                                                                                                                                      | Sélecteur réel                      | État par défaut                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| Bandeau de verdict (titre + phrase) | Nouveau motif — `design/ux/interaction-patterns.md` ne documente aucun message statique plein écran de ce type (le plus proche, Toast, est transitoire) | `.notfound-view .alert`             | Affiché, statique, aucune interaction                             |
| Bouton de retour                    | [Bouton](interaction-patterns.md#bouton), variante primaire                                                                                             | `#backToLogin` (`.btn.btn-primary`) | Actionnable dès le premier rendu, libellé dépendant de la session |

### ASCII Wireframe

Un seul tracé : aucun point de rupture n'est déclaré pour `.notfound-view`, et
le contenu (bandeau plafonné à `32rem`, bouton à `200px`) tient sans changement
de mise en page aux deux résolutions de référence.

```
┌──────────────────────────────────────────────┐
│                                                │  100dvh, flex centré
│                                                │
│         ┌────────────────────────────┐        │
│         │  404: Page Not Found       │        │  .alert — fond sunset-orange
│         │                             │        │  texte on-accent
│         │  The page you are looking   │        │
│         │  for does not exist.       │        │
│         └────────────────────────────┘        │
│                                                │
│           [ Back to Dashboard ]                │  #backToLogin — 200px, ≥44px
│                                                │
└──────────────────────────────────────────────┘
```

---

## States & Variants

| State / Variant | Trigger                                                                                                                | What Changes                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Session active  | `sessionStorage.getItem("username") !== null` au moment du rendu (`notfound.js:12`)                                    | Libellé "Back to Dashboard", `backPath = "/dashboard"` |
| Pas de session  | `sessionStorage.getItem("username") === null`                                                                          | Libellé "Back to the demo", `backPath = "/"`           |
| Loading         | Sans objet — `notfound.js` ne contient ni `fetch` ni `fetchWithToken` ; rien ne se réveille à l'ouverture de cet écran | —                                                      |
| Empty           | Sans objet — aucune collection n'y est affichée                                                                        | —                                                      |
| Error           | Sans objet — l'écran entier _est_ l'état d'erreur de la navigation ; il n'a pas de sous-état d'échec propre à afficher | —                                                      |

**Peint vs actionnable.** Le bouton est peint (`innerHTML`, `notfound.js:16-28`)
et son écouteur posé (`addEventListener`, `notfound.js:30-32`) dans le même
appel synchrone de `notFound()`, avant que le navigateur ne rende la frame
suivante. Aucun état "visible mais inerte".

---

## Interaction Map

Clavier :

1. Au rendu, focus programmatique posé sur le `h1`
   (`heading.tabIndex = -1; heading.focus({ preventScroll: true })`,
   `app.js:22-23`) — hors de l'ordre de tabulation, ne sert que l'annonce
   lecteur d'écran.
2. `Tab` depuis le corps de la page → un seul élément focalisable : le bouton de
   retour (`#backToLogin`). Anneau d'or global (`tokens.css:83-87`) au focus.
3. `Enter` / `Espace` sur le bouton → `navigateTo(backPath)` (comportement natif
   de `<button>`, rien à coder).
4. `Shift+Tab` depuis le bouton → sort de l'écran ; pas de piège de focus.
5. `Escape` → aucun effet ; rien à fermer sur cet écran (pas de menu, pas de
   panneau).

Pointeur : clic sur le bouton → même action que le clavier.

Tactile : bouton de 200px de large, `min-height: var(--tap-min)` (44px) hérité
de `.btn` (`tokens.css:133-143`) — cible large, aucune précision de pointeur
requise.

---

## Events Fired

| Player Action                                 | Event Fired                                                              | Payload / Data                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Ouverture de l'écran (route inconnue résolue) | Aucun appel réseau — `document.title` posé et focus déplacé              | `announceRoute("Page not found")`, `app.js:18-24`, appelé depuis `notfound.js:34` |
| Clic / activation sur le bouton de retour     | `navigateTo(backPath)` → `history.pushState` puis nouveau rendu de route | `notfound.js:30-32`, `app.js:104-113` (UI-NAV-1)                                  |

---

## Transitions & Animations

Entrée : aucune — `innerHTML` remplace le contenu de `#ft_transcendence`
instantanément, comme toutes les vues de la SPA ; aucune ne s'anime à l'entrée.

Sortie : instantanée également, au clic sur le bouton de retour.

`prefers-reduced-motion: reduce` : sans effet observable sur cet écran — aucune
boucle décorative, aucun halo, aucune transition propre à `.notfound-view`
au-delà du survol standard du bouton, déjà couvert globalement par
`tokens.css:94-125`.

---

## Data Requirements

| Data                                        | Source System                                                                               | Read / Write | Update trigger                                                    | Null handling                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------- | ------------------------------------------------------- |
| Statut de session (`username`)              | `sessionStorage`, écrit par login/register — l'UI de cet écran n'en est jamais propriétaire | Read         | Lu une fois, de façon synchrone, à l'ouverture (`notfound.js:12`) | `null` → traité comme "pas de session", bouton vers `/` |
| Chemin demandé (`window.location.pathname`) | Le navigateur — l'UI n'en est pas propriétaire                                              | Read         | Lu par `router()` avant l'appel à `notFound()` (`app.js:31`)      | Jamais nul : tout `pathname` existe, au pire `/`        |

---

## Accessibility

**Ordre de focus.** Un seul élément dans l'ordre de tabulation : le bouton de
retour. Le focus initial (programmatique, sur le `h1`) est délibérément hors
ordre de tabulation — voir Interaction Map.

**Contrastes chiffrés.**

- Bandeau `.notfound-view .alert` : fond `--sunset-orange` (#ff8c00) / texte
  `--on-accent` (#121212) → 8,03:1, valeur cohérente avec celle déjà établie
  pour cette paire ailleurs dans le système (`tokens.css:50-52`). Largement
  au-dessus du minimum 4,5:1.
- Bouton `#backToLogin` (`.btn-primary`) : fond `--lava-orange` (#ff5722) /
  texte `--on-accent` → 5,92:1, identique à la même paire déjà vérifiée à
  `tokens.css:301-304` (`.toast-body-warning`). Au-dessus du minimum 4,5:1.
- Anneau de focus `--sun-gold` (#ffcc00) sur fond nuit (`--night`, #121212, posé
  globalement par `dashboard.css:15-24`, chargé sur toutes les routes) :
  contraste très large, au-dessus du 3:1 requis pour un indicateur non textuel.

**Annonce lecteur d'écran.** `announceRoute("Page not found")` (`app.js:18-24`,
appelé à `notfound.js:34`) pose
`document.title = "Page not found — ft_transcendence"` et déplace le focus DOM
sur le `h1` — le mécanisme d'annonce de changement de route déjà en place pour
les sept vues de la SPA, pas un état à construire ici. Un lecteur d'écran
annonce le contenu du `h1` focalisé ("404: Page Not Found") au moment du rendu,
sans région `aria-live` ni interruption d'une lecture en cours. Voir Open
Questions pour l'écart entre ce constat et
`design/accessibility-requirements.md`.

**Alternative non colorée.** Rien sur cet écran ne porte d'information par la
couleur seule : le message est un texte complet, le bouton porte un libellé qui
nomme sa destination ("Back to Dashboard" / "Back to the demo").

**Taille des cibles.** Bouton : 200px de large, hauteur ≥ 44px (`.btn`,
`tokens.css:133-143`).

**Focus à l'ouverture / à la fermeture.** À l'ouverture, focus posé sur le `h1`,
hors ordre de tabulation, sans voler d'interaction future. Il n'y a pas de
"fermeture" propre à cet écran : la sortie est une navigation complète vers un
autre écran, qui repose son propre focus via son propre appel à `announceRoute`.

---

## Localization Considerations

Trois chaînes fixes : "404: Page Not Found", "The page you are looking for does
not exist.", et un libellé de bouton conditionnel — "Back to Dashboard" (18
caractères) ou "Back to the demo" (17 caractères), le plus long des trois
éléments de texte hors phrase d'explication. L'interface reste en anglais, comme
le reste de la SPA ; cette spec est en français, sans mélange affiché à l'écran
(`CLAUDE.md`). Aucune chaîne n'est assez longue pour casser la mise en page à
+40 % : le bandeau a un `max-width: 32rem` avec retour à la ligne naturel, et le
bouton n'a pas de largeur fixe qui tronquerait un libellé plus long.

---

## Acceptance Criteria

1. Étant donné une URL qui ne correspond à aucune route de `frontend/src/app.js`
   et qui n'est ni une redirection de route protégée ni un chemin `/profile/*`,
   quand la personne l'atteint (saisie directe, lien mort, ou retour
   navigateur), alors l'écran affiche "404: Page Not Found" et un bouton de
   retour unique.
2. Étant donné une session active (`sessionStorage.username` non nul), quand
   l'écran se rend, alors le bouton porte le libellé "Back to Dashboard" et
   navigue vers `/dashboard`.
3. Étant donné aucune session active, quand l'écran se rend, alors le bouton
   porte le libellé "Back to the demo" et navigue vers `/`.
4. Étant donné un clic ou une activation clavier (`Enter`/`Espace`) sur le
   bouton, alors la navigation passe par `navigateTo()`, sans rechargement
   complet de page (UI-NAV-1).
5. Étant donné une navigation au clavier seul, alors le bouton est atteignable
   en un seul `Tab` depuis le corps de la page et porte l'anneau de focus d'or.
6. Étant donné un lecteur d'écran actif, quand l'écran se rend, alors le titre
   de l'onglet change et le `h1` focalisé annonce "404: Page Not Found", sans
   déplacement de focus ultérieur non sollicité.
7. Performance : l'écran est utilisable (bouton actionnable) en moins de 100 ms
   après l'exécution de `notFound()` — aucun appel réseau n'a lieu, le réveil de
   l'API est sans objet ici.
8. Résolution : la mise en page reste centrée et lisible, sans recouvrement ni
   débordement, à 1440×900 et à 390×844 — aucun point de rupture dédié n'existe,
   le bandeau plafonne à `32rem` et le bouton à `200px`, tous deux sous les deux
   largeurs de référence.
9. Aucun élément interactif n'est visible avant d'être actionnable : le bouton
   est peint et son écouteur posé dans le même appel synchrone
   (`notfound.js:16-32`).

---

## Open Questions

- **Statut HTTP réel de cet écran.** La SPA le rend entièrement côté client ;
  rien dans le dépôt ne garantit qu'une requête vers une route inconnue reçoit
  autre chose qu'un `200` (le document `index.html` est servi tel quel, puis le
  routeur choisit `notFound()`). Aucun fichier de repli SPA pour l'hébergement
  statique cible (`vercel.json`, `_redirects` ou équivalent) n'existe dans
  `frontend/` — recherché explicitement, aucune occurrence.
  `docs/HANDOFF.md:229-245` (Lot 7) ne documente que les rewrites `/api/*` vers
  Render, pas de règle de repli vers `index.html` pour les chemins inconnus sur
  Vercel. Sans cette règle, un chemin mal tapé pourrait ne jamais atteindre ce
  routeur en production et recevoir le 404 générique de l'hébergeur à la place —
  cet écran ne s'afficherait alors jamais. Un `200` en régime SPA a par ailleurs
  deux conséquences produit à trancher : un lien mort partagé s'indexe comme une
  page valide (contraire à l'objectif portfolio), et un aperçu de lien sur les
  réseaux ne distingue pas un lien mort d'un lien valide. Décision
  d'infrastructure, ne m'appartient pas.
- **`design/accessibility-requirements.md:57`** liste "Changement de route SPA →
  absent, écart connu". Ce n'est plus vrai pour cet écran ni pour aucune des
  sept vues de la SPA : `announceRoute()` (`app.js:18-24`) pose le titre et
  déplace le focus sur le `h1` à chaque rendu de vue, et `notFound()` l'appelle
  explicitement (`notfound.js:34`). `docs/HANDOFF.md` (Lot 6, ligne 59-60)
  documente ce correctif comme livré le même jour que la date de la table. La
  ligne de la table d'annonces est restée à "absent" — à corriger dans
  `design/accessibility-requirements.md`, ce n'est pas une décision qui
  m'appartient mais une mise à jour de document en retard sur le code.
- **Le bandeau de verdict (`.notfound-view .alert`) n'a pas de motif équivalent
  dans `design/ux/interaction-patterns.md`.** Faut-il l'ajouter au catalogue
  comme "message statique plein écran", ou ce cas reste-t-il isolé tant qu'un
  deuxième écran du même genre n'apparaît pas ? Ne m'appartient pas — relève de
  la règle de non-duplication du catalogue.
