import { fetchWithToken } from "./api.js";
import { getSocket } from "./socketManager.js";

// Fonction pour envoyer une demande d'ami
export function sendFriendRequest(toUsername) {
  return fetchWithToken("/api/send-friend-request/", {
    method: "POST",
    body: JSON.stringify({ to_username: toUsername }),
  });
}

// Accepter et rejeter ne diffèrent que par la route et la réponse annoncée à
// l'expéditeur ; le reste du trajet est identique.
function answerFriendRequest(requestId, response) {
  return fetchWithToken(
    `/api/${response === "accepted" ? "accept" : "reject"}-friend-request/`,
    {
      method: "POST",
      body: JSON.stringify({ request_id: requestId }),
    },
  )
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) {
        throw new Error(
          data.message || `Erreur lors du traitement de la demande d'ami`,
        );
      }
      // Notifier l'expéditeur.
      const socket = getSocket();
      if (socket) {
        socket.emit("friend_request_response", {
          from: data.from_user,
          to: data.to_user,
          response,
          requestId,
        });
      }
      return data;
    });
}

export const acceptFriendRequest = (requestId) =>
  answerFriendRequest(requestId, "accepted");
export const rejectFriendRequest = (requestId) =>
  answerFriendRequest(requestId, "rejected");
