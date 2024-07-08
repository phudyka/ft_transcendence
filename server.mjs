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

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

const rooms = {};
const roomsTypes = {};
let roomCounter = 1;

const padsMap = new Map();

const tableHeight = 2.70;
const tableWidth = 4.70;

function initializePads(room) {
    const pad1 = new Pad(0xc4d418);
    const pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 2.10, 0, 0);
    padsMap.set(room, { pad1, pad2 });
}

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (let room in rooms) {
            if (rooms[room].includes(socket.id)) {
                rooms[room] = rooms[room].filter(id => id !== socket.id);
                if (rooms[room].length === 1 && roomsTypes[room] === 'multi') {
                    delete rooms[room];
                    delete roomsTypes[room];
                    roomCounter--;
                }
                else if (rooms[room].length === 0 && roomsTypes[room] === 'solo'){
                    delete rooms[room];
                    delete roomsTypes[room];
                    roomCounter--;
                }
                break;
            }
        }
    });
    // Si le joueur click sur solo, une nouvelle room est cree et la partie 
    // ce lance contre l'IA
    socket.on('solo', () => {
        let room = null;

        room = `room-${roomCounter++}`;
        rooms[room] = [];
        roomsTypes[room] = 'solo';
        rooms[room].push(socket.id);
        socket.join(room);

        io.in(room).emit('start-game', rooms[room]);
            console.log(`Starting game in ${room}`);

            const ball = new Ball(0.07, 32);
            const pad1 = new Pad(0xc4d418);
            const pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 2.10, 0, 0)

            io.in(room).emit('initBall', {
                position: { x: ball.mesh.position.x, y: ball.mesh.position.y },
                direction: { x: ball.direction.x, y: ball.direction.y },
                speed: ball.speed,
            });

            socket.on('movePad', (data) => {
                if (data.pad === 1) {
                    pad1.mesh.position.y = data.position;
                } 
                io.in(room).emit('movePad', { pad1: pad1.mesh.position.y, pad2: pad2.mesh.position.y });
            });

            function IApad(pad2) {
                const speed = 0.1;
                const impreciseSpeed = 0.03;
                const padHeight = 0.5;
                const pad2Limit = tableHeight / 2 - padHeight / 2;
                const padPosition = pad2.mesh.position.clone();
                const ballPosition = ball.mesh.position.clone();
            
                const distance = ballPosition.distanceTo(padPosition);
            
                if (distance < 1.50) {

                    const deltaY = ballPosition.y - padPosition.y;
                    let newY = padPosition.y + deltaY * speed;
            
                    if (newY > pad2Limit) {
                        newY = pad2Limit;
                    } else if (newY < -pad2Limit) {
                        newY = -pad2Limit;
                    }
            
                    pad2.mesh.position.y = newY;
                } else {
                    const imprecise = (Math.random() - 0.5) * 0.4;
                    const targetPosition = ballPosition.y + imprecise;
                    const deltaY = targetPosition - padPosition.y;
                    let newY = padPosition.y + deltaY * impreciseSpeed;
            
                    if (newY > pad2Limit) {
                        newY = pad2Limit;
                    } else if (newY < -pad2Limit) {
                        newY = -pad2Limit;
                    }
                    pad2.mesh.position.y = newY;
                }
            }
            
            function checkWallCollision() {
                if (ball.mesh.position.y + ball.direction.y * ball.speed > tableHeight / 2 - ball.radius - 0.02) {
                    ball.direction.y *= -1;
                    ball.mesh.position.y = tableHeight / 2 - ball.radius - 0.02;
                }
                else if (ball.mesh.position.y + ball.direction.y * ball.speed < -tableHeight / 2 + ball.radius + 0.02) {
                    ball.direction.y *= -1;
                    ball.mesh.position.y = -tableHeight / 2 + ball.radius + 0.02;
                }
            
                if (ball.mesh.position.x > tableWidth / 2 + ball.radius) {
                    ball.resetPosition();
                    pad2.score++
                    io.in(room).emit('updateScores', { score1: pad1.score, score2: pad2.score });
                }
                if (ball.mesh.position.x < -tableWidth / 2 - ball.radius) {
                    ball.resetPosition();
                    pad1.score++
                    io.in(room).emit('updateScores', { score1: pad1.score, score2: pad2.score });
                }
            }
            

            function updateBallPosition() {
                IApad(pad2);
                ball.updatePosition();
                checkWallCollision();
                ball.checkCollision(pad1);
                ball.checkCollision(pad2);
                io.in(room).emit('moveBall', {
                    position: { x: ball.mesh.position.x, y: ball.mesh.position.y },
                    direction: { x: ball.direction.x, y: ball.direction.y },
                    speed: ball.speed,
                });
                io.in(room).emit('movePad', { pad1: pad1.mesh.position.y, pad2: pad2.mesh.position.y });
            }

            const interval = setInterval(updateBallPosition, 16);

            socket.on('disconnect', () => {
                clearInterval(interval);
                if (rooms[room]) {
                    rooms[room] = rooms[room].filter(id => id !== socket.id);
                    if (rooms[room].length === 0 && roomsTypes[room] === 'solo'){
                        delete rooms[room];
                        delete roomsTypes[room];
                        roomCounter--;
                    }
                }
            });
    });
    // si le joueur choisi multijoueur soit il rejoint une room deja creee
    // avec deja un joueur en attente, soit une nouvelle room est creee.
    socket.on('multi', () => {
        let room = null;

        for (let r in rooms) {
            if (rooms[r].length === 1 && roomsTypes[r] === 'multi') {
                room = r;
                break;
            }
        }

        if (!room) {
            room = `room-${roomCounter++}`;
            rooms[room] = [];
            roomsTypes[room] = 'multi';
        }

        rooms[room].push(socket.id);
        socket.join(room);

        if (rooms[room].length === 1) {
            const pad1 = new Pad(0xc4d418);
            const pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 2.10, 0, 0);
            padsMap.set(room, { pad1, pad2 });
        }
    
        socket.on('movePad', (data) => {
            const { pad1, pad2 } = padsMap.get(room);
            console.log(data);
            if (data.pad === 1) {
                pad1.mesh.position.y = data.position;
                console.log('reception emitting pad1');
            } else if (data.pad === 2) {
                pad2.mesh.position.y = data.position;
                console.log('reception emitting pad2');
            }
            io.in(room).emit('movePad',  {
                pad1: pad1.mesh.position.y,
                pad2: pad2.mesh.position.y
            });
        });

        console.log(`Player ${socket.id} joined ${room}`);
        // Si 2 joueurs sont dans la room, la partie ce lance.
        if (rooms[room].length === 2) {

            io.in(room).emit('start-game', rooms[room]);
            console.log(`Starting game in ${room}`);

            const ball = new Ball(0.07, 32);
            const { pad1, pad2 } = padsMap.get(room);

            io.in(room).emit('initBall', {
                position: { x: ball.mesh.position.x, y: ball.mesh.position.y },
                direction: { x: ball.direction.x, y: ball.direction.y },
                speed: ball.speed,
            });
            
            socket.on('movePad', (data) => {
                console.log(data);
                if (data.pad === 1) {
                    pad1.mesh.position.y = data.position;
                    console.log('reception emitting pad1');
                } else if (data.pad === 2) {
                    pad2.mesh.position.y = data.position;
                    console.log('reception emitting pad2');
                }
                io.in(room).emit('movePad',  {
                    pad1: pad1.mesh.position.y,
                    pad2: pad2.mesh.position.y
                });
            });

            function checkWallCollision() {
                if (ball.mesh.position.y + ball.direction.y * ball.speed > tableHeight / 2 - ball.radius - 0.02) {
                    ball.direction.y *= -1;
                    ball.mesh.position.y = tableHeight / 2 - ball.radius - 0.02;
                }
                else if (ball.mesh.position.y + ball.direction.y * ball.speed < -tableHeight / 2 + ball.radius + 0.02) {
                    ball.direction.y *= -1;
                    ball.mesh.position.y = -tableHeight / 2 + ball.radius + 0.02;
                }
            
                if (ball.mesh.position.x > tableWidth / 2 + ball.radius) {
                    ball.resetPosition();
                    pad2.score++
                    io.in(room).emit('updateScores', { score1: pad1.score, score2: pad2.score });
                }
                if (ball.mesh.position.x < -tableWidth / 2 - ball.radius) {
                    ball.resetPosition();
                    pad1.score++
                    io.in(room).emit('updateScores', { score1: pad1.score, score2: pad2.score });
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
                    if (rooms[room].length === 1 && roomsTypes[room] === 'multi') {
                        delete rooms[room];
                        delete roomsTypes[room];
                        roomCounter--;
                    }
                }
            });
        }
    });
});

server.listen(3000, () => {
    console.log('Ecoute sur le port 3000');
});
