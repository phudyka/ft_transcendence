import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Ball } from './ball.mjs';
import { Pad } from './pad.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

app.get('/main.mjs', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'main.mjs'));
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get("/main.html", (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

const rooms = {};
let roomCounter = 1;

const tableHeight = 2;
const tableWidth = 4.10;

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (let room in rooms) {
            if (rooms[room].includes(socket.id)) {
                rooms[room] = rooms[room].filter(id => id !== socket.id);
                if (rooms[room].length === 1) {
                    delete rooms[room];
                }
                break;
            }
        }
    });
    // si le joueur choisi multijoueur soit il rejoint une room deja creee
    // avec deja un joueur en attente, soit une nouvelle room est creee.
    socket.on('multi', () => {
        let room = null;

        for (let r in rooms) {
            if (rooms[r].length === 1) {
                room = r;
                break;
            }
        }

        if (!room) {
            room = `room-${roomCounter++}`;
            rooms[room] = [];
        }

        rooms[room].push(socket.id);
        socket.join(room);

        console.log(`Player ${socket.id} joined ${room}`);
        // Si 2 joueurs sont dans la room, la partie ce lance.
        if (rooms[room].length === 2) {
            io.in(room).emit('start-game', room);
            console.log(`Starting game in ${room}`);

            const ball = new Ball(0.07, 32);
            const pad1 = new Pad(0xc4d418);
            const pad2 = new Pad(0xfa00ff, 0.05, 0.3, 0.2, 1.85, 0, 0);

            const gameState = {
                ball,
                pad1,
                pad2,
                room,
            };

            io.in(room).emit('initBall', {
                position: { x: ball.mesh.position.x, y: ball.mesh.position.y },
                direction: { x: ball.direction.x, y: ball.direction.y },
                speed: ball.speed,
            });

            socket.on('movePad', (data) => {
                if (data.pad === 1) {
                    pad1.mesh.position.y = data.position;
                } else if (data.pad === 2) {
                    pad2.mesh.position.y = data.position;
                }
                io.in(room).emit('movePad', { pad1: pad1.mesh.position.y, pad2: pad2.mesh.position.y });
            });

            function checkWallCollision() {
                if (ball.mesh.position.y + ball.direction.y * ball.speed > tableHeight / 2 - ball.radius || ball.mesh.position.y + ball.direction.y * ball.speed < -tableHeight / 2 + ball.radius) {
                    ball.direction.y *= -1;
                    ball.collided = true;
                }

                if (ball.mesh.position.x > tableWidth / 2 + ball.radius || ball.mesh.position.x < -tableWidth / 2 - ball.radius) {
                    ball.resetPosition();
                    ball.collided = true;
                }
            }

            function updateBallPosition() {
                ball.updatePosition();
                checkWallCollision();
                ball.checkCollision(pad1);
                ball.checkCollision(pad2);
                io.in(room).emit('moveBall', {
                    position: { x: ball.mesh.position.x, y: ball.mesh.position.y },
                    direction: { x: ball.direction.x, y: ball.direction.y },
                    speed: ball.speed,
                });
            }

            const interval = setInterval(updateBallPosition, 16);

            socket.on('disconnect', () => {
                clearInterval(interval);
                if (rooms[room]) {
                    rooms[room] = rooms[room].filter(id => id !== socket.id);
                    if (rooms[room].length === 1) {
                        delete rooms[room];
                        console.log(`Clearing game in ${room}`);
                    }
                }
            });
        }
    });
});

server.listen(3000, () => {
    console.log('Ecoute sur le port 3000');
});
