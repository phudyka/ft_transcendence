import * as THREE from './node_modules/three/build/three.module.js';
import { Light } from './light.mjs';
import { Pad } from './pad.mjs';
import { Ball } from './ball.mjs';

const socket = io();

let pad1MoveUp = false;
let pad1MoveDown = false;
let pad2MoveUp = false;
let pad2MoveDown = false;

var pad1;
var pad2;

const tableHeight = 2
const padHeight = 0.5;

var scene;
var camera;
var renderer;

function initGame() {

    document.getElementById('multi-button').addEventListener('click', () => {
        socket.emit('multi');
    });

    document.getElementById('solo-button').addEventListener('click', () => {
        socket.emit('solo');
    });

    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio * 0.8);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    const sunLight = new Light(0xffffff, 3);
    scene.add(sunLight);
    
    const backgeo = new THREE.PlaneGeometry(10, 10);
    const backmaterial = new THREE.MeshPhongMaterial({ color : 0x007BFF });
    const back = new THREE.Mesh(backgeo, backmaterial);
    back.receiveShadow = true;
    scene.add(back);
    
    const tableGeometry = new THREE.BoxGeometry(4.10, 2, 0.01);
    const tableMaterial = new THREE.MeshPhongMaterial({ color: 0x499BC2, transparent: true, opacity: 0 });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.receiveShadow = true;
    scene.add(table);
    
    function border() {
    
        const borderMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const borderThickness = 0.07;
        const horizontalBorderGeometry = new THREE.BoxGeometry(4.10 + borderThickness * 2, borderThickness, 0.01 + borderThickness);
        const verticalBorderGeometry = new THREE.BoxGeometry(borderThickness, 2 + borderThickness * 2, 0.01 + borderThickness);
        
        const topBorder = new THREE.Mesh(horizontalBorderGeometry, borderMaterial);
        topBorder.position.set(0, 2 / 2 + borderThickness / 2, 0);
        scene.add(topBorder);
        
        const bottomBorder = new THREE.Mesh(horizontalBorderGeometry, borderMaterial);
        bottomBorder.position.set(0, -2 / 2 - borderThickness / 2, 0);
        scene.add(bottomBorder);
        
        const leftBorder = new THREE.Mesh(verticalBorderGeometry, borderMaterial);
        leftBorder.position.set(-4.10 / 2 - borderThickness / 2, 0, 0);
        scene.add(leftBorder);
        
        const rightBorder = new THREE.Mesh(verticalBorderGeometry, borderMaterial);
        rightBorder.position.set(4.10 / 2 + borderThickness / 2, 0, 0);
        scene.add(rightBorder);
    
    }
    
    border();
    
    pad1 = new Pad(0xc4d418);
    pad1.addToScene(scene);
    
    pad2 = new Pad(0xfa00ff, 0.045, 0.40, 16, 1.85, 0, 0);
    pad2.addToScene(scene);
    
    const ballGeometry = new THREE.SphereGeometry(0.07, 32, 32);
    const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xff8f00 });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.receiveShadow = true;
    ball.castShadow = true;
    ball.position.z = 0.05;
    scene.add(ball);
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'w') pad1MoveUp = true;
        if (event.key === 's') pad1MoveDown = true;
        if (event.key === 'ArrowUp') pad2MoveUp = true;
        if (event.key === 'ArrowDown') pad2MoveDown = true;
        emitPadMovement();
    });
    
    document.addEventListener('keyup', (event) => {
        if (event.key === 'w') pad1MoveUp = false;
        if (event.key === 's') pad1MoveDown = false;
        if (event.key === 'ArrowUp') pad2MoveUp = false;
        if (event.key === 'ArrowDown') pad2MoveDown = false;
        emitPadMovement();
    });
    
    socket.on('initBall', (data) => {
        ball.position.x = data.position.x;
        ball.position.y = data.position.y;
        console.log('Initial ball data received:', data);
    });
    
    socket.on('moveBall', (data) => {
        ball.position.x = data.position.x;
        ball.position.y = data.position.y;
        ball.speed = data.speed;
    });
    
    
    socket.on('movePad', (data) => {
        console.log('Received movePad event:', data);
        if (data.pad === 1) {
            pad1.mesh.position.y = data.position;
        } else if (data.pad === 2) {
            pad2.mesh.position.y = data.position;
        } else {
            pad1.mesh.position.y = data.pad1;
            pad2.mesh.position.y = data.pad2;
        }
    });

    socket.on('updateScores', (scores) => {
        document.getElementById('scoreLeft').textContent = scores.score1;
        document.getElementById('scoreRight').textContent = scores.score2;
    });
}

initGame();

function movePads() {
    const speed = 0.02;

    const pad1Limit = tableHeight / 2 - padHeight / 2;
    const pad2Limit = tableHeight / 2 - padHeight / 2;

    if (pad1MoveUp && pad1.mesh.position.y + speed < pad1Limit) {
        pad1.mesh.position.y = pad1.mesh.position.y + speed;
        socket.emit('movePad', { pad: 1, position: pad1.mesh.position.y });
    }
    if (pad1MoveDown && pad1.mesh.position.y - speed > -pad1Limit) {
        pad1.mesh.position.y = pad1.mesh.position.y - speed;
        socket.emit('movePad', { pad: 1, position: pad1.mesh.position.y });
    }
    if (pad2MoveUp && pad2.mesh.position.y + speed < pad2Limit) {
        pad2.mesh.position.y = pad2.mesh.position.y + speed;
        socket.emit('movePad', { pad: 2, position: pad2.mesh.position.y });
    }
    if (pad2MoveDown && pad2.mesh.position.y - speed > -pad2Limit) {
        pad2.mesh.position.y = pad2.mesh.position.y - speed;
        socket.emit('movePad', { pad: 2, position: pad2.mesh.position.y });
    }
}

function emitPadMovement() {
    if (pad1MoveUp || pad1MoveDown || pad2MoveUp || pad2MoveDown) {
        const data = {
            pad1: pad1.mesh.position.y,
            pad2: pad2.mesh.position.y
        };
        console.log('Emitting movePad event:', data);
        socket.emit('movePad', data);
    }
}

function animate() {
    requestAnimationFrame(animate);
    movePads();
    renderer.render(scene, camera);
}

socket.on('start-game', () => {
    document.getElementById('waiting').classList.remove('active');
    animate();
});

