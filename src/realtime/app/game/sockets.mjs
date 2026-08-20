import { Ball } from "./ball.mjs";
import { Pad } from "./pad.mjs";
import { setupMultiGame, setupSoloGame } from "./game.mjs";
import { playerRoomMap, setupTournamentEvents } from "./tournament.mjs";
import { findOrCreateRoom, findRoomForSocket } from "./socketUtils.mjs";

export const rooms = {};
export const roomsTypes = {};
const padsMap = new Map();
export const keysPressedMap = new Map();
export const clients = new Map();
const roomTeams = new Map();

export default function setupSockets(io) {
  io.on("connection", (socket) => {
    // Le client émet toujours cet événement — il conditionne l'installation
    // de tous les autres gestionnaires — mais l'identité qu'il annonce est
    // ignorée : elle vient du JWT vérifié au handshake. Sans cela, n'importe
    // qui pouvait jouer sous le nom d'un autre et lui faire créditer la partie.
    socket.on("username", () => {
      const { displayName } = socket.data.user;
      const client = {
        socket,
        socketId: socket.id,
        playerName: displayName,
        accessToken: socket.data.token,
        room: null,
        initGame: false,
      };
      clients.set(socket.id, client);

      socket.on("disconnect", () => {
        clients.delete(socket.id);

        for (let room in rooms) {
          if (rooms[room].includes(socket.id)) {
            rooms[room] = rooms[room].filter((id) => id !== socket.id);

            if (rooms[room].length === 0) {
              io.in(room).socketsLeave(room);
              delete rooms[room];
              delete roomsTypes[room];
              padsMap.delete(room);
              keysPressedMap.delete(room);
              roomTeams.delete(room);
            } else if (
              rooms[room].length === 1 && roomsTypes[room] === "multi-2-online"
            ) {
              const winner = clients.get(rooms[room][0]).playerName;
              io.to(rooms[room][0]).emit("gameOver", { winner: winner });
            } else if (
              roomsTypes[room] === "semi-tournament" ||
              roomsTypes[room] === "final-tournament"
            ) {
              const winner = clients.get(rooms[room][0]).playerName;
              io.to(rooms[room]).emit("matchOver", {
                winner: winner,
                roomName: room,
                roomType: roomsTypes[room],
              });
            } else if (
              rooms[room].length > 0 && roomsTypes[room] === "multi-four"
            ) {
              let winningTeam;
              {
                const teams = roomTeams.get(room);
                if (
                  teams.team1[0] === socket.id || teams.team1[1] === socket.id
                ) {
                  winningTeam = [
                    clients.get(teams.team2[0]).playerName,
                    clients.get(teams.team2[1]).playerName,
                  ];
                } else if (
                  teams.team2[0] === socket.id || teams.team2[1] === socket.id
                ) {
                  winningTeam = [
                    clients.get(teams.team1[0]).playerName,
                    clients.get(teams.team1[1]).playerName,
                  ];
                }
                if (winningTeam) {
                  io.to(room).emit("gameOver", {
                    winner: winningTeam,
                    roomType: roomsTypes[room],
                  });
                } else {
                  console.error(
                    `Impossible de déterminer l'équipe gagnante pour la salle ${room}`,
                  );
                }
              }
            }

            //break;
          }
        }
      });

      socket.on("lobby ready", () => {
        socket.emit("lobby");
        client.initGame = true;
      });

      // Un seul gestionnaire : tournament.mjs en posait un second, si bien que
      // chaque touche était traitée deux fois. En tournoi le joueur appartient
      // au lobby *et* à son match, et findRoomForSocket() rend le premier des
      // deux — d'où playerRoomMap en premier choix.
      socket.on("padMove", (data) => {
        const room = playerRoomMap[socket.id] ||
          findRoomForSocket(socket.id, rooms);
        if (!room) return;

        // Un seul navigateur pilote les deux raquettes en local. En ligne la
        // raquette vient du rang du socket dans la salle, jamais du client :
        // `data.pad` permettait de déplacer la raquette de l'adversaire.
        const local = roomsTypes[room] === "solo_vs_ia" ||
          roomsTypes[room] === "multi-2-local";
        const pad = local ? data.pad : rooms[room].indexOf(socket.id) + 1;
        if (!(pad >= 1 && pad <= 4)) return;

        // Les touches non enfoncées restent absentes : `undefined` est falsy,
        // Movepad() lit ces clés directement.
        const roomKeysPressed = keysPressedMap.get(room) || {};
        roomKeysPressed[
          `pad${pad}Move${data.direction === "up" ? "Up" : "Down"}`
        ] = data.moving;
        keysPressedMap.set(room, roomKeysPressed);
      });

      socket.on("endGame", () => {
        const room = findRoomForSocket(socket.id, rooms);
        if (room) {
          io.in(room).emit("gameEnded");

          io.in(room).socketsLeave(room);

          rooms[room].forEach((socketId) => {
            const client = clients.get(socketId);
            if (client && client.room === room) {
              client.room = null;
            }
          });

          delete rooms[room];
          delete roomsTypes[room];
          padsMap.delete(room);
          keysPressedMap.delete(room);
        } else {
          io.in(room).emit("gameEnded");
        }
      });

      // Les deux modes à un seul navigateur : même salle, même boucle, seul le
      // type change (il décide si la raquette droite est pilotée par l'IA).
      for (const mode of ["solo_vs_ia", "multi-2-local"]) {
        socket.on(mode, () => {
          if (client.room !== null) return;

          const room = findOrCreateRoom(mode);
          rooms[room].push(socket.id);
          roomsTypes[room] = mode;
          socket.join(room);
          client.room = room;
          keysPressedMap.set(room, {});

          io.in(room).emit("start-game", rooms[room], roomsTypes[room]);

          setupSoloGame(
            io,
            rooms[room],
            room,
            socket,
            rooms,
            roomsTypes[room],
            keysPressedMap.get(room),
          );
        });
      }

      // Frontière du mode démo. Un invité n'a pas de compte : les deux modes
      // qui tiennent dans un seul navigateur lui suffisent, et tout ce qui
      // suit — invitation, file publique, quatre joueurs, tournoi — suppose
      // une identité que personne ne lui a délivrée. Aucun gestionnaire n'est
      // installé plutôt que d'en refuser l'entrée un par un.
      if (socket.data.user.guest === true) return;

      socket.on("invite", (data) => {
        let to = findClientByUsername(data.to);
        let from = findClientByUsername(data.from);
        if (
          to !== null && to.room === null && to.initGame === true &&
          from !== null && from.initGame === true
        ) {
          io.to(to.socketId).emit("invite", { from: data.from, to: data.to });
        } else if (to !== null) {
          io.to(socket.id).emit("not-ready", { from: to.playerName });
        }
      });

      // Partie privée sur invitation. Les deux joueurs entrent d'un coup ;
      // le démarrage est le même que pour la file publique ci-dessous.
      socket.on("accept", (data) => {
        const from = findClientByUsername(data.from);
        if (client.room !== null || from === null || from.room !== null) return;

        const room = findOrCreateRoom(`private game ${client.playerName}`);
        rooms[room].push(socket.id, from.socketId);
        roomsTypes[room] = "multi-2-online";
        socket.join(room);
        from.socket.join(room);
        padsMap.set(room, {
          pad1: new Pad(-2.13, 3.59, 0),
          pad2: new Pad(2.10, 3.59, 0),
        });
        client.room = room;
        from.room = room;

        if (rooms[room].length === 2) startTwoPlayerMatch(room);
      });

      socket.on("refuse", (data) => {
        let from = findClientByUsername(data.from);
        io.to(from.socketId).emit("refuse-invit", { to: data.to });
      });

      socket.on("cancel", () => {
        const room = client.room;
        client.room = null;
        socket.leave(room);
        const index = rooms[room].indexOf(socket.id);
        if (index !== -1) {
          rooms[room].splice(index, 1);
        }
        if (rooms[room].length == 0) {
          delete rooms[room];
          delete roomsTypes[room];
        }
      });

      // File publique : on attend le second joueur dans la même salle.
      socket.on("multi-2-online", () => {
        if (client.room !== null) return;

        const room = findOrCreateRoom("multi-2-online");
        rooms[room].push(socket.id);
        roomsTypes[room] = "multi-2-online";
        socket.join(room);

        if (rooms[room].length === 1) {
          padsMap.set(room, {
            pad1: new Pad(-2.13, 3.59, 0),
            pad2: new Pad(2.10, 3.59, 0),
          });
        }

        client.room = room;

        if (rooms[room].length === 2) startTwoPlayerMatch(room);
      });

      // Coup d'envoi d'une partie à deux en ligne, identique qu'elle vienne
      // d'une invitation ou de la file publique.
      function startTwoPlayerMatch(room) {
        keysPressedMap.set(room, {});

        const ball = new Ball();
        const { pad1, pad2 } = padsMap.get(room);

        io.in(room).emit("start-game", rooms[room]);
        io.in(room).emit("initBall", {
          position: { x: ball.position.x, z: ball.position.z },
          direction: { x: ball.direction.x, z: ball.direction.z },
          speed: ball.speed,
        });

        // `roomsTypes` (la table entière) était passée là où la boucle attend
        // le type de la salle : aucune comparaison ne pouvait aboutir.
        setupMultiGame(
          io,
          room,
          ball,
          [pad1, pad2],
          keysPressedMap.get(room),
          rooms[room],
          roomsTypes[room],
        );
      }

      socket.on("multi-four", () => {
        if (client.room === null) {
          let room = findOrCreateRoom("multi-four");
          rooms[room].push(socket.id);
          socket.join(room);

          if (rooms[room].length === 1) {
            const pad1 = new Pad(-2.13, 3.59, 0);
            const pad2 = new Pad(2.10, 3.59, 0);
            const pad3 = new Pad(-0.5, 3.59, 0);
            const pad4 = new Pad(0.5, 3.59, 0);
            padsMap.set(room, { pad1, pad2, pad3, pad4 });
          }

          client.room = room;

          if (rooms[room].length === 4) {
            roomTeams.set(room, {
              team1: [rooms[room][0], rooms[room][2]],
              team2: [rooms[room][1], rooms[room][3]],
            });
            io.in(room).emit("start-game", rooms[room], roomsTypes[room]);

            keysPressedMap.set(room, {});

            const ball = new Ball();
            const { pad1, pad2, pad3, pad4 } = padsMap.get(room);

            io.in(room).emit("initBall", {
              position: { x: ball.position.x, z: ball.position.z },
              direction: { x: ball.direction.x, z: ball.direction.z },
              speed: ball.speed,
            });

            setupMultiGame(
              io,
              room,
              ball,
              [pad1, pad2, pad3, pad4],
              keysPressedMap.get(room),
              rooms[room],
              "multi-four",
              roomTeams,
            );
          }
        }
      });

      // Tournoi
      setupTournamentEvents(io, socket, padsMap);
    });
  });

  function findClientByUsername(username) {
    for (const client of clients.values()) {
      if (client.playerName === username) {
        return client;
      }
    }
    return null;
  }
}
