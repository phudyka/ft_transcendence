import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { Light } from './light.mjs';
import { Pad } from './pad.mjs';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';


const socket = io();

let pad1MoveUp = false;
let pad1MoveDown = false;
let pad2MoveUp = false;
let pad2MoveDown = false;

var pad1;
var pad2;

const tableHeight = 2.70;
const padHeight = 0.5;

var scene;
var camera;
var renderer;
var island;

function initGame() {

    document.getElementById('multi-button').addEventListener('click', () => {
        socket.emit('multi');
    });

    document.getElementById('solo-button').addEventListener('click', () => {
        socket.emit('solo');
    });

    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -80, 80);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio * 0.8);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x7EB6F7); // Fond blanc
    document.body.appendChild(renderer.domElement);

    const sunLight = new Light(0xffffff, 2.5);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Couleur gris et intensité augmentée
    scene.add(ambientLight);

    const loader = new GLTFLoader();

    loader.load('scenes/pong_scene_maj.glb', function (gltf) {
        island = gltf.scene;
        island.traverse((child) => {
            if (child.isMesh && child.name != "Cube" && child.name != "Plan" && child.name != "base") {
                if (child.name === "ile" || child.name === "Plan001")
                    {
                        child.receiveShadow = true;
                    }
                else{
                    child.castShadow = true;
                    child.receiveShadow = true;

                }
            }
        });
        island.position.set(0, -0.09, -3.59);
        island.scale.set(1.5, 1.5, 1.28);
        island.rotation.set(1.56, 0, 0);
        scene.add(island);
        console.log(island);
    });

    pad1 = new Pad(0xc4d418);
    pad1.addToScene(scene);
    
    pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 2.10, 0, 0);
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
            clearInterval(cameraAnimation);
        }

        renderer.render(scene, camera);
    }, interval);
}

initGame();

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.25;
// controls.screenSpacePanning = false;

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
    // controls.update();
    //console.log(camera.position);
    renderer.render(scene, camera);
}

socket.on('start-game', () => {
    document.getElementById('waiting').classList.remove('active');
    animate();
});

