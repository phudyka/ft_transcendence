#!/usr/bin/env node
// Re-bake de la scène 3D : décimation, déduplication, élagage.
//
// Le GLB exporté de Blender pesait 598 834 triangles, dont 544 616 — 91 % —
// pour les deux seuls troncs de palmier (`tronc`, `tronc.001`) : neuf palmes de
// 30 200 triangles chacune, skinnées sur 21 os. Le reste de l'île tient en
// 54 000 triangles.
//
// `simplify()` de meshoptimizer travaille sous contrainte d'erreur : le ratio
// est un plafond, pas une consigne. Les petits meshes propres atteignent leur
// budget d'erreur avant d'avoir perdu grand-chose (la table passe de 4 022 à
// 2 946, la passerelle de 1 768 à 1 740, la feuille de cactus ne bouge pas),
// alors que les palmes s'effondrent de 272 308 à 14 093 par arbre. C'est
// exactement ce qu'on veut : la décimation se concentre là où la densité est
// absurde.
//
//   node scripts/bake-scene.mjs [entrée.glb] [sortie.glb]
//
// Sans argument, réécrit frontend/public/scenes/pong-scene.glb sur place. Le
// fichier d'origine est dans git (4f4c2017) : `git checkout` le restaure.

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { statSync } from "node:fs";

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, simplify, weld } from "@gltf-transform/functions";
import {
  MeshoptDecoder,
  MeshoptEncoder,
  MeshoptSimplifier,
} from "meshoptimizer";

import bakeAmbientOcclusion from "./bake-ao.mjs";

// Les deux boutons de réglage. `RATIO` est le plancher de triangles conservés,
// `ERROR` la déviation maximale tolérée, en fraction de la taille du mesh.
// Monter ERROR décime plus fort et abîme les silhouettes ; le descendre rend
// le ratio inatteignable et ne change plus rien.
const RATIO = 0.05;
const ERROR = 0.005;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scene = join(root, "frontend/public/scenes/pong-scene.glb");
const input = process.argv[2] || scene;
const output = process.argv[3] || input;

// La liste des pistes réellement jouées vit dans le client, à côté du code qui
// les joue. La dupliquer ici, c'est se garantir qu'un jour l'une des deux
// copies élaguera une animation que l'autre attend encore.
const { PLAYED_ANIMATIONS } = await import(
  pathToFileURL(join(root, "frontend/src/game/loadIsland.mjs")).href
);

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });

function census(document) {
  const meshes = document.getRoot().listMeshes();
  let triangles = 0;
  let primitives = 0;
  for (const mesh of meshes) {
    for (const primitive of mesh.listPrimitives()) {
      primitives++;
      const indices = primitive.getIndices();
      triangles += (indices ?? primitive.getAttribute("POSITION")).getCount() /
        3;
    }
  }
  return {
    triangles: Math.round(triangles),
    primitives,
    materials: document.getRoot().listMaterials().length,
    animations: document.getRoot().listAnimations().length,
  };
}

const report = (
  label,
  { triangles, primitives, materials, animations },
  bytes,
) =>
  console.log(
    `${label} : ${
      triangles.toLocaleString("fr")
    } triangles, ${primitives} primitives, ` +
      `${materials} matériaux, ${animations} animations — ${
        (bytes / 1024 / 1024).toFixed(2)
      } Mo`,
  );

const document = await io.read(input);
report("avant", census(document), statSync(input).size);

for (const animation of document.getRoot().listAnimations()) {
  if (!PLAYED_ANIMATIONS.has(animation.getName())) {
    console.log(`  piste jamais jouée, retirée : ${animation.getName()}`);
    animation.dispose();
  }
}

await document.transform(
  // Les 35 matériaux comptaient neuf `None.00x` identiques par palmier.
  dedup(),
  // simplify() exige des sommets soudés : sans ça la décimation s'arrête aux
  // coutures et ne descend jamais au ratio demandé.
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: ERROR }),
  // Les nœuds vidés par la décimation, et les accessors devenus orphelins.
  prune({ keepAttributes: false, keepLeaves: false }),
  dedup(),
);

// L'AO passe en dernier, et surtout après `prune()` : aucun matériau glTF ne
// déclare utiliser les couleurs de sommets — c'est implicite — donc un élagage
// postérieur verrait un COLOR_0 que personne ne réclame et le supprimerait.
const ao = bakeAmbientOcclusion(document);
console.log(
  `  AO cuite sur ${ao.baked.toLocaleString("fr")} sommets ` +
    `(${ao.skipped} primitives skinnées ignorées, occluder ${
      ao.triangles.toLocaleString("fr")
    } triangles, ` +
    `portée ${ao.maxDistance.toFixed(2)} u) — ` +
    `min ${ao.darkest.toFixed(2)} / moy ${ao.average.toFixed(2)} / max ${
      ao.brightest.toFixed(2)
    }`,
);

await io.write(output, document);
report("après", census(document), statSync(output).size);
