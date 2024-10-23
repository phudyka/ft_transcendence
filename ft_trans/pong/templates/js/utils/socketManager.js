import { fetchWithToken } from './api.js';

let sockets = new Map();
let activityTimers = new Map();

export function initializeSocket(username) {
    if (sockets.has(username) && sockets.get(username).connected) {
        console.log('Socket déjà initialisé pour cet utilisateur');
        resetActivityTimer(username);
        return sockets.get(username);
    }

    if (!username) {
        console.error('Nom d\'utilisateur non trouvé');
        return null;
    }

    const socket = io('http://localhost:3000', {
        transports: ['websocket'],
        query: { username: username }
    });

    socket.username = username;

    socket.on('connect', () => {
        console.log(`Connected to chat server for ${username}`);
        socket.emit('register', username);
        resetActivityTimer(username);
    });

    socket.on('disconnect', () => {
        console.log(`Disconnected from chat server for ${username}`);
        sockets.delete(username);
        clearActivityTimer(username);
        updateOnlineStatus(username, false);
    });

    socket.on('connect_error', (error) => {
        console.error(`Connection error for ${username}:`, error);
    });

    sockets.set(username, socket);
    console.log(`Socket: ${socket} linked to ${username}`);
    resetActivityTimer(username);
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

async function updateOnlineStatus(username, isOnline) {
    try {
        const response = await fetchWithToken('/api/update-online-status/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_online: isOnline }),
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
