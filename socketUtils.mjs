import { rooms, roomsTypes } from './sockets.mjs'

let roomCounter = 1;

export function findOrCreateRoom(type, name = null) {
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

export function findRoomForSocket(socketId) {
    for (const room in rooms) {
        if (rooms[room].includes(socketId)) {
            return room;
        }
    }
    return null;
}
