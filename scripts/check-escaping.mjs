#!/usr/bin/env node
// deno-fmt-ignore-file -- `deno fmt` reformate le HTML des gabarits `html`
// et réécrit les quotes d'attribut, ce qui change la valeur testée ici.
// Vérifie l'échappement HTML des vues :
//  1. `html`/`escapeHtml` neutralisent bien les charges connues, y compris en
//     contexte d'attribut (guillemets) ;
//  2. aucun `innerHTML` du frontend n'interpole de valeur sans passer par le
//     gabarit `html` — c'est la régression facile à réintroduire.
//
//   node scripts/check-escaping.mjs

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jsDir = join(root, 'frontend/src');

const { html, raw, escapeHtml } = await import(join(jsDir, 'utils/html.js'));

// --- 1. comportement de l'échappement ---------------------------------------

const XSS = '<img src=x onerror=alert(1)>';
assert.equal(escapeHtml(XSS), '&lt;img src=x onerror=alert(1)&gt;');

// Contexte texte : plus aucune balise ouvrante.
assert.ok(!html`<span>${XSS}</span>`.includes('<img'));

// Contexte d'attribut : le guillemet ne doit pas pouvoir fermer l'attribut.
const BREAKOUT = '" onerror="alert(1)';
const attr = html`<img src="${BREAKOUT}">`;
assert.ok(!attr.includes('onerror="'), `échappement d'attribut cassé : ${attr}`);
assert.equal(attr, '<img src="&quot; onerror=&quot;alert(1)">');

// L'apostrophe aussi : certains attributs sont délimités par des simples quotes.
assert.ok(!html`<b class='${"' onclick='x"}'>`.includes("onclick='x'"));

// `raw` laisse passer le balisage construit volontairement.
assert.equal(html`<ul>${raw('<li>a</li>')}</ul>`, '<ul><li>a</li></ul>');
// ... mais pas une chaîne brute équivalente.
assert.equal(html`<ul>${'<li>a</li>'}</ul>`, '<ul>&lt;li&gt;a&lt;/li&gt;</ul>');

// Valeurs non-chaînes : comportement inchangé par rapport aux gabarits d'origine.
assert.equal(html`${0}|${null}|${undefined}`, '0|null|undefined');

// --- 2. aucune interpolation hors gabarit ------------------------------------

function jsFiles(dir) {
    const out = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name);
        if (e.isDirectory()) out.push(...jsFiles(full));
        else if (e.name.endsWith('.js')) out.push(full);
    }
    return out;
}

// `x.innerHTML = ` / `+= ` suivi d'un gabarit non préfixé par `html`.
const UNSAFE = /innerHTML\s*\+?=\s*`/g;
const offenders = [];
for (const file of jsFiles(jsDir)) {
    const code = readFileSync(file, 'utf8');
    for (const m of code.matchAll(UNSAFE)) {
        const line = code.slice(0, m.index).split('\n').length;
        // Un gabarit sans interpolation ne peut rien injecter.
        const template = code.slice(m.index + m[0].length);
        const end = template.indexOf('`');
        if (!template.slice(0, end === -1 ? undefined : end).includes('${')) continue;
        offenders.push(`${relative(root, file)}:${line}`);
    }
}

if (offenders.length) {
    console.error(`innerHTML avec interpolation non échappée (préfixer par \`html\`) :`);
    for (const o of offenders) console.error(`  ${o}`);
    process.exit(1);
}

console.log('OK — échappement conforme, aucun innerHTML interpolé sans gabarit.');
