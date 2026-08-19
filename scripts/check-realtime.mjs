#!/usr/bin/env node
// Démarre le service temps réel pour de vrai et vérifie que :
//  - les deux namespaces (/game et /chat) acceptent un JWT valide ;
//  - une connexion sans jeton, avec un jeton mal signé, avec un jeton de
//    rafraîchissement ou sans nom d'affichage est refusée.
//
// C'est la barrière posée au Lot 4 : avant, le serveur croyait sur parole le
// nom annoncé par le client.
//
//   node scripts/check-realtime.mjs

import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const realtime = join(root, 'src/requirements/realtime');

process.env.DJANGO_SECRET_KEY = 'clef-de-test-uniquement';
// Le port effectif est relu sur le serveur actif plus bas.
process.env.PORT = '';
process.env.WIN_SCORE = '11';

const jwt = (await import(pathToFileURL(join(realtime, 'node_modules/jsonwebtoken/index.js')).href)).default;
const { io } = await import(pathToFileURL(join(root, 'frontend/node_modules/socket.io-client/build/esm/index.js')).href);

const sign = (payload) => jwt.sign(payload, process.env.DJANGO_SECRET_KEY, { algorithm: 'HS256' });
const valid = sign({ user_id: 1, display_name: 'Zoé', token_type: 'access' });

await import(pathToFileURL(join(realtime, 'src/index.mjs')).href);

// Le module écoute sur un port éphémère : on le récupère sur le serveur actif.
await new Promise((r) => setTimeout(r, 200));
const handles = process._getActiveHandles().filter((h) => h.constructor.name === 'Server');
assert.ok(handles.length, 'le service ne semble pas écouter');
const port = handles[0].address().port;
const base = `http://127.0.0.1:${port}`;

function connect(namespace, token) {
    return new Promise((resolve) => {
        const socket = io(`${base}${namespace}`, {
            transports: ['websocket'],
            auth: token ? { token } : {},
            reconnection: false,
        });
        socket.on('connect', () => { socket.close(); resolve({ ok: true }); });
        socket.on('connect_error', (err) => { socket.close(); resolve({ ok: false, message: err.message }); });
    });
}

const cases = [
    ['/game', valid, true, 'jeton valide sur /game'],
    ['/chat', valid, true, 'jeton valide sur /chat'],
    ['/game', null, false, 'aucun jeton'],
    ['/game', sign({ user_id: 1, display_name: 'Zoé', token_type: 'refresh' }), false, 'jeton de rafraîchissement'],
    ['/game', sign({ user_id: 1, token_type: 'access' }), false, 'jeton sans display_name'],
    ['/chat', jwt.sign({ user_id: 1, display_name: 'Zoé', token_type: 'access' }, 'mauvaise-clef'), false, 'signature invalide'],
];

let failures = 0;
for (const [namespace, token, expected, label] of cases) {
    const result = await connect(namespace, token);
    const pass = result.ok === expected;
    if (!pass) failures++;
    console.log(`${pass ? 'ok  ' : 'ÉCHEC'} ${label} → ${result.ok ? 'accepté' : `refusé (${result.message})`}`);
}

// Le health check sert aussi de sonde de démarrage sur les plateformes.
const health = await fetch(`${base}/health`).then((r) => r.json());
assert.deepEqual(health, { status: 'ok' }, '/health ne répond pas comme attendu');
console.log('ok   /health répond');

process.exit(failures ? 1 : 0);
