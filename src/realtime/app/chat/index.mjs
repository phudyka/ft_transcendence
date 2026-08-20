// Chat : messages publics, messages privés, notifications d'amitié et présence.
//
// Converti en ESM et branché sur un namespace au lieu de son propre serveur.
// Changement de fond : l'identité ne vient plus de ce que le client annonce
// mais du JWT vérifié au handshake (`socket.data.user`). Auparavant un
// `register` suffisait à se faire passer pour n'importe qui — donc à lire ses
// messages privés et à émettre en son nom.

const DJANGO_API = process.env.DJANGO_API_URL || "http://django:8000";

const userTokens = new Map(); // displayName -> jeton, pour appeler l'API
const users = new Map(); // displayName -> socketId

// sv-SE est le seul locale dont le format court est déjà `AAAA-MM-JJ hh:mm:ss`.
const stamp = () => `[${new Date().toLocaleString("sv-SE")}]`;

export default function setupChat(nsp) {
  nsp.on("connection", (socket) => {
    // Identité issue du jeton, pas du client.
    const username = socket.data.user.displayName;
    socket.username = username;

    socket.on("register", () => {
      const existing = users.get(username);
      if (existing && existing !== socket.id) {
        const previous = nsp.sockets.get(existing);
        if (previous) {
          previous.emit("force_disconnect", {
            message: "Your account has been connected from another location",
          });
          previous.disconnect(true);
        }
      }

      userTokens.set(username, socket.data.token);
      users.set(username, socket.id);
      // La présence est écrite ici et à la déconnexion, nulle part ailleurs :
      // le client la posait aussi depuis le login, l'ouverture du socket, la
      // minuterie d'inactivité et le logout — quatre écrivains pour un champ
      // que ce namespace observe déjà des deux côtés. L'ordre compte : `users`
      // doit pointer sur le nouveau socket avant l'appel, sinon la déconnexion
      // forcée de la session précédente repasse le compte hors ligne juste
      // après.
      updateOnlineStatus(username, true);
    });

    socket.on("chat message", (msg) => {
      // `name` est réécrit : le client pouvait signer sous n'importe quel nom.
      const message = { ...msg, name: username };
      nsp.emit("chat message", message);
    });

    socket.on("private message", ({ to, message }) => {
      const recipientSocketId = users.get(to);
      if (recipientSocketId) {
        nsp.to(recipientSocketId).emit("private message", {
          from: username,
          message,
          time: Date.now(),
        });

        socket.emit("private message", {
          from: username,
          message,
          time: Date.now(),
          isSelf: true,
        });
      } else {
        socket.emit("error", { message: `${to} n'est pas en ligne.` });
      }
    });

    socket.on("error", (data) => {
      console.error("Erreur serveur:", data?.message);
    });

    socket.on("friend_request", (data) => {
      const recipientSocketId = users.get(data.to);
      if (recipientSocketId) {
        nsp.to(recipientSocketId).emit("friend_request_received", {
          from: username,
          requestId: data.requestId,
        });
      }
    });

    socket.on("friend_request_response", (data) => {
      // `data.from` désigne le demandeur d'origine ; l'expéditeur de la
      // réponse, lui, est celui du jeton.
      const senderSocketId = users.get(data.from);
      if (senderSocketId) {
        nsp.to(senderSocketId).emit("friend_request_updated", {
          from: username,
          response: data.response,
          requestId: data.requestId,
        });
      }
    });

    socket.on("disconnect", () => {
      // Ne rien effacer si une session plus récente a déjà repris la place.
      if (users.get(username) === socket.id) {
        users.delete(username);
        updateOnlineStatus(username, false);
      }
    });
  });
}

async function updateOnlineStatus(username, isOnline) {
  const token = userTokens.get(username);
  if (!token) {
    return;
  }

  try {
    // `fetch` est natif depuis Node 18 : node-fetch et son agent HTTPS
    // sur mesure ne sont plus nécessaires. L'appel est en clair sur le
    // réseau interne, le TLS étant terminé par le proxy en amont.
    const response = await fetch(`${DJANGO_API}/api/update-online-status/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ is_online: isOnline, display_name: username }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.error(
      `${stamp()} Échec de mise à jour du statut de ${username}:`,
      error.message,
    );
  }
}
