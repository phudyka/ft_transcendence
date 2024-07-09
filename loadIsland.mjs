import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';

export default async function loadModel(scene) {
    const loader = new GLTFLoader();

    try {
        const gltf = await loader.loadAsync('scenes/pongScene_V1.glb');
        const model = gltf.scene;

        model.traverse((child) => {
            if (child.isMesh && child.name != "Cube" && child.name != "Plan" && child.name != "base") {
                if (child.name === "ile" || child.name === "Plan001") {
                    child.receiveShadow = true;
                } else {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            }
        });

        model.position.set(0, -0.09, -3.59);
        model.scale.set(1.5, 1.5, 1.28);
        model.rotation.set(1.56, 0, 0);
        scene.add(model);
        console.log(model);
    } catch (error) {
        console.error('Error : Loading Island', error);
    }
}