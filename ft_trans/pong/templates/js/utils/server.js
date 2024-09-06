node_server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Permet toutes les origines, à ajuster selon vos besoins
        methods: ["GET", "POST"]
    }
});

// Utiliser le middleware CORS
app.use(cors());

app.get('/', (req, res) => {
    res.send('Socket.io server is running');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected'); 
    });
    socket.on('chat_message', (msg) => {
        io.emit('chat_message', msg);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
