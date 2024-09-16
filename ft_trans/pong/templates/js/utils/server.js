const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');


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
    console.log(`${formatDate(new Date())} Un utilisateur s'est connecté: ${socket.id}`);

    const { username, browserSessionId } = socket.handshake.query;

    if (userConnections.has(username)) {
        const existingConnection = userConnections.get(username);
        if (existingConnection.browserSessionId !== browserSessionId) {
            socket.emit('connection_limit_reached');
            socket.disconnect(true);
            return;
        }
    }

    userConnections.set(username, { socketId: socket.id, browserSessionId });

    socket.on('register', (userId) => {
        users.set(userId, socket.id);
        console.log(`${formatDate(new Date())} Utilisateur enregistré: ${userId}`);
    });

    socket.on('chat message', (msg) => {
        console.log(`${formatDate(new Date())} Message reçu de ${msg.name}: ${msg.message}`);
        io.emit('chat message', msg); // Émet à tous les clients, y compris l'expéditeur
    });

    socket.on('private message', ({ to, message }) => {
        const recipientSocket = users.get(to);
        if (recipientSocket) {
            console.log(`${formatDate(new Date())} Message privé de ${socket.id} à ${to}: ${message}`);
            io.to(recipientSocket).emit('private message', {
                from: socket.id,
                message: message
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`${formatDate(new Date())} Un utilisateur s'est déconnecté: ${socket.id}`);
        users.forEach((value, key) => {
            if (value === socket.id) {
                users.delete(key);
            }
        });
        userConnections.forEach((value, key) => {
            if (value.socketId === socket.id) {
                userConnections.delete(key);
            }
        });
    });
});

server.listen(3000, () => {
    console.log(`${formatDate(new Date())} Serveur en écoute sur le port 3000`);
});
