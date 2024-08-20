import { PerspectiveCamera } from "./node_modules/three/build/three.module.js";

export default class Camera extends PerspectiveCamera {
    constructor() {
        super(50, window.innerWidth/window.innerHeight)
        this.position.set(0, 200, 50);
    }
}