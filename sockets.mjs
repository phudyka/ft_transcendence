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

            for (let room in rooms) {
                if (rooms[room].includes(socket.id)) {
                    rooms[room] = rooms[room].filter(id => id !== socket.id);
                    console.log(`Player ${socket.id} left ${room}`);

                    if (rooms[room].length === 0 || (roomsTypes[room] === 'multi-2-online'
                        && rooms[room].length === 1) || (roomsTypes[room] === 'multi-four'
                            && rooms[room].length === 3)) {
                        io.in(room).socketsLeave(room);
                        delete rooms[room];
                        delete roomsTypes[room];
                        padsMap.delete(room);
                        console.log(`Room ${room} has been removed`);
                    } else if (rooms[room].length === 1 && roomsTypes[room] === 'multi-2-online') {
                        io.to(rooms[room][0]).emit('gameOver', { winner: rooms[room][0] });
                    }

                    break;
                }
            }
        });


        socket.on('solo_vs_ia', () => {
            let room = `room-${roomCounter++}`;
            rooms[room] = [socket.id];
            roomsTypes[room] = 'solo_vs_ia';
            socket.join(room);

            io.in(room).emit('start-game', rooms[room], roomsTypes[room]);
            console.log(`Starting game in ${room}`);

            setupSoloGame(io, room, socket, rooms, roomsTypes[room]);
        });

        socket.on('multi-2-local', () => {
            let room = `room-${roomCounter++}`;
            rooms[room] = [socket.id];
            roomsTypes[room] = 'multi-2-local';
            socket.join(room);

            io.in(room).emit('start-game', rooms[room], roomsTypes[room]);
            console.log(`Starting game in ${room}`);

            setupSoloGame(io, room, socket, rooms, roomsTypes[room]);
        });

        socket.on('multi-2-online', () => {
            let room = findOrCreateRoom(socket, 'multi-2-online');
            rooms[room].push(socket.id);
            socket.join(room);

            if (rooms[room].length === 1) {
                const pad1 = new Pad(0xc4d418, 0.045, 0.50, 16, -2.13, 3.59, 0);
                const pad2 = new Pad(0xb3261a, 0.045, 0.50, 16, 2.10, 3.59, 0);
                padsMap.set(room, { pad1, pad2 });
            }

            socket.on('movePad', (data) => {
                const { pad1, pad2 } = padsMap.get(room);
                if (data.pad === 1) {
                    pad1.mesh.position.z = data.position;
                } else if (data.pad === 2) {
                    pad2.mesh.position.z = data.position;
                }
                io.in(room).emit('movePad', {
                    pad1: pad1.mesh.position.z,
                    pad2: pad2.mesh.position.z
                });
            });

            console.log(`Player ${socket.id} joined ${room}`);

            if (rooms[room].length === 2) {
                io.in(room).emit('start-game', rooms[room]);
                console.log(`Starting game in ${room}`);

                const ball = new Ball(0.07, 32);
                const { pad1, pad2 } = padsMap.get(room);

                io.in(room).emit('initBall', {
                    position: { x: ball.mesh.position.x, z: ball.mesh.position.z },
                    direction: { x: ball.direction.x, z: ball.direction.z },
                    speed: ball.speed,
                });

                setupMultiGame(io, room, ball, pad1, pad2);
            }
        });

        socket.on('multi-four', () => {
            let room = findOrCreateRoom(socket, 'multi-four');
            rooms[room].push(socket.id);
            socket.join(room);

            if (rooms[room].length === 1) {
                const pad1 = new Pad(0xc4d418, 0.045, 0.50, 16, -2.13, 3.59, 0);
                const pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 2.10, 3.59, 0);
                const pad3 = new Pad(0xfa00ff, 0.045, 0.50, 16, -0.5, 3.59, 0);
                const pad4 = new Pad(0xfa00ff, 0.045, 0.50, 16, 0.5, 3.59, 0);
                padsMap.set(room, { pad1, pad2, pad3, pad4 });
            }

            socket.on('movePad', (data) => {
                const { pad1, pad2, pad3, pad4 } = padsMap.get(room);
                if (data.pad === 1) {
                    pad1.mesh.position.z = data.position;
                } else if (data.pad === 2) {
                    pad2.mesh.position.z = data.position;
                } else if (data.pad === 3) {
                    pad3.mesh.position.z = data.position;
                } else if (data.pad === 4) {
                    pad4.mesh.position.z = data.position;
                }
                io.in(room).emit('movePad', {
                    pad1: pad1.mesh.position.z,
                    pad2: pad2.mesh.position.z,
                    pad3: pad3.mesh.position.z,
                    pad4: pad4.mesh.position.z
                });
            });

            console.log(`Player ${socket.id} joined ${room}`);

            if (rooms[room].length === 4) {
                io.in(room).emit('start-game', rooms[room], roomsTypes[room]);
                console.log(`Starting game in ${room}`);

                const ball = new Ball(0.07, 32);
                const { pad1, pad2, pad3, pad4 } = padsMap.get(room);

                io.in(room).emit('initBall', {
                    position: { x: ball.mesh.position.x, z: ball.mesh.position.z },
                    direction: { x: ball.direction.x, z: ball.direction.z },
                    speed: ball.speed,
                });

                setupMultiGameFour(io, room, ball, pad1, pad2, pad3, pad4);
            }
        
        });
        socket.on('tournament', () => {
            //get pseudo
            let room = `${socket.id}'s tournament`;
            rooms[room] = [socket.id];
            roomsTypes[room] = 'tournament';
            socket.join(room);
            console.log(`Player ${socket.id} joined ${room}`);
        });
    });
}

function findOrCreateRoom(type) {
    let room = null;
    let maxPlayers;

    if (type === 'multi-four') {
        maxPlayers = 4;
    } else {
        maxPlayers = 2;
    }

    for (const r in rooms) {
        if (rooms[r].length < maxPlayers && roomsTypes[r] === type) {
            room = r;
            break;
        }
    }

    if (!room) {
        room = `room-${roomCounter++}`;
        rooms[room] = [];
        roomsTypes[room] = type;
    }

    return room;
}