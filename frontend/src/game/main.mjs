/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.mjs                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: fabperei <fabperei@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/26 16:25:09 by phudyka           #+#    #+#             */
/*   Updated: 2024/11/15 11:37:52 by fabperei         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';
import Light from './light.mjs';
import Camera from './camera.mjs';
import Graphic from './graphic.mjs';
import Logo from './logo.mjs';
import { fadeOutLogoAndStartAnimation } from './animation.mjs';
import { Pad } from './pad.mjs';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import loadModel from './loadIsland.mjs';
import { Ball } from './ball.mjs';
import { hitPadEvent, initSocketEvent, SoundLobby } from './socketEvent.mjs';
import Sound from './sounds.mjs';
import { updateUserStats } from './api.mjs';
import { connectGame } from '../config.js';
import { padForSide, padMoveFor } from './controls.mjs';

const socket = connectGame();

// La page du jeu est désormais servie par le même hôte que la SPA : elle lit
// directement la session au lieu de l'attendre par postMessage.
const username = sessionStorage.getItem('display_name');
const token = sessionStorage.getItem('accessToken');

// Le serveur enregistre tous ses gestionnaires dans le callback de 'username' :
// rien d'autre ne doit partir avant. L'événement ne porte plus de charge utile,
// le serveur tenant l'identité du jeton présenté au handshake.
socket.on('connect', () => {
    socket.emit('username');
});

// Les invitations restent transmises par la SPA parente, en same-origin.
window.addEventListener('message', function(event) {
    if (event.origin !== window.location.origin) {
        console.warn('Origine non autorisée:', event.origin);
        return;
    }
    if (event.data.type === 'gameInvitation') {
        socket.emit('invite', { to: event.data.to, from: event.data.from });
    }
});

export let pad1, pad2, pad3, pad4, ball;
export let scene, camera, renderer, listener;
let logo
let mixer, action;
export let gameState = {
    choice: false
};
let controls;
export let sounds = [];

const clock = new THREE.Clock();

// L'état des raquettes vit ici, la résolution des touches dans controls.mjs.
const padState = { controlledPad: null, controlledPads: null };

function emitPadMove(key, moving) {
    const move = padMoveFor(key, padState);
    if (move) socket.emit('padMove', { ...move, moving });
}

// Sur mobile il n'y a pas de clavier : deux zones de part et d'autre de l'écran
// envoient les mêmes touches. Le CSS ne les affiche que sur pointeur grossier.
function initTouchControls() {
    for (const button of document.querySelectorAll('#touch-controls button')) {
        const key = button.dataset.key;
        const press = (event) => { event.preventDefault(); emitPadMove(key, true); };
        const release = (event) => { event.preventDefault(); emitPadMove(key, false); };
        button.addEventListener('pointerdown', press);
        button.addEventListener('pointerup', release);
        button.addEventListener('pointercancel', release);
        button.addEventListener('pointerleave', release);
    }
}

// Une zone tactile inutilisable est pire qu'absente : on n'affiche que les
// côtés que le joueur pilote réellement, une fois les raquettes attribuées.
function updateTouchControls() {
    const controls = document.getElementById('touch-controls');
    controls.classList.remove('hidden');
    for (const side of controls.querySelectorAll('.touch-side')) {
        side.classList.toggle('hidden', !padForSide(side.dataset.side, padState));
    }
}

function initGame() {
    scene = new THREE.Scene();
    camera = new Camera();
    renderer = new Graphic(scene, camera);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.screenSpacePanning = false;
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotateSpeed = 0.7;
    controls.autoRotate = true;

    new Light(scene);

    logo = new Logo(scene);

    fadeOutLogoAndStartAnimation(logo, scene, camera, renderer);


    sounds = new Sound(camera);

    pad1 = new Pad(0xFF6600, 0.045, 0.50, 16, -2.10, 3.59, 0);
    pad1.addToScene(scene);

    pad2 = new Pad(0x00A9FF, 0.045, 0.50, 16, 2.10, 3.59, 0);
    pad2.addToScene(scene);

    ball = new Ball(0.07, 32);
    ball.addToScene(scene);


    document.addEventListener('keydown', (event) => {
        if (!event.repeat) emitPadMove(event.key, true);
    });

    document.addEventListener('keyup', (event) => {
        emitPadMove(event.key, false);
    });

    initTouchControls();

    initSocketEvent(socket, ball);
    hitPadEvent(socket, sounds);
    SoundLobby(socket, sounds);
}

document.getElementById('start-game-button').addEventListener('click', () => {
    document.getElementById('start-game-button').classList.add('hidden');
    initGame();
    setTimeout(() => {
        loadModel(scene, (loadedMixer, loadedAction) => {
            mixer = loadedMixer;
            action = loadedAction;
        });
        animateChoice();
        socket.emit('lobby ready');
    }, 2000);
});

function updateAnimation() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
}

function animateChoice() {
    if (!gameState.choice) {
        requestAnimationFrame(animateChoice);
        controls.update();
        updateAnimation();
        renderer.render(scene, camera);
    }
    else {
        animate();
    }
}

function animate() {
    if (gameState.choice) {
        requestAnimationFrame(animate);
        updateAnimation();
        renderer.render(scene, camera);
    }
    else {
        camera.animCam(0, 8, 20);
        controls.autoRotate = true
        animateChoice();
    }
}

socket.on('start-game', (rooms, roomsTypes) => {
    gameState.choice = true;
    sounds.stop('lobby');
    sounds.play('ambient');
	sounds.playMusic();
    camera.animCam(0, 8, 6.2);
    controls.autoRotate = false;
    controls.update();
    padState.controlledPad = 0;
    padState.controlledPads = 0;
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('multi').classList.add('hidden');
    document.getElementById('tournament-details').classList.add('hidden');
    document.getElementById('tournament-details').classList.remove('flex');
    document.getElementById('waiting').classList.add('hidden');
    document.getElementById('space').classList.add('hidden');
    document.getElementById('score').classList.remove('hidden');
    document.getElementById('score').classList.add('score-container');

    const [player1, player2, player3, player4] = rooms;

    if (roomsTypes === 'multi-2-local') {
        padState.controlledPads = [1, 2];
    } else {
        if (username === player1 || socket.id === player1) padState.controlledPad = 1;
        else if (username === player2 || socket.id === player2) padState.controlledPad = 2;
        else if (username === player3 || socket.id === player3) padState.controlledPad = 3;
        else if (username === player4 || socket.id === player4) padState.controlledPad = 4;
    }

    if (player4) {
        pad3 = new Pad(0xcc7700, 0.045, 0.50, 16, -0.5, 3.59, 0);
        pad3.addToScene(scene);

        pad4 = new Pad(0x2040df, 0.045, 0.50, 16, 0.5, 3.59, 0);
        pad4.addToScene(scene);
    }
    colorPad(padState.controlledPad);
    updateTouchControls();
});

function colorPad(number){
    switch (number) {
        case 1:
            pad1.color();
            break;
        case 2:
            pad2.color();
            break;
        case 3:
            pad3.color();
            break;
        case 4:
            pad4.color();
            break;
        default:
            break;
    }
}

socket.on('movePad', (data) => {
    pad1.mesh.position.z = data.pad1;
    pad2.mesh.position.z = data.pad2;
    if (pad4) {
        pad3.mesh.position.z = data.pad3;
        pad4.mesh.position.z = data.pad4;
    }
});

socket.on('matchOver', (data) => {
    const winner = data.winner;
    const currentRoom = data.roomName;
    document.getElementById('score').classList.add('hidden');
    document.getElementById('score').classList.remove('score-container');
    document.getElementById('scoreLeft').textContent = 0;
    document.getElementById('scoreRight').textContent = 0;
    document.getElementById('tournament-details').classList.remove('hidden');
    document.getElementById('tournament-details').classList.add('flex');

    if (winner === socket.id) {
        socket.emit('match-finished', { playerWinner: winner, playerName: username, room: currentRoom, roomType: data.roomType });
    }
    cleanUpGameObjects();
});

socket.on('gameOver', (data) => {
    sounds.play('lobby');
    sounds.stop('ambient');
	sounds.stopMusic();
    gameState.choice = false;
    const winner = data.winner;
    const gameOverSection = document.getElementById('game-over');
    const winnerMessage = document.getElementById('winner-message');
    console.log('winner contient :', winner);
	if (data.winner === username && data.roomType !== 'multi-2-local'){
		sounds.play('win');
        winnerMessage.textContent = `YOU WIN !`;
        updateUserStats(username, token, true, data.looser);
    }
	else if (data.winner !== username && data.roomType !== 'multi-2-local' && data.roomType !== 'multi-four') {
        sounds.play('loose');
        winnerMessage.textContent = `YOU LOOSE ! ${winner} is the winner`;
        updateUserStats(username, token, false, data.winner);
    }
    else if (data.winner.length === 2 && data.winner[0] === username || data.winner[1] === username){
        winnerMessage.textContent = `YOU WIN ${winner}`;
    }
    else {
        winnerMessage.textContent = `YOU LOOSE the winners is ${winner}`;
        sounds.play('win');
    }
    gameOverSection.style.display = 'flex';

    document.getElementById('score').classList.add('hidden');
    document.getElementById('score').classList.remove('score-container');
    document.getElementById('scoreLeft').textContent = 0;
    document.getElementById('scoreRight').textContent = 0;
    document.getElementById('tournament').classList.remove('active');

    document.getElementById('back-to-menu-button').addEventListener('click', () => {
        gameOverSection.style.display = 'none';
        document.getElementById('menu').classList.remove('hidden');
    });
    cleanUpGameObjects();
    socket.emit('endGame');
});

function removeGameObject(gameObject) {
    if (gameObject) {
        gameObject.removeFromScene(scene);
        gameObject = null;
    }
    return gameObject;
}

function cleanUpGameObjects() {
    pad1 = removeGameObject(pad1);
    pad2 = removeGameObject(pad2);
    pad3 = removeGameObject(pad3);
    pad4 = removeGameObject(pad4);
    ball = removeGameObject(ball);

    pad1 = new Pad(0xcc7700, 0.045, 0.50, 16, -2.10, 3.59, 0);
    pad1.addToScene(scene);

    pad2 = new Pad(0x2FA4FF, 0.045, 0.50, 16, 2.10, 3.59, 0);
    pad2.addToScene(scene);

    ball = new Ball(0.07, 32);
    ball.addToScene(scene);
}

