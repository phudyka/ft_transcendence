import { PerspectiveCamera } from "three";

// `animCam` vivait ici : un `setInterval` à 20 ms qui écrivait `position` pas à
// pas, pendant que la boucle rAF de `main.mjs` la faisait tourner sur elle-même
// à 60 Hz. Deux horloges, une seule propriété — la caméra tremblait à chaque
// lancement de match et à chaque retour au lobby. Le recadrage est maintenant
// un tween de cette boucle-là (`flyCamera`).
export default class Camera extends PerspectiveCamera {
  constructor() {
    super(50, window.innerWidth / window.innerHeight);
    this.position.set(0, 200, 50);
  }
}
