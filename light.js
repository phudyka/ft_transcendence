import * as THREE from 'three';

export class Light extends THREE.DirectionalLight {
    constructor(color, intensity) {
        super(color, intensity);
        this.castShadow = true;
        this.position.set(0, 10, 10);
        this.shadow.mapSize.width = 1024;
        this.shadow.mapSize.height = 1024;
        this.shadow.camera.near = 0.5;
        this.shadow.camera.far = 500;
    }
}