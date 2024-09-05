import { findOrCreateRoom, findRoomForSocket } from './socketUtils.mjs';
import { setupSoloGame, setupMultiGame, setupMultiGameFour, setupTournamentGame } from './game.mjs';
import { Ball } from './ball.mjs';
import { Pad } from './pad.mjs';
import { keysPressedMap } from './sockets.mjs'

const tournaments = {};
const playerRoomMap = {};

export function setupTournamentEvents(io, socket, rooms, roomsTypes, padsMap) {

    socket.on('padMove', (data) => {
        const room = playerRoomMap[socket.id];
        if (!room) return;
    
        const roomKeysPressed = keysPressedMap.get(room) || {
            pad1MoveUp: false,
            pad1MoveDown: false,
            pad2MoveUp: false,
            pad2MoveDown: false,
        };
    
        if (data.pad === 1) {
            roomKeysPressed.pad1MoveUp = data.direction === 'up' ? data.moving : roomKeysPressed.pad1MoveUp;
            roomKeysPressed.pad1MoveDown = data.direction === 'down' ? data.moving : roomKeysPressed.pad1MoveDown;
        } else if (data.pad === 2) {
            roomKeysPressed.pad2MoveUp = data.direction === 'up' ? data.moving : roomKeysPressed.pad2MoveUp;
            roomKeysPressed.pad2MoveDown = data.direction === 'down' ? data.moving : roomKeysPressed.pad2MoveDown;
        }
    
        keysPressedMap.set(room, roomKeysPressed);
        console.log(`Updated keysPressedMap for room ${room}:`, roomKeysPressed);
    });

    socket.on('create-tournament', () => {
        const roomName = `${socket.id}'s tournament`;
        const room = findOrCreateRoom('tournament', roomName);
        rooms[room] = [socket.id];
        playerRoomMap[socket.id] = room;
        socket.join(room);

        console.log(`Player ${socket.id} created ${room}`);
        socket.emit('tournament-created');
        socket.emit('tournament-updated', { room: rooms[room] });

        socket.on('player_ready', () => {
            console.log('player ready:', socket.id);
        });

        if (room && rooms[room].length === 4) {
            createQuarterRooms(io, socket, room, rooms, roomsTypes, padsMap);
        }
    });

    socket.on('join-tournament', (data) => {
        const { roomName } = data;
        let room = rooms[roomName] ? roomName : null;

        socket.on('player_ready', () => {
            console.log('player ready:', socket.id);
        });

        if (room && rooms[room].length < 4) {
            rooms[room].push(socket.id);
            playerRoomMap[socket.id] = room;
            socket.join(room);
            console.log(`Player ${socket.id} joined ${room}`);
            io.to(room).emit('tournament-updated', { room: rooms[room] });
        }

        if (room && rooms[room].length === 4) {
            createQuarterRooms(io, socket, room, rooms, roomsTypes, padsMap);
        }
    });

    socket.on('quit-tournament', () => {
        const room = findRoomForSocket(socket.id, rooms);

        if (room) {
            const index = rooms[room].indexOf(socket.id);
            if (index !== -1) rooms[room].splice(index, 1);
            delete playerRoomMap[socket.id];
            socket.leave(room);

            io.to(room).emit('tournament-updated', { room: rooms[room] });

            if (rooms[room].length === 0) {
                delete rooms[room];
                delete roomsTypes[room];
                padsMap.delete(room);
                console.log(`Room ${room} has been removed`);
                updateTournamentList(io, rooms, roomsTypes);
            }
        }
    });

    socket.on('return-list', () => {
        updateTournamentList(io, rooms, roomsTypes);
    });
}

function updateTournamentList(io, rooms, roomsTypes) {
    const tournamentList = Object.keys(rooms).filter(room => roomsTypes[room] === 'tournament');
    io.emit('tournament-list', tournamentList);
}

function createQuarterRooms(io, socket, mainRoom, rooms, roomsTypes, padsMap) {
    const players = [...rooms[mainRoom]];
    const quarterRooms = [];

    for (let i = 0; i < 2; i++) {
        const quarterRoom = `${mainRoom}-quarter-${i + 1}`;
        rooms[quarterRoom] = [players[i * 2], players[i * 2 + 1]];
        roomsTypes[quarterRoom] = 'quarter-final';
        quarterRooms.push(quarterRoom);
        
        keysPressedMap.set(quarterRoom, {
            pad1MoveUp: false,
            pad1MoveDown: false,
            pad2MoveUp: false,
            pad2MoveDown: false,
        });
        for (const playerId of rooms[quarterRoom]) {
            const playerSocket = io.sockets.sockets.get(playerId);
            if (playerSocket) {
                playerSocket.join(quarterRoom);
                playerSocket.leave(mainRoom);
                playerRoomMap[playerId] = quarterRoom;
            }
        }

        console.log(`Players ${rooms[quarterRoom].join(' and ')} joined room: ${quarterRoom}`);
    }

    io.to(mainRoom).emit('tournament-started', { quarterRooms });
    console.log(`Tournament started with quarter finals: ${quarterRooms}`);

    startQuarterMatch(0, socket);
    startQuarterMatch(1, socket);

    function startQuarterMatch(index, socket) {
        if (index >= quarterRooms.length) {
            console.log("All quarter-final matches are completed.");
            return;
        }

        const quarterRoom = quarterRooms[index];
        const pad1 = new Pad(0xc4d418, 0.045, 0.50, 16, -2.13, 3.59, 0);
        const pad2 = new Pad(0xb3261a, 0.045, 0.50, 16, 2.10, 3.59, 0);
        const ball = new Ball(0.07, 32);

        io.in(quarterRoom).emit('start-game', rooms[quarterRoom]);

        setupMultiGame(io, quarterRoom, ball, pad1, pad2, keysPressedMap.get(quarterRoom));

        console.log(`Starting quarter-final match in room: ${quarterRoom}`);

        socket.on('match-finished', (data) => {
            const winnerId = data.winnerId;
            console.log(`Match finished in room: ${quarterRoom}. Winner: ${winnerId}`);
            
            // Appeler la fonction pour démarrer le prochain match
            //startQuarterMatch(index + 1);
        });
    }
}



