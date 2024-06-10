import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Pad } from './pad.js';
import { Light } from './light.js'

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 4);
camera.lookAt(0, 0, 0);

//const textureLoader = new THREE.TextureLoader();
//const sable = textureLoader.load('sable.jpg');

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const sunLight = new Light(0xffffff, 3);
scene.add(sunLight); 

const geometryback = new THREE.PlaneGeometry(7, 5, 5);
const materialback = new THREE.MeshPhongMaterial({ color : 0x000000 });
const back = new THREE.Mesh(geometryback, materialback);
back.receiveShadow = true;
scene.add(back);

const geometry = new THREE.BoxGeometry(4, 2, 0.1);
const material = new THREE.MeshPhongMaterial({ color: 0x499BC2 });
const table = new THREE.Mesh(geometry, material);
table.receiveShadow = true;
scene.add(table);

const pad1 = new Pad(0xffffff);
pad1.addToScene(scene);

const pad2 = new Pad(0xfff0ff, 0.1, 0.3, 0.2, 1.85, 0, 0);
pad2.addToScene(scene);

const ballRadius = 0.07;
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.receiveShadow = true;
scene.add(ball);
//const controls = new OrbitControls(camera, renderer.domElement);

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

const ballSpeed = 0.03;

let ballDirectionX = 1;
let ballDirectionY = 1;

function animate() {
    requestAnimationFrame(animate);
    updateBallPosition();
    movePads();
    renderer.render(scene, camera);
}

function updateBallPosition() {
    ball.position.x += ballDirectionX * ballSpeed;
    ball.position.y += ballDirectionY * ballSpeed;

    if (ball.position.y + ballDirectionY * ballSpeed > tableHeight / 2 - ballRadius || ball.position.y + ballDirectionY * ballSpeed < -tableHeight / 2 + ballRadius) {
        ballDirectionY *= -1;
    }

    if (ball.position.x > tableWidth / 2 + ballRadius || ball.position.x < -tableWidth / 2 - ballRadius) {
        ball.position.x = 0;
        ball.position.y = 0;
        ballDirectionX = Math.random() > 0.5 ? 1 : -1;
        ballDirectionY = Math.random() > 0.5 ? 1 : -1;
    }

    if (ball.position.x + ballDirectionX * ballSpeed > pad1.mesh.position.x - padWidth / 2 - ballRadius &&
        ball.position.x + ballDirectionX * ballSpeed < pad1.mesh.position.x + padWidth / 2 + ballRadius &&
        ball.position.y + ballDirectionY * ballSpeed > pad1.mesh.position.y - padHeight / 2 - ballRadius &&
        ball.position.y + ballDirectionY * ballSpeed < pad1.mesh.position.y + padHeight / 2 + ballRadius) {
        ballDirectionX *= -1;
    }

    if (ball.position.x + ballDirectionX * ballSpeed > pad2.mesh.position.x - padWidth / 2 - ballRadius &&
        ball.position.x + ballDirectionX * ballSpeed < pad2.mesh.position.x + padWidth / 2 + ballRadius &&
        ball.position.y + ballDirectionY * ballSpeed > pad2.mesh.position.y - padHeight / 2 - ballRadius &&
        ball.position.y + ballDirectionY * ballSpeed < pad2.mesh.position.y + padHeight / 2 + ballRadius) {
        ballDirectionX *= -1;
    }
}

animate();