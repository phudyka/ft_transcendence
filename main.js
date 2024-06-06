import * as THREE from 'three';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 2);

const textureLoader = new THREE.TextureLoader();
const sable = textureLoader.load('sable.jpg');

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.set(0, 1, 10);
sunLight.castShadow = true;
scene.add(sunLight);

const geometryback = new THREE.PlaneGeometry(7, 5, 5);
const materialback = new THREE.MeshPhongMaterial({map : sable});
const back = new THREE.Mesh(geometryback, materialback);
back.receiveShadow = true
scene.add(back);

const geometry = new THREE.BoxGeometry(4, 2, 0.1);
const material = new THREE.MeshPhongMaterial({color : 0x499BC2});
const table = new THREE.Mesh(geometry, material);
table.receiveShadow = true
scene.add(table);

const geometryPad = new THREE.BoxGeometry(0.1, 0.3, 0.1);
const materialPad = new THREE.MeshPhongMaterial({color : 0xff00ff})
const paddle = new THREE.Mesh(geometryPad, materialPad);
paddle.receiveShadow = true
paddle.position.set(-1.85, 0, 0);
scene.add(paddle);


function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}
animate();