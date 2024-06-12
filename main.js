import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Pad } from './pad.js';
import { Light } from './light.js'

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, -2, 3);
camera.lookAt(0, 0, 0);


//const textureLoader = new THREE.TextureLoader();
//const tball = textureLoader.load('explosive.jpg');

const renderer = new THREE.WebGLRenderer({ antialias: true, 
    alpha: false, 
    stencil: false, 
    preserveDrawingBuffer: false, 
    depth: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio * 0.6);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const sunLight = new Light(0xffffff, 2);
scene.add(sunLight); 

const geometryback = new THREE.PlaneGeometry(7, 5, 5);
const materialback = new THREE.MeshPhongMaterial({ color : 0x000000 });
const back = new THREE.Mesh(geometryback, materialback);
back.receiveShadow = true;
scene.add(back);

const geometry = new THREE.BoxGeometry(4.10, 2, 0.01);
const material = new THREE.MeshPhongMaterial({ color: 0x499BC2 });
const table = new THREE.Mesh(geometry, material);
table.receiveShadow = true;
scene.add(table);

const pad1 = new Pad(0xffffff);
pad1.addToScene(scene);

const pad2 = new Pad(0xfff0ff, 0.05, 0.3, 0.2, 1.85, 0, 0);
pad2.addToScene(scene);

const ballRadius = 0.07;
const ballMaxSpeed = 0.09;
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMaterial = new THREE.MeshLambertMaterial({ color : 0xff8f00 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.receiveShadow = true;
ball.position.z = 0.05;
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

let ballSpeed = 0.03;

let ballDirectionX = 1;
let ballDirectionY = 1;

function animate() {
    requestAnimationFrame(animate);
    updateBallPosition();
    movePads();
    //controls.update();
    renderer.render(scene, camera);
}

function updateBallPosition() {
    moveBall();
    checkWallCollision();
    checkPaddleCollision(pad1);
    checkPaddleCollision(pad2);
}

function moveBall() {
    ball.position.x += ballDirectionX * ballSpeed;
    ball.position.y += ballDirectionY * ballSpeed;
}

function checkWallCollision() {
    if (ball.position.y + ballDirectionY * ballSpeed > tableHeight / 2 - ballRadius || ball.position.y + ballDirectionY * ballSpeed < -tableHeight / 2 + ballRadius) {
        ballDirectionY *= -1;
    }

    if (ball.position.x > tableWidth / 2 + ballRadius || ball.position.x < -tableWidth / 2 - ballRadius) {
        resetBall();
    }
}

function resetBall() {
    ballSpeed = 0.03;
    ball.position.x = 0;
    ball.position.y = 0;
    ballDirectionX = Math.random() > 0.5 ? 1 : -1;
    ballDirectionY = Math.random() > 0.5 ? 1 : -1;
}

function checkPaddleCollision(paddle) {
    const paddleBox = new THREE.Box3().setFromObject(paddle.mesh);
    const ballBox = new THREE.Box3().setFromObject(ball);

    if (ballBox.intersectsBox(paddleBox)) {
        const paddleCenter = paddleBox.getCenter(new THREE.Vector3());
        const ballPosition = ball.position.clone();

        const distance = ballPosition.distanceTo(paddleCenter);

        if (distance <= ballRadius + Math.max(paddle.mesh.scale.x, paddle.mesh.scale.y)) {
            const relativePosition = ballPosition.clone().sub(paddleCenter);

            relativePosition.normalize();

            ballDirectionX = relativePosition.x;
            ballDirectionY = relativePosition.y * 0.7;

        }
        if (ballSpeed < ballMaxSpeed)
            ballSpeed += 0.02;
    }
}

animate();