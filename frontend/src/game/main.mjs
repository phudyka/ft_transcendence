import * as THREE from "three";
import setupLighting from "./light.mjs";
import Camera from "./camera.mjs";
import { createLogo } from "./plane.mjs";
import { easeInOutExpo, fadeOutLogoAndStartAnimation } from "./animation.mjs";
import { Pad } from "./pad.mjs";
import loadModel from "./loadIsland.mjs";
import { Ball } from "./ball.mjs";
import { initSocketEvent } from "./socketEvent.mjs";
import Sound from "./sounds.mjs";
import { saveMatchResult } from "./api.mjs";
import { connectGame } from "../config.js";
import { padForSide, padMoveFor } from "./controls.mjs";
import { showPanel } from "./panels.mjs";

const socket = connectGame();

// La page du jeu est désormais servie par le même hôte que la SPA : elle lit
// directement la session au lieu de l'attendre par postMessage.
const username = sessionStorage.getItem("display_name");
const token = sessionStorage.getItem("accessToken");

// Sans jeton, la page est la démo de l'accueil : le service temps réel admet
// l'invité sur `/game` mais ne lui installe que les modes tenant dans un seul
// navigateur. Le menu doit dire la même chose que le serveur, sinon on clique
// sur « Multiplayer » pour tomber sur un écran qui ne répond jamais.
const isGuest = token === null;

if (isGuest) {
  document.getElementById("multi-button").classList.add("hidden");
  document.getElementById("guest-note").classList.remove("hidden");
}

// Le serveur enregistre tous ses gestionnaires dans le callback de 'username' :
// rien d'autre ne doit partir avant. L'événement ne porte plus de charge utile,
// le serveur tenant l'identité du jeton présenté au handshake.
socket.on("connect", () => {
  socket.emit("username");
});

// Les invitations restent transmises par la SPA parente, en same-origin.
window.addEventListener("message", function (event) {
  if (event.origin !== window.location.origin) {
    console.warn("Origine non autorisée:", event.origin);
    return;
  }
  if (event.data.type === "gameInvitation") {
    socket.emit("invite", { to: event.data.to, from: event.data.from });
  }
});

// Les couleurs d'équipe ne se réécrivent plus à la main à chaque création :
// `cleanUpGameObjects` reconstruisait les raquettes en 0xcc7700 / 0x2FA4FF,
// si bien qu'à partir du deuxième match le chiffre du score et la raquette
// qu'il compte n'avaient plus la même couleur. Deux équipes, deux couleurs —
// c'est la Règle des Couleurs d'Équipe, et elle vaut aussi pour les pads 3 et 4.
const TEAM_ORANGE = 0xff6600;
const TEAM_BLUE = 0x00a9ff;

export let pad1, pad2, pad3, pad4, ball;
export let scene, camera, renderer;
let logo;
let mixer;
export const gameState = {
  choice: false,
};
// OrbitControls ne servait qu'à cette rotation : rotation à la souris, zoom,
// pan et amortissement étaient tous désactivés. Même pas, même cible (0, 0, 0)
// et même sens que son autoRotate à 0,7.
const UP = new THREE.Vector3(0, 1, 0);
const AUTO_ROTATE_STEP = ((2 * Math.PI) / 3600) * 0.7;
let autoRotate = true;

// La rotation continue de la caméra est une boucle décorative : elle s'arrête
// sur son état de repos comme les animations CSS, sans quoi la scène 3D reste
// le seul mouvement que `prefers-reduced-motion` ne coupe pas. Le garde est ici
// plutôt que sur chaque appelant : tous passent par cette fonction.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Une seule horloge écrit `camera.position` : la boucle rAF. Le vol d'entrée
// (`setInterval` à 16 ms) et les deux recadrages de match (`animCam`, 20 ms)
// avaient chacun la leur, et tournaient par-dessus la rotation de repos qui,
// elle, s'incrémente à chaque image. Deux propriétaires d'une même propriété :
// la position posée par l'intervalle, tournée par la frame suivante, reposée
// par l'intervalle — la caméra tremblait pendant les deux secondes d'ouverture
// et à chaque retour au lobby.
let camTween = null;

function flyCamera(x, y, z, lookY, duration) {
  camTween = {
    from: camera.position.clone(),
    to: new THREE.Vector3(x, y, z),
    lookY,
    start: performance.now(),
    duration,
  };
}

function updateCamera() {
  // Tant qu'un tween court, il est seul propriétaire — la rotation de repos
  // attend la fin plutôt que de s'y ajouter.
  if (camTween) {
    const t = Math.min(
      (performance.now() - camTween.start) / camTween.duration,
      1,
    );
    camera.position.lerpVectors(camTween.from, camTween.to, easeInOutExpo(t));
    camera.lookAt(0, camTween.lookY, 0);
    if (t === 1) camTween = null;
    return;
  }
  if (!autoRotate || reduceMotion.matches) return;
  camera.position.applyAxisAngle(UP, -AUTO_ROTATE_STEP);
  camera.lookAt(0, 0, 0);
}
export let sounds = [];

const clock = new THREE.Clock();

// L'état des raquettes vit ici, la résolution des touches dans controls.mjs.
const padState = { controlledPad: null, controlledPads: null };

function emitPadMove(key, moving) {
  const move = padMoveFor(key, padState);
  if (move) socket.emit("padMove", { ...move, moving });
}

// Sur mobile il n'y a pas de clavier : deux zones de part et d'autre de l'écran
// envoient les mêmes touches. Le CSS ne les affiche que sur pointeur grossier.
function initTouchControls() {
  for (const button of document.querySelectorAll("#touch-controls button")) {
    const key = button.dataset.key;
    const press = (event) => {
      event.preventDefault();
      emitPadMove(key, true);
    };
    const release = (event) => {
      event.preventDefault();
      emitPadMove(key, false);
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }
}

// Une zone tactile inutilisable est pire qu'absente : on n'affiche que les
// côtés que le joueur pilote réellement, une fois les raquettes attribuées.
function updateTouchControls() {
  const controls = document.getElementById("touch-controls");
  controls.classList.remove("hidden");
  for (const side of controls.querySelectorAll(".touch-side")) {
    side.classList.toggle("hidden", !padForSide(side.dataset.side, padState));
  }
}

function initGame() {
  scene = new THREE.Scene();
  camera = new Camera();
  // `Graphic extends WebGLRenderer` n'était qu'une sous-classe à implémentation
  // unique pour ces cinq réglages.
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Au-delà de 2, le coût par image triple sans gain visible.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Le ciel de `light.mjs` sort des valeurs HDR : sans courbe de tonalité, le
  // ciel comme le sable saturent au blanc.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.6;
  document.body.appendChild(renderer.domElement);

  setupLighting(scene, renderer);

  logo = createLogo(scene);

  fadeOutLogoAndStartAnimation(logo, scene, () => flyCamera(0, 8, 20, 0, 2000));

  sounds = new Sound(camera);

  pad1 = new Pad(TEAM_ORANGE, 0.045, 0.50, 16, -2.10, 3.59, 0);
  pad1.addToScene(scene);

  pad2 = new Pad(TEAM_BLUE, 0.045, 0.50, 16, 2.10, 3.59, 0);
  pad2.addToScene(scene);

  ball = new Ball(0.07, 32);
  ball.addToScene(scene);

  document.addEventListener("keydown", (event) => {
    if (!event.repeat) emitPadMove(event.key, true);
  });

  document.addEventListener("keyup", (event) => {
    emitPadMove(event.key, false);
  });

  initTouchControls();

  window.addEventListener("resize", resizeRenderer);

  initSocketEvent(socket);
}

function resizeRenderer() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

document.getElementById("start-game-button").addEventListener("click", () => {
  document.getElementById("start-game-button").classList.add("hidden");
  const progress = document.getElementById("loading");
  const bar = document.getElementById("loading-bar");
  progress.classList.remove("hidden");
  initGame();
  animate();
  loadModel(scene, (loadedMixer) => {
    mixer = loadedMixer;
  }, (fraction) => {
    bar.style.setProperty("--loaded", fraction);
    progress.setAttribute("aria-valuenow", Math.round(fraction * 100));
  }).finally(() => {
    progress.classList.add("hidden");
    socket.emit("lobby ready");
  });
});

// Le service refuse le handshake sans jeton `display_name` valide, et le jeu
// restait alors muet : ni menu, ni message.
socket.on("connect_error", () => {
  const progress = document.getElementById("loading");
  progress.classList.add("hidden");
  const notice = document.getElementById("not-ready-text");
  notice.textContent = "Cannot reach the game server. Try reloading the page.";
  document.getElementById("notReady").classList.remove("hidden");
});

// Une seule boucle : hors partie la caméra tourne, et le retour au lobby se
// déclenche sur le front descendant de gameState.choice.
let wasPlaying = false;

function animate() {
  requestAnimationFrame(animate);

  // Onglet caché : rien à peindre. Le navigateur bride déjà `rAF`, il ne
  // l'arrête pas — et l'iframe du tableau de bord reste montée en permanence.
  if (document.hidden) return;

  if (gameState.choice) {
    wasPlaying = true;
  } else if (wasPlaying) {
    flyCamera(0, 8, 20, 3, 1000);
    autoRotate = true;
    wasPlaying = false;
  }

  updateCamera();
  // Au retour d'un onglet caché, `getDelta` rend la pause entière et le mixeur
  // saute d'autant. Plafonner, c'est une image de retard au lieu d'un bond.
  if (mixer) mixer.update(Math.min(clock.getDelta(), 0.1));
  renderer.render(scene, camera);
}

socket.on("start-game", (rooms, roomsTypes) => {
  gameState.choice = true;
  sounds.stop("lobby");
  sounds.play("ambient");
  sounds.playMusic();
  flyCamera(0, 8, 6.2, 3, 1000);
  autoRotate = false;
  padState.controlledPad = 0;
  padState.controlledPads = 0;
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("multi").classList.add("hidden");
  document.getElementById("tournament-details").classList.add("hidden");
  document.getElementById("tournament-details").classList.remove("flex");
  document.getElementById("waiting").classList.add("hidden");
  document.getElementById("space").classList.add("hidden");
  document.getElementById("score").classList.remove("hidden");
  document.getElementById("score").classList.add("score-container");

  const [player1, player2, player3, player4] = rooms;

  if (roomsTypes === "multi-2-local") {
    padState.controlledPads = [1, 2];
  } else {
    if (username === player1 || socket.id === player1) {
      padState.controlledPad = 1;
    } else if (username === player2 || socket.id === player2) {
      padState.controlledPad = 2;
    } else if (username === player3 || socket.id === player3) {
      padState.controlledPad = 3;
    } else if (username === player4 || socket.id === player4) {
      padState.controlledPad = 4;
    }
  }

  if (player4) {
    pad3 = new Pad(TEAM_ORANGE, 0.045, 0.50, 16, -0.5, 3.59, 0);
    pad3.addToScene(scene);

    pad4 = new Pad(TEAM_BLUE, 0.045, 0.50, 16, 0.5, 3.59, 0);
    pad4.addToScene(scene);
  }
  colorPad(padState.controlledPad);
  updateTouchControls();
  briefControls();
});

// Quelle raquette est la mienne, et avec quoi je la bouge. Les deux seules
// choses qu'il faut savoir pour jouer, et les deux seules que le jeu n'écrivait
// nulle part : la seule indication était le clignotement de `colorPad`.
let briefTimer = null;

function briefControls() {
  const left = padForSide("left", padState);
  const right = padForSide("right", padState);
  if (!left && !right) return;

  const lines = [];
  if (left && right) {
    lines.push("Left paddle (orange): W and S", "Right paddle (blue): ↑ and ↓");
  } else if (left) {
    lines.push("You are the orange paddle, on the left.", "Move with W and S.");
  } else {
    lines.push("You are the blue paddle, on the right.", "Move with ↑ and ↓.");
  }

  // Élément dédié, et non `#match-info` : celui-ci porte le décompte des
  // tournois, dont l'intervalle réécrit `#countdown` chaque seconde. Le
  // recycler ici lui retirerait ce nœud sous les pieds.
  const brief = document.getElementById("controls-brief");
  brief.textContent = "";
  for (const text of lines) {
    const line = document.createElement("p");
    line.textContent = text;
    brief.append(line);
  }
  brief.classList.remove("hidden");
  // Deux matches enchaînés : le timer du premier masquait le rappel du second
  // au bout de ce qu'il lui restait à courir.
  clearTimeout(briefTimer);
  briefTimer = setTimeout(() => brief.classList.add("hidden"), 4000);
}

function colorPad(number) {
  [pad1, pad2, pad3, pad4][number - 1]?.color();
}

socket.on("movePad", (data) => {
  pad1.mesh.position.z = data.pad1;
  pad2.mesh.position.z = data.pad2;
  if (pad4) {
    pad3.mesh.position.z = data.pad3;
    pad4.mesh.position.z = data.pad4;
  }
});

socket.on("matchOver", (data) => {
  const winner = data.winner;
  const currentRoom = data.roomName;
  document.getElementById("score").classList.add("hidden");
  document.getElementById("score").classList.remove("score-container");
  document.getElementById("scoreLeft").textContent = 0;
  document.getElementById("scoreRight").textContent = 0;
  document.getElementById("tournament-details").classList.remove("hidden");
  document.getElementById("tournament-details").classList.add("flex");

  if (winner === socket.id) {
    socket.emit("match-finished", {
      playerWinner: winner,
      playerName: username,
      room: currentRoom,
      roomType: data.roomType,
    });
  }
  cleanUpGameObjects();
});

document.getElementById("back-to-menu-button").addEventListener("click", () => {
  document.getElementById("game-over").classList.add("hidden");
  showPanel("menu");
});

// Le dernier mode lancé, pour la revanche. Il se retient au clic plutôt que de
// se déduire de la charge utile du serveur : `start-game` ne porte pas toujours
// le type de salle. Les modes en ligne repassent par la file d'attente comme un
// premier lancement ; un tournoi ne se rejoue pas et remet le compteur à zéro.
let lastMode = null;

const REPLAYABLE = {
  "solo-ia": "solo_vs_ia",
  "multi-2-local": "multi-2-local",
  "multi-2-online": "multi-2-online",
  "multi-four": "multi-four",
};

for (const [id, event] of Object.entries(REPLAYABLE)) {
  document.getElementById(id).addEventListener("click", () => {
    lastMode = event;
  });
}

for (const id of ["multi-tournament", "create-tournament"]) {
  document.getElementById(id).addEventListener("click", () => {
    lastMode = null;
  });
}

document.getElementById("play-again-button").addEventListener("click", () => {
  if (!lastMode) return;
  document.getElementById("game-over").classList.add("hidden");
  socket.emit(lastMode);
});

socket.on("gameOver", (data) => {
  sounds.play("lobby");
  sounds.stop("ambient");
  sounds.stopMusic();
  gameState.choice = false;
  const winner = data.winner;
  const winnerMessage = document.getElementById("winner-message");
  // La défaite portait exactement l'habillage de la victoire : halo bleu en
  // respiration, balayage de lumière, cadre d'or. « YOU LOSE » clignotait en
  // fête. Le halo est un événement mérité, pas un décor de fin de partie.
  const won = (result) => {
    winnerMessage.classList.toggle("is-win", result);
    winnerMessage.classList.toggle("is-loss", !result);
  };
  if (data.winner === username && data.roomType !== "multi-2-local") {
    sounds.play("win");
    winnerMessage.textContent = "YOU WIN";
    won(true);
    saveMatchResult(token, true, data.looser);
  } else if (
    data.winner !== username && data.roomType !== "multi-2-local" &&
    data.roomType !== "multi-four"
  ) {
    sounds.play("loose");
    winnerMessage.textContent = `YOU LOSE — ${formatWinner(winner)} wins`;
    won(false);
    saveMatchResult(token, false, data.winner);
  } else if (
    data.winner.length === 2 && data.winner[0] === username ||
    data.winner[1] === username
  ) {
    winnerMessage.textContent = `YOU WIN — with ${formatWinner(winner)}`;
    won(true);
  } else {
    winnerMessage.textContent = `YOU LOSE — ${formatWinner(winner)} wins`;
    won(false);
    sounds.play("loose");
  }
  // Rejouer le même mode sans repasser par les menus : le seul bouton était
  // « Back », et une défaite sans revanche est une fin de session.
  document.getElementById("play-again-button").classList.toggle(
    "hidden",
    lastMode === null,
  );
  showPanel("game-over");

  document.getElementById("score").classList.add("hidden");
  document.getElementById("score").classList.remove("score-container");
  document.getElementById("scoreLeft").textContent = 0;
  document.getElementById("scoreRight").textContent = 0;
  document.getElementById("tournament").classList.remove("active");

  cleanUpGameObjects();
  socket.emit("endGame");
});

// En quatre joueurs, `winner` est une paire : sans cela le message affichait
// « alice,bob ».
function formatWinner(winner) {
  return Array.isArray(winner) ? winner.join(" & ") : winner;
}

function cleanUpGameObjects() {
  for (const object of [pad1, pad2, pad3, pad4, ball]) {
    object?.removeFromScene(scene);
  }
  pad1 =
    pad2 =
    pad3 =
    pad4 =
    ball =
      null;

  pad1 = new Pad(TEAM_ORANGE, 0.045, 0.50, 16, -2.10, 3.59, 0);
  pad1.addToScene(scene);

  pad2 = new Pad(TEAM_BLUE, 0.045, 0.50, 16, 2.10, 3.59, 0);
  pad2.addToScene(scene);

  ball = new Ball(0.07, 32);
  ball.addToScene(scene);
}
