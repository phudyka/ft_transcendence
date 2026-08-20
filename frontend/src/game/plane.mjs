import { Mesh, MeshBasicMaterial, PlaneGeometry, TextureLoader } from "three";

// Plan texturé posé à plat, ajouté à la scène. `logo.mjs` et `clouds.mjs`
// étaient deux copies de cette classe, identiques au jeu de valeurs par défaut
// près — le logo de démarrage et la nappe de nuages de l'animation d'entrée.
export default class TexturedPlane extends Mesh {
  constructor(
    scene,
    texturePath,
    width,
    height,
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: -1.56, y: 0, z: 0 },
  ) {
    super(
      new PlaneGeometry(width, height),
      new MeshBasicMaterial({
        map: new TextureLoader().load(texturePath),
        transparent: true,
        opacity: 1,
      }),
    );

    this.position.set(position.x, position.y, position.z);
    this.rotation.set(rotation.x, rotation.y, rotation.z);

    scene.add(this);
  }
}

export const createLogo = (scene) =>
  new TexturedPlane(scene, "/textures/logoScreen.png", 160, 100);

export const createClouds = (scene) =>
  new TexturedPlane(
    scene,
    "/textures/clouds.png",
    window.innerWidth / 2,
    window.innerHeight / 2,
    { x: 0, y: 60, z: 0 },
  );
