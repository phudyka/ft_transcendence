import { findOrCreateRoom, findRoomForSocket } from "./socketUtils.mjs";
import { setupMultiGame } from "./game.mjs";
import { Ball } from "./ball.mjs";
import { Pad } from "./pad.mjs";
import { keysPressedMap } from "./sockets.mjs";
import { clients, rooms, roomsTypes } from "./sockets.mjs";

let roomMain;
// Quelle salle pilote les touches de ce socket. En tournoi le joueur est à la
// fois dans le lobby et dans son match : `findRoomForSocket()` rendrait le
// premier des deux. Lu par le gestionnaire `padMove` de sockets.mjs.
export const playerRoomMap = {};
const finalPlayers = [];
const finalPlayersName = [];
let playersName = {};

export function setupTournamentEvents(io, socket, padsMap) {
  socket.on("match-finished", (data) => {
    const winnerId = data.playerWinner;
    finalPlayers.push(winnerId);
    finalPlayersName.push(data.playerName);

    if (data.roomType === "semi-tournament" && finalPlayers.length === 2) {
      io.to(roomMain).emit("update tournament", finalPlayersName);
      finalGame(io, rooms, finalPlayers);
    } else if (
      finalPlayers.length === 1 && data.roomType === "final-tournament"
    ) {
      io.to(roomMain).emit("update tournament", finalPlayersName);
      finalPlayers.length = 0;
      finalPlayersName.length = 0;

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
    updateTournamentList(io, rooms, roomsTypes);

    if (room && rooms[room].length === 4) {
      createQuarterRooms(io, room, roomsTypes);
    }
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

    if (room && rooms[room].length === 4) {
      createQuarterRooms(io, room, roomsTypes);
    }
  });

  socket.on("quit-tournament", (data) => {
    const room = findRoomForSocket(socket.id, rooms);

    if (room) {
      const index = rooms[room].indexOf(socket.id);
      if (index !== -1) {
        rooms[room].splice(index, 1);
      }
      delete playerRoomMap[socket.id];
      playersName[room] = playersName[room].filter((name) =>
        name !== clients.get(socket.id).playerName
      );
      socket.leave(room);

      if (!data && rooms[room].length > 0) {
        io.to(room).emit("tournament-updated", { room: playersName[room] });
      }

      if (rooms[room].length === 0) {
        delete rooms[room];
        delete roomsTypes[room];
        delete playersName[room];
        roomMain = null;
        updateTournamentList(io, rooms, roomsTypes);
      }
    }
  });

  socket.on("return-list", () => {
    updateTournamentList(io, rooms, roomsTypes);
  });
}

function updateTournamentList(io, rooms, roomsTypes) {
  const tournamentList = Object.keys(rooms).filter((room) =>
    roomsTypes[room] === "tournament"
  );
  io.emit("tournament-list", tournamentList);
}

function createQuarterRooms(io, mainRoom, roomsTypes) {
  const players = [...rooms[mainRoom]];
  const quarterRooms = [];
  roomMain = mainRoom;

  for (let i = 0; i < 2; i++) {
    const quarterRoom = `${mainRoom}-quarter-${i + 1}`;
    rooms[quarterRoom] = [players[i * 2], players[i * 2 + 1]];
    roomsTypes[quarterRoom] = "semi-tournament";
    playersName[quarterRoom] = [
      playersName[mainRoom][i * 2],
      playersName[mainRoom][i * 2 + 1],
    ];
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

function finalGame(io, rooms, finalPlayers) {
  const finalRoom = `${roomMain}-final`;
  rooms[finalRoom] = [finalPlayers[0], finalPlayers[1]];
  roomsTypes[finalRoom] = "final-tournament";
  playersName[finalRoom] = [
    clients.get(finalPlayers[0]).playerName,
    clients.get(finalPlayers[1]).playerName,
  ];
  const allPlayers = rooms[roomMain];

  keysPressedMap.set(finalRoom, {});

  for (const playerId of rooms[finalRoom]) {
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.join(finalRoom);
      playerRoomMap[playerId] = finalRoom;
    }
  }

  const spectators = allPlayers.filter((playerId) =>
    !finalPlayers.includes(playerId)
  );
  for (const spectatorId of spectators) {
    const spectatorSocket = io.sockets.sockets.get(spectatorId);
    if (spectatorSocket) {
      spectatorSocket.join(finalRoom);
    }
  }

  finalPlayers.length = 0;
  finalPlayersName.length = 0;

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
