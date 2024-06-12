import * as THREE from 'three';

export class Pad {
    constructor(color, width = 0.05, height = 0.3, depth = 0.2, x = -1.85, y = 0, z = 0) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhongMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.position.set(x, y, z);
        this.targetY = this.mesh.position.y;
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

}