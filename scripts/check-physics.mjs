#!/usr/bin/env node
// La physique serveur a été réécrite sans three : les boîtes englobantes que
// Box3.setFromObject() recalculait à chaque tick sont désormais des constantes
// dans src/realtime/app/game/config.mjs.
//
// Ce script les recalcule avec three et échoue si elles dérivent — c'est-à-dire
// si quelqu'un touche à la géométrie côté client sans reporter les valeurs.
// Il vérifie ensuite le comportement de la balle réécrite, puis les fins de
// partie : les deux buts émettaient chacun leur copie en miroir des trois cas
// (tournoi, quatre joueurs, tout le reste), désormais fusionnées.
//
//   node scripts/check-physics.mjs

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const threePath = join(
  root,
  "frontend/node_modules/three/build/three.module.js",
);

if (!existsSync(threePath)) {
  console.error(
    "three introuvable — lancer `npm install` dans frontend/ avant ce contrôle.",
  );
  process.exit(1);
}

const THREE = await import(pathToFileURL(threePath).href);
const gameDir = join(root, "src/realtime/app/game");
const { BALL_HALF, PAD_HALF } = await import(
  pathToFileURL(join(gameDir, "config.mjs")).href
);
const { Ball } = await import(pathToFileURL(join(gameDir, "ball.mjs")).href);
const { Pad } = await import(pathToFileURL(join(gameDir, "pad.mjs")).href);

// --- 1. les constantes correspondent-elles toujours à la géométrie du client ? ---

function halfExtents(mesh) {
  mesh.updateMatrixWorld(true);
  const size = new THREE.Vector3();
  new THREE.Box3().setFromObject(mesh).getSize(size);
  return { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
}

// Mêmes paramètres que frontend/src/game/{ball,pad}.mjs.
const padMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.50, 16, 32));
padMesh.rotation.set(1.56, 0, 0);
const measuredPad = halfExtents(padMesh);
const measuredBall = halfExtents(
  new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 32)),
);

const TOLERANCE = 1e-6;
for (const axis of ["x", "y", "z"]) {
  assert.ok(
    Math.abs(measuredPad[axis] - PAD_HALF[axis]) < TOLERANCE,
    `PAD_HALF.${axis} = ${PAD_HALF[axis]} mais three mesure ${
      measuredPad[axis]
    }`,
  );
}
assert.ok(
  Math.abs(measuredBall.x - BALL_HALF) < TOLERANCE,
  `BALL_HALF = ${BALL_HALF} mais three mesure ${measuredBall.x}`,
);

// --- 2. comportement de la balle réécrite ---

const ball = new Ball();

// Direction toujours unitaire dans le plan (x, z).
assert.ok(Math.abs(Math.hypot(ball.direction.x, ball.direction.z) - 1) < 1e-9);
// Service initial à plat : l'original omettait la 3e composante du Vector3.
assert.equal(
  ball.direction.z,
  0,
  "le service initial doit rester aligné sur x",
);

// Après un point, le tirage porte sur trois composantes : x et z tombent à 1/√3.
ball.resetPosition();
assert.ok(
  Math.abs(Math.abs(ball.direction.x) - 1 / Math.sqrt(3)) < 1e-9,
  `service après point : x vaut ${ball.direction.x}, attendu ±1/√3`,
);
assert.equal(ball.speed, ball.initialSpeed);

// Collision : raquette posée exactement sur la balle.
const pad = new Pad(0, 3.59, 0);
ball.position.x = 0;
ball.position.z = 0;
const speedBefore = ball.speed;
ball.position.x = BALL_HALF + PAD_HALF.x - 0.001; // boîtes qui se recouvrent
assert.equal(ball.checkCollision(pad), true, "recouvrement non détecté");
assert.ok(ball.speed > speedBefore, "la balle doit accélérer au contact");
assert.ok(
  Math.abs(Math.hypot(ball.direction.x, ball.direction.z) - 1) < 1e-9,
  "la direction doit rester unitaire après rebond",
);

// Pas de collision quand les boîtes sont disjointes.
ball.position.x = BALL_HALF + PAD_HALF.x + 0.001;
assert.equal(ball.checkCollision(pad), false, "collision détectée à tort");

// Le palier de vitesse est respecté.
ball.speed = ball.maxSpeed;
ball.position.x = 0;
ball.checkCollision(pad);
assert.equal(
  ball.speed,
  ball.maxSpeed,
  "la vitesse ne doit pas dépasser maxSpeed",
);

// --- 3. fins de partie, les six modes ---

process.env.WIN_SCORE = "3";
const { IApad, checkWallCollision } = await import(
  pathToFileURL(join(gameDir, "game.mjs")).href
);
const { clients } = await import(
  pathToFileURL(join(gameDir, "sockets.mjs")).href
);

clients.set("s1", { socketId: "s1", playerName: "Alice" });
clients.set("s2", { socketId: "s2", playerName: "Bob" });
clients.set("s3", { socketId: "s3", playerName: "Chloé" });
clients.set("s4", { socketId: "s4", playerName: "Dan" });

// `io.in(room).emit(...)` : on retient la dernière émission autre que le score.
function fakeIo(sink) {
  return {
    in: () => ({
      emit: (event, payload) => {
        if (event !== "updateScores") sink.push({ event, payload });
      },
    }),
  };
}

// Fait marquer `side` jusqu'à la victoire et rend la dernière émission.
function playToWin(side, roomsTypes, players, roomTeams = null) {
  const sink = [];
  const io = fakeIo(sink);
  const pad1 = new Pad();
  const pad2 = new Pad();
  const ball = new Ball();
  // Hors de la table du côté opposé au marqueur.
  const out = side === "left" ? 100 : -100;

  let won = false;
  for (let i = 0; i < 3; i++) {
    ball.position.x = out;
    ball.position.z = 0;
    ball.direction.z = 0;
    won = checkWallCollision(
      ball,
      pad1,
      pad2,
      io,
      "room-1",
      roomsTypes,
      players,
      roomTeams,
    ) === true;
    // WIN_SCORE vaut 3 : rien ne doit se terminer avant le troisième point.
    assert.equal(
      won,
      i === 2,
      `${roomsTypes}/${side} : fin de partie au point ${i + 1}`,
    );
  }
  assert.equal(pad1.score, 0, "les scores sont remis à zéro");
  assert.equal(pad2.score, 0, "les scores sont remis à zéro");
  return sink.at(-1);
}

let last = playToWin("left", "solo_vs_ia", ["s1"]);
assert.equal(last.event, "gameOver");
assert.equal(last.payload.winner, "Alice", "solo : le joueur gagne");
assert.equal(last.payload.looser, "AI");

last = playToWin("right", "solo_vs_ia", ["s1"]);
assert.equal(last.payload.winner, "AI", "solo : l'IA gagne");
assert.equal(last.payload.looser, "Alice");

last = playToWin("right", "multi-2-local", ["s1"]);
assert.equal(
  last.payload.winner,
  "Player 2",
  "local à deux : pas de second compte",
);

last = playToWin("left", "multi-2-online", ["s1", "s2"]);
assert.equal(last.payload.winner, "Alice");
assert.equal(last.payload.looser, "Bob");
assert.equal(last.payload.roomType, "multi-2-online");

last = playToWin("right", "multi-2-online", ["s1", "s2"]);
assert.equal(last.payload.winner, "Bob", "le but de droite renvoie Bob");
assert.equal(last.payload.looser, "Alice");

const teams = new Map([["room-1", {
  team1: ["s1", "s3"],
  team2: ["s2", "s4"],
}]]);
last = playToWin("left", "multi-four", ["s1", "s2", "s3", "s4"], teams);
assert.deepEqual(
  last.payload.winner,
  ["Alice", "Chloé"],
  "à quatre : l'équipe de gauche",
);
last = playToWin("right", "multi-four", ["s1", "s2", "s3", "s4"], teams);
assert.deepEqual(
  last.payload.winner,
  ["Bob", "Dan"],
  "à quatre : l'équipe de droite",
);

for (const type of ["semi-tournament", "final-tournament"]) {
  last = playToWin("left", type, ["s1", "s2"]);
  assert.equal(last.event, "matchOver", `${type} : matchOver et non gameOver`);
  assert.equal(last.payload.winner, "s1", `${type} : le gagnant est un socket`);
  assert.equal(last.payload.roomName, "room-1");

  last = playToWin("right", type, ["s1", "s2"]);
  assert.equal(last.payload.winner, "s2");
}

// --- 4. plafond de vitesse de l'IA ---
//
// `IApad` interpole vers la balle : sans bornage, le pas atteignait 0,22/tick,
// sept fois la vitesse d'un joueur, et le mode solo devenait ingagnable.
{
  const padIA = new Pad(2.10, 3.59, 0);
  const balleIA = new Ball();
  let pasMax = 0;
  for (const z of [-1.2, -0.6, 0, 0.6, 1.2]) {
    for (const x of [-2, 0, 1, 2]) {
      padIA.position.z = 0;
      balleIA.position.x = x;
      balleIA.position.z = z;
      const avant = padIA.position.z;
      IApad(padIA, balleIA);
      pasMax = Math.max(pasMax, Math.abs(padIA.position.z - avant));
    }
  }
  assert.ok(
    pasMax <= padIA.speed + 1e-9,
    `l'IA se déplace de ${pasMax} par tick, au-delà de ${padIA.speed}`,
  );
}

console.log(
  "OK — boîtes englobantes conformes à three, physique de la balle, plafond de l'IA et fins de partie vérifiées.",
);
