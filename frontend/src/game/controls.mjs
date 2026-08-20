/* Résolution des commandes : quelle raquette une touche pilote-t-elle ?
 *
 * `w`/`s` visent toujours le côté gauche et les flèches le côté droit, mais le
 * pad qui s'y trouve dépend du mode : en local à deux, un seul navigateur
 * pilote les deux ; en ligne, chacun n'a que le sien, qui peut être au centre
 * en partie à quatre. Le clavier et les commandes tactiles passent tous les
 * deux par ici, et `scripts/check-controls.mjs` couvre les six cas.
 */

const KEYS = {
  w: { direction: "up", side: "left" },
  s: { direction: "down", side: "left" },
  ArrowUp: { direction: "up", side: "right" },
  ArrowDown: { direction: "down", side: "right" },
};

/* `null` tant que les raquettes ne sont pas attribuées, et pour un côté que le
 * joueur ne pilote pas. */
export function padForSide(side, { controlledPad, controlledPads }) {
  if (controlledPads) return side === "left" ? 1 : 2;
  if (side === "left") {
    return controlledPad === 1 || controlledPad === 3 ? controlledPad : null;
  }
  return controlledPad === 2 || controlledPad === 4 ? controlledPad : null;
}

/* `null` quand la touche ne pilote rien : appelant n'émet alors pas. */
export function padMoveFor(key, state) {
  if (!Object.hasOwn(KEYS, key)) return null;
  const { direction, side } = KEYS[key];
  const pad = padForSide(side, state);
  return pad ? { pad, direction } : null;
}
