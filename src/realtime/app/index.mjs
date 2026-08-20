// Service temps réel : jeu et chat réunis derrière un seul socket.io.
//
// Avant : deux conteneurs Node, chacun avec son certificat auto-signé, son
// serveur HTTPS et son chemin socket.io (/g_socket.io, /c_socket.io). Les
// hébergeurs gratuits ne donnent qu'un service : les deux sont fusionnés en
// deux namespaces, /game et /chat, sur le chemin socket.io par défaut.
//
// Le TLS est terminé en amont (nginx en local, la plateforme en production),
// donc on écoute en clair.

import { createServer } from "node:http";
import { Server } from "socket.io";
import setupGame from "./game/sockets.mjs";
import setupChat from "./chat/index.mjs";
import { allowGuest, requireAuth } from "./auth.mjs";

const PORT = Number(process.env.PORT) || 3000;

// Origines autorisées à ouvrir un socket. Le frontend étant servi par un hôte
// distinct en production, il faut les déclarer explicitement.
//
// On échoue à l'amorçage plutôt que de retomber sur « toutes les origines » :
// combiné à `credentials: true`, ce défaut renvoie l'en-tête d'autorisation à
// n'importe quel site. `.env.example` livre la variable vide, donc un
// déploiement recopié depuis l'exemple partirait ouvert sans le savoir.
const ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (!ORIGINS.length) {
  throw new Error(
    "ALLOWED_ORIGINS est vide : déclarez les origines du frontend (séparées par des virgules).",
  );
}

// socket.io intercepte /socket.io/ avant ce gestionnaire ; il ne reste que la
// sonde de démarrage des plateformes d'hébergement.
const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404).end();
});
const io = new Server(server, {
  cors: {
    origin: ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const game = io.of("/game");
const chat = io.of("/chat");

// Le jeu admet l'invité (solo seulement, voir `allowGuest`) ; le chat, jamais.
game.use(allowGuest);
chat.use(requireAuth);

setupGame(game);
setupChat(chat);

server.listen(PORT, () => {
  console.log(`Service temps réel à l'écoute sur le port ${PORT}`);
  console.log(`Origines autorisées : ${ORIGINS.join(", ")}`);
});
