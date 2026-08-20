import { createClouds } from "./plane.mjs";
import { showPanel } from "./panels.mjs";

const FADE_MS = 2000;

// Ce module n'anime plus que des opacités — sa propriété à lui, que personne
// d'autre n'écrit. La caméra appartient à la boucle rAF de `main.mjs`, et c'est
// elle seule qui rend : le vol d'entrée tournait sur un `setInterval` à 16 ms
// qui appelait `renderer.render` de son côté, si bien que la scène était peinte
// deux fois par image, à deux positions de caméra différentes.
export function fadeOutLogoAndStartAnimation(logo, scene, flyCamera) {
  fade(scene, logo, 1, () => {
    // Le fond cyan uni est remplacé par le boîtier de ciel de `light.mjs`, déjà
    // dans la scène : le peindre derrière ne ferait que le recouvrir.
    //
    // Les nuages partent à 2 : ils tiennent le cadre opaque la première moitié
    // du vol, puis s'ouvrent sur l'île.
    fade(scene, createClouds(scene), 2, () => showPanel("menu"));
    flyCamera();
  });
}

function fade(scene, object, from, onDone) {
  const start = performance.now();
  (function step() {
    const t = (performance.now() - start) / FADE_MS;
    object.material.opacity = Math.max(from * easeInOutExpo(1 - t, 0, 1, 1), 0);
    if (t < 1) return requestAnimationFrame(step);
    scene.remove(object);
    object.geometry.dispose();
    object.material.dispose();
    onDone();
  })();
}

export function easeInOutExpo(t, b, c, d) {
  if (t == 0) return b;
  if (t == d) return b + c;
  if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
  return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
}
