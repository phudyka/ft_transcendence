import * as THREE from './node_modules/three/build/three.module.js';

export class Light extends THREE.DirectionalLight {
    constructor(color, intensity) {
        super(color, intensity);
        this.castShadow = true;

        this.position.set(-10, 5, 5);

        const target = new THREE.Object3D();
        target.position.set(0, 0, 0);
        this.target = target;

        this.shadow.mapSize.width = 1024;
        this.shadow.mapSize.height = 1024;
        this.shadow.camera.near = 0.5;
        this.shadow.camera.far = 500;

    }
}
