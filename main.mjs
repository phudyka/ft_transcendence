/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.mjs                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: phudyka <phudyka@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/26 16:25:09 by phudyka           #+#    #+#             */
/*   Updated: 2024/08/12 16:47:02 by phudyka          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from './node_modules/three/build/three.module.js';
import { sunLight } from './light.mjs';
import { Pad } from './pad.mjs';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import loadModel from './loadIsland.mjs';
import { Ball } from './ball.mjs';
import { tableHeight } from './config.mjs';
import { hitPadEvent, initSocketEvent } from './socketEvent.mjs'

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
let controlledPads = null;

var pad1;
var pad2;
var pad3;
var pad4;

const padHeight = 0.5;

var scene;
var camera;
var renderer;
var listener;
var sound;

var nuages;
var nuagesMaterial;

let mixer;
let action;

let choice = false;

let protectEvent = false;

const clock = new THREE.Clock();
const fpsDisplay = document.getElementById('fpsDisplay');

function updateFPSDisplay() {
    measureFPS(1000, function(fps) {
        fpsDisplay.innerText = `FPS: ${Math.round(fps)}`;
    });
}

function measureFPS(duration = 1000, callback) {
    let frameCount = 0;
    let startTime = performance.now();

    function countFrames() {
        frameCount++;
        const now = performance.now();
        if (now - startTime < duration) {
            requestAnimationFrame(countFrames);
        } else {
            const fps = (frameCount / (now - startTime)) * 1000;
            callback(fps);
        }
    }

    requestAnimationFrame(countFrames);
}

function initGame() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 200, 50);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xfffff0, 0x080820, 1);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const pointLight = new THREE.PointLight(0xffa95c, 0.5, 100);
    pointLight.position.set(0, 50, 50);
    scene.add(pointLight);

    const logoTextureLoader = new THREE.TextureLoader();
    const logoTexture = logoTextureLoader.load('./png/logoScreen.png', function(texture) {
    const logoMaterial = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            opacity: 1
        });
        const logoGeometry = new THREE.PlaneGeometry(160, 100);
        const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
        logoMesh.position.set(0, 0, 0);
		logoMesh.rotation.set(-1.56, 0, 0);
        scene.add(logoMesh);

        renderer.render(scene, camera);

        setTimeout(() => {
            fadeOutLogoAndStartAnimation(logoMesh, logoMaterial);
        }, 2000);
    });
    
    measureFPS(1000, function(fps) {
        console.log(`FPS: ${Math.round(fps)}`);
        
        if (fps < 30) {
            console.log("LOW QUALITY MODE ON");
            renderer.setPixelRatio(window.devicePixelRatio / 1.5);
            renderer.shadowMap.enabled = false;
        }
        else if (fps < 90) {
            console.log("HIGH QUALITY MODE ON");
            renderer.setPixelRatio(window.devicePixelRatio / 1.2);
        }
        else {
            console.log("ULTRA QUALITY MODE ON");
        }
    });

    function fadeOutLogoAndStartAnimation(logoMesh, logoMaterial) {
        const fadeDuration = 2200; 
        const startTime = performance.now();

        function fadeOut() {
            const elapsedTime = performance.now() - startTime;
            const opacity = 1 - (elapsedTime / fadeDuration);
            logoMaterial.opacity = Math.max(opacity, 0);

            if (elapsedTime < fadeDuration) {
                requestAnimationFrame(fadeOut);
            } else {
                scene.remove(logoMesh);
                logoMesh.geometry.dispose();
                logoMesh.material.dispose();
                startCameraAnimation();
            }

            renderer.render(scene, camera);
        }

        fadeOut();
    }

    function startCameraAnimation() {
        const loader = new THREE.TextureLoader();
        loader.load('png/skybox.png', function(texture) {
            scene.background = texture;
        });

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('./png/clouds.png', function(texture) {
            const planeGeo = new THREE.PlaneGeometry(window.innerWidth / 2, window.innerHeight / 2, 100);
            nuagesMaterial = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true,
                opacity: 2
            });

            nuages = new THREE.Mesh(planeGeo, nuagesMaterial);
            nuages.position.set(0, 60, 0);
            nuages.rotation.set(-1.56, 0, 0);
            scene.add(nuages);

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
            const duration = 4500;
            const interval = 16;
            let elapsedTime = 0;

            const cameraAnimation = setInterval(() => {
                elapsedTime += interval;

                const newX = easeInOutExpo(elapsedTime, startPosition.x, endPosition.x - startPosition.x, duration);
                const newY = easeInOutExpo(elapsedTime, startPosition.y, endPosition.y - startPosition.y, duration);
                const newZ = easeInOutExpo(elapsedTime, startPosition.z, endPosition.z - startPosition.z, duration);
                const newOpacity = easeInOutExpo(elapsedTime, startOpacity, endOpacity - startOpacity, duration);

                camera.position.set(newX, newY, newZ);
                nuagesMaterial.opacity = newOpacity;
                camera.lookAt(0, 0, 0);

                if (elapsedTime >= duration) {
                    camera.position.set(endPosition.x, endPosition.y, endPosition.z);
                    camera.lookAt(0, 0, 0);
                    document.getElementById('menu').classList.add('active');
                    clearInterval(cameraAnimation);
                    scene.remove(nuages);
                    nuages.geometry.dispose();
                    nuages.material.dispose();
                }

                renderer.render(scene, camera);
            }, interval);
        });

        const Light = new sunLight(0xfffff0, 2);
        scene.add(Light);

        const Sun = new THREE.DirectionalLight(0xfffff0, 1);
        Sun.position.set(-5, 20, -15);
        scene.add(Sun);

        const ambientLight = new THREE.AmbientLight(0xfffff0, 0.5);
        scene.add(ambientLight);

        loadModel(scene, (loadedMixer, loadedAction) => {
            mixer = loadedMixer;
            action = loadedAction;
        });

        listener = new THREE.AudioListener();
        camera.add(listener);

        sound = new THREE.Audio(listener);

        var audioLoader = new THREE.AudioLoader();
        audioLoader.load('/sound/pong.wav', function(buffer) {
            sound.setVolume(0.2);
            sound.setLoop(false);
            sound.setBuffer(buffer);
        });

        pad1 = new Pad(0xcc7700, 0.045, 0.50, 16, -2.10, 3.59, 0);
        pad1.addToScene(scene);
        
        pad2 = new Pad(0x2040df, 0.045, 0.50, 16, 2.10, 3.59, 0);
        pad2.addToScene(scene);
        
        const ball = new Ball(0.07, 32);
        ball.addToScene(scene);

        document.addEventListener('keydown', (event) => {
            if (controlledPads) {
                if (event.key === 'w') socket.emit('padMove', { pad: 1, direction: 'up', moving: true });
                if (event.key === 's') socket.emit('padMove', { pad: 1, direction: 'down', moving: true });
                if (event.key === 'ArrowUp') socket.emit('padMove', { pad: 2, direction: 'up', moving: true });
                if (event.key === 'ArrowDown') socket.emit('padMove', { pad: 2, direction: 'down', moving: true });
            } else {
                if (controlledPad === 1) {
                    if (event.key === 'w') socket.emit('padMove', { pad: 1, direction: 'up', moving: true });
                    if (event.key === 's') socket.emit('padMove', { pad: 1, direction: 'down', moving: true });
                } else if (controlledPad === 2) {
                    if (event.key === 'ArrowUp') socket.emit('padMove', { pad: 2, direction: 'up', moving: true });
                    if (event.key === 'ArrowDown') socket.emit('padMove', { pad: 2, direction: 'down', moving: true });
                } else if (controlledPad === 3) {
                    if (event.key === 'w') socket.emit('padMove', { pad: 3, direction: 'up', moving: true });
                    if (event.key === 's') socket.emit('padMove', { pad: 3, direction: 'down', moving: true });
                } else if (controlledPad === 4) {
                    if (event.key === 'ArrowUp') socket.emit('padMove', { pad: 4, direction: 'up', moving: true });
                    if (event.key === 'ArrowDown') socket.emit('padMove', { pad: 4, direction: 'down', moving: true });
                }
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (controlledPads) {
                if (event.key === 'w') socket.emit('padMove', { pad: 1, direction: 'up', moving: false });
                if (event.key === 's') socket.emit('padMove', { pad: 1, direction: 'down', moving: false });
                if (event.key === 'ArrowUp') socket.emit('padMove', { pad: 2, direction: 'up', moving: false });
                if (event.key === 'ArrowDown') socket.emit('padMove', { pad: 2, direction: 'down', moving: false });
            } else {
                if (controlledPad === 1) {
                    if (event.key === 'w') socket.emit('padMove', { pad: 1, direction: 'up', moving: false });
                    if (event.key === 's') socket.emit('padMove', { pad: 1, direction: 'down', moving: false });
                } else if (controlledPad === 2) {
                    if (event.key === 'ArrowUp') socket.emit('padMove', { pad: 2, direction: 'up', moving: false });
                    if (event.key === 'ArrowDown') socket.emit('padMove', { pad: 2, direction: 'down', moving: false });
                } else if (controlledPad === 3) {
                    if (event.key === 'w') socket.emit('padMove', { pad: 3, direction: 'up', moving: false });
                    if (event.key === 's') socket.emit('padMove', { pad: 3, direction: 'down', moving: false });
                } else if (controlledPad === 4) {
                    if (event.key === 'ArrowUp') socket.emit('padMove', { pad: 4, direction: 'up', moving: false });
                    if (event.key === 'ArrowDown') socket.emit('padMove', { pad: 4, direction: 'down', moving: false });
                }
            }
        });
        
        initSocketEvent(socket, ball, pad1, pad2, pad3, pad4);
        hitPadEvent(socket, sound, listener);

        animateChoice();

        function easeInOutExpo(t, b, c, d) {
            if (t == 0) return b;
            if (t == d) return b + c;
            if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
            return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
        }
    }
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

function animateChoice() {
    if (choice === false){
        requestAnimationFrame(animateChoice);
        controls.update();
        updateAnimation();
        renderer.render(scene, camera);
    }
}

function animate() {
    updateFPSDisplay();
    requestAnimationFrame(animate);
    updateAnimation();
    console.log(camera.position);
    renderer.render(scene, camera);
}

socket.on('start-game', (rooms, roomsTypes) => {
    choice = true;
    camera.position.set(0, 8.4, 7.2);
    controls.target.set(0, 3, 0);
    controls.autoRotate = false;
    controls.update();
    document.getElementById('waiting').classList.remove('active');
    document.getElementById('score').classList.add('score-container');
    const player1 = rooms[0];
    const player2 = rooms[1];
    const player3 = rooms[2];
    const player4 = rooms[3];

    if (roomsTypes === 'multi-2-local'){
        controlledPads = [1, 2];
    } else {
        if (socket.id === player1) {
            controlledPad = 1;
        } else if (socket.id === player2) {
            controlledPad = 2;
        } else if (socket.id === player3) {
            controlledPad = 3;
        } else if (socket.id === player4) {
            controlledPad = 4;
        }
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

socket.on('movePad', (data) => {
    pad1.mesh.position.z = data.pad1;
    pad2.mesh.position.z = data.pad2;
    if (pad4)
    {
        pad3.mesh.position.z = data.pad3;
        pad4.mesh.position.z = data.pad4;
    }
});


    