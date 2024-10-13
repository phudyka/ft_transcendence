export function fetchFriendList() {
    return fetch('/api/friends/', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
    })
    .then(response => response.json())
    .catch(error => {
        console.error('Erreur lors de la récupération de la liste d\'amis:', error);
        throw error;
    });
}

// Fonction pour envoyer une demande d'ami
export function sendFriendRequest(username) {
    return fetch('/api/send-friend-request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ to_username: username })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Demande d\'ami envoyée');
            return data;
        } else {
            throw new Error(data.message || 'Erreur lors de l\'envoi de la demande d\'ami');
        }
    });
}

// Fonction pour récupérer les demandes d'ami en attente
export function fetchFriendRequests() {
    return fetch('/api/get-friend-requests/', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
    })
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
    return fetch('/api/accept-friend-request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
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
    return fetch('/api/reject-friend-request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
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
