import { fetchWithToken } from './api.js';

export function fetchFriendList() {
    return fetchWithToken('/api/friends/')
        .then(response => response.json())
        .catch(error => {
            console.error('Erreur lors de la récupération de la liste d\'amis:', error);
            throw error;
        });
}

// Fonction pour envoyer une demande d'ami
export function sendFriendRequest(toUsername) {
    return fetchWithToken('/api/send-friend-request/', {
        method: 'POST',
        body: JSON.stringify({ to_username: toUsername })
    });
}

// Fonction pour récupérer les demandes d'ami en attente
export function fetchFriendRequests() {
    return fetchWithToken('/api/get-friend-requests/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.friend_requests;
            } else {
                throw new Error(data.message || 'Erreur lors de la récupération des demandes d\'ami');
            }
        });
}

// Fonction pour accepter une demande d'ami
export function acceptFriendRequest(requestId) {
    return fetchWithToken('/api/accept-friend-request/', {
        method: 'POST',
        body: JSON.stringify({ request_id: requestId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Demande d\'ami acceptée');
            return data;
        } else {
            throw new Error(data.message || 'Erreur lors de l\'acceptation de la demande d\'ami');
        }
    });
}

// Fonction pour rejeter une demande d'ami
export function rejectFriendRequest(requestId) {
    return fetchWithToken('/api/reject-friend-request/', {
        method: 'POST',
        body: JSON.stringify({ request_id: requestId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Demande d\'ami rejetée');
            return data;
        } else {
            throw new Error(data.message || 'Erreur lors du rejet de la demande d\'ami');
        }
    });
}

export function addFriend(event) {
    event.preventDefault();
    const dropdown = event.target.closest('.dropdown-menu, .dropdown-menu_chat');
    const friendName = dropdown ? dropdown.getAttribute('data-friend') : null;
    if (!friendName) {
        console.error("Impossible de déterminer le nom de l'ami");
        return;
    }
    console.log(`Tentative d'ajout de ${friendName} comme ami`);

    // Vérifier d'abord si l'utilisateur est déjà ami
    checkFriendshipStatus(friendName)
        .then(response => {
            if (response.is_friend) {
                showToast(`Vous êtes déjà ami avec ${friendName}.`);
            } else if (response.request_sent) {
                showToast(`Une demande d'ami a déjà été envoyée à ${friendName}.`);
            } else {
                // Si ce n'est pas un ami et qu'aucune demande n'a été envoyée, envoyer la demande
                return sendFriendRequest(friendName);
            }
        })
        .then(response => {
            if (response && response.ok) {
                return response.json();
            }
        })
        .then(data => {
            if (data) {
                console.log('Demande d\'ami envoyée avec succès', data);
                showFriendRequestSentToast(friendName);
            }
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
            showToast('Une erreur est survenue lors de l\'envoi de la demande d\'ami.', 'error');
        });
}

// Fonction pour vérifier le statut d'amitié
function checkFriendshipStatus(username) {
    return fetch(`/api/check-friend-request/${username}/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
}

// Fonction pour afficher un toast
function showToast(message, type = 'info') {
    // Implémentez cette fonction pour afficher un message toast
    // Vous pouvez utiliser une bibliothèque de toast ou créer votre propre implémentation
    console.log(`Toast (${type}): ${message}`);
    // Exemple d'implémentation basique :
    alert(message);
}
