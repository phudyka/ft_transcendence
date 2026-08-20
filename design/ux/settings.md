# UX Spec: Settings

> **Status**: In Design
> **Author**: phudyka + ux-designer
> **Last Updated**: 2026-08-20
> **Platform Target**: Web — ordinateur (clavier + souris) d'abord, téléphone utilisable (tactile, pointeur grossier). Pas de manette.
> **Accessibility Tier**: Comprehensive (`design/accessibility-requirements.md`)
> **UI Requirements**: UI-SET-1, UI-SET-2, UI-SET-3, UI-SET-4, UI-SET-5
> **Journey Phase(s)**: Parcours B (le joueur) — hors des sept phases numérotées de `design/player-journey.md` ; la table « États émotionnels par écran » du même document nomme directement `/settings` : intention précise et rare. Parcours A (visiteur portfolio) n'atteint jamais cet écran : `/settings` est protégée (UI-AUTH-8) et le parcours A ne crée pas de compte.
> **Template**: UX Spec

---

## Purpose & Player Need

La personne arrive en voulant corriger une chose précise à propos d'elle-même
— son nom affiché, son adresse courriel ou son avatar — puis quitter l'écran
aussitôt après. Elle n'est pas venue pour parcourir des réglages : `/settings`
n'a qu'un seul chemin d'entrée déclaré dans le tableau de bord (le menu de
compte) et aucune section à explorer au-delà des trois champs qu'elle est
venue changer.

---

## Player Context on Arrival

Seul le Parcours B atteint cet écran. Elle est en session active — la garde
de route (`frontend/src/app.js:34`, `PROTECTED_ROUTES`) et la garde locale de
la vue (`frontend/src/views/settings.js:14-17`, absence de
`sessionStorage.display_name` → redirection immédiate vers `/login`)
l'exigent toutes les deux avant qu'un seul champ ne soit peint. Elle porte
donc déjà un nom d'affichage, un avatar et un jeton d'accès en
`sessionStorage`. Deux origines concrètes :

- Elle vient de remarquer une coquille dans son nom ou veut changer d'avatar
  pendant qu'elle est sur le tableau de bord — c'est le chemin normal, via le
  menu de compte.
- Elle revient sur `/settings` après une absence (favori, onglet resté
  ouvert, retour du navigateur) : la session peut avoir plus de quinze
  minutes d'inactivité, ce qui expose l'appel de préremplissage du courriel
  au réveil de l'API (`design/player-journey.md`, point de friction 1) —
  jusqu'à une minute avant que le champ courriel ne se remplisse.

---

## Navigation Position

Route protégée `/settings` (`frontend/src/app.js:13`). Un seul niveau sous
`/dashboard`, atteinte uniquement depuis le menu de compte de l'en-tête — pas
de barre de navigation, pas de fil d'Ariane. C'est un écran feuille : les deux
seules sorties ramènent toutes les deux à `/dashboard`, jamais plus loin.

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| `/dashboard`, menu de compte | Clic sur « Settings » dans `#profileDropdown` (`frontend/src/views/dashboard.js:271-273`, `goTosettings` `:787-790`) | Session active, vient corriger un champ précis |
| URL tapée directement, session active | Navigation directe ou favori vers `/settings` | Même contexte, sans passer par le menu |
| URL tapée directement, sans session | Navigation directe vers `/settings` sans être connectée | Redirigée vers `/login` avant tout rendu du formulaire (`frontend/src/app.js:34`, UI-AUTH-8) — aucun flash de l'écran protégé |
| Retour du navigateur (`popstate`) | Bouton retour après avoir quitté `/settings` | Le formulaire n'est pas conservé : re-rendu complet, re-préremplissage depuis la session puis l'API |

| Exit Destination | Trigger | Notes |
|---|---|---|
| `/dashboard` | Clic sur le logo (`#pongonlineLink`, `frontend/src/views/settings.js:121-124`) | Aucune confirmation si le formulaire porte des modifications non enregistrées |
| `/dashboard` | Clic sur « Back to Dashboard » (`#backToDashboard`, `frontend/src/views/settings.js:126`) | Même absence de garde |
| Reste sur `/settings` | Soumission réussie du formulaire | Aucune navigation n'a lieu après un enregistrement : la confirmation est un toast, pas un changement d'écran (`frontend/src/views/settings.js:168-189`) |

---

## Layout Specification

### Information Hierarchy

En-tête de vue (logo/retour, nom, avatar) → titre « User Settings » → formulaire
(Display Name, Email, Avatar avec aperçu et rappels de contraintes) → bouton
Save → bouton secondaire Back to Dashboard → pied de page.

### Layout Zones

- **En-tête de vue** (`.view-header`) : bouton logo à gauche, nom d'affichage
  centré-droite, avatar à droite (`frontend/src/views/settings.js:21-43`).
  Cet écran n'a pas le triptyque du tableau de bord : `.settings-view` réécrit
  `.dashboard-container` en flux vertical simple (`frontend/src/css/settings.css:8-15`).
- **Contenu principal** (`.settings-form-container`) : colonne unique,
  `max-width: 600px`, remplissage `--space-lg` (`frontend/src/css/settings.css:24-27`,
  `frontend/src/css/tokens.css:66`).
- **Champs du formulaire** : empilés verticalement, séparés par la classe
  Bootstrap `mb-3` — non tokenisée, hors du vocabulaire d'espacement du
  système (`frontend/src/css/tokens.css:62-67` ne connaît pas `mb-3`).
- **Pied de page** : ligne de signature, hors formulaire.

### Component Inventory

| Component | Pattern Reference | Selector | Default State |
|---|---|---|---|
| Bouton logo / retour | Nouveau motif — non catalogué dans `design/ux/interaction-patterns.md` ; décrit dans `docs/DESIGN.md` § Navigation (En-tête) | `#pongonlineLink` | Repos |
| Avatar d'en-tête | Nouveau motif — non catalogué ; `docs/DESIGN.md` § Navigation (En-tête) | `.view-header-avatar` | Image de session, décorative (`alt=""`) |
| Titre d'écran | Aucun motif dédié (rôle typographique Headline/Title de `docs/DESIGN.md`) | `#header-dashboard` | Cible de focus à l'entrée sur la route |
| Champ Display Name | [Champ de saisie](interaction-patterns.md#champ-de-saisie) | `#displayName` | Vide au premier rendu, rempli en JS avant peinture perceptible |
| Champ Email | [Champ de saisie](interaction-patterns.md#champ-de-saisie) | `#email` | Vide jusqu'à la résolution de l'appel réseau |
| Aperçu de l'avatar courant | Nouveau motif — non catalogué (aucune entrée « aperçu d'image » dans le catalogue) | `#currentAvatar` | Avatar de session |
| Champ fichier avatar | [Champ de saisie](interaction-patterns.md#champ-de-saisie), variante fichier | `#avatar` | Vide |
| Rappels de contraintes avatar | [Champ de saisie](interaction-patterns.md#champ-de-saisie) — élément `.field-hints` du même motif | `#avatar-hints` | Texte statique, toujours visible |
| Bouton Save changes | [Bouton](interaction-patterns.md#bouton), variante primaire | `#saveSettings` | Repos |
| Bouton Back to Dashboard | [Bouton](interaction-patterns.md#bouton), variante secondaire | `#backToDashboard` | Repos |
| Confirmation / erreur d'enregistrement | [Toast](interaction-patterns.md#toast) | Généré par `showToast()` (`frontend/src/utils/feedback.js:18-60`) | Absent tant que rien n'a été soumis |

### ASCII Wireframe

Desktop (1440 × 900) :

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Logo]                    Zoé Martin                        (Avatar) │  .view-header
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                          USER SETTINGS                               │  h1, cible de focus
│                                                                        │
│              ┌──────────────────────────────────────┐                │
│              │ Display Name                          │                │
│              │ [____________________________]        │                │
│              │                                        │                │
│              │ Email                                  │                │
│              │ [____________________________]        │                │
│              │                                        │                │
│              │ Avatar                                 │                │
│              │  (●)   [ Choose File ]                 │                │
│              │  Accepted formats: JPG, PNG, GIF        │                │
│              │  Maximum size: 2 MB                     │                │
│              │  Dimensions: 100×100 to 1000×1000 px    │                │
│              │                                        │                │
│              │ [        Save changes        ]         │                │
│              └──────────────────────────────────────┘                │
│                     [   Back to Dashboard   ]                        │
│                                                                        │
├──────────────────────────────────────────────────────────────────────┤
│              ft_transcendence — a 3D Pong by phudyka                 │
└──────────────────────────────────────────────────────────────────────┘
```

Mobile (390 × 844) :

```
┌───────────────────────────┐
│ [Logo]  Zoé M…    (Avatar)│  .view-header-name tronqué par ellipse
├───────────────────────────┤
│                            │
│      USER SETTINGS        │
│                            │
│ Display Name               │
│ [_______________________] │
│                            │
│ Email                       │
│ [_______________________] │
│                            │
│ Avatar                      │
│  (●)                       │
│  [ Choose File ]            │
│  Accepted formats: JPG,     │
│  PNG, GIF                   │
│  Maximum size: 2 MB         │
│  Dimensions: 100×100 to     │
│  1000×1000 px               │
│                            │
│ [    Save changes     ]     │
│ [  Back to Dashboard  ]     │
│                            │
├───────────────────────────┤
│  ft_transcendence — a 3D   │
│  Pong by phudyka           │
└───────────────────────────┘
```

`.settings-form-container` garde son `max-width: 600px` aux deux largeurs — à
1440 px il reste centré avec beaucoup d'espace libre latéral ; à 390 px il
occupe la largeur utile moins le remplissage `--space-lg`.

---

## States & Variants

| State / Variant | Trigger | What Changes |
|---|---|---|
| Default | Rendu initial, session valide | Formulaire vide peint (aucun `value` dans le gabarit, `frontend/src/views/settings.js:52-89`), puis `#displayName` reçoit `sessionStorage.display_name` de façon synchrone avant tout `await` (`prefillSettings`, `frontend/src/views/settings.js:255`) — le nom est donc peint et correct dans le même souffle |
| Loading — courriel | À l'ouverture, `GET /api/user/{displayName}/` en vol (`frontend/src/views/settings.js:260-262`) ; peut durer jusqu'à une minute si l'API dormait (`design/player-journey.md`, point 1) | Le champ `#email` est peint vide, focalisable et **éditable** dès l'instant zéro — rien à l'écran ne dit qu'un chargement est en cours. **Visible mais inerte, dans le mauvais sens** : si la personne se met à taper une adresse avant la résolution de l'appel, la réponse écrase sans avertissement ce qu'elle vient de saisir (`emailField.value = data.user.email ?? ""`, `frontend/src/views/settings.js:265`, affectation inconditionnelle) |
| Empty — pas de courriel enregistré | L'appel réussit et `data.user.email` est vide/`null` | Champ vide, mais `dataset.loaded = "true"` posé (`:267`) : un enregistrement ultérieur enverra bien une chaîne vide, comportement correct et distinct du cas d'échec ci-dessous |
| Error — préremplissage du courriel échoué | Panne réseau ou exception pendant `fetchWithToken` | Catch silencieux, `console.error` seul (`frontend/src/views/settings.js:269-271`) ; le champ reste vide et **indistinguable à l'écran** de l'état Empty ci-dessus — seule différence, invisible pour la personne : `dataset.loaded` n'est pas posé, donc le champ ne sera pas envoyé à l'enregistrement (protection correcte, communication nulle) |
| Avatar — fichier trop lourd | Fichier sélectionné > 2 Mo | Toast d'erreur immédiat, champ fichier vidé (`avatarInput.value = ""`, `frontend/src/views/settings.js:209-213`), aucun appel réseau |
| Avatar — type refusé | Type hors JPEG/PNG/GIF | Toast d'erreur, champ vidé (`:216-224`) |
| Avatar — dimensions hors bornes | Image < 100×100 ou > 1000×1000 px, vérifié après décodage asynchrone de l'image | Toast d'erreur, champ vidé, aucun aperçu posé (`:230-238`) |
| Avatar — fichier valide | Fichier accepté | Aperçu instantané dans `#currentAvatar` via `FileReader` (`:240-244`), sans appel réseau ; l'avatar de l'en-tête (`.view-header-avatar`) **n'est pas** mis à jour à ce stade — seulement après un enregistrement réussi |
| Nom d'affichage modifié | Valeur du champ ≠ `sessionStorage.display_name` au moment de la soumission | Le socket de chat actif est fermé avant même l'envoi de la requête (`disconnectSocket()`, `frontend/src/views/settings.js:143-146`) — **inconditionnellement**, y compris si le serveur refuse ensuite le nouveau nom. Rien dans cet écran ne rouvre un socket ; voir Open Questions |
| Saving | Soumission en cours | Bouton Save : `aria-busy="true"`, libellé « Saving… », désactivé (`setBusy`, motif [Bouton](interaction-patterns.md#bouton) — pas redéfini ici) |
| Save — succès | Réponse `200` | Toast succès (auto-disparition 5000 ms), en-tête (nom + avatar) mis à jour sans rechargement (`:182-189`), les champs du formulaire gardent les valeurs qu'ils affichaient déjà — rien ne les réinitialise |
| Save — refus serveur (ex. nom invalide) | Réponse non `ok`, `errorData.message` | Toast d'erreur (auto-disparition 5000 ms) ; **aucun** `.field-error`, **aucun** `aria-invalid` posé sur le champ en cause — le champ garde la valeur saisie, sans marque |
| Save — échec réseau | `fetch` lève une exception | Toast « Could not reach the server. Please try again. » (`:197-199`), même absence de marquage de champ |

---

## Interaction Map

**Clavier seul.** Ordre de tabulation, numéroté :

1. `#pongonlineLink` (logo / retour au tableau de bord)
2. `#displayName`
3. `#email`
4. `#avatar` (déclenche le sélecteur de fichier natif du système à `Entrée`/`Espace`)
5. `#saveSettings`
6. `#backToDashboard`

`Entrée` dans `#displayName` ou `#email` soumet le formulaire (comportement
natif du navigateur, un seul `<form>` avec un bouton `submit`). `Échap` n'a
aucun effet sur cet écran : aucun panneau, menu ou tiroir n'y est jamais
ouvert. Aucune interaction ne demande de précision de pointeur — les deux
boutons tiennent `--tap-min` (44 px, `frontend/src/css/tokens.css:139`) et le
champ fichier ouvre le sélecteur natif du système.

**Pointeur fin.** Clic sur chaque champ et bouton ; états de survol hérités
des motifs [Champ de saisie](interaction-patterns.md#champ-de-saisie) et
[Bouton](interaction-patterns.md#bouton), non redéfinis ici.

**Tactile.** Mêmes cibles ; `#avatar` ouvre le sélecteur de fichier/appareil
photo natif du système d'exploitation. Les deux boutons respectent 44 px
(`--tap-min`) ; les champs de texte, eux, ne portent pas de hauteur minimale
dédiée — ils suivent le remplissage de `.field-input` (12 px de remplissage,
16 px de corps, `frontend/src/css/tokens.css:177-187`), ce qui n'est pas
mesuré contre `--tap-min` mais n'est pas non plus une cible ronde ou dense au
sens de la Règle du Pouce de `docs/DESIGN.md`.

---

## Events Fired

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| Ouverture de l'écran | `GET /api/user/{displayName}/` (`frontend/src/views/settings.js:260-262`) | Nom d'affichage courant, encodé dans l'URL |
| Sélection d'un fichier avatar valide | Aucun — validation et aperçu 100 % client (`:226-246`) | `FileReader` en `data:` URL, local au navigateur |
| Sélection d'un fichier avatar invalide (taille, type ou dimensions) | Aucun appel réseau — refusé avant tout envoi | `showToast(message, "error")` |
| Soumission du formulaire | `POST /api/update-user-settings/` (`:159-166`) | `FormData` : `display_name` (toujours présent), `email` (seulement si `dataset.loaded === "true"`), `avatar` (seulement si un fichier est choisi) |
| Nom d'affichage modifié, avant l'envoi | Appel direct `disconnectSocket()` (`:144-146`, `frontend/src/utils/socketManager.js:120-128`) — pas un événement réseau nommé | Ferme le socket de chat actif ; n'en ouvre aucun nouveau |
| Clic sur le logo ou « Back to Dashboard » | `navigateTo("/dashboard")` (`:121-126`) | Aucun |

---

## Transitions & Animations

**Entrée sur l'écran.** Aucune transition dédiée : le routeur remplace tout
`#ft_transcendence` par `innerHTML` en un seul geste (`frontend/src/app.js`,
`frontend/src/views/settings.js:19-109`) — apparition instantanée. Le seul
mouvement est le déplacement du focus vers `#header-dashboard`
(`announceRoute("Settings")`, `:112` ; `app.js:18-24`), sans transition
visuelle associée.

**Sortie de l'écran.** Même mécanisme, instantané, vers `/dashboard`.

**Sous `prefers-reduced-motion: reduce`.** Rien de spécifique à cet écran :
les seules transitions présentes sont les fondus de couleur au survol des
champs et boutons (`--ease-color`, `frontend/src/css/tokens.css:141,186`) et
l'agrandissement au survol du bouton primaire (`--ease-transform`,
`:140,152`). Les deux sont couvertes par la règle globale de
`tokens.css:94-125` : le fondu de couleur reste, l'agrandissement est
neutralisé — aucune règle propre à `settings.css` ne s'y ajoute ni n'y
échappe.

---

## Data Requirements

| Data | Source System | Read / Write | Update trigger | Null handling |
|---|---|---|---|---|
| Nom d'affichage (préremplissage) | `sessionStorage.display_name`, puis confirmé par `GET /api/user/{name}/` (Django) | Read | Ouverture de l'écran | Absent en session → redirection `/login` avant rendu (`:14-17`) ; si l'appel API échoue, le champ garde la valeur déjà peinte depuis la session, jamais vidé |
| Courriel (préremplissage) | Django, via `GET /api/user/{name}/` — pas en `sessionStorage` | Read | Ouverture de l'écran | Échec ou absence → champ vide, non envoyé à la sauvegarde (`dataset.loaded` non posé) ; voir États « Loading »/« Error » pour l'ambiguïté visible |
| Avatar (aperçu) | `sessionStorage.avatar_url` | Read | Ouverture de l'écran | Valeur malformée nettoyée par une regex locale (`:9-12`) avant affichage |
| Nom d'affichage (écriture) | `pong.CustomUser.display_name`, validé par `clean_display_name` (`src/django/app/pong/views.py:38-46`, regex `:35`) | Write | Soumission du formulaire | Rejeté par le serveur si hors de 3-50 caractères ou hors de la classe autorisée — réponse `400`, affichée en toast |
| Courriel (écriture) | `pong.CustomUser.email` (`src/django/app/pong/views.py:278-279`) | Write | Soumission, seulement si le champ a été chargé avec succès | Aucune validation de format observée côté serveur pour ce champ précis |
| Avatar (écriture) | Fichier écrit dans `MEDIA_ROOT/avatars/`, servi par `/media/avatars/…` (`src/django/app/pong/views.py:259-270`) | Write | Soumission, si un fichier est choisi | Plafonné à 2 Mo côté client (`:209`) et côté serveur (`MAX_AVATAR_BYTES`, `:253-257`) — le volume qui les reçoit est éphémère sur les tiers d'hébergement gratuits, voir Open Questions |
| Revendication `display_name` du jeton JWT | `pong.tokens.tokens_for_user`, posée seulement à la connexion | Read (par le service temps réel, `src/realtime/app/auth.mjs:22-34`) | **Jamais** par cet écran | Cet écran n'est propriétaire d'aucune de ces données : il les lit et les écrit via l'API Django, et n'écrit jamais lui-même le jeton — voir Open Questions pour la conséquence |

---

## Accessibility

**Ordre de focus.** Identique à l'ordre de tabulation de la section
Interaction Map, six arrêts, aucun élément n'est retiré de l'ordre naturel du
DOM.

**Focus à l'ouverture.** Déplacé sur `#header-dashboard` (le `h1` « User
Settings »), `tabIndex = -1`, sans défilement forcé
(`{ preventScroll: true }`, `frontend/src/app.js:18-24`) ; `document.title`
passe à « Settings — ft_transcendence ». C'est le mécanisme d'annonce de
changement de route du projet — voir Open Questions pour son statut par
rapport à `design/accessibility-requirements.md`.

**Focus à la fermeture.** Aucun retour de focus géré : quitter vers
`/dashboard` déclenche le même remplacement de `innerHTML` que l'arrivée, et
le focus de l'écran de destination suit sa propre règle d'entrée (le tableau
de bord annonce sa propre route).

**Contrastes chiffrés, paires réellement utilisées sur cet écran :**

- `--lava-orange` (#ff5722) — titre et libellés de champ — sur `--night`
  (#121212) : 5,92:1 calculé (formule WCAG, luminance relative), au-dessus du
  seuil de 4,5:1 pour le texte courant, donc valable aussi bien pour les
  libellés 14 px que pour le titre. Cette paire n'est pas chiffrée telle
  quelle dans `docs/DESIGN.md` ; le calcul est fait ici, pas repris.
- `--chalk` (#ffffff) — texte saisi — sur `--field-slate` (#2a2a2a) : 14,36:1
  calculé, très au-dessus du seuil.
- `--muted-sand` (#888888) — rappels de contraintes de l'avatar (`.field-hints`,
  14 px) — sur `--night` (#121212) : 5,29:1 calculé, au-dessus du seuil de
  4,5:1 mais avec une marge plus courte que les deux paires précédentes.
- `--on-accent` (nuit, #121212) sur `--lava-orange` (#ff5722) — texte du
  bouton Save — 8,03:1, valeur reprise telle quelle de
  `frontend/src/css/tokens.css:50-52` et de
  `design/ux/interaction-patterns.md` § Bouton.
- Le toast de confirmation/erreur suit ses propres paires, définies et déjà
  chiffrées dans [Toast](interaction-patterns.md#toast) — non recalculées ici,
  règle de non-duplication du catalogue.

**Alternative non colorée.** Rien sur cet écran ne porte une information par
la seule couleur : les trois refus d'avatar (taille, type, dimensions)
s'expriment en texte de toast, et le refus de nom d'affichage relaie le
message texte renvoyé par le serveur.

**Annonces lecteur d'écran.** Les toasts de succès et d'erreur portent leur
propre `role`/`aria-live` (`polite` pour succès, `assertive` pour erreur —
[Toast](interaction-patterns.md#toast)). En dehors des toasts, **aucune**
annonce n'existe sur cet écran : l'échec silencieux du préremplissage du
courriel (état Error) ne porte ni `role="alert"` ni aucune autre marque
perceptible par un lecteur d'écran — l'information n'existe nulle part,
visuellement ou vocalement. Aucun champ ne reçoit `aria-invalid` après un
refus serveur, contrairement à ce que `design/accessibility-requirements.md`
attend pour la ligne « Erreur de formulaire » de son tableau — c'est le même
écart que documente déjà `design/ux/interaction-patterns.md` (Gaps, point 2)
pour `login.js`/`register.js`, étendu ici à `settings.js`.

**Taille des cibles.** Les deux boutons tiennent `--tap-min` (44 px,
`frontend/src/css/tokens.css:139`). Les champs de texte et le champ fichier
ne portent pas de hauteur minimale dédiée à `--tap-min` — voir Interaction
Map.

---

## Localization Considerations

L'interface est en anglais (tous les libellés, rappels et messages du
gabarit, `frontend/src/views/settings.js:19-109`), cette documentation est en
français — aucun mélange à l'écran lui-même, le mélange est entre le produit
et sa documentation, comme sur le reste du projet.

**Longueurs.** Le nom d'affichage est borné côté serveur à 3-50 caractères
(`clean_display_name`, `src/django/app/pong/views.py:35`), mais ni
`#displayName` ni `#email` ne portent d'attribut `maxlength`
(`frontend/src/views/settings.js:52-68`) : rien n'empêche de taper au-delà de
50 caractères avant que le serveur ne le refuse en toast, après l'attente de
la requête. Le message d'erreur du serveur lui-même est une phrase complète
(« Display name must be 3 to 50 characters, letters, digits, spaces, dots,
dashes and underscores only. ») — dans le conteneur de toast, sans largeur
fixe documentée, ce texte est le plus long de tout l'écran et le plus
susceptible de casser en plusieurs lignes à +40 % de longueur si la langue de
l'interface changeait un jour ; le projet n'a aujourd'hui aucun système
d'internationalisation, cette hypothèse reste théorique.

Les trois lignes de rappel de l'avatar (formats, taille, dimensions) sont du
texte fixe, jamais interpolé — aucun risque de casse dynamique.

---

## Acceptance Criteria

1. Le formulaire de Paramètres est peint et ses six éléments interactifs
   (logo, deux champs, champ fichier, deux boutons) sont actionnables en
   moins de 200 ms après l'arrivée sur `/settings` pour une session déjà
   éveillée — réveil de l'API Django explicitement exclu de cette mesure (il
   ne retarde que le remplissage du champ courriel, pas la peinture du
   formulaire).
2. À 1440 × 900 et à 390 × 844, les deux champs et les deux boutons restent
   visibles et utilisables sans défilement horizontal ;
   `.settings-form-container` conserve `max-width: 600px`
   (`frontend/src/css/settings.css:24-27`) aux deux largeurs.
3. Aucun élément interactif n'est visible avant d'être actionnable : les six
   éléments focalisables sont rendus dans le même appel à `innerHTML` que le
   reste de l'écran (`frontend/src/views/settings.js:19-109`) — seul le
   bouton Save passe en `aria-busy` pendant l'envoi, un état volontaire posé
   après une action de la personne, pas un défaut de peinture.
4. Une tentative d'accès direct à `/settings` sans session redirige vers
   `/login` avant tout rendu du formulaire (`frontend/src/app.js:34`,
   UI-AUTH-8) — aucun flash de contenu protégé.
5. Un envoi d'avatar de plus de 2 Mo est refusé côté client avant tout appel
   réseau, avec un message visible à l'écran
   (`frontend/src/views/settings.js:209-213`) — UI-SET-2.
6. Un nom d'affichage refusé par le serveur affiche le message d'erreur
   renvoyé dans un toast, sans effacer la valeur déjà saisie dans le champ
   (`frontend/src/views/settings.js:190-196`) — UI-SET-5.
7. Après un enregistrement réussi, le nom et l'avatar de l'en-tête reflètent
   la nouvelle valeur sans rechargement de page
   (`frontend/src/views/settings.js:182-189`) — UI-SET-4.
8. Le nom d'affichage, le courriel et l'avatar peuvent chacun être modifiés
   indépendamment des deux autres en un seul envoi ; un champ courriel jamais
   chargé avec succès n'est jamais envoyé, donc ne peut pas écraser
   l'adresse existante par une chaîne vide
   (`frontend/src/views/settings.js:139-141`) — UI-SET-1.

---

## Open Questions

- **Le jeton JWT n'est jamais réémis après un changement de nom
  d'affichage, et rien ne reconnecte le socket de chat.**
  `update_user_settings` (`src/django/app/pong/views.py:238-294`) écrit
  `user.display_name` en base mais n'appelle jamais `tokens_for_user`
  (`src/django/app/pong/tokens.py:19-28`) ; `sessionStorage.accessToken` et
  `refreshToken` ne sont jamais touchés par `settings.js`. Le socket actif est
  fermé avant l'envoi (`frontend/src/views/settings.js:143-146`) mais aucun
  nouveau socket n'est ouvert par cet écran. À la prochaine reconnexion
  (`frontend/src/views/dashboard.js:39-40`, au retour sur `/dashboard`), le
  même jeton — donc le même `display_name` périmé — est présenté au service
  temps réel, qui en déduit l'identité (`src/realtime/app/auth.mjs:22-34`) :
  l'interface affiche déjà le nouveau nom, le chat continue de parler sous
  l'ancien. Le commentaire de `src/django/app/pong/tokens.py:12-13` affirme
  que le changement « se répercute au renouvellement du jeton, une heure au
  plus » — mais `/api/token/refresh/` est la `TokenRefreshView` de base
  (`src/django/app/pong/urls.py:8`), sans `ROTATE_REFRESH_TOKENS`
  (`src/django/app/ft_trans/settings.py:187-190`), et se contente de recopier
  les revendications déjà figées dans le jeton de rafraîchissement (le
  comportement que documente lui-même `tokens.py:21-24`) : le nom reste donc
  périmé jusqu'à `REFRESH_TOKEN_LIFETIME` (1 jour, `settings.py:189`) ou une
  déconnexion/reconnexion manuelle, pas une heure. Décision produit hors du
  périmètre de cet écran : faut-il réémettre le jeton et reconnecter le
  socket à la fin d'un enregistrement réussi ?
- **UI-SET-1 annonce un champ mot de passe qui n'existe pas.**
  `design/ui-requirements.md:88` liste « Modification du nom d'affichage, du
  courriel, du mot de passe ». Le formulaire
  (`frontend/src/views/settings.js:49-99`) ne contient aucun champ mot de
  passe, et `update_user_settings`
  (`src/django/app/pong/views.py:238-294`) ne traite aucune clé `password`.
  Tant que ceci n'est pas tranché (exigence à corriger, ou fonction à
  construire), `UI-AUTH-3` ne s'applique pas à cet écran : il n'y a pas de
  champ mot de passe à démasquer ici, d'où son absence de l'en-tête de cette
  spec.
- **Le préremplissage du courriel peut écraser une saisie en cours, sans
  avertissement.** `emailField.value = data.user.email ?? ""`
  (`frontend/src/views/settings.js:265`) s'exécute inconditionnellement
  quand la réponse arrive, y compris si la personne a déjà commencé à taper
  dans le champ pendant l'attente. Combiné à l'absence de tout indicateur de
  chargement, le champ est peint interactif avant que sa valeur ne soit
  connue — un cas concret de « visible mais inerte » dans le sens inverse
  attendu : la personne peut agir dessus avant qu'il ne soit prêt, et perdre
  cette action.
- **Un échec de préremplissage du courriel et une absence réelle de courriel
  produisent le même écran, sans distinction possible pour la personne.**
  Le `catch` de `prefillSettings` (`frontend/src/views/settings.js:269-271`)
  ne journalise qu'en console. `dataset.loaded` protège correctement
  l'enregistrement dans les deux cas mais ne communique rien à l'écran — ni
  chargement, ni échec, ni succès visuellement distincts.
- **Les avatars envoyés vivent sur un volume `media_files` éphémère sur les
  tiers d'hébergement gratuits** (`CLAUDE.md`, section Gotchas ;
  `docs/PRODUCT.md` § Capabilities and Constraints, « Faits produit encore
  indécis »). Un redéploiement peut faire disparaître un avatar envoyé ici
  sans qu'aucun signal ne le dise à la personne qui l'a envoyé — décision
  d'hébergement notée ouverte dans `docs/HANDOFF.md`, pas une décision de cet
  écran.
- **Le refus d'enregistrement part en toast, alors que le système documente
  l'inverse pour un refus de champ.** `frontend/src/views/settings.js:190-196`
  affiche l'échec dans un toast qui disparaît après 5000 ms
  (`bootstrap.Toast` par défaut, `frontend/src/utils/feedback.js:59`), alors
  que `frontend/src/css/tokens.css:238-239` documente explicitement
  l'inverse (« Un refus de champ tenu à côté du champ, pas dans un toast qui
  part au bout de cinq secondes »). C'est la même incohérence que nomme déjà
  `design/ux/interaction-patterns.md` (Gaps, point 2, et sa propre Open
  Question) — je ne la retranche pas ici : c'est ce catalogue qui doit
  trancher si `settings.js` rejoint le motif `field-error` des deux autres
  formulaires du compte, ou reste volontairement différent.
- **Aucune confirmation avant enregistrement, et un changement de nom coûte
  le chat même s'il échoue.** Le clic sur « Save changes » envoie directement
  (`frontend/src/views/settings.js:128-166`) — pas de `window.confirm`, pas
  de récapitulatif. Plus précisément, `disconnectSocket()` s'exécute avant
  l'appel réseau (`:143-146`) : si le serveur refuse ensuite le nouveau nom
  (validation échouée), la personne a déjà perdu sa connexion de chat pour un
  changement qui n'a pourtant pas eu lieu. Tous les changements restent
  réversibles en revenant sur cet écran et en resaisissant l'ancienne valeur,
  à l'exception de l'identité socket tant que le jeton n'a pas suivi (premier
  point ci-dessus).
- **`design/accessibility-requirements.md` marque le changement de route SPA
  comme « absent — écart connu », mais le code fait quelque chose sur cet
  écran.** `announceRoute("Settings")` (`frontend/src/views/settings.js:112`)
  déplace le focus sur `#header-dashboard` et change `document.title`
  (`frontend/src/app.js:18-24`). Ce n'est pas une région `aria-live`, donc
  peut-être insuffisant selon la technologie d'assistance utilisée, mais ce
  n'est pas non plus « absent » — je ne tranche pas si ce mécanisme suffit,
  seulement que le document de référence semble périmé par rapport au code
  actuel.
