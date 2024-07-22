import * as THREE from './node_modules/three/build/three.module.js';

export class Pad {
    constructor(color, length = 0.045, height = 0.50, seg = 16, x = -2.13, y = 0, z = 0) {
        const geometry = new THREE.CapsuleGeometry(length, height, seg, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            metalness: 0.5,
            roughness: 0.5
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.position.set(x, y, z);

        this.currentY = y;
        this.targetY = y;
        this.speed = 0.05; 
        this.smoothFactor = 0.5;
        this.friction = 0.95;
        this.maxY = 5; 
        this.minY = -5;
        this.score = 0;
    }
    addToScene(scene) {
        scene.add(this.mesh);
    }
    updatePosition() {
        this.currentY += (this.targetY - this.currentY) * this.smoothFactor;
        this.mesh.position.y = this.currentY;
        this.targetY = this.currentY * this.friction + this.targetY * (1 - this.friction);
    }
    moveTo(y) {
        this.targetY = Math.max(this.minY, Math.min(this.maxY, y));
    }
    setSpeed(speed) {
        this.speed = speed;
    }
}