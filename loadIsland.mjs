import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';

export default async function loadModel(scene) {
    const loader = new GLTFLoader();

    try {
        const gltf = await loader.loadAsync('scenes/pongScene_V1.glb');
        const model = gltf.scene;

        model.traverse((child) => {
            // if (child.isMesh && child.name != "Fond_marin_sable_" && child.name != "groupe_ocean" && child.name != "axe_sable" && child.name != "Plan002" && child.name != "Plan003") {
            //     if (child.name === "ile" || child.name === "base002") {
            //         child.receiveShadow = true;
            //     } else {
            //         child.castShadow = true;
            //         child.receiveShadow = true;
            //     }
            // }
            if (child.isMesh && child.name != "socle_sable_parfait" && child.name != "eau" 
                && child.name != "Plan" && child.name != "Plan002" && child.name != "Plan003" && child.name != "socle_turquoise_scene" 
                && child.name != "groupe_ocean" && child.name != "Fond_marin_sable_" && child.name != "base" && child.name != "ile_sable_imparfait")
                child.castShadow = true;
                child.receiveShadow = true;
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