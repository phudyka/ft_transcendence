#!/usr/bin/env node
// Le jeu n'avait que le clavier : les commandes tactiles ajoutées au Lot 6
// passent par la même résolution que `w`/`s` et les flèches. Ce qui décide de
// la raquette pilotée est le mode de partie, et une erreur n'y est pas visible
// — le joueur presse, rien ne bouge, aucune erreur nulle part.
//
//   node scripts/check-controls.mjs

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { padMoveFor, padForSide } = await import(
  pathToFileURL(join(root, "frontend/src/game/controls.mjs")).href
);

const cases = [
  // [libellé, état, touche, résultat attendu]
  ["solo, gauche vers le haut", { controlledPad: 1 }, "w", {
    pad: 1,
    direction: "up",
  }],
  ["solo, gauche vers le bas", { controlledPad: 1 }, "s", {
    pad: 1,
    direction: "down",
  }],
  ["solo, flèches inertes", { controlledPad: 1 }, "ArrowUp", null],
  ["en ligne côté droit", { controlledPad: 2 }, "ArrowDown", {
    pad: 2,
    direction: "down",
  }],
  ["en ligne côté droit, w inerte", { controlledPad: 2 }, "w", null],
  ["à quatre, pad 3 à gauche", { controlledPad: 3 }, "s", {
    pad: 3,
    direction: "down",
  }],
  ["à quatre, pad 4 à droite", { controlledPad: 4 }, "ArrowUp", {
    pad: 4,
    direction: "up",
  }],
  ["local à deux, gauche", { controlledPads: [1, 2] }, "w", {
    pad: 1,
    direction: "up",
  }],
  ["local à deux, droite", { controlledPads: [1, 2] }, "ArrowUp", {
    pad: 2,
    direction: "up",
  }],
  ["avant attribution", { controlledPad: 0, controlledPads: 0 }, "w", null],
  [
    "état initial",
    { controlledPad: null, controlledPads: null },
    "ArrowUp",
    null,
  ],
  ["touche inconnue", { controlledPad: 1 }, "a", null],
  // Sans garde, une clé héritée d'Object.prototype passerait pour une touche.
  ["clé héritée", { controlledPad: 1 }, "constructor", null],
];

for (const [label, state, key, expected] of cases) {
  assert.deepEqual(padMoveFor(key, state), expected, label);
  console.log(`ok   ${label}`);
}

// Les zones tactiles s'affichent d'après le même calcul : un côté non piloté
// resterait un bouton mort à l'écran.
assert.equal(
  padForSide("left", { controlledPad: 2 }),
  null,
  "zone gauche masquée côté droit",
);
assert.equal(
  padForSide("right", { controlledPad: 4 }),
  4,
  "zone droite affichée pour le pad 4",
);
assert.equal(
  padForSide("right", { controlledPads: [1, 2] }),
  2,
  "zone droite en local à deux",
);
console.log("ok   zones tactiles alignées sur les raquettes pilotées");

console.log("OK — commandes clavier et tactiles conformes aux six modes.");
