import * as THREE from 'three';

export class Light extends THREE.DirectionalLight {
    constructor(color, intensity) {
        super(color, intensity);
        this.castShadow = true;
        this.position.set(-5, 5, 20);
        //this.shadow.mapSize.width = window.innerWidth;
        //this.shadow.mapSize.height = window.innerHeight;
        //this.shadow.camera.near = 0.5;
        //this.shadow.camera.far = 500;
    }
}