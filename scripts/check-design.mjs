#!/usr/bin/env node
// Relie docs/DESIGN.md au CSS qu'il prétend décrire.
//
// Le document affirmait des dizaines de valeurs — « aucune couleur en dur »,
// « l'anneau d'or déclaré une seule fois », « jamais un champ sous 16 px » — et
// rien ne les vérifiait : une revue en a trouvé onze déjà fausses, sans qu'un
// seul test bronche. Sur un système déjà construit, une documentation n'est pas
// une spécification, c'est une affirmation sur le présent qui vieillit en
// silence. Ce script est ce qui la fait crier.
//
// Chaque contrôle balaie tous les fichiers à la recherche du motif de violation
// plutôt que de réaffirmer une constante : un test qui vérifie une valeur sans
// exercer son point d'appel ne couvre rien.
//
//   node scripts/check-design.mjs

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cssDir = join(root, "frontend/src/css");
const tokensPath = join(cssDir, "tokens.css");

const failures = [];
const fail = (check, lines) => failures.push({ check, lines });
const at = (src, index) => src.slice(0, index).split("\n").length;

function walk(dir, test, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") walk(full, test, out);
    } else if (test(entry.name)) out.push(full);
  }
  return out;
}

const frontendSrc = join(root, "frontend/src");
const cssFiles = walk(frontendSrc, (n) => n.endsWith(".css"));
const codeFiles = walk(frontendSrc, (n) => /\.(css|js|mjs)$/.test(n));
const htmlFiles = ["index.html", "game.html"].map((f) =>
  join(root, "frontend", f)
);

// Les commentaires citent les motifs qu'ils interdisent — les scanner
// ferait échouer le contrôle sur sa propre documentation.
const strip = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const read = (f) => strip(readFileSync(f, "utf8"));

const tokens = read(tokensPath);
const otherCss = cssFiles.filter((f) => f !== tokensPath);

// --- A. jetons orphelins ----------------------------------------------------
// N'affirme pas la valeur d'un jeton : affirme qu'il a un appelant. Trois
// jetons du frontmatter vivaient sans un seul `var()` — changer leur valeur ne
// bougeait rien à l'écran, et personne ne l'aurait su.

const declared = [...tokens.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]);
const allCode = codeFiles.map(read).join("\n");

const orphans = declared.filter((name) => {
  const uses = allCode.split(`var(${name})`).length - 1;
  // Un jeton peut n'être appelé que par un autre jeton (--on-accent) : c'est
  // un appel valide, il vit dans tokens.css.
  return uses === 0;
});
if (orphans.length) {
  fail("A · jetons orphelins (déclarés, jamais appelés)", orphans);
}

// --- B. unicité de l'anneau de focus ----------------------------------------
// « Déclaré une fois dans tokens.css pour tout le projet. Rien n'a le droit de
// redéfinir le focus localement. » register.css le faisait, en orange.
// Exception légitime : une cible masquée dont le voisin porte l'anneau — mais
// alors dans la couleur et au décalage du système.

const RING = /outline\s*:\s*(\d+)px\s+solid\s+([^;]+);/g;
for (const file of otherCss) {
  const src = read(file);
  for (const m of src.matchAll(RING)) {
    const [, width, color] = m;
    if (width === "3" && color.trim() === "var(--sun-gold)") continue;
    fail("B · anneau de focus redéfini hors tokens.css", [
      `${relative(root, file)}:${at(src, m.index)} — ${m[0].trim()}`,
    ]);
  }
}
if (!/outline:\s*3px solid var\(--sun-gold\)/.test(tokens)) {
  fail("B · anneau de focus absent de tokens.css", ["tokens.css"]);
}
for (const file of [...otherCss, tokensPath]) {
  const src = read(file);
  for (const m of src.matchAll(/outline\s*:\s*none/g)) {
    fail("B · `outline: none` interdit", [
      `${relative(root, file)}:${at(src, m.index)}`,
    ]);
  }
}

// --- C. couleurs écrites en dur ---------------------------------------------
// La liste d'exceptions est le point de contrôle : y ajouter demande un diff
// que quelqu'un relit. Une couleur qui s'y glisse en silence, non.

const ALLOWED = new Set([
  // Masque radial du donut : une valeur d'alpha, pas une couleur du système.
  "frontend/src/css/profile.css#000",
  // Filets et ombres translucides — le vocabulaire d'élévation, documenté
  // comme local à son composant.
  "rgba",
]);
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
for (const file of otherCss) {
  const src = read(file);
  const rel = relative(root, file);
  for (const m of src.matchAll(HEX)) {
    if (ALLOWED.has(rel + m[0])) continue;
    fail("C · couleur écrite en dur (lire depuis tokens.css)", [
      `${rel}:${at(src, m.index)} — ${m[0]}`,
    ]);
  }
}

// --- D. plancher de seize ---------------------------------------------------
// Sous 16 px, Safari iOS zoome de force sur le champ au focus et casse la mise
// en page du formulaire. Le doc l'affirmait deux fois et s'accordait une
// exception « saisie de chat » ailleurs ; le CSS suivait l'exception.

const INPUT_RULE =
  /(^|\})\s*([^{}]*(?:input|textarea|field-input|message-input)[^{}]*)\{([^}]*)\}/gim;
for (const file of otherCss) {
  const src = read(file);
  for (const m of src.matchAll(INPUT_RULE)) {
    const [, , selector, body] = m;
    if (/::(placeholder|-webkit-input-placeholder)/.test(selector)) continue;
    const size = body.match(/font-size\s*:\s*([\d.]+)(px|rem)/);
    if (!size) continue;
    const px = size[2] === "rem" ? Number(size[1]) * 16 : Number(size[1]);
    if (px < 16) {
      fail("D · champ de saisie sous 16 px (Plancher de Seize)", [
        `${relative(root, file)}:${at(src, m.index)} — ${selector.trim()} → ${
          size[0]
        }`,
      ]);
    }
  }
}

// --- E. vh au lieu de dvh ---------------------------------------------------
// Sur mobile la barre d'adresse se rétracte : `vh` ne bouge pas, `dvh` si. Ne
// vise que les propriétés d'ancrage — un padding en vh est sans conséquence.

const ANCHOR =
  /\b(height|min-height|max-height|top|bottom|inset)\s*:\s*[^;]*?\b[\d.]+vh\b/g;
for (const file of cssFiles) {
  const src = read(file);
  for (const m of src.matchAll(ANCHOR)) {
    fail("E · hauteur d'écran en vh (utiliser dvh)", [
      `${relative(root, file)}:${at(src, m.index)} — ${m[0].trim()}`,
    ]);
  }
}

// --- F. piles de polices ----------------------------------------------------
// Le frontmatter de docs/DESIGN.md annonce les replis. Le code en avait perdu la
// moitié — un repli qui disparaît ne se voit jamais, la police distante répond.

const design = readFileSync(join(root, "docs/DESIGN.md"), "utf8");
const STACKS = [...design.matchAll(/fontFamily:\s*"([^"]+)"/g)].map((m) =>
  m[1]
);
const expected = new Map();
for (const stack of STACKS) {
  const family = stack.split(",")[0].trim();
  expected.set(family, stack.replace(/\s*,\s*/g, ", "));
}
for (const file of cssFiles) {
  const src = read(file);
  for (const m of src.matchAll(/font-family\s*:\s*([^;]+);/g)) {
    const stack = m[1].replace(/["']/g, "").replace(/\s*,\s*/g, ", ").trim();
    if (stack === "inherit") continue;
    const family = stack.split(",")[0].trim();
    const want = expected.get(family);
    if (want && stack !== want) {
      fail("F · pile de polices divergente du frontmatter", [
        `${relative(root, file)}:${
          at(src, m.index)
        } — « ${stack} », attendu « ${want} »`,
      ]);
    }
  }
}

// --- G. l'or n'est pas un fond ----------------------------------------------
// « L'or encadre, il ne remplit pas » — la seule formulation du doc qui était
// invérifiable telle quelle. Réécrite : l'or n'apparaît jamais en `background`.

for (const file of otherCss) {
  const src = read(file);
  for (
    const m of src.matchAll(/background(-color)?\s*:\s*var\(--sun-gold\)/g)
  ) {
    // La jauge de chargement est un trait de progression, pas une surface :
    // l'or y lit comme une mesure et ne porte aucun texte.
    const rule = src.lastIndexOf("{", m.index);
    const selector = src.slice(src.lastIndexOf("}", rule) + 1, rule).trim();
    if (selector === "#loading-bar::before") continue;
    fail("G · l'or en aplat (il encadre, il ne remplit pas)", [
      `${relative(root, file)}:${at(src, m.index)}`,
    ]);
  }
}

// --- H. une seule police chargée par page -----------------------------------
// Quatre `@import` répartis dans les feuilles ont été repliés sur un `<link>`
// par page. Le motif se réintroduit d'un copier-coller.

for (const file of otherCss) {
  const src = read(file);
  for (const m of src.matchAll(/@import\s+url\(['"]?https?:/g)) {
    fail("H · police chargée par @import (utiliser le <link> de la page)", [
      `${relative(root, file)}:${at(src, m.index)}`,
    ]);
  }
}
for (const file of htmlFiles) {
  const src = read(file);
  const links = src.match(/fonts\.googleapis\.com\/css2/g) ?? [];
  if (links.length > 1) {
    fail("H · plusieurs feuilles de polices sur la même page", [
      `${relative(root, file)} — ${links.length} liens`,
    ]);
  }
}

// --- rapport ----------------------------------------------------------------

if (failures.length) {
  const grouped = new Map();
  for (const { check, lines } of failures) {
    if (!grouped.has(check)) grouped.set(check, []);
    grouped.get(check).push(...lines);
  }
  console.error("docs/DESIGN.md et le CSS ont divergé :\n");
  for (const [check, lines] of grouped) {
    console.error(`  ${check}`);
    for (const line of lines) console.error(`    ${line}`);
    console.error("");
  }
  process.exit(1);
}

console.log(
  `OK — design : ${declared.length} jetons tous appelés, anneau de focus unique, ` +
    `aucune couleur en dur, plancher de seize tenu, piles de polices conformes.`,
);
