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

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export default async function loadModel(scene, onLoad) {
    // La scène est compressée en meshopt (EXT_meshopt_compression) et ses textures
    // en WebP : 30,8 Mo à l'origine, 5,4 Mo aujourd'hui. Sans ce décodeur, le
    // chargement échoue.
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    let ocean;

    try {
        const gltf = await loader.loadAsync('/scenes/pongScene_V6.glb');
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

        const waterGeometry = new THREE.BoxGeometry(500, 500, 2);

        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e90ff,
            transparent: true,
            opacity: 0.7,
            roughness: 0.3,
            metalness: 0.2,
            depthWrite: false,
        });

        ocean = new THREE.Mesh(waterGeometry, waterMaterial);
        ocean.receiveShadow = true;
        ocean.rotation.x = - Math.PI / 2;

        scene.add(ocean);

        const mixer = new THREE.AnimationMixer(model);

        const actions = {};

        gltf.animations.forEach((clip) => {
            if (clip.name === 'Palmier' || clip.name === 'Palmier2' || clip.name === 'Drapeau' || clip.name === 'Sketchfab_modelAction' || clip.name === 'Swim') {
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
