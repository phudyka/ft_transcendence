// Service temps réel : jeu et chat réunis derrière un seul socket.io.
//
// Avant : deux conteneurs Node, chacun avec son certificat auto-signé, son
// serveur HTTPS et son chemin socket.io (/g_socket.io, /c_socket.io). Les
// hébergeurs gratuits ne donnent qu'un service : les deux sont fusionnés en
// deux namespaces, /game et /chat, sur le chemin socket.io par défaut.
//
// Le TLS est terminé en amont (nginx en local, la plateforme en production),
// donc on écoute en clair.

import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import setupGame from './game/sockets.mjs';
import setupChat from './chat/index.mjs';
import { requireAuth } from './auth.mjs';

const PORT = Number(process.env.PORT) || 3000;

// Origines autorisées à ouvrir un socket. Le frontend étant servi par un hôte
// distinct en production, il faut les déclarer explicitement.
const ORIGINS = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const app = express();
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ORIGINS.length ? ORIGINS : true,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const game = io.of('/game');
const chat = io.of('/chat');

game.use(requireAuth);
chat.use(requireAuth);

setupGame(game);
setupChat(chat);

server.listen(PORT, () => {
    console.log(`Service temps réel à l'écoute sur le port ${PORT}`);
    console.log(`Origines autorisées : ${ORIGINS.length ? ORIGINS.join(', ') : '(toutes)'}`);
});
