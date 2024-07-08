import * as THREE from './node_modules/three/build/three.module.js';


export class Pad {
    constructor(color, length = 0.045, height = 0.50, seg = 16, x = -2.13, y = 0, z = 0) {
        const geometry = new THREE.CapsuleGeometry(length, height, seg, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            metalness : 0.3,
            roughness: 0.3
         });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.set(x, y, z);
        this.targetY = this.mesh.position.y;
        this.speed = 0.02;
        this.score = 0;
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

}