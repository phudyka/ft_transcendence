import { findOrCreateRoom, findRoomForSocket} from './socketUtils.mjs'
import { setupSoloGame, setupMultiGame, setupMultiGameFour, setupTournamentGame } from './game.mjs';

export const tournaments = {};

export function setupTournamentEvents(io, socket, rooms, roomsTypes, padsMap, keysPressed) {
        socket.on('create-tournament', () => {
            const roomName = `${socket.id}'s tournament`;
            const room = findOrCreateRoom('tournament', roomName);
            rooms[room].push(socket.id);
            socket.join(room);
            
            console.log(`Player ${socket.id} created ${room}`);
            socket.emit('tournament-created');
            socket.emit('tournament-updated', { room: rooms[room] });

            socket.on('player_ready', () => {
                console.log('player ready:', socket.id);
            });

            if (room && rooms[room].length === 2) {
                setupTournamentGame(io, room, keysPressed, socket);
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
                socket.join(room);
                console.log(`Player ${socket.id} joined ${room}`);
                io.to(room).emit('tournament-updated', { room: rooms[room] });
            }
            
            if (room && rooms[room].length === 8) {
                setupTournamentGame(io, room, keysPressed, socket);
            }
        });

        socket.on('quit-tournament', () => {
            const room = findRoomForSocket(socket.id, rooms);
        
            if (room) {
                const index = rooms[room].indexOf(socket.id);
                if (index !== -1) rooms[room].splice(index, 1);
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
