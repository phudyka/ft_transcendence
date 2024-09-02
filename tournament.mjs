import { findOrCreateRoom, findRoomForSocket } from './socketUtils.mjs';
import { setupSoloGame, setupMultiGame, setupMultiGameFour, setupTournamentGame } from './game.mjs';
import { Ball } from './ball.mjs';
import { Pad } from './pad.mjs';

const tournaments = {};
const playerRoomMap = {};

export function setupTournamentEvents(io, socket, rooms, roomsTypes, padsMap, keysPressed) {
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

        if (room && rooms[room].length === 8) {
            createQuarterRooms(io, room, rooms, roomsTypes, padsMap, keysPressed);
        }
    });

    socket.on('join-tournament', (data) => {
        const { roomName } = data;
        let room = rooms[roomName] ? roomName : null;

        socket.on('player_ready', () => {
            console.log('player ready:', socket.id);
        });

        if (room && rooms[room].length < 8) {
            rooms[room].push(socket.id);
            playerRoomMap[socket.id] = room;
            socket.join(room);
            console.log(`Player ${socket.id} joined ${room}`);
            io.to(room).emit('tournament-updated', { room: rooms[room] });
        }

        if (room && rooms[room].length === 8) {
            createQuarterRooms(io, room, rooms, roomsTypes, padsMap, keysPressed);
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

function createQuarterRooms(io, mainRoom, rooms, roomsTypes, padsMap, keysPressed) {
    const players = rooms[mainRoom];
    const quarterRooms = [];

    for (let i = 0; i < 4; i++) {
        const quarterRoom = `${mainRoom}-quarter-${i + 1}`;
        rooms[quarterRoom] = [players[i * 2], players[i * 2 + 1]];
        roomsTypes[quarterRoom] = 'quarter-final';

        const pad1 = new Pad(0xc4d418, 0.045, 0.50, 16, -2.13, 3.59, 0);
        const pad2 = new Pad(0xb3261a, 0.045, 0.50, 16, 2.10, 3.59, 0);
        const ball = new Ball(0.07, 32);

        for (const playerId of rooms[quarterRoom]) {
            const playerSocket = io.sockets.sockets.get(playerId);
            if (playerSocket) {
                playerSocket.join(quarterRoom);
                playerRoomMap[playerId] = quarterRoom;
            }
        }

        console.log(`Players ${rooms[quarterRoom].join(' and ')} joined room: ${quarterRoom}`);

        setupMultiGame(io, quarterRoom, ball, pad1, pad2, keysPressed);
        
        quarterRooms.push(quarterRoom);
        io.in(quarterRoom).emit('start-game', rooms[quarterRoom]);
    }
    
    io.to(mainRoom).emit('tournament-started', { quarterRooms });
    console.log(`Tournament started with quarter finals: ${quarterRooms}`);
}
