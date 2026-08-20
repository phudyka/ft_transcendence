import { DirectionalLight, PMREMGenerator, Scene, Vector3 } from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";

// Cinq lumières éclairaient cette scène : deux directionnelles, une ponctuelle
// à cinquante unités, une hémisphérique et une ambiante. Aucune ne savait quoi
// que ce soit de la géométrie — d'où une île uniformément éclairée, sans un
// creux, et cinq évaluations par fragment.
//
// À la place : un ciel de Preetham, préfiltré en carte d'environnement. Il
// porte l'ambiante (le bleu du zénith, le chaud de l'horizon, le dégradé entre
// les deux) en une seule recherche dans une cubemap, remplace à lui seul les
// quatre lumières d'appoint, et donne aux matériaux métalliques de la balle et
// des raquettes quelque chose à réfléchir. L'occlusion de contact, elle, est
// cuite dans les couleurs de sommets du GLB, en amont du dépôt.
//
// Reste une seule lumière analytique : le soleil, qui porte les ombres.

// Direction du soleil, reprise de l'ancienne `sunLight`. Le ciel et l'ombre la
// partagent : les découpler, c'est une ombre qui part dans une direction que
// le dégradé du ciel dément.
const SUN = new Vector3(-6, 11, -10).normalize();
const SUN_DISTANCE = 18;

// Le boîtier de ciel doit contenir la scène sans dépasser le plan lointain de
// la caméra, qui reste à sa valeur par défaut de 2000.
const SKY_SIZE = 1000;

// L'ombre ne couvre plus que le terrain de jeu et les deux palmiers. Le frustum
// passe de ±10 à ±6.5 : à taille de shadow map égale, la densité de texels par
// unité monde augmente de deux tiers — l'ombre est plus nette qu'avant, pour le
// même coût. Ce qui sort du cadre (l'épave, à quarante-six unités) était de
// toute façon éliminé par le culling.
const SHADOW_EXTENT = 6.5;

export default function setupLighting(scene, renderer) {
  const sky = new Sky();
  sky.scale.setScalar(SKY_SIZE);

  const uniforms = sky.material.uniforms;
  uniforms.turbidity.value = 4;
  uniforms.rayleigh.value = 1.4;
  uniforms.mieCoefficient.value = 0.005;
  uniforms.mieDirectionalG.value = 0.8;
  uniforms.sunPosition.value.copy(SUN);

  // Le disque solaire est une singularité très brillante sur quelques pixels :
  // préfiltré en cubemap, il se répand en une tache qui déborde partout. On
  // l'éteint le temps de la capture, la lumière directionnelle le représente.
  uniforms.showSunDisc.value = false;

  const pmrem = new PMREMGenerator(renderer);
  const skyOnly = new Scene().add(sky);
  // Le rendu appartient à la scène, pas au générateur : `dispose()` libère les
  // ressources internes du PMREM sans toucher à la texture qu'il a produite.
  scene.environment = pmrem.fromScene(skyOnly).texture;
  pmrem.dispose();

  uniforms.showSunDisc.value = true;
  scene.add(sky);

  const sun = new DirectionalLight(0xfff4e0, 2.4);
  sun.position.copy(SUN).multiplyScalar(SUN_DISTANCE);
  // La partie se joue à hauteur de table, pas au niveau de l'eau : viser
  // l'origine décentrerait le frustum d'ombre d'une hauteur de socle.
  sun.target.position.set(0, 3, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 4;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -SHADOW_EXTENT;
  sun.shadow.camera.right = SHADOW_EXTENT;
  sun.shadow.camera.top = SHADOW_EXTENT;
  sun.shadow.camera.bottom = -SHADOW_EXTENT;
  // `normalBias` décale l'échantillon le long de la normale plutôt que dans la
  // profondeur : c'est ce qui enlève l'acné d'ombre sur les surfaces courbes
  // (la balle, les raquettes en capsule) sans décoller l'ombre de son objet.
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;

  scene.add(sun);
  scene.add(sun.target);

  return { sky, sun };
}
