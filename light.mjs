import * as THREE from './node_modules/three/build/three.module.js';

export class sunLight extends THREE.DirectionalLight {
    constructor(color, intensity) {
        super(color, intensity);
        this.castShadow = true;
        this.position.set(-13, 11, 11);
        this.shadow.mapSize.width = 4096;
        this.shadow.mapSize.height = 4096;
        this.shadow.camera.near = 0.5;
        this.shadow.camera.far = 500;
        this.shadow.camera.left = -50;
        this.shadow.camera.right = 50;
        this.shadow.camera.top = 50;
        this.shadow.camera.bottom = -50;
    }
}