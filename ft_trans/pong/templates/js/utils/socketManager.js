let sockets = new Map();

export function initializeSocket(username) {
    if (sockets.has(username) && sockets.get(username).connected) {
        console.log('Socket déjà initialisé pour cet utilisateur');
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
        console.log(`Connecté au serveur de chat pour ${username}`);
        socket.emit('register', username);
    });

    socket.on('disconnect', () => {
        console.log(`Déconnecté du serveur de chat pour ${username}`);
        sockets.delete(username);
    });

    socket.on('connect_error', (error) => {
        console.error(`Erreur de connexion pour ${username}:`, error);
    });

    sockets.set(username, socket);
    return socket;
}

export function getSocket(username) {
    return sockets.get(username);
}

export function disconnectSocket(username) {
    const socket = sockets.get(username);
    if (socket) {
        socket.disconnect();
        sockets.delete(username);
    }
}
