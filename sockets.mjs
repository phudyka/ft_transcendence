import { Ball } from './ball.mjs';
import { Pad } from './pad.mjs';
import { tableHeight, tableWidth } from './config.mjs';
import { setupSoloGame, setupMultiGame, setupMultiGameFour } from './game.mjs';

const rooms = {};
const roomsTypes = {};
let roomCounter = 1;
const padsMap = new Map();

export default function setupSockets(io) {
    io.on('connection', (socket) => {
        console.log('New user connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });

        socket.on('solo', () => {
            let room = `room-${roomCounter++}`;
            rooms[room] = [];
            roomsTypes[room] = 'solo';
            rooms[room].push(socket.id);
            socket.join(room);

            io.in(room).emit('start-game', rooms[room]);
            console.log(`Starting game in ${room}`);

            setupSoloGame(io, room, socket, rooms, roomsTypes);
        });

        socket.on('multi', () => {
            let interval = null;

            socket.on('disconnect', () => {
                clearInterval(interval);
                console.log('client disconnected!');
                if (rooms[room]) {
                    rooms[room] = rooms[room].filter(id => id !== socket.id);
                    if (rooms[room].length === 1 && roomsTypes[room] === 'multi') {
                        io.in(room).socketsLeave(room);
                        delete rooms[room];
                        delete roomsTypes[room];
                        console.log('room removed');
                    }
                }
            });

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
                const pad2 = new Pad(0xb3261a, 0.045, 0.50, 16, 2.10, 0, 0);
                padsMap.set(room, { pad1, pad2 });
            }

            socket.on('movePad', (data) => {
                const { pad1, pad2 } = padsMap.get(room);
                if (data.pad === 1) {
                    pad1.mesh.position.y = data.position;
                } else if (data.pad === 2) {
                    pad2.mesh.position.y = data.position;
                }
                io.in(room).emit('movePad', {
                    pad1: pad1.mesh.position.y,
                    pad2: pad2.mesh.position.y
                });
            });

            console.log(`Player ${socket.id} joined ${room}`);

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

                setupMultiGame(io, room, ball, pad1, pad2, interval);
            }
        });

        socket.on('multi-four', () => {
            let interval = null;

            socket.on('disconnect', () => {
                clearInterval(interval);
                console.log('client disconnected!');
                if (rooms[room]) {
                    rooms[room] = rooms[room].filter(id => id !== socket.id);
                    if (rooms[room].length === 3 && roomsTypes[room] === 'multi_four') {
                        io.in(room).socketsLeave(room);
                        delete rooms[room];
                        delete roomsTypes[room];
                        console.log('room removed');
                    }
                }
            });

            let room = null;

            for (let r in rooms) {
                if (rooms[r].length < 4 && roomsTypes[r] === 'multi_four') {
                    room = r;
                    break;
                }
            }

            if (!room) {
                room = `room-${roomCounter++}`;
                rooms[room] = [];
                roomsTypes[room] = 'multi_four';
            }

            rooms[room].push(socket.id);
            socket.join(room);

            if (rooms[room].length === 1) {
                const pad1 = new Pad(0xc4d418);
                const pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 2.10, 0, 0);
                const pad3 = new Pad(0xfa00ff, 0.045, 0.50, 16, -0.5, 0, 0);
                const pad4 = new Pad(0xfa00ff, 0.045, 0.50, 16, 0.5, 0, 0);
                padsMap.set(room, { pad1, pad2, pad3, pad4 });
            }

            socket.on('movePad', (data) => {
                const { pad1, pad2, pad3, pad4 } = padsMap.get(room);
                if (data.pad === 1) {
                    pad1.mesh.position.y = data.position;
                } else if (data.pad === 2) {
                    pad2.mesh.position.y = data.position;
                } else if (data.pad === 3) {
                    pad3.mesh.position.y = data.position;
                } else if (data.pad === 4) {
                    pad4.mesh.position.y = data.position;
                }
                io.in(room).emit('movePad', {
                    pad1: pad1.mesh.position.y,
                    pad2: pad2.mesh.position.y,
                    pad3: pad3.mesh.position.y,
                    pad4: pad4.mesh.position.y
                });
            });

            console.log(`Player ${socket.id} joined ${room}`);

            if (rooms[room].length === 4) {
                io.in(room).emit('start-game', rooms[room]);
                console.log(`Starting game in ${room}`);

                const ball = new Ball(0.07, 32);
                const { pad1, pad2, pad3, pad4 } = padsMap.get(room);

                io.in(room).emit('initBall', {
                    position: { x: ball.mesh.position.x, y: ball.mesh.position.y },
                    direction: { x: ball.direction.x, y: ball.direction.y },
                    speed: ball.speed,
                });

                setupMultiGameFour(io, room, ball, pad1, pad2, pad3, pad4, interval);
            }
        });
    });
}
