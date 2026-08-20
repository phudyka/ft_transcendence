import { fetchWithToken } from "./api.js";
import { connectChat } from "../config.js";
import {
  fetchAndDisplayFriends,
  setupChatListeners,
} from "../views/dashboard.js";
import { showToast } from "./feedback.js";
import { logout } from "../utils/token.js";

// Une seule session de chat par onglet : le pseudo connecté vit dans
// sessionStorage, inutile d'indexer les sockets par nom.
let socket = null;
let activityTimer = null;

export function initializeSocket(displayName) {
  disconnectSocket();

  const token = sessionStorage.getItem("accessToken");
  if (!displayName || !token) {
    console.error("Nom d'utilisateur ou token non trouvé");
    return null;
  }

  // Ni le nom ni le jeton ne transitent plus en query : le jeton part dans le
  // handshake `auth` et le serveur en déduit l'identité lui-même.
  socket = connectChat({ reconnection: false });
  socket.displayName = displayName;

  socket.on("connect", () => {
    socket.emit("register");
    updateOnlineStatus(displayName, true);
    startActivityTimer(displayName);
  });

  socket.on("disconnect", () => {
    socket = null;
    clearActivityTimer();
  });

  socket.on("connect_error", (error) => {
    console.error(`Connection error for ${displayName}:`, error);
    showToast("Chat disconnected. Reload the page to reconnect.", "error");
  });

  socket.on("friend_request_updated", (data) => {
    const message = data.response === "accepted"
      ? `${data.from} accepted your friend request.`
      : `${data.from} declined your friend request.`;
    showToast(message, data.response === "accepted" ? "success" : "info");
    fetchAndDisplayFriends();
  });

  socket.on("force_disconnect", (data) => {
    showToast(data.message, "warning");
    disconnectSocket();
    logout();
  });

  // Les écouteurs de chat se posent ici, et non chez l'appelant : `sendMessage`
  // recréait le socket sans eux, et le chat devenait muet en silence — l'envoi
  // continuait de marcher, plus rien n'arrivait. Poser la réparation chez un
  // seul appelant aurait laissé les autres cassés.
  setupChatListeners(socket);

  return socket;
}

const IDLE_MS = 10 * 60 * 1000;
let rearmActivityTimer = null;

function startActivityTimer(username) {
  clearActivityTimer();
  const arm = () => {
    clearTimeout(activityTimer);
    activityTimer = setTimeout(async () => {
      showToast("Disconnected after 10 minutes idle.", "warning");
      await updateOnlineStatus(username, false);
      disconnectSocket();
    }, IDLE_MS);
  };
  arm();

  // La minuterie n'était jamais réarmée : dix minutes après la connexion, le
  // chat se coupait même en pleine conversation.
  rearmActivityTimer = arm;
  for (const event of ["pointerdown", "keydown", "visibilitychange"]) {
    document.addEventListener(event, arm, { passive: true });
  }
}

function clearActivityTimer() {
  clearTimeout(activityTimer);
  activityTimer = null;
  if (rearmActivityTimer) {
    for (const event of ["pointerdown", "keydown", "visibilitychange"]) {
      document.removeEventListener(event, rearmActivityTimer);
    }
    rearmActivityTimer = null;
  }
}

export async function updateOnlineStatus(username, isOnline) {
  try {
    const response = await fetchWithToken("/api/update-online-status/", {
      method: "POST",
      body: JSON.stringify({ is_online: isOnline, display_name: username }),
    });
    if (!response.ok) {
      throw new Error("Error updating online status");
    }
  } catch (error) {
    console.error("Error updating online status:", error);
  }
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  const username = socket.displayName;
  socket.off("force_disconnect");
  socket.disconnect();
  socket = null;
  clearActivityTimer();
  updateOnlineStatus(username, false);
}

export function sendFriendRequestSocket(to, requestId) {
  if (socket) {
    socket.emit("friend_request", {
      from: sessionStorage.getItem("display_name"),
      to: to,
      requestId: requestId,
    });
  }
}
