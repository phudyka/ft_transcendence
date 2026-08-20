// Ouverture et fermeture des surcouches du jeu.
//
// Les panneaux étaient montrés et masqués par `classList` seul. Comme le bouton
// qu'on vient d'actionner vit dans le panneau qui se ferme, le focus retombait
// sur `<body>` à chaque écran : au clavier il fallait retabuler depuis le début
// du document, et un lecteur d'écran n'annonçait rien de ce qui venait de
// s'ouvrir. Le tableau de bord tient déjà cette règle pour ses menus ; c'est la
// même ici.

export function showPanel(id) {
  const panel = document.getElementById(id);
  if (!panel) return null;
  panel.classList.remove("hidden");
  focusFirst(panel);
  return panel;
}

export function hidePanel(id) {
  document.getElementById(id)?.classList.add("hidden");
}

// Le premier bouton réellement atteignable : les entrées masquées ne comptent
// pas — le menu du jeu cache le multijoueur pour un invité.
export function focusFirst(panel) {
  const target = [...panel.querySelectorAll("button")]
    .find((button) => !button.disabled && !button.classList.contains("hidden"));
  target?.focus();
}
