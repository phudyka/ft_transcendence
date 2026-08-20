import { findOrCreateRoom, findRoomForSocket } from "./socketUtils.mjs";
import { setupMultiGame } from "./game.mjs";
import { Ball } from "./ball.mjs";
import { Pad } from "./pad.mjs";
import { keysPressedMap } from "./sockets.mjs";
import { clients, rooms, roomsTypes } from "./sockets.mjs";

// Quelle salle pilote les touches de ce socket. En tournoi le joueur est à la
// fois dans le lobby et dans son match : `findRoomForSocket()` rendrait le
// premier des deux. Lu par le gestionnaire `padMove` de sockets.mjs.
export const playerRoomMap = {};

// Un tournoi, un état. `roomMain` et les deux listes de finalistes étaient des
// variables de module : deux tournois lancés en parallèle se les partageaient,
// donc la finale de l'un se jouait avec les gagnants de l'autre, et la fin de
// partie du premier supprimait les salles du second. Tout est indexé par la
// salle du lobby, la seule identité qu'un tournoi possède.
const mainRoomOf = {}; // salle de match -> salle du lobby
const finalists = new Map(); // salle du lobby -> { ids: [], names: [] }
const playersName = {}; // salle -> noms des joueurs, dans l'ordre

function roundOf(mainRoom) {
  if (!finalists.has(mainRoom)) finalists.set(mainRoom, { ids: [], names: [] });
  return finalists.get(mainRoom);
}

function dropRoom(room, padsMap) {
  delete rooms[room];
  delete roomsTypes[room];
  delete playersName[room];
  delete mainRoomOf[room];
  keysPressedMap.delete(room);
  padsMap.delete(room);
}

export function setupTournamentEvents(io, socket, padsMap) {
  socket.on("match-finished", (data) => {
    // Seul le gagnant émet, une fois par match. Une salle de match inconnue
    // n'appartient à aucun tournoi vivant : il n'y a rien à faire avancer.
    const mainRoom = mainRoomOf[data.room];
    if (!mainRoom) return;

    const round = roundOf(mainRoom);
    round.ids.push(data.playerWinner);
    round.names.push(data.playerName);

    if (data.roomType === "semi-tournament" && round.ids.length === 2) {
      io.to(mainRoom).emit("update tournament", round.names);
      const winners = [...round.ids];
      round.ids.length = 0;
      round.names.length = 0;
      finalGame(io, mainRoom, winners);
    } else if (
      data.roomType === "final-tournament" && round.ids.length === 1
    ) {
      io.to(mainRoom).emit("update tournament", round.names);
      finalists.delete(mainRoom);
      // Les salles de match de *ce* tournoi, et elles seules : la boucle
      // balayait `rooms` en entier et emportait les parties des autres.
      for (const room of Object.keys(mainRoomOf)) {
        if (mainRoomOf[room] === mainRoom) dropRoom(room, padsMap);
      }
    }

    if (rooms[data.room] && data.room !== mainRoom) {
      dropRoom(data.room, padsMap);
    }
  });

  socket.on("create-tournament", () => {
    const roomName = `${clients.get(socket.id).playerName}'s tournament`;
    const room = findOrCreateRoom("tournament", roomName);
    rooms[room] = [socket.id];
    roomsTypes[room] = "tournament";
    playerRoomMap[socket.id] = room;
    playersName[room] = [clients.get(socket.id).playerName];
    socket.join(room);

    socket.emit("tournament-created");
    socket.emit("tournament-updated", { room: playersName[room] });
    updateTournamentList(io);

    if (room && rooms[room].length === 4) createQuarterRooms(io, room);
  });

  socket.on("join-tournament", (data) => {
    const { roomName } = data;
    let room = rooms[roomName] ? roomName : null;

    if (room && rooms[room].length < 4) {
      rooms[room].push(socket.id);
      playerRoomMap[socket.id] = room;
      playersName[room].push(clients.get(socket.id).playerName);
      socket.join(room);
      io.to(room).emit("tournament-updated", { room: playersName[room] });
    }

    if (room && rooms[room].length === 4) createQuarterRooms(io, room);
  });

  socket.on("quit-tournament", (data) => {
    const room = findRoomForSocket(socket.id);
    if (!room) return;

    const index = rooms[room].indexOf(socket.id);
    if (index !== -1) rooms[room].splice(index, 1);
    delete playerRoomMap[socket.id];
    playersName[room] = playersName[room].filter((name) =>
      name !== clients.get(socket.id).playerName
    );
    socket.leave(room);

    if (!data && rooms[room].length > 0) {
      io.to(room).emit("tournament-updated", { room: playersName[room] });
    }

    if (rooms[room].length === 0) {
      // Le lobby est vide : ses matchs n'ont plus de parent.
      for (const match of Object.keys(mainRoomOf)) {
        if (mainRoomOf[match] === room) dropRoom(match, padsMap);
      }
      finalists.delete(room);
      dropRoom(room, padsMap);
      updateTournamentList(io);
    }
  });

  socket.on("return-list", () => updateTournamentList(io));
}

function updateTournamentList(io) {
  io.emit(
    "tournament-list",
    Object.keys(rooms).filter((room) => roomsTypes[room] === "tournament"),
  );
}

function createQuarterRooms(io, mainRoom) {
  const players = [...rooms[mainRoom]];
  const quarterRooms = [];

  for (let i = 0; i < 2; i++) {
    const quarterRoom = `${mainRoom}-quarter-${i + 1}`;
    rooms[quarterRoom] = [players[i * 2], players[i * 2 + 1]];
    roomsTypes[quarterRoom] = "semi-tournament";
    playersName[quarterRoom] = [
      playersName[mainRoom][i * 2],
      playersName[mainRoom][i * 2 + 1],
    ];
    mainRoomOf[quarterRoom] = mainRoom;
    quarterRooms.push(quarterRoom);

    keysPressedMap.set(quarterRoom, {});

    for (const playerId of rooms[quarterRoom]) {
      const playerSocket = io.sockets.sockets.get(playerId);
      if (playerSocket) {
        playerSocket.join(quarterRoom);
        playerRoomMap[playerId] = quarterRoom;
      }
    }
  }

  io.to(mainRoom).emit("tournament-started", { quarterRooms });

  for (const quarterRoom of quarterRooms) {
    const names = playersName[quarterRoom];
    launchMatch(
      io,
      quarterRoom,
      `${names[0]} vs ${names[1]}`,
      "semi-tournament",
    );
  }
}

function finalGame(io, mainRoom, winners) {
  const finalRoom = `${mainRoom}-final`;
  rooms[finalRoom] = [...winners];
  roomsTypes[finalRoom] = "final-tournament";
  playersName[finalRoom] = winners.map((id) => clients.get(id).playerName);
  mainRoomOf[finalRoom] = mainRoom;

  keysPressedMap.set(finalRoom, {});

  for (const playerId of winners) {
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.join(finalRoom);
      playerRoomMap[playerId] = finalRoom;
    }
  }

  // Les éliminés du même lobby regardent la finale.
  for (const spectatorId of rooms[mainRoom]) {
    if (winners.includes(spectatorId)) continue;
    io.sockets.sockets.get(spectatorId)?.join(finalRoom);
  }

  launchMatch(
    io,
    finalRoom,
    `Finale : ${playersName[finalRoom][0]} vs ${playersName[finalRoom][1]}`,
    "final-tournament",
  );
}

// Annonce des adversaires, cinq secondes de compte à rebours, puis coup
// d'envoi. Les quarts et la finale n'en avaient pas la même copie, mais deux.
function launchMatch(io, room, message, roomType) {
  io.in(room).emit("match-info", { message, countdown: 5 });

  setTimeout(() => {
    io.in(room).emit("start-game", rooms[room]);

    setupMultiGame(
      io,
      room,
      new Ball(),
      [new Pad(-2.13, 3.59, 0), new Pad(2.10, 3.59, 0)],
      keysPressedMap.get(room),
      rooms[room],
      roomType,
    );
  }, 5000);
}
