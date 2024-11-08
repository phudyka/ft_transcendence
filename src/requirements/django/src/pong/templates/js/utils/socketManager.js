import { fetchWithToken } from './api.js';
import { fetchAndDisplayFriends } from '../views/dashboard.js';
import { showToast } from './unmask.js';
import { acceptFriendRequest, rejectFriendRequest } from '../utils/friendManager.js';

let sockets = new Map();
let activityTimers = new Map();

export function initializeSocket(displayName) {
    if (sockets.has(displayName) && sockets.get(displayName).connected) {
        console.log('Socket déjà initialisé pour cet utilisateur:', displayName);
        resetActivityTimer(displayName);
        return sockets.get(displayName);
    }

    if (!displayName) {
        console.error('Nom d\'utilisateur non trouvé');
        return null;
    }

    const socket = io('https://localhost:8080', {
        transports: ['websocket'],
        path: '/c_socket.io',
        query: { username: displayName }
    });

    socket.displayName = displayName;

    socket.on('connect', () => {
        console.log(`Connected to chat server for ${displayName}`);
        console.log(`Socket ID: ${socket.id}`);
        socket.emit('register', displayName);
        resetActivityTimer(displayName);
    });

    socket.on('disconnect', () => {
        console.log(`Disconnected from chat server for ${displayName}`);
        sockets.delete(displayName);
        clearActivityTimer(displayName);
        updateOnlineStatus(displayName, false);
    });

    socket.on('connect_error', (error) => {
        console.error(`Connection error for ${displayName}:`, error);
    });

    socket.on('friend_request_received', (data) => {
        console.log('Friend request received:', data);
        showFriendRequestToast(data.from, data.requestId);
    });

    socket.on('friend_request_updated', (data) => {
        console.log('Friend request updated:', data);
        const message = data.response === 'accepted' 
            ? `${data.from} a accepté votre demande d'ami!` 
            : `${data.from} a refusé votre demande d'ami.`;
        showToast(message, data.response === 'accepted' ? 'success' : 'info');
        fetchAndDisplayFriends(); // Rafraîchir la liste des amis
    });

    sockets.set(displayName, socket);
    console.log(`Socket: ${socket.id} linked to ${displayName}`);
    resetActivityTimer(displayName);
    return socket;
}

function resetActivityTimer(username) {
    clearActivityTimer(username);
    activityTimers.set(username, setTimeout(() => {
        console.log(`Inactivity detected for ${username}`);
        updateOnlineStatus(username, false);
    }, 120000)); // 2 minutes
}

function clearActivityTimer(username) {
    if (activityTimers.has(username)) {
        clearTimeout(activityTimers.get(username));
        activityTimers.delete(username);
    }
}

export async function updateOnlineStatus(username, isOnline) {
    try {
        const response = await fetchWithToken('/api/update-online-status/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                is_online: isOnline,
                display_name: username 
            }),
        });
        if (!response.ok) {
            throw new Error('Error updating online status');
        }
        console.log(`Online status updated for ${username}: ${isOnline}`);
    } catch (error) {
        console.error('Error updating online status:', error);
    }
}

export function getSocket(username) {
    resetActivityTimer(username);
    return sockets.get(username);
}

export function disconnectSocket(username) {
    const socket = sockets.get(username);
    if (socket) {
        socket.disconnect();
        sockets.delete(username);
    }
}

export function sendFriendRequestSocket(to, requestId) {
    const username = sessionStorage.getItem('display_name');
    const socket = getSocket(username);
    if (socket) {
        socket.emit('friend_request', {
            from: username,
            to: to,
            requestId: requestId
        });
    }
}

export function sendFriendRequestResponse(to, response, requestId) {
    const username = sessionStorage.getItem('display_name');
    const socket = getSocket(username);
    if (socket) {
        socket.emit('friend_request_response', {
            from: to,
            to: username,
            response: response,
            requestId: requestId
        });
    }
}

function showFriendRequestToast(fromUsername, requestId) {
    const toastHtml = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header" style="background-color: #FFD700;">
                <strong class="me-auto" style="color: #ff5722; background-color: white;">Friend Request</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                <p>Friend request received from ${fromUsername}</p>
                <button class="btn btn-primary" onclick="acceptFriendRequest('${requestId}')">Accept</button>
                <button class="btn btn-secondary" onclick="rejectFriendRequest('${requestId}')">Reject</button>
            </div>
        </div>
    `;
    document.body.innerHTML += toastHtml;
}

export function isSocketConnected(displayName) {
    const socket = sockets.get(displayName);
    return socket && socket.connected;
}
