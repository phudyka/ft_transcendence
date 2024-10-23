const express = require('express');
const https = require('https');
const socketIo = require('socket.io');
const fs = require('fs');
const cors = require('cors');

const options = {
    key: fs.readFileSync('/app/ssl_certificates/chat_api.key'),
    cert: fs.readFileSync('/app/ssl_certificates/chat_api.crt')
};

const userConnections = new Map();

const app = express();
const server = https.createServer(options, app);
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
        if (username && !users.has(username)) {
            socket.username = username;
            users.set(username, socket.id);
            console.log('Utilisateur enregistré:', username);
        } else if (users.has(username)) {
            console.log('Utilisateur déjà enregistré:', username);
        } else {
            console.error('Tentative d\'enregistrement avec un nom d\'utilisateur invalide');
        }
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

server.listen(443, () => {
    console.log(`${formatDate(new Date())} Serveur en écoute sur le port 443`);
});
