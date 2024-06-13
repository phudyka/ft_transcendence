import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Pad } from './pad.js';
import { Light } from './light.js';
import { Ball } from './ball.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, -2, 3);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    stencil: false,
    preserveDrawingBuffer: false,
    depth: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio * 0.6);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const sunLight = new Light(0xffffff, 3);
scene.add(sunLight);

const loader = new GLTFLoader();
loader.load('./assets3D/scenes/pong_scene2.glb', (gltf) => {
    const beachScene = gltf.scene;
    beachScene.scale.set(1, 0.8, 0.4);
	beachScene.position.z = -1;
    beachScene.rotation.x = -Math.PI / 2;
    scene.add(beachScene);
}, undefined, (error) =>
{
    console.error('An error happened while loading the GLTF file:', error);
});

const geometryback = new THREE.PlaneGeometry(7, 5, 5);
const materialback = new THREE.MeshPhongMaterial({ color: 0x000000 });
const back = new THREE.Mesh(geometryback, materialback);
back.receiveShadow = true;
// scene.add(back);

const geometry = new THREE.BoxGeometry(4.10, 2, 0.01);
const material = new THREE.MeshPhongMaterial({ color: 0x499BC2 });
const table = new THREE.Mesh(geometry, material);
table.receiveShadow = true;
scene.add(table);

const pad1 = new Pad(0xc4d418);
pad1.addToScene(scene);

const pad2 = new Pad(0xfa00ff, 0.05, 0.3, 0.2, 1.85, 0, 0);
pad2.addToScene(scene);

const ballRadius = 0.07;
const ball = new Ball(ballRadius, 32);
scene.add(ball.mesh);

let pad1MoveUp = false;
let pad1MoveDown = false;
let pad2MoveUp = false;
let pad2MoveDown = false;

document.addEventListener('keydown', (event) => {
    if (event.key === 'w') pad1MoveUp = true;
    if (event.key === 's') pad1MoveDown = true;
    if (event.key === 'ArrowUp') pad2MoveUp = true;
    if (event.key === 'ArrowDown') pad2MoveDown = true;
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'w') pad1MoveUp = false;
    if (event.key === 's') pad1MoveDown = false;
    if (event.key === 'ArrowUp') pad2MoveUp = false;
    if (event.key === 'ArrowDown') pad2MoveDown = false;
});

const tableHeight = table.geometry.parameters.height;
const tableWidth = table.geometry.parameters.width;
const padHeight = pad1.mesh.geometry.parameters.height;
const padWidth = pad1.mesh.geometry.parameters.width;

function movePads() {
    const speed = 0.07;

    const pad1Limit = tableHeight / 2 - padHeight / 2;
    const pad2Limit = tableHeight / 2 - padHeight / 2;

    if (pad1MoveUp && pad1.mesh.position.y + speed < pad1Limit) {
        pad1.mesh.position.y = pad1.mesh.position.y + speed;
    }
    if (pad1MoveDown && pad1.mesh.position.y - speed > -pad1Limit) {
        pad1.mesh.position.y = pad1.mesh.position.y - speed;
    }
    if (pad2MoveUp && pad2.mesh.position.y + speed < pad2Limit) {
        pad2.mesh.position.y = pad2.mesh.position.y + speed;
    }
    if (pad2MoveDown && pad2.mesh.position.y - speed > -pad2Limit) {
        pad2.mesh.position.y = pad2.mesh.position.y - speed;
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateBallPosition();
    movePads();
    renderer.render(scene, camera);
}

function updateBallPosition() {
    ball.updatePosition();
    ball.checkCollision(pad1);
    ball.checkCollision(pad2);
    checkWallCollision();
}

function checkWallCollision() {
    if (ball.mesh.position.y + ball.direction.y * ball.speed > tableHeight / 2 - ball.radius || ball.mesh.position.y + ball.direction.y * ball.speed < -tableHeight / 2 + ball.radius) {
        ball.direction.y *= -1;
    }

    if (ball.mesh.position.x > tableWidth / 2 + ball.radius || ball.mesh.position.x < -tableWidth / 2 - ball.radius) {
        ball.resetPosition();
    }
}

animate();
