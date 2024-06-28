import * as THREE from './node_modules/three/build/three.module.js';


export class Pad {
    constructor(color, length = 0.045, height = 0.40, seg = 16, x = -1.85, y = 0, z = 0) {
        const geometry = new THREE.CapsuleGeometry(length, height, seg, 32);
        const material = new THREE.MeshPhongMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.set(x, y, z);
        this.targetY = this.mesh.position.y;
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

}