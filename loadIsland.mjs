import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';

export default async function loadModel(scene, onLoad) {
    const loader = new GLTFLoader();

    try {
        const gltf = await loader.loadAsync('scenes/pongScene_V1.glb');
        const model = gltf.scene;

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
            }
            if(child.isMesh && child.name === "socle_sable_parfait" || child.name === "eau" || child.name === "socle_turquoise_scene" || child.name === "Plan001"){
                child.receiveShadow = true;
                child.castShadow = false;
            }
        });

        const mixer = new THREE.AnimationMixer(model);

        let action;
        gltf.animations.forEach((clip) => {
            if (clip.name === 'Palmier') {
                action = mixer.clipAction(clip);
                action.play();
            }
        });
        model.position.set(0, -0.09, -3.59);
        model.scale.set(1.5, 1.5, 1.28);
        model.rotation.set(1.56, 0, 0);
        scene.add(model);
        console.log(model);
        onLoad(mixer, action);
    } catch (error) {
        console.error('Error : Loading Island', error);
    }
}