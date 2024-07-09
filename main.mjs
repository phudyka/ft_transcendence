import * as THREE from './node_modules/three/build/three.module.js';
import { sunLight } from './light.mjs';
import { Pad } from './pad.mjs';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import loadModel from './loadIsland.mjs';
import { Ball } from './ball.mjs';

const socket = io();

let pad1MoveUp = false;
let pad1MoveDown = false;
let pad2MoveUp = false;
let pad2MoveDown = false;
let controlledPad = null;

var pad1;
var pad2;

const tableHeight = 2.70;
const padHeight = 0.5;

var scene;
var camera;
var renderer;

function initGame() {

    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -80, 80);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio * 0.8);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x7EB6F7);
    document.body.appendChild(renderer.domElement);

    const Light = new sunLight(0xffffff, 2.5);
    scene.add(Light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    loadModel(scene);

    pad1 = new Pad(0xc4d418, 0.045, 0.50, 16, -2.13, 0, 0);
    pad1.addToScene(scene);
    
    pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 2.10, 0, 0);
    pad2.addToScene(scene);
    
    const ball = new Ball(0.07, 32);
    ball.addToScene(scene);

    document.addEventListener('keydown', (event) => {
        if (controlledPad === 1) {
            if (event.key === 'w') pad1MoveUp = true;
            if (event.key === 's') pad1MoveDown = true;
        } else if (controlledPad === 2) {
            if (event.key === 'ArrowUp') pad2MoveUp = true;
            if (event.key === 'ArrowDown') pad2MoveDown = true;
        }
        movePads();
    });
    
    document.addEventListener('keyup', (event) => {
        if (controlledPad === 1) {
            if (event.key === 'w') pad1MoveUp = false;
            if (event.key === 's') pad1MoveDown = false;
        } else if (controlledPad === 2) {
            if (event.key === 'ArrowUp') pad2MoveUp = false;
            if (event.key === 'ArrowDown') pad2MoveDown = false;
        }
        movePads();
    });
    
    socket.on('initBall', (data) => {
        ball.mesh.position.x = data.position.x;
        ball.mesh.position.y = data.position.y;
        console.log('Initial ball data received:', data);
    });
    
    socket.on('moveBall', (data) => {
        ball.mesh.position.x = data.position.x;
        ball.mesh.position.y = data.position.y;
        ball.speed = data.speed;
    });
    
    
    socket.on('movePad', (data) => {
        console.log('Received movePad event:', data);
            pad1.mesh.position.y = data.pad1;
            pad2.mesh.position.y = data.pad2;
    });

    socket.on('updateScores', (scores) => {
        document.getElementById('scoreLeft').textContent = scores.score1;
        document.getElementById('scoreRight').textContent = scores.score2;
    });

    socket.on('LeaveRoom', (room) => {
        socket.emit('disconnect');
    })

    const startPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };
    const endPosition = {
        x: 0,
        y: 0,
        z: 6
    };
    const duration = 4000;
    const interval = 16;
    const step = {
        x: (endPosition.x - startPosition.x) / (duration / interval),
        y: (endPosition.y - startPosition.y) / (duration / interval),
        z: (endPosition.z - startPosition.z) / (duration / interval)
    };

    const cameraAnimation = setInterval(() => {
        camera.position.x += step.x;
        camera.position.y += step.y;
        camera.position.z += step.z;
        camera.lookAt(0,0,0);

        if (camera.position.z <= endPosition.z) {
            camera.position.set(endPosition.x, endPosition.y, endPosition.z);
            document.getElementById('menu').classList.add('active');
            clearInterval(cameraAnimation);
        }

        renderer.render(scene, camera);
    }, interval);

    document.getElementById('multi-button').addEventListener('click', () => {
        socket.emit('multi');
    });

    document.getElementById('solo-button').addEventListener('click', () => {
        socket.emit('solo');
    });
}

initGame();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;

function movePads() {
    const pad1Limit = tableHeight / 2 - padHeight / 2;
    const pad2Limit = tableHeight / 2 - padHeight / 2;

    if (pad1MoveUp && pad1.mesh.position.y + pad1.speed < pad1Limit) {
        pad1.mesh.position.y = pad1.mesh.position.y + pad1.speed;
        socket.emit('movePad', { pad: 1, position: pad1.mesh.position.y });
    }
    else if (pad1MoveDown && pad1.mesh.position.y - pad1.speed > -pad1Limit) {
        pad1.mesh.position.y = pad1.mesh.position.y - pad1.speed;
        socket.emit('movePad', { pad: 1, position: pad1.mesh.position.y });
    }
    else if (pad2MoveUp && pad2.mesh.position.y + pad2.speed < pad2Limit) {
        pad2.mesh.position.y = pad2.mesh.position.y + pad2.speed;
        socket.emit('movePad', { pad: 2, position: pad2.mesh.position.y });
    }
    else if (pad2MoveDown && pad2.mesh.position.y - pad2.speed > -pad2Limit) {
        pad2.mesh.position.y = pad2.mesh.position.y - pad2.speed;
        socket.emit('movePad', { pad: 2, position: pad2.mesh.position.y });
    }
}

function animate() {
    requestAnimationFrame(animate);
    movePads();
    controls.update();
    // console.log(camera.position);
    renderer.render(scene, camera);
}

socket.on('start-game', (rooms) => {
    document.getElementById('waiting').classList.remove('active');
    document.getElementById('score').classList.add('score-container');
    const player1 = rooms[0];
    const player2 = rooms[1];

    if (socket.id === player1) {
        controlledPad = 1;
    } else if (socket.id === player2) {
        controlledPad = 2;
    }
    console.log(controlledPad);
    animate();
});

