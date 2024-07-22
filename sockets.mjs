import { Ball } from './ball.mjs';
import { Pad } from './pad.mjs';
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
            // Cleanup rooms and pads
            for (const [room, players] of Object.entries(rooms)) {
                if (players.includes(socket.id)) {
                    rooms[room] = players.filter(id => id !== socket.id);
                    if (rooms[room].length === 0) {
                        delete rooms[room];
                        delete roomsTypes[room];
                        padsMap.delete(room);
                        console.log('Room removed:', room);
                    }
                    break;
                }
            }
        });

        socket.on('solo', () => {
            const room = `room-${roomCounter++}`;
            rooms[room] = [socket.id];
            roomsTypes[room] = 'solo';
            socket.join(room);

            io.in(room).emit('start-game', rooms[room]);
            console.log(`Starting solo game in ${room}`);

            setupSoloGame(io, room, socket, rooms, roomsTypes);
        });

        socket.on('multi', () => {
            let room = Object.keys(rooms).find(r => rooms[r].length === 1 && roomsTypes[r] === 'multi');

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
                console.log(`Starting multi-game in ${room}`);

                const ball = new Ball(0.07, 32);
                const { pad1, pad2 } = padsMap.get(room);

                io.in(room).emit('initBall', {
                    position: { x: ball.mesh.position.x, y: ball.mesh.position.y },
                    direction: { x: ball.direction.x, y: ball.direction.y },
                    speed: ball.speed,
                });

                setupMultiGame(io, room, ball, pad1, pad2);
            }
        });

        socket.on('multi-four', () => {
            let room = Object.keys(rooms).find(r => rooms[r].length < 4 && roomsTypes[r] === 'multi_four');

            if (!room) {
                room = `room-${roomCounter++}`;
                rooms[room] = [];
                roomsTypes[room] = 'multi_four';
            }

            rooms[room].push(socket.id);
            socket.join(room);

            if (rooms[room].length === 1) {
                const pad1 = new Pad(0xc4d418);
                const pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 0.5, 0, 0);
                const pad3 = new Pad(0xfa00ff, 0.045, 0.50, 16, -0.5, 0, 0);
                const pad4 = new Pad(0xfa00ff, 0.045, 0.50, 16, 0, 0, 0);
                padsMap.set(room, { pad1, pad2, pad3, pad4 });
            }

            socket.on('movePad', (data) => {
                const pads = padsMap.get(room);
                if (pads) {
                    const padKey = `pad${data.pad}`;
                    if (pads[padKey]) {
                        pads[padKey].mesh.position.y = data.position;
                        io.in(room).emit('movePad', {
                            pad1: pads.pad1.mesh.position.y,
                            pad2: pads.pad2.mesh.position.y,
                            pad3: pads.pad3.mesh.position.y,
                            pad4: pads.pad4.mesh.position.y
                        });
                    }
                }
            });

            console.log(`Player ${socket.id} joined ${room}`);

            if (rooms[room].length === 4) {
                io.in(room).emit('start-game', rooms[room]);
                console.log(`Starting four-player game in ${room}`);

                const ball = new Ball(0.07, 32);
                const { pad1, pad2, pad3, pad4 } = padsMap.get(room);

                io.in(room).emit('initBall', {
                    position: { x: ball.mesh.position.x, y: ball.mesh.position.y },
                    direction: { x: ball.direction.x, y: ball.direction.y },
                    speed: ball.speed,
                });

                setupMultiGameFour(io, room, ball, pad1, pad2, pad3, pad4);
            }
        });
    });
}
