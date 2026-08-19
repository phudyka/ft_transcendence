#!/usr/bin/env node
// Vérifie que chaque asset référencé par le frontend existe dans public/, et
// qu'aucun fichier de public/ ne traîne sans être chargé par personne.
// Attrape les renommages d'extension, les compressions de GLB et les chemins
// cassés par un déplacement de fichiers.
//
//   node scripts/check-assets.mjs

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const frontend = join(root, 'frontend');
const publicDir = join(frontend, 'public');
const ASSET_DIRS = ['sound', 'scenes', 'png', 'content'];

// Tous les fichiers source du frontend, hors dépendances et build.
function sourceFiles(dir) {
    const out = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', 'dist', 'public'].includes(entry.name)) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) out.push(...sourceFiles(full));
        else if (/\.(m?js|html|css)$/.test(entry.name)) out.push(full);
    }
    return out;
}

const sources = sourceFiles(frontend);
const referenced = new Map(); // chemin d'asset -> fichiers qui le citent

// `/sound/x.mp3` en absolu, ou `${staticUrl}content/x.png` dans les vues.
const PATTERNS = [
    new RegExp(`['"\`](/(?:${ASSET_DIRS.join('|')})/[^'"\`]+)['"\`]`, 'g'),
    new RegExp(`\\$\\{staticUrl\\}((?:${ASSET_DIRS.join('|')})/[^'"\`]+)`, 'g'),
];

for (const file of sources) {
    const code = readFileSync(file, 'utf8');
    for (const pattern of PATTERNS) {
        for (const [, path] of code.matchAll(pattern)) {
            const key = path.startsWith('/') ? path : `/${path}`;
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
    else missing.push(`${path}  (cité par ${citedBy.join(', ')})`);
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
    EXT_meshopt_compression: 'setMeshoptDecoder',
    KHR_draco_mesh_compression: 'setDRACOLoader',
};
const decoderErrors = [];
for (const path of referenced.keys()) {
    if (!path.endsWith('.glb')) continue;
    const onDisk = join(publicDir, path);
    if (!existsSync(onDisk)) continue;
    const glb = readFileSync(onDisk);
    const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8'));
    for (const ext of json.extensionsRequired || []) {
        const setter = DECODERS[ext];
        if (!setter) continue;
        const wired = sources.some((f) => readFileSync(f, 'utf8').includes(setter));
        if (!wired) decoderErrors.push(`${path} exige ${ext} mais aucun appel à ${setter}()`);
    }
}

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} Mo`;
console.log(`${referenced.size} assets référencés, ${mb(bytes)} sur le disque`);
if (orphans.length) console.log(`orphelins (jamais chargés) : ${orphans.join(', ')}`);

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
console.log('OK — aucun asset manquant ni orphelin.');
