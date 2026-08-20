import { padHeight, tableHeight, tableWidth } from "./config.mjs";
import { Ball } from "./ball.mjs";
import { Pad } from "./pad.mjs";
import { clients, rooms } from "./sockets.mjs";

// Une valeur absente ou vide donnait `undefined` / "" : `score < maxScore`
// était alors faux dès le premier point et la partie s'arrêtait aussitôt.
const maxScore = Number(process.env.WIN_SCORE) || 11;

// Exportée pour scripts/check-physics.mjs : le plafond de vitesse de l'IA
// est une valeur d'équilibrage, elle ne doit pas dériver en silence.
export function IApad(pad2, ball) {
  const pad2Limit = tableHeight / 2 - padHeight / 2;
  // distanceTo() était 3D, mais la balle et la raquette sont toujours à la
  // même hauteur : la composante verticale est nulle.
  const distance = Math.hypot(
    ball.position.x - pad2.position.x,
    ball.position.z - pad2.position.z,
  );

  // Loin de la balle, l'IA vise à côté et suit plus lentement.
  const near = distance < 1.50;
  const speed = near ? 0.1 : 0.03;
  const target = near
    ? ball.position.z
    : ball.position.z + (Math.random() - 0.5) * 0.4;
  // Le lerp seul déplaçait la raquette de 0,1 × l'écart, soit jusqu'à
  // 0,22/tick — sept fois la vitesse d'un joueur, et un mode solo ingagnable.
  // L'IA est bornée au même plafond que les humains.
  const step = (target - pad2.position.z) * speed;
  const newY = pad2.position.z +
    Math.max(-pad2.speed, Math.min(pad2.speed, step));

  pad2.position.z = Math.min(pad2Limit, Math.max(-pad2Limit, newY));
}

// Nom affichable d'un adversaire : en solo et en local à deux, le second
// joueur n'a pas de socket, c'est la chaîne "AI" ou "Player 2".
const nameOf = (client) =>
  typeof client === "string" ? client : client.playerName;

// Fin de partie. Les deux buts émettaient chacun leur copie de ces trois cas
// (tournoi, quatre joueurs, tout le reste) en miroir l'une de l'autre.
function announceWinner(io, room, roomsTypes, teams, winner, looser, scores) {
  if (roomsTypes === "semi-tournament" || roomsTypes === "final-tournament") {
    io.in(room).emit("matchOver", {
      winner: winner.socketId,
      roomName: room,
      roomType: roomsTypes,
    });
    return;
  }

  if (roomsTypes === "multi-four") {
    io.in(room).emit("gameOver", {
      winner: [
        clients.get(teams[0]).playerName,
        clients.get(teams[1]).playerName,
      ],
      roomType: roomsTypes,
    });
    return;
  }

  io.in(room).emit("gameOver", {
    winner: nameOf(winner),
    looser: nameOf(looser),
    score1: scores.score1,
    score2: scores.score2,
    roomType: roomsTypes,
  });
}

// Exportée pour scripts/check-physics.mjs, qui couvre les six modes de fin de
// partie : les deux buts partagent désormais le même chemin.
export function checkWallCollision(
  ball,
  pad1,
  pad2,
  io,
  room,
  roomsTypes,
  players,
  roomTeams = null,
) {
  let teams;
  if (roomTeams !== null && roomsTypes === "multi-four") {
    teams = roomTeams.get(room);
  }
  const client1 = clients.get(players[0]);
  let client2 = "Player 2";
  if (roomsTypes !== "solo_vs_ia" && roomsTypes !== "multi-2-local") {
    client2 = clients.get(players[1]);
  } else if (roomsTypes === "solo_vs_ia") {
    client2 = `AI`;
  }

  if (
    ball.position.z + ball.direction.z * ball.speed >
      tableHeight / 2 - ball.radius - 0.02
  ) {
    ball.direction.z *= -1;
    ball.position.z = tableHeight / 2 - ball.radius - 0.02;
  } else if (
    ball.position.z + ball.direction.z * ball.speed <
      -tableHeight / 2 + ball.radius + 0.02
  ) {
    ball.direction.z *= -1;
    ball.position.z = -tableHeight / 2 + ball.radius + 0.02;
  }

  // Sortie par la droite : le joueur de gauche marque, et inversement.
  const leftScored = ball.position.x > tableWidth / 2 + ball.radius;
  const rightScored = ball.position.x < -tableWidth / 2 - ball.radius;
  if (!leftScored && !rightScored) return;

  ball.resetPosition();
  const scorer = leftScored ? pad1 : pad2;
  scorer.score++;

  const scores = { score1: pad1.score, score2: pad2.score };
  io.in(room).emit("updateScores", scores);

  if (scorer.score < maxScore) return;

  announceWinner(
    io,
    room,
    roomsTypes,
    teams && (leftScored ? teams.team1 : teams.team2),
    leftScored ? client1 : client2,
    leftScored ? client2 : client1,
    scores,
  );

  pad1.score = 0;
  pad2.score = 0;
  return true;
}

function updateBallPosition(
  ball,
  pads,
  io,
  room,
  soloMode,
  keysPressed,
  roomsTypes,
  players,
  roomTeams = null,
) {
  const [pad1, pad2] = pads;
  if (soloMode) {
    IApad(pad2, ball);
  }
  ball.updatePosition();
  if (
    checkWallCollision(
      ball,
      pad1,
      pad2,
      io,
      room,
      roomsTypes,
      players,
      roomTeams,
    ) === true
  ) {
    return true;
  }
  for (const pad of pads) {
    if (ball.checkCollision(pad) === true) {
      io.in(room).emit("hitPad");
    }
  }
  io.in(room).emit("moveBall", {
    position: { x: ball.position.x, z: ball.position.z },
    direction: { x: ball.direction.x, z: ball.direction.z },
    speed: ball.speed,
  });
  Movepad(pads, keysPressed, room, io);
}

// La boucle s'arrête sur un point gagnant comme sur une salle disparue : sans
// ce second cas, une partie quittée par `endGame` continuait de tourner à vide.
function runLoop(room, tick) {
  const interval = setInterval(() => {
    if (tick() === true || !rooms[room]) clearInterval(interval);
  }, 16);
  return interval;
}

export function setupSoloGame(
  io,
  players,
  room,
  socket,
  rooms,
  roomsTypes,
  keysPressed,
) {
  const ball = new Ball();
  const pad1 = new Pad(-2.13, 3.59, 0);
  const pad2 = new Pad(2.10, 3.59, 0);

  io.in(room).emit("initBall", {
    position: { x: ball.position.x, z: ball.position.z },
    direction: { x: ball.direction.x, z: ball.direction.z },
    speed: ball.speed,
  });

  const soloMode = roomsTypes === "solo_vs_ia";

  const interval = runLoop(
    room,
    () =>
      updateBallPosition(
        ball,
        [pad1, pad2],
        io,
        room,
        soloMode,
        keysPressed,
        roomsTypes,
        players,
      ),
  );

  socket.on("disconnect", () => {
    clearInterval(interval);

    if (rooms[room]) {
      rooms[room] = rooms[room].filter((id) => id !== socket.id);
      if (
        rooms[room].length === 0 &&
        (roomsTypes[room] === "solo_vs_ia" ||
          roomsTypes[room] === "multi-2-local")
      ) {
        delete rooms[room];
        delete roomsTypes[room];
      }
    }
  });
}

// Deux raquettes ou quatre : la seule différence était la longueur du tableau
// de pads. `setupMultiGameFour` était la même enveloppe autour de `runLoop`.
export function setupMultiGame(
  io,
  room,
  ball,
  pads,
  keysPressed,
  players,
  roomsTypes,
  roomTeams = null,
) {
  runLoop(
    room,
    () =>
      updateBallPosition(
        ball,
        pads,
        io,
        room,
        false,
        keysPressed,
        roomsTypes,
        players,
        roomTeams,
      ),
  );
}

function Movepad(pads, keysPressed, room, io) {
  const padLimit = tableHeight / 2 - padHeight / 2;

  pads.forEach((pad, index) => {
    const n = index + 1;
    if (
      keysPressed[`pad${n}MoveDown`] && pad.position.z + pad.speed < padLimit
    ) {
      pad.position.z += pad.speed;
    }
    if (
      keysPressed[`pad${n}MoveUp`] && pad.position.z - pad.speed > -padLimit
    ) {
      pad.position.z -= pad.speed;
    }
  });

  // N'émettre que si une raquette a effectivement bougé : sans cela le
  // serveur diffusait movePad ~60 fois par seconde raquettes immobiles.
  // La comparaison porte sur la dernière valeur *émise*, pas sur un
  // instantané pris en début de fonction : en solo, IApad() déplace
  // pad2 avant d'arriver ici, et un instantané local figerait l'IA.
  if (pads.every((pad) => pad.position.z === pad.lastSentZ)) return;
  for (const pad of pads) pad.lastSentZ = pad.position.z;

  const positions = {};
  pads.forEach((pad, index) => {
    positions[`pad${index + 1}`] = pad.position.z;
  });
  io.in(room).emit("movePad", positions);
}
