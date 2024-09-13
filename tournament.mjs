import { findOrCreateRoom, findRoomForSocket } from './socketUtils.mjs';
import { setupMultiGame } from './game.mjs';
import { Ball } from './ball.mjs';
import { Pad } from './pad.mjs';
import { keysPressedMap } from './sockets.mjs'

let roomMain;
const playerRoomMap = {};
const finalPlayers = [];

export function setupTournamentEvents(io, socket, rooms, roomsTypes, padsMap) {

    socket.on('match-finished', (data) => {
        const winnerId = data.playerWinner;
        finalPlayers.push(winnerId);
        console.log(`Match terminé dans la room: ${data.room}. Gagnant: ${winnerId}. Type de room: ${data.roomType}`);

        if (data.roomType === "semi-tournament" && finalPlayers.length === 2) {
            console.log('Les 2 finalistes sont :', finalPlayers[0], finalPlayers[1]);
            io.to(roomMain).emit('update tournament', finalPlayers);
            finalGame(io, rooms, finalPlayers, padsMap);
        } 
        else if (finalPlayers.length === 1 && data.roomType === "final-tournament") {
            console.log(`Le gagnant final est : ${finalPlayers[0]}`);
            io.to(roomMain).emit('update tournament', [finalPlayers[0]]);
            finalPlayers.length = 0;
            
            for (const room in rooms) {
                if (room !== roomMain) {
                    delete rooms[room];
                    delete roomsTypes[room];
                    keysPressedMap.delete(room);
                    padsMap.delete(room);
                }
            }
        }

        if (rooms[data.room] && data.room !== roomMain) {
            delete rooms[data.room];
            delete roomsTypes[data.room];
            keysPressedMap.delete(data.room);
            padsMap.delete(data.room);
            console.log(`Room ${data.room} a été supprimée`);
        }        
    });

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
        console.log("Nom de la room trouvée :", room);
    
        if (room) {
            const index = rooms[room].indexOf(socket.id);
            if (index !== -1) rooms[room].splice(index, 1);
            delete playerRoomMap[socket.id];
            socket.leave(room);

            if (room === roomMain && rooms[room].length === 0) {
                delete rooms[room];
                delete roomsTypes[room];
                console.log(`Room principale ${room} a été supprimée`);
                roomMain = null;
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
    roomMain = mainRoom;

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
        const players = rooms[quarterRoom];
        const opponentMessage = `Vous allez jouer contre : ${players.filter(id => id !== socket.id)}`;
    

        io.in(quarterRoom).emit('match-info', {
            message: opponentMessage,
            countdown: 5
        });
    

        setTimeout(() => {
            const pad1 = new Pad(0xc4d418, 0.045, 0.50, 16, -2.13, 3.59, 0);
            const pad2 = new Pad(0xb3261a, 0.045, 0.50, 16, 2.10, 3.59, 0);
            const ball = new Ball(0.07, 32);
    
            io.in(quarterRoom).emit('start-game', rooms[quarterRoom]);
    
            setupMultiGame(io, rooms[quarterRoom], quarterRoom, ball, pad1, pad2, keysPressedMap.get(quarterRoom), "semi-tournament");
    
            console.log(`Starting quarter-final match in room: ${quarterRoom}`);
        }, 5000);
    }

}

function finalGame(io, rooms, finalPlayers, padsMap){
    const finalRoom = `${roomMain}-final`;
    rooms[finalRoom] = [finalPlayers[0], finalPlayers[1]];
    const allPlayers = rooms[roomMain];
    
    
    keysPressedMap.set(finalRoom, {
        pad1MoveUp: false,
        pad1MoveDown: false,
        pad2MoveUp: false,
        pad2MoveDown: false,
    });

    for (const playerId of finalPlayers) {
        const playerSocket = io.sockets.sockets.get(playerId);
        if (playerSocket) {
            playerSocket.join(finalRoom);
            playerRoomMap[playerId] = finalRoom;
        }
    }

    const spectators = allPlayers.filter(playerId => !finalPlayers.includes(playerId));

    for (const spectatorId of spectators) {
        const spectatorSocket = io.sockets.sockets.get(spectatorId);
        if (spectatorSocket) {
            spectatorSocket.join(finalRoom);
        }
    }

    console.log(`Players ${rooms[finalRoom].join(' and ')} joined room: ${finalRoom}`);

    let opponentMessage = `Finale ${finalPlayers[0]} contre ${finalPlayers[1]}`;

    io.in(finalRoom).emit('match-info', {
        message: opponentMessage,
        countdown: 5
    });

    finalPlayers.length = 0

    setTimeout(() => {
        const ball = new Ball(0.07, 32);
        const pad1 = new Pad(0xc4d418, 0.045, 0.50, 16, -2.13, 3.59, 0);
        const pad2 = new Pad(0xb3261a, 0.045, 0.50, 16, 2.10, 3.59, 0);

        io.in(roomMain).emit('start-game', rooms[finalRoom], "final-tournament");

        setupMultiGame(io, rooms[finalRoom], finalRoom, ball, pad1, pad2, keysPressedMap.get(finalRoom), "final-tournament");

        console.log(`Starting final match in room: ${finalRoom}`);
    }, 5000);
}

function clearRooms(rooms)
{
    for (const room in rooms){
        console.log('room restante :', room);
        //delete rooms[room];
    }
}
