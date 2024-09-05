import { Ball } from './ball.mjs';
import { Pad } from './pad.mjs';
import { setupSoloGame, setupMultiGame, setupMultiGameFour, setupTournamentGame } from './game.mjs';
import { setupTournamentEvents } from './tournament.mjs';
import { findRoomForSocket, findOrCreateRoom } from './socketUtils.mjs';

export const rooms = {};
export const roomsTypes = {};
const tournaments = {};
const padsMap = new Map();
export const keysPressedMap = new Map();

export default function setupSockets(io) {
    io.on('connection', (socket) => {
        console.log('Nouvel utilisateur connecté :', socket.id);

        socket.on('disconnect', () => {
            console.log('Utilisateur déconnecté :', socket.id);

            for (let room in rooms) {
                if (rooms[room].includes(socket.id)) {
                    rooms[room] = rooms[room].filter(id => id !== socket.id);
                    console.log(`Le joueur ${socket.id} a quitté ${room}`);

                    if (rooms[room].length === 0 || (roomsTypes[room] === 'multi-2-online'
                        && rooms[room].length === 1) || (roomsTypes[room] === 'multi-four'
                            && rooms[room].length === 3)) {
                        io.in(room).socketsLeave(room);
                        delete rooms[room];
                        delete roomsTypes[room];
                        padsMap.delete(room);
                        keysPressedMap.delete(room);
                        console.log(`La salle ${room} a été supprimée`);
                    } else if (rooms[room].length === 1 && roomsTypes[room] === 'multi-2-online') {
                        io.to(rooms[room][0]).emit('gameOver', { winner: rooms[room][0] });
                    }

                    break;
                }
            }
        });

        socket.on('lobby ready', () => {
            socket.emit('lobby');
        });

        socket.on('padMove', (data) => {
            const room = findRoomForSocket(socket.id);
            if (!room) return;

            const roomKeysPressed = keysPressedMap.get(room) || {
                pad1MoveUp: false,
                pad1MoveDown: false,
                pad2MoveUp: false,
                pad2MoveDown: false,
                pad3MoveUp: false,
                pad3MoveDown: false,
                pad4MoveUp: false,
                pad4MoveDown: false,
            };

            if (data.pad === 1) {
                roomKeysPressed.pad1MoveUp = data.direction === 'up' ? data.moving : roomKeysPressed.pad1MoveUp;
                roomKeysPressed.pad1MoveDown = data.direction === 'down' ? data.moving : roomKeysPressed.pad1MoveDown;
            } else if (data.pad === 2) {
                roomKeysPressed.pad2MoveUp = data.direction === 'up' ? data.moving : roomKeysPressed.pad2MoveUp;
                roomKeysPressed.pad2MoveDown = data.direction === 'down' ? data.moving : roomKeysPressed.pad2MoveDown;
            } else if (data.pad === 3) {
                roomKeysPressed.pad3MoveUp = data.direction === 'up' ? data.moving : roomKeysPressed.pad3MoveUp;
                roomKeysPressed.pad3MoveDown = data.direction === 'down' ? data.moving : roomKeysPressed.pad3MoveDown;
            } else if (data.pad === 4) {
                roomKeysPressed.pad4MoveUp = data.direction === 'up' ? data.moving : roomKeysPressed.pad4MoveUp;
                roomKeysPressed.pad4MoveDown = data.direction === 'down' ? data.moving : roomKeysPressed.pad4MoveDown;
            }

            keysPressedMap.set(room, roomKeysPressed);
        });

        socket.on('endGame', () => {
            const room = findRoomForSocket(socket.id);
            if (room) {
                io.in(room).emit('gameEnded');
                io.in(room).socketsLeave(room);

                delete rooms[room];
                delete roomsTypes[room];
                padsMap.delete(room);
                keysPressedMap.delete(room);
                console.log(`La salle ${room} a été supprimée`);
            }
        });

        socket.on('solo_vs_ia', () => {
            let room = findOrCreateRoom('solo_vs_ia');
            rooms[room].push(socket.id);
            roomsTypes[room] = 'solo_vs_ia';
            socket.join(room);

            keysPressedMap.set(room, {
                pad1MoveUp: false,
                pad1MoveDown: false,
            });

            io.in(room).emit('start-game', rooms[room], roomsTypes[room]);
            console.log(`Démarrage du jeu dans ${room}`);

            setupSoloGame(io, room, socket, rooms, roomsTypes[room], keysPressedMap.get(room));
        });

        socket.on('multi-2-local', () => {
            let room = findOrCreateRoom('multi-2-local');
            rooms[room].push(socket.id);
            roomsTypes[room] = 'multi-2-local';
            socket.join(room);

            keysPressedMap.set(room, {
                pad1MoveUp: false,
                pad1MoveDown: false,
                pad2MoveUp: false,
                pad2MoveDown: false,
            });

            io.in(room).emit('start-game', rooms[room], roomsTypes[room]);
            console.log(`Démarrage du jeu dans ${room}`);

            setupSoloGame(io, room, socket, rooms, roomsTypes[room], keysPressedMap.get(room));
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
            
            console.log(`Joueur ${socket.id} a rejoint ${room}`);
            
            if (rooms[room].length === 2) {
                io.in(room).emit('start-game', rooms[room]);
                console.log(`Démarrage du jeu dans ${room}`);
                
                keysPressedMap.set(room, {
                    pad1MoveUp: false,
                    pad1MoveDown: false,
                    pad2MoveUp: false,
                    pad2MoveDown: false,
                });

                const ball = new Ball(0.07, 32);
                const { pad1, pad2 } = padsMap.get(room);

                io.in(room).emit('initBall', {
                    position: { x: ball.mesh.position.x, z: ball.mesh.position.z },
                    direction: { x: ball.direction.x, z: ball.direction.z },
                    speed: ball.speed,
                });

                setupMultiGame(io, room, ball, pad1, pad2, keysPressedMap.get(room));
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
            
            console.log(`Joueur ${socket.id} a rejoint ${room}`);
            
            if (rooms[room].length === 4) {
                io.in(room).emit('start-game', rooms[room], roomsTypes[room]);
                console.log(`Démarrage du jeu dans ${room}`);
                
                keysPressedMap.set(room, {
                    pad1MoveUp: false,
                    pad1MoveDown: false,
                    pad2MoveUp: false,
                    pad2MoveDown: false,
                    pad3MoveUp: false,
                    pad3MoveDown: false,
                    pad4MoveUp: false,
                    pad4MoveDown: false,
                });

                const ball = new Ball(0.07, 32);
                const { pad1, pad2, pad3, pad4 } = padsMap.get(room);

                io.in(room).emit('initBall', {
                    position: { x: ball.mesh.position.x, z: ball.mesh.position.z },
                    direction: { x: ball.direction.x, z: ball.direction.z },
                    speed: ball.speed,
                });

                setupMultiGameFour(io, room, ball, pad1, pad2, pad3, pad4, keysPressedMap.get(room));
            }
        });

        // Tournoi
        setupTournamentEvents(io, socket, rooms, roomsTypes, padsMap);
    });
}
