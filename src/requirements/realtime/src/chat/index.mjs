// Chat : messages publics, messages privés, notifications d'amitié et présence.
//
// Converti en ESM et branché sur un namespace au lieu de son propre serveur.
// Changement de fond : l'identité ne vient plus de ce que le client annonce
// mais du JWT vérifié au handshake (`socket.data.user`). Auparavant un
// `register` suffisait à se faire passer pour n'importe qui — donc à lire ses
// messages privés et à émettre en son nom.

const DJANGO_API = process.env.DJANGO_API_URL || 'http://django:8000';

const userConnections = new Map(); // displayName -> { socketId, lastActivity }
const userTokens = new Map();      // displayName -> jeton, pour appeler l'API
const users = new Map();           // displayName -> socketId

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `[${day}/${month}/${year} ${hours}:${minutes}:${seconds}]`;
}

const stamp = () => formatDate(new Date());

export default function setupChat(nsp) {
    nsp.on('connection', (socket) => {
        // Identité issue du jeton, pas du client.
        const username = socket.data.user.displayName;
        socket.username = username;
        console.log(`${stamp()} Connecté au chat : ${username} (${socket.id})`);

        socket.on('register', () => {
            const existing = userConnections.get(username);
            if (existing && existing.socketId !== socket.id) {
                const previous = nsp.sockets.get(existing.socketId);
                if (previous) {
                    console.log(`${stamp()} Déconnexion de l'ancienne session de ${username}`);
                    previous.emit('force_disconnect', {
                        message: 'Your account has been connected from another location'
                    });
                    previous.disconnect(true);
                }
            }

            userTokens.set(username, socket.data.token);
            userConnections.set(username, { socketId: socket.id, lastActivity: Date.now() });
            users.set(username, socket.id);
            console.log(`${stamp()} Utilisateur enregistré : ${username}`);

            socket.emit('registration_success', {
                message: 'Successfully connected to chat server'
            });
        });

        socket.on('chat message', (msg) => {
            // `name` est réécrit : le client pouvait signer sous n'importe quel nom.
            const message = { ...msg, name: username };
            console.log(`${stamp()} Message de ${username}: ${message.message}`);
            nsp.emit('chat message', message);
            updateLastActivity(username);
        });

        socket.on('private message', ({ to, message }) => {
            console.log(`${stamp()} Message privé de ${username} à ${to}`);
            const recipientSocketId = users.get(to);
            if (recipientSocketId) {
                nsp.to(recipientSocketId).emit('private message', {
                    from: username,
                    message,
                    time: Date.now()
                });

                socket.emit('private message', {
                    from: username,
                    message,
                    time: Date.now(),
                    isSelf: true
                });
            } else {
                socket.emit('error', { message: `${to} n'est pas en ligne.` });
                console.log(`${stamp()} ${to} n'est pas en ligne.`);
            }
            updateLastActivity(username);
        });

        socket.on('error', (data) => {
            console.error('Erreur serveur:', data?.message);
        });

        socket.on('friend_request', (data) => {
            console.log(`${stamp()} Demande d'ami de ${username} à ${data.to}`);
            const recipientSocketId = users.get(data.to);
            if (recipientSocketId) {
                nsp.to(recipientSocketId).emit('friend_request_received', {
                    from: username,
                    requestId: data.requestId
                });
            } else {
                console.log(`${stamp()} ${data.to} n'est pas en ligne.`);
            }
        });

        socket.on('friend_request_response', (data) => {
            // `data.from` désigne le demandeur d'origine ; l'expéditeur de la
            // réponse, lui, est celui du jeton.
            console.log(`${stamp()} Réponse de ${username} à ${data.from} : ${data.response}`);
            const senderSocketId = users.get(data.from);
            if (senderSocketId) {
                nsp.to(senderSocketId).emit('friend_request_updated', {
                    from: username,
                    response: data.response,
                    requestId: data.requestId
                });
            } else {
                console.log(`${stamp()} ${data.from} n'est pas en ligne.`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`${stamp()} Déconnexion : ${username} (${socket.id})`);
            // Ne rien effacer si une session plus récente a déjà repris la place.
            if (userConnections.get(username)?.socketId === socket.id) {
                userConnections.delete(username);
                users.delete(username);
                updateOnlineStatus(username, false);
            }
        });
    });
}

function updateLastActivity(username) {
    const connection = userConnections.get(username);
    if (connection) connection.lastActivity = Date.now();
}

async function updateOnlineStatus(username, isOnline) {
    const token = userTokens.get(username);
    if (!token) {
        console.log(`${stamp()} Pas de jeton pour ${username}, statut non mis à jour.`);
        return;
    }

    try {
        // `fetch` est natif depuis Node 18 : node-fetch et son agent HTTPS
        // sur mesure ne sont plus nécessaires. L'appel est en clair sur le
        // réseau interne, le TLS étant terminé par le proxy en amont.
        const response = await fetch(`${DJANGO_API}/api/update-online-status/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_online: isOnline, display_name: username })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        console.error(`${stamp()} Échec de mise à jour du statut de ${username}:`, error.message);
    }
}
