import * as THREE from './node_modules/three/build/three.module.js';
import { sunLight } from './light.mjs';
import { Pad } from './pad.mjs';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import loadModel from './loadIsland.mjs';
import { Ball } from './ball.mjs';
import { tableHeight } from './config.mjs';

const socket = io();

let pad1MoveUp = false;
let pad1MoveDown = false;
let pad2MoveUp = false;
let pad2MoveDown = false;
let pad3MoveUp = false;
let pad3MoveDown = false;
let pad4MoveUp = false;
let pad4MoveDown = false;
let controlledPad = null;

var pad1;
var pad2;
var pad3;
var pad4;

const padHeight = 0.5;

var scene;
var camera;
var renderer;

var nuages;
var nuagesMaterial;

let mixer;
let action;

const clock = new THREE.Clock();

function initGame() {

    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 200, 50);
    
    const loader = new THREE.TextureLoader();
    loader.load('png/ciel3.jpg', function(texture) {

    scene.background = texture;
    });

    renderer = new THREE.WebGLRenderer({ 
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    //renderer.setClearColor(0x7EB6F7);
    document.body.appendChild(renderer.domElement);

    // const axesHelper = new THREE.AxesHelper(10);
    // scene.add(axesHelper);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('./png/nuages.png', function(texture) {

    const planeGeo = new THREE.PlaneGeometry(window.innerWidth / 2, window.innerHeight / 2, 100);

    nuagesMaterial = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        opacity: 2
    });

    nuages = new THREE.Mesh(planeGeo, nuagesMaterial);
    nuages.position.set(0,60,0);
    nuages.rotation.set(-1.56,0,0)
    scene.add(nuages);
    });

    const Light = new sunLight(0xfffff0, 2);
    scene.add(Light);

    const Sun = new THREE.DirectionalLight(0xfffff0, 1);

    Sun.position.set(-5, 20, -15);
    //Sun.castShadow = true;
    scene.add(Sun);

    const ambientLight = new THREE.AmbientLight(0xfffff0, 0.5);
    scene.add(ambientLight);

    loadModel(scene, (loadedMixer, loadedAction) => {
        mixer = loadedMixer;
        action = loadedAction;
    });

    pad1 = new Pad(0xcc7700, 0.045, 0.50, 16, -2.10, 3.59, 0);
    pad1.addToScene(scene);
    
    pad2 = new Pad(0x2040df, 0.045, 0.50, 16, 2.10, 3.59, 0);
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
        else if (controlledPad === 3) {
            if (event.key === 'w') pad3MoveUp = true;
            if (event.key === 's') pad3MoveDown = true;
        }
        else if (controlledPad === 4) {
            if (event.key === 'ArrowUp') pad4MoveUp = true;
            if (event.key === 'ArrowDown') pad4MoveDown = true;
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
        else if (controlledPad === 3) {
            if (event.key === 'w') pad3MoveUp = false;
            if (event.key === 's') pad3MoveDown = false;
        }
        else if (controlledPad === 4) {
            if (event.key === 'ArrowUp') pad4MoveUp = false;
            if (event.key === 'ArrowDown') pad4MoveDown = false;
        }
        movePads();
    });
    
    socket.on('initBall', (data) => {
        ball.mesh.position.x = data.position.x;
        ball.mesh.position.z = data.position.z;
        console.log('Initial ball data received:', data);
    });
    
    socket.on('moveBall', (data) => {
        ball.mesh.position.x = data.position.x;
        ball.mesh.position.z = data.position.z;
        ball.speed = data.speed;
    });
    
    
    socket.on('movePad', (data) => {
        console.log('Received movePad event:', data);
            pad1.mesh.position.z = data.pad1;
            pad2.mesh.position.z = data.pad2;
            if (pad4)
            {
                pad3.mesh.position.z = data.pad3;
                pad4.mesh.position.z = data.pad4;
            }
    });

    socket.on('updateScores', (scores) => {
        document.getElementById('scoreLeft').textContent = scores.score1;
        document.getElementById('scoreRight').textContent = scores.score2;
    });

    socket.on('LeaveRoom', (room) => {
        socket.emit('disconnect');
    })

    const startOpacity = 2;
    const endOpacity = 0.0;

    const startPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };
    const endPosition = {
        x: 0,
        y: 8,
        z: 20
    };
    const duration = 5000;
    const interval = 16;
    const step = {
        x: (endPosition.x - startPosition.x) / (duration / interval),
        y: (endPosition.y - startPosition.y) / (duration / interval),
        z: (endPosition.z - startPosition.z) / (duration / interval),
        o: (endOpacity - startOpacity) / (duration / interval)
    };

    const cameraAnimation = setInterval(() => {
        camera.position.x += step.x;
        camera.position.y += step.y;
        camera.position.z += step.z;
        nuagesMaterial.opacity += step.o * 1.2;
        camera.lookAt(0,0,0);

        if (camera.position.z <= endPosition.z) {
            camera.position.set(endPosition.x, endPosition.y, endPosition.z);
            camera.lookAt(0,0,0);
            document.getElementById('menu').classList.add('active');
            clearInterval(cameraAnimation);
            scene.remove(nuages);
            nuages.geometry.dispose();
            nuages.material.dispose();
        }

        renderer.render(scene, camera);
    }, interval);

    document.getElementById('multi-button').addEventListener('click', () => {
        socket.emit('multi');
    });

    document.getElementById('solo-button').addEventListener('click', () => {
        socket.emit('solo');
    });

    document.getElementById('multi-four').addEventListener('click', () => {
        socket.emit('multi-four');
    });
    
}

function updateAnimation() {
    const delta = clock.getDelta();
    if (mixer) {
        mixer.update(delta);
    }
}

initGame();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = true;
controls.autoRotateSpeed = 0.3;
controls.autoRotate = true;

function movePads() {
    const padLimit = tableHeight / 2 - padHeight / 2;

    if (pad1MoveDown && pad1.mesh.position.z + pad1.speed < padLimit) {
        pad1.mesh.position.z = pad1.mesh.position.z + pad1.speed;
        socket.emit('movePad', { pad: 1, position: pad1.mesh.position.z });
    }
    else if (pad1MoveUp && pad1.mesh.position.z - pad1.speed > -padLimit) {
        pad1.mesh.position.z = pad1.mesh.position.z - pad1.speed;
        socket.emit('movePad', { pad: 1, position: pad1.mesh.position.z });
    }
    else if (pad2MoveDown && pad2.mesh.position.z + pad2.speed < padLimit) {
        pad2.mesh.position.z = pad2.mesh.position.z + pad2.speed;
        socket.emit('movePad', { pad: 2, position: pad2.mesh.position.z });
    }
    else if (pad2MoveUp && pad2.mesh.position.z - pad2.speed > -padLimit) {
        pad2.mesh.position.z = pad2.mesh.position.z - pad2.speed;
        socket.emit('movePad', { pad: 2, position: pad2.mesh.position.z });
    }
    else if (pad3MoveDown && pad3.mesh.position.z + pad3.speed < padLimit) {
        pad3.mesh.position.z = pad3.mesh.position.z + pad3.speed;
        socket.emit('movePad', { pad: 3, position: pad3.mesh.position.z });
    }
    else if (pad3MoveUp && pad3.mesh.position.z - pad3.speed > -padLimit) {
        pad3.mesh.position.z = pad3.mesh.position.z - pad3.speed;
        socket.emit('movePad', { pad: 3, position: pad3.mesh.position.z });
    }
    else if (pad4MoveDown && pad4.mesh.position.z + pad4.speed < padLimit) {
        pad4.mesh.position.z = pad4.mesh.position.z + pad4.speed;
        socket.emit('movePad', { pad: 4, position: pad4.mesh.position.z });
    }
    else if (pad4MoveUp && pad4.mesh.position.z - pad4.speed > -padLimit) {
        pad4.mesh.position.z = pad4.mesh.position.z - pad4.speed;
        socket.emit('movePad', { pad: 4, position: pad4.mesh.position.z });
    }
}

function animate() {
    requestAnimationFrame(animate);
    movePads();
    updateAnimation();
    //camera.up.set( 1, -1, 0 );
    controls.update();
    //console.log(camera.position);
    renderer.render(scene, camera);
}

socket.on('start-game', (rooms) => {
    document.getElementById('waiting').classList.remove('active');
    document.getElementById('score').classList.add('score-container');
    const player1 = rooms[0];
    const player2 = rooms[1];
    const player3 = rooms[2];
    const player4 = rooms[3];

    if (socket.id === player1) {
        controlledPad = 1;
    } else if (socket.id === player2) {
        controlledPad = 2;
    } else if (socket.id === player3) {
        controlledPad = 3;
    } else if (socket.id === player4) {
        controlledPad = 4;
    }
    if (player4) {
        pad3 = new Pad(0xcc7700, 0.045, 0.50, 16, -0.5, 3.59, 0);
        pad3.addToScene(scene);
    
        pad4 = new Pad(0x2040df, 0.045, 0.50, 16, 0.5, 3.59, 0);
        pad4.addToScene(scene);
    }
    console.log(controlledPad);
    animate();
});

