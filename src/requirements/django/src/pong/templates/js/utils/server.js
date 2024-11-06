const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fetch = require('node-fetch');

const userConnections = new Map();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Fonction pour formater la date
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `{[${day}/${month}/${year} ${hours}:${minutes}:${seconds}]}`;
}

// Utiliser le middleware CORS
app.use(cors());

app.get('/', (req, res) => {
    res.send('Socket.io server is running');
});

const users = new Map();

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté:', socket.id);

    socket.on('register', (displayName) => {
        if (displayName) {
            userConnections.set(displayName, { socketId: socket.id, lastActivity: Date.now() });
            if (!users.has(displayName)) {
                socket.displayName = displayName;
                users.set(displayName, socket.id);
                console.log(`${formatDate(new Date())} Utilisateur enregistré: ${displayName}`);
            } else {
                console.log(`${formatDate(new Date())} L'utilisateur ${displayName} est déjà connecté`);
                // Déconnecter l'ancien socket si nécessaire
                const existingSocketId = users.get(displayName);
                const existingSocket = io.sockets.sockets.get(existingSocketId);
                if (existingSocket) {
                    existingSocket.disconnect();
                }
                socket.displayName = displayName;
                users.set(displayName, socket.id);
                console.log(`${formatDate(new Date())} Utilisateur ${displayName} reconnecté avec le nouveau socket ${socket.id}`);
            }
        } else {
            console.error(`${formatDate(new Date())} Tentative d'enregistrement avec un nom d'utilisateur invalide`);
        }
    });

    socket.on('chat message', (msg) => {
        console.log(`${formatDate(new Date())} Message reçu de ${msg.name}: ${msg.message}`);
        io.emit('chat message', msg);
        updateLastActivity(msg.name);
    });

    socket.on('private message', ({ to, message }) => {
        console.log(`${formatDate(new Date())} Message privé de ${socket.displayName} à ${to}: ${message}`);
        const recipientSocketId = users.get(to);
        if (recipientSocketId) {
            // Envoyer le message au destinataire ET à l'expéditeur
            io.to(recipientSocketId).emit('private message', {
                from: socket.displayName,
                message: message,
                time: Date.now()
            });
            
            // Envoyer une confirmation à l'expéditeur
            socket.emit('private message', {
                from: socket.displayName,
                message: message,
                time: Date.now(),
                isSelf: true
            });
            
            console.log(`${formatDate(new Date())} Message privé envoyé à ${to} via socket ${recipientSocketId}`);
        } else {
            socket.emit('error', { message: `${to} n'est pas en ligne.` });
            console.log(`${formatDate(new Date())} Tentative d'envoi à ${to} mais l'utilisateur n'est pas en ligne.`);
        }
    });

    // Gestion des erreurs globales
    socket.on('error', (data) => {
        console.error('Erreur serveur:', data.message);
    });

    socket.on('disconnect', async () => {
        console.log(`${formatDate(new Date())} Un utilisateur s'est déconnecté: ${socket.id}`);
        const username = [...userConnections.entries()].find(([_, value]) => value.socketId === socket.id)?.[0];
        if (username) {
            userConnections.delete(username);
            users.delete(username);
            io.emit('user_disconnected', username);

            console.log(`try to update online status to false of ${username}`);
            try {
                const response = await fetch('http://web:8000/api/update-online-status/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        is_online: false,
                        display_name: username
                    })
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                console.log(`${formatDate(new Date())} Statut mis à jour pour ${username}: offline`);
            } catch (error) {
                console.error(`${formatDate(new Date())} Erreur lors de la mise à jour du statut pour ${username}:`, error.message);
            }
        }
    });

    // Ajouter ces nouveaux événements
    socket.on('friend_request', (data) => {
        console.log(`${formatDate(new Date())} Demande d'ami de ${data.from} à ${data.to}`);
        const recipientSocketId = users.get(data.to);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('friend_request_received', {
                from: data.from,
                requestId: data.requestId
            });
        }
    });

    socket.on('friend_request_response', (data) => {
        console.log(`${formatDate(new Date())} Réponse à la demande d'ami: ${data.response} de ${data.to} à ${data.from}`);
        const senderSocketId = users.get(data.from);
        if (senderSocketId) {
            io.to(senderSocketId).emit('friend_request_updated', {
                from: data.to,
                response: data.response
            });
        }
    });
});

function updateLastActivity(username) {
    if (userConnections.has(username)) {
        userConnections.get(username).lastActivity = Date.now();
    }
}

// Vérifier l'inactivité toutes les minutes
setInterval(() => {
    console.log('Vérification de l\'inactivité');
    const now = Date.now();
    userConnections.forEach((value, username) => {
        if (now - value.lastActivity > 120000) { // 2 minutes
            const socket = io.sockets.sockets.get(value.socketId);
            if (socket) {
                socket.disconnect(true);
            }
            console.log(`${formatDate(new Date())} Déconnexion de l'utilisateur ${username} pour inactivité`);
            userConnections.delete(username);
            io.emit('user_disconnected', username);
            console.log(`${formatDate(new Date())} Mise à jour du statut de ${username} à offline`);
        }
    });
}, 60000); // Vérifier chaque minute

server.listen(3000, () => {
    console.log(`${formatDate(new Date())} Serveur en écoute sur le port 3000`);
});
