import { WebGLRenderer, PCFSoftShadowMap } from 'three';

export default class Graphic extends WebGLRenderer {
    constructor(scene, camera) {
        super({ antialias: true });

        this.scene = scene;
        this.camera = camera;

        this.setSize(window.innerWidth, window.innerHeight);
        this.setPixelRatio(window.devicePixelRatio);
        this.shadowMap.enabled = true;
        this.shadowMap.type = PCFSoftShadowMap;

        document.body.appendChild(this.domElement);
    }
}