#!/usr/bin/env node
// Vérifie que chaque asset référencé par le frontend existe dans public/, et
// qu'aucun fichier de public/ ne traîne sans être chargé par personne.
// Attrape les renommages d'extension, les compressions de GLB et les chemins
// cassés par un déplacement de fichiers.
//
//   node scripts/check-assets.mjs

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const frontend = join(root, "frontend");
const publicDir = join(frontend, "public");
const ASSET_DIRS = ["sound", "scenes", "textures", "brand", "avatars"];

// Tous les fichiers source du frontend, hors dépendances et build.
function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "public"].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(m?js|html|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const sources = sourceFiles(frontend);
const referenced = new Map(); // chemin d'asset -> fichiers qui le citent

// `/sound/x.mp3` en absolu, ou `${staticUrl}brand/x.png` dans les vues.
const PATTERNS = [
  new RegExp(`['"\`](/(?:${ASSET_DIRS.join("|")})/[^'"\`]+)['"\`]`, "g"),
  new RegExp(`\\$\\{staticUrl\\}((?:${ASSET_DIRS.join("|")})/[^'"\`]+)`, "g"),
];

for (const file of sources) {
  const code = readFileSync(file, "utf8");
  for (const pattern of PATTERNS) {
    for (const [, path] of code.matchAll(pattern)) {
      const key = path.startsWith("/") ? path : `/${path}`;
      if (!referenced.has(key)) referenced.set(key, []);
      referenced.get(key).push(relative(frontend, file));
    }
  }
}

const missing = [];
let bytes = 0;
for (const [path, citedBy] of referenced) {
  const onDisk = join(publicDir, path);
  if (existsSync(onDisk)) bytes += statSync(onDisk).size;
  else missing.push(`${path}  (cité par ${citedBy.join(", ")})`);
}

const orphans = [];
for (const dir of ASSET_DIRS) {
  const full = join(publicDir, dir);
  if (!existsSync(full)) continue;
  for (const f of readdirSync(full)) {
    if (!referenced.has(`/${dir}/${f}`)) orphans.push(`${dir}/${f}`);
  }
}

// Un .glb compressé ne se charge pas si le décodeur correspondant n'est pas
// branché sur le GLTFLoader. C'est le mode d'échec le plus facile à réintroduire.
const DECODERS = {
  EXT_meshopt_compression: "setMeshoptDecoder",
  KHR_draco_mesh_compression: "setDRACOLoader",
};
const decoderErrors = [];
for (const path of referenced.keys()) {
  if (!path.endsWith(".glb")) continue;
  const onDisk = join(publicDir, path);
  if (!existsSync(onDisk)) continue;
  const glb = readFileSync(onDisk);
  const json = JSON.parse(
    glb.subarray(20, 20 + glb.readUInt32LE(12)).toString("utf8"),
  );
  for (const ext of json.extensionsRequired || []) {
    const setter = DECODERS[ext];
    if (!setter) continue;
    const wired = sources.some((f) => readFileSync(f, "utf8").includes(setter));
    if (!wired) {
      decoderErrors.push(`${path} exige ${ext} mais aucun appel à ${setter}()`);
    }
  }
}

// --- les surfaces qui reçoivent l'ombre existent-elles encore ? ---
//
// `markGroundSurfaces()` les désigne par leur nom. Une faute de frappe ou un
// export Blender qui renomme un nœud ne casse rien : la scène se charge, les
// ombres sont simplement fausses. C'est resté invisible pendant un an.
const shadowErrors = [];
const island = readFileSync(join(frontend, "src/game/loadIsland.mjs"), "utf8");
// `\s*` : l'appel passe à la ligne dès qu'un second argument s'ajoute (un
// callback de progression, par exemple). Exiger le chemin sur la même ligne
// faisait échouer le contrôle sur un simple reformatage.
const scenePath = island.match(/loadAsync\(\s*["']([^"']+\.glb)["']/)?.[1];

if (!scenePath) {
  shadowErrors.push(
    "loadIsland.mjs ne charge plus de .glb par loadAsync() — contrôle à réécrire",
  );
} else {
  const { GROUND_NODES } = await import(
    pathToFileURL(join(frontend, "src/game/loadIsland.mjs")).href
  );
  const { PropertyBinding } = await import(
    pathToFileURL(join(frontend, "node_modules/three/build/three.module.js"))
      .href
  );

  const glb = readFileSync(join(publicDir, scenePath.replace(/^\//, "")));
  const json = JSON.parse(
    glb.subarray(20, 20 + glb.readUInt32LE(12)).toString("utf8"),
  );
  // three assainit les noms au chargement : espaces en tirets bas, points retirés.
  const byName = new Map(
    json.nodes.map((
      n,
      i,
    ) => [PropertyBinding.sanitizeNodeName(n.name || ""), i]),
  );

  for (const name of GROUND_NODES) {
    const index = byName.get(name);
    if (index === undefined) {
      shadowErrors.push(`${name} : absent de ${scenePath}`);
      continue;
    }
    const node = json.nodes[index];
    // Soit le nœud porte la géométrie, soit c'est son enfant anonyme.
    const anonymousMesh = (node.children || []).some(
      (c) => json.nodes[c].mesh !== undefined && !json.nodes[c].name,
    );
    if (node.mesh === undefined && !anonymousMesh) {
      shadowErrors.push(
        `${name} : ni mesh ni enfant anonyme portant une géométrie`,
      );
    }
  }
}

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} Mo`;
console.log(`${referenced.size} assets référencés, ${mb(bytes)} sur le disque`);
if (orphans.length) {
  console.log(`orphelins (jamais chargés) : ${orphans.join(", ")}`);
}

if (shadowErrors.length) {
  console.error(
    `\nSurfaces d'ombre introuvables (frontend/src/game/loadIsland.mjs) :`,
  );
  for (const e of shadowErrors) console.error(`  ${e}`);
  process.exit(1);
}
if (decoderErrors.length) {
  console.error(`\nDécodeur manquant :`);
  for (const e of decoderErrors) console.error(`  ${e}`);
  process.exit(1);
}
if (missing.length) {
  console.error(`\n${missing.length} asset(s) référencé(s) mais absent(s) :`);
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}
if (orphans.length) process.exit(1);
console.log(
  "OK — aucun asset manquant ni orphelin, surfaces d'ombre en place.",
);
