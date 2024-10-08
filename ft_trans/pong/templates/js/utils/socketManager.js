let socket;

export function initializeSocket(username) {
    if (socket) {
        socket.disconnect();
    }

    if (!username) {
        console.error('Nom d\'utilisateur non trouvé');
        return null;
    }

    socket = io('http://localhost:3000', {
        transports: ['websocket'],
        query: {
            username: username,
        }
    });

    socket.on('connect', () => {
        console.log('Connecté au serveur de chat');
        socket.emit('register', username);
    });

    socket.on('disconnect', () => {
        console.log('Déconnecté du serveur de chat');
    });

    socket.on('connect_error', (error) => {
        console.error('Erreur de connexion:', error);
    });

    return socket;
}

export function getSocket() {
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
