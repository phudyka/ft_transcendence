/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   loadIsland.mjs                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: phudyka <phudyka@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/26 16:25:21 by phudyka           #+#    #+#             */
/*   Updated: 2024/07/26 16:25:22 by phudyka          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';

export default async function loadModel(scene, onLoad) {
    const loader = new GLTFLoader();

    try {
        const gltf = await loader.loadAsync('scenes/pongScene_V4.glb');
        const model = gltf.scene;

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
            }
            if(child.isMesh && (
                child.name === "socle_sable_parfait" || 
                child.name === "ile_sable_imparfait" || 
                child.name === "eau" || 
                child.name === "socle_turquoise_scene" || 
                child.name === "Plan001")) {
                child.receiveShadow = true;
                child.castShadow = false;
            }
        });

        const mixer = new THREE.AnimationMixer(model);

        const actions = {};

        gltf.animations.forEach((clip) => {
            if (clip.name === 'Palmier' || clip.name === 'Palmier2' || clip.name === 'Drapeau') {
                const action = mixer.clipAction(clip);
                actions[clip.name] = action;
                action.play();
            }
        });

        model.scale.set(1.5, 1.5, 1.28);
        scene.add(model);
        console.log(model);
        onLoad(mixer, actions);
    } catch (error) {
        console.error('Error : Loading Island', error);
    }
}
