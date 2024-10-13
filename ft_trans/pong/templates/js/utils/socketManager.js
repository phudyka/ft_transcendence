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

    socket.on('chat message', (msg) => {
        console.log('Message reçu:', msg);
        // Diffuser le message à tous les clients connectés, y compris l'expéditeur
        receiveMessage(msg);
        io.emit('chat message', msg);
    });

    socket.on('connect_error', (error) => {
        console.error('Erreur de connexion:', error);
    });

    socket.on('private message', (msg) => {
        console.log('Message privé reçu:', msg);
        // Ici, nous allons émettre un événement personnalisé que nous écouterons dans dashboard.js
        const event = new CustomEvent('privateMessage', { detail: msg });
        document.dispatchEvent(event);
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
