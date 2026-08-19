#!/usr/bin/env node
// La physique serveur a été réécrite sans three : les boîtes englobantes que
// Box3.setFromObject() recalculait à chaque tick sont désormais des constantes
// dans src/requirements/realtime/src/game/config.mjs.
//
// Ce script les recalcule avec three et échoue si elles dérivent — c'est-à-dire
// si quelqu'un touche à la géométrie côté client sans reporter les valeurs.
// Il vérifie ensuite le comportement de la balle réécrite.
//
//   node scripts/check-physics.mjs

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const threePath = join(root, 'frontend/node_modules/three/build/three.module.js');

if (!existsSync(threePath)) {
    console.error('three introuvable — lancer `npm install` dans frontend/ avant ce contrôle.');
    process.exit(1);
}

const THREE = await import(pathToFileURL(threePath).href);
const gameDir = join(root, 'src/requirements/realtime/src/game');
const { BALL_HALF, PAD_HALF } = await import(pathToFileURL(join(gameDir, 'config.mjs')).href);
const { Ball } = await import(pathToFileURL(join(gameDir, 'ball.mjs')).href);
const { Pad } = await import(pathToFileURL(join(gameDir, 'pad.mjs')).href);

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
const measuredBall = halfExtents(new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 32)));

const TOLERANCE = 1e-6;
for (const axis of ['x', 'y', 'z']) {
    assert.ok(
        Math.abs(measuredPad[axis] - PAD_HALF[axis]) < TOLERANCE,
        `PAD_HALF.${axis} = ${PAD_HALF[axis]} mais three mesure ${measuredPad[axis]}`
    );
}
assert.ok(
    Math.abs(measuredBall.x - BALL_HALF) < TOLERANCE,
    `BALL_HALF = ${BALL_HALF} mais three mesure ${measuredBall.x}`
);

// --- 2. comportement de la balle réécrite ---

const ball = new Ball();

// Direction toujours unitaire dans le plan (x, z).
assert.ok(Math.abs(Math.hypot(ball.direction.x, ball.direction.z) - 1) < 1e-9);
// Service initial à plat : l'original omettait la 3e composante du Vector3.
assert.equal(ball.direction.z, 0, 'le service initial doit rester aligné sur x');

// Après un point, le tirage porte sur trois composantes : x et z tombent à 1/√3.
ball.resetPosition();
assert.ok(Math.abs(Math.abs(ball.direction.x) - 1 / Math.sqrt(3)) < 1e-9,
    `service après point : x vaut ${ball.direction.x}, attendu ±1/√3`);
assert.equal(ball.speed, ball.initialSpeed);

// Collision : raquette posée exactement sur la balle.
const pad = new Pad(0, 3.59, 0);
ball.position.x = 0; ball.position.z = 0;
const speedBefore = ball.speed;
ball.position.x = BALL_HALF + PAD_HALF.x - 0.001; // boîtes qui se recouvrent
assert.equal(ball.checkCollision(pad), true, 'recouvrement non détecté');
assert.ok(ball.speed > speedBefore, 'la balle doit accélérer au contact');
assert.ok(Math.abs(Math.hypot(ball.direction.x, ball.direction.z) - 1) < 1e-9,
    'la direction doit rester unitaire après rebond');

// Pas de collision quand les boîtes sont disjointes.
ball.position.x = BALL_HALF + PAD_HALF.x + 0.001;
assert.equal(ball.checkCollision(pad), false, 'collision détectée à tort');

// Le palier de vitesse est respecté.
ball.speed = ball.maxSpeed;
ball.position.x = 0;
ball.checkCollision(pad);
assert.equal(ball.speed, ball.maxSpeed, 'la vitesse ne doit pas dépasser maxSpeed');

console.log('OK — boîtes englobantes conformes à three, physique de la balle vérifiée.');
