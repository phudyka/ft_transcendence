import { rooms, roomsTypes } from "./sockets.mjs";

let roomCounter = 1;

// Les autres types (solo, local, partie privée) n'ont pas de maximum : la
// comparaison avec `undefined` est fausse, donc chacun ouvre sa propre salle.
const MAX_PLAYERS = { tournament: 4, "multi-four": 4, "multi-2-online": 2 };

export function findOrCreateRoom(type, name = null) {
  const maxPlayers = MAX_PLAYERS[type];
  const named = type === "tournament" && name;

  for (const r in rooms) {
    if (roomsTypes[r] !== type) continue;
    if (named && r !== name) continue;
    if (!(rooms[r].length < maxPlayers)) continue;
    return r;
  }

  const room = named ? name : `room-${roomCounter++}`;
  rooms[room] = [];
  roomsTypes[room] = type;
  return room;
}

export function findRoomForSocket(client, roomsid) {
  for (const room in roomsid) {
    if (roomsid[room].includes(client)) {
      return room;
    }
  }
  return null;
}
