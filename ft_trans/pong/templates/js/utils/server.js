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
    console.log('Un utilisateur s\'est connecté:', socket.id);

    socket.on('register', (username) => {
        if (username) {
            if (!users.has(username)) {
                socket.username = username;
                users.set(username, socket.id);
                console.log(`${formatDate(new Date())} Utilisateur enregistré: ${username}`);
            } else {
                console.log(`${formatDate(new Date())} L'utilisateur ${username} est déjà connecté`);
                // disconnect l'avant dernier socker
                const lastSocket = Array.from(userConnections.values()).pop();
                if (lastSocket) {
                    lastSocket.disconnect();
                }
            }
        } else {
            console.error(`${formatDate(new Date())} Tentative d'enregistrement avec un nom d'utilisateur invalide`);
        }
    });

    socket.on('chat message', (msg) => {
        console.log(`${formatDate(new Date())} Message reçu de ${msg.name}: ${msg.message}`);
        io.emit('chat message', msg);
    });

    socket.on('create private room', (data) => {
        const roomName = [socket.username, data.friend].sort().join('-');
        socket.join(roomName);
        const friendSocket = users.get(data.friend);
        if (friendSocket) {
            io.to(friendSocket).emit('private room created', { friend: socket.username });
        }
        socket.emit('private room created', { friend: data.friend });
        console.log(`${formatDate(new Date())} Salle privée créée : ${roomName}`);
    });

    socket.on('private message', ({ to, message }) => {
        const recipientSocket = users.get(to);
        if (recipientSocket) {
            const roomName = [socket.username, to].sort().join('-');
            console.log(`${formatDate(new Date())} Message privé de ${socket.username} à ${to} dans la salle ${roomName}: ${message}`);
            io.to(roomName).emit('private message', {
                from: socket.username,
                message: message
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`${formatDate(new Date())} Un utilisateur s'est déconnecté: ${socket.id}`);
        if (socket.username) {
            users.delete(socket.username);
        }
    });
});

server.listen(3000, () => {
    console.log(`${formatDate(new Date())} Serveur en écoute sur le port 3000`);
});
