import { Ball } from './ball.mjs';
import { Pad } from './pad.mjs';
import { setupSoloGame, setupMultiGame, setupMultiGameFour } from './game.mjs';
import { padHeight, tableHeight } from './config.mjs';

const rooms = {};
const roomsTypes = {};
let roomCounter = 1;
const padsMap = new Map();
const keysPressed = {
    pad1MoveUp: false,
    pad1MoveDown: false,
    pad2MoveUp: false,
    pad2MoveDown: false,
    pad3MoveUp: false,
    pad3MoveDown: false,
    pad4MoveUp: false,
    pad4MoveDown: false
};

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

        socket.on('lobby ready', () =>{
            socket.emit('lobby');
        });

        socket.on('padMove', (data) => {
            console.log(`Received padMove for pad ${data.pad} in direction ${data.direction} moving: ${data.moving}`);
            if (data.pad === 1) {
                keysPressed.pad1MoveUp = data.direction === 'up' ? data.moving : keysPressed.pad1MoveUp;
                keysPressed.pad1MoveDown = data.direction === 'down' ? data.moving : keysPressed.pad1MoveDown;
            } else if (data.pad === 2) {
                keysPressed.pad2MoveUp = data.direction === 'up' ? data.moving : keysPressed.pad2MoveUp;
                keysPressed.pad2MoveDown = data.direction === 'down' ? data.moving : keysPressed.pad2MoveDown;
            } else if (data.pad === 3) {
                keysPressed.pad3MoveUp = data.direction === 'up' ? data.moving : keysPressed.pad3MoveUp;
                keysPressed.pad3MoveDown = data.direction === 'down' ? data.moving : keysPressed.pad3MoveDown;
            } else if (data.pad === 4) {
                keysPressed.pad4MoveUp = data.direction === 'up' ? data.moving : keysPressed.pad4MoveUp;
                keysPressed.pad4MoveDown = data.direction === 'down' ? data.moving : keysPressed.pad4MoveDown;
            }
        });

        socket.on('endGame', () => {
            const room = findRoomForSocket(socket.id);
            if (room) {
                io.in(room).emit('gameEnded');
                io.in(room).socketsLeave(room);

                delete rooms[room];
                delete roomsTypes[room];
                padsMap.delete(room);
                console.log(`Room ${room} has been removed`);
            }
        });

        socket.on('solo_vs_ia', () => {
            let room = `room-${roomCounter++}`;
            rooms[room] = [socket.id];
            roomsTypes[room] = 'solo_vs_ia';
            socket.join(room);

            io.in(room).emit('start-game', rooms[room], roomsTypes[room]);
            console.log(`Starting game in ${room}`);

            setupSoloGame(io, room, socket, rooms, roomsTypes[room], keysPressed);
        });

        socket.on('multi-2-local', () => {
            let room = `room-${roomCounter++}`;
            rooms[room] = [socket.id];
            roomsTypes[room] = 'multi-2-local';
            socket.join(room);

            io.in(room).emit('start-game', rooms[room], roomsTypes[room]);
            console.log(`Starting game in ${room}`);

            setupSoloGame(io, room, socket, rooms, roomsTypes[room], keysPressed);
        });

        socket.on('multi-2-online', () => {
            let room = findOrCreateRoom('multi-2-online');
            rooms[room].push(socket.id);
            socket.join(room);
        
            if (rooms[room].length === 1) {
                const pad1 = new Pad(0xc4d418, 0.045, 0.50, 16, -2.13, 3.59, 0);
                const pad2 = new Pad(0xb3261a, 0.045, 0.50, 16, 2.10, 3.59, 0);
                padsMap.set(room, { pad1, pad2 });
            }
        
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
        
                // Gestion des événements de touche
                setupMultiGame(io, room, ball, pad1, pad2, keysPressed);
            }
        });
        

        socket.on('multi-four', () => {
            let room = findOrCreateRoom('multi-four');
            rooms[room].push(socket.id);
            socket.join(room);

            if (rooms[room].length === 1) {
                const pad1 = new Pad(0xc4d418, 0.045, 0.50, 16, -2.13, 3.59, 0);
                const pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 2.10, 3.59, 0);
                const pad3 = new Pad(0xfa00ff, 0.045, 0.50, 16, -0.5, 3.59, 0);
                const pad4 = new Pad(0xfa00ff, 0.045, 0.50, 16, 0.5, 3.59, 0);
                padsMap.set(room, { pad1, pad2, pad3, pad4 });
            }

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

                setupMultiGameFour(io, room, ball, pad1, pad2, pad3, pad4, keysPressed);
            }
        
        });
        socket.on('create-tournament', () => {
            const roomName = `${socket.id}'s tournament`;
            const room = findOrCreateRoom('tournament', roomName);
            rooms[room].push(socket.id);
            socket.join(room);
            
            console.log(`Player ${socket.id} created ${room}`);
            socket.emit('tournament-created');
        });

        socket.on('join-tournament', (data) => {
            const { roomName } = data;
            let room = null;

            if (rooms[roomName]) {
                room = roomName;
            } else {
                room = null;
            }
        
            if (room && rooms[room].length < 8) {
                rooms[room].push(socket.id);
                socket.join(room);
                console.log(`Player ${socket.id} joined ${room}`);
            } else {
                socket.emit('error', { message: 'Error' });
            }
        });

        socket.on('return-list', () => {
            updateTournamentList();
        });
        socket.on('join-tournament', (data) => {
            socket.emit('tournament-joined');
        });
    });

    function updateTournamentList() {
        const tournamentList = Object.keys(rooms).filter(room => roomsTypes[room] === 'tournament');
        io.emit('tournament-list', tournamentList);
    }
}

function findOrCreateRoom(type, name = null) {
    let room = null;
    let maxPlayers;

    if (type === 'tournament') {
        maxPlayers = 8;
    } else if (type === 'multi-four') {
        maxPlayers = 4;
    } else if (type === 'multi-2-online'){
        maxPlayers = 2;
    }

    for (const r in rooms) {
        if (roomsTypes[r] === type && rooms[r].length < maxPlayers) {
            room = r;
            break;
        }
    }

    if (!room) {
        if (type === 'tournament' && name) {
            room = name;
        } else {
            room = `room-${roomCounter++}`;
        }
        rooms[room] = [];
        roomsTypes[room] = type;
    }

    return room;
}

function findRoomForSocket(socketId) {
    for (const room in rooms) {
        if (rooms[room].includes(socketId)) {
            return room;
        }
    }
    return null;
}