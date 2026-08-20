import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export default async function loadModel(scene, onLoad, onProgress) {
  // La scène est compressée en meshopt (EXT_meshopt_compression) et ses textures
  // en WebP : 30,8 Mo à l'origine, 5,4 Mo aujourd'hui. Sans ce décodeur, le
  // chargement échoue.
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let ocean;

  try {
    // 5,2 Mo : sans fraction remontée, le clic sur START ouvrait sur du vide.
    const gltf = await loader.loadAsync(
      "/scenes/pong-scene.glb",
      (event) => {
        if (onProgress && event.lengthComputable) {
          onProgress(event.loaded / event.total);
        }
      },
    );
    const model = gltf.scene;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    markGroundSurfaces(model);

    const waterGeometry = new THREE.BoxGeometry(500, 500, 2);

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x20b8c5,
      transparent: true,
      opacity: 0.7,
      roughness: 0.3,
      metalness: 0.2,
      depthWrite: false,
    });

    ocean = new THREE.Mesh(waterGeometry, waterMaterial);
    ocean.receiveShadow = true;
    ocean.rotation.x = -Math.PI / 2;

    scene.add(ocean);

    const mixer = new THREE.AnimationMixer(model);

    const actions = {};

    for (const clip of gltf.animations) {
      if (!PLAYED_ANIMATIONS.has(clip.name)) continue;
      const action = mixer.clipAction(clip);
      actions[clip.name] = action;
      action.play();
    }

    model.scale.set(1.5, 1.5, 1.28);
    scene.add(model);
    onLoad(mixer, actions);
  } catch (error) {
    console.error("Error : Loading Island", error);
  }
}

/* Les seules pistes jouées. Le GLB en portait sept : les trois autres
 * (`PalmArmatureAction`, `PalmArmatureAction.001`, `Swim and Jump`) étaient
 * chargées puis ignorées. `scripts/bake-scene.mjs` lit cette liste pour élaguer
 * le fichier — la garder ici évite qu'un renommage supprime une piste jouée.
 */
export const PLAYED_ANIMATIONS = new Set([
  "Palmier",
  "Drapeau",
  "Sketchfab_modelAction",
  "Swim",
]);

/* Les cinq surfaces qui reçoivent l'ombre au lieu de la projeter.
 *
 * Trois d'entre elles ne sont pas elles-mêmes des mesh : leur géométrie est un
 * enfant anonyme. Le filtre `child.isMesh` qui portait ce test les écartait donc
 * en silence, et seuls les deux socles ont jamais reçu d'ombre. D'où la descente
 * d'un niveau — mais d'un seul : `eau` contient toute l'île, tout marquer
 * reviendrait à supprimer les ombres portées de la scène entière.
 *
 * Les noms sont ceux du graphe three, pas ceux du GLB : `createUniqueName()`
 * remplace les espaces par des tirets bas et retire les points.
 * `scripts/check-assets.mjs` échoue si l'un d'eux disparaît du fichier.
 */
export const GROUND_NODES = [
  "eau",
  "ile_sable_imparfait",
  "Plan001",
  "socle_turquoise_scene",
  "socle_sable_parfait",
];

function markGroundSurfaces(model) {
  for (const name of GROUND_NODES) {
    const node = model.getObjectByName(name);
    if (!node) continue;
    const surfaces = node.isMesh
      ? [node]
      : node.children.filter((c) => c.isMesh && !c.name);
    for (const surface of surfaces) {
      surface.receiveShadow = true;
      surface.castShadow = false;
    }
  }
}
