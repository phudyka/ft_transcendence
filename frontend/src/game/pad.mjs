import * as THREE from "three";

export class Pad {
  constructor(
    color,
    length = 0.045,
    height = 0.50,
    seg = 16,
    x = -2.13,
    y = 3.59,
    z = 0,
  ) {
    const geometry = new THREE.CapsuleGeometry(length, height, seg, 32);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.3,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.set(1.56, 0, 0);
    this.targetY = this.mesh.position.y;
    this.speed = 0.03;
    this.score = 0;
    this.originColor = color;
    this.blink = null;
  }

  addToScene(scene) {
    scene.add(this.mesh);
  }

  updatePosition() {
    this.mesh.position.z += (this.targetY - this.mesh.position.z) * this.speed;
  }

  setTargetY(y) {
    this.targetY = y;
  }

  removeFromScene(scene) {
    // Le clignotement dure trois secondes et écrit dans `material.color` : une
    // manche qui se termine dans cet intervalle laissait un timer écrivant
    // dans un matériau déjà libéré. Ce qui anime l'objet meurt avec lui.
    stopBlink(this);
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }

  color() {
    // Le clignotement est en JavaScript : ni le bloc `prefers-reduced-motion`
    // de tokens.css ni le garde de la caméra ne l'atteignaient, et c'était le
    // seul mouvement du projet que le réglage système ne coupait pas. Au repos
    // il devient une couleur tenue trois secondes, qui dit la même chose.
    stopBlink(this);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.mesh.material.color.set(0xffff00);
      this.blink = setTimeout(
        () => this.mesh.material.color.set(this.originColor),
        3000,
      );
      return;
    }

    let countdown = 15;
    const intervalDuration = 200;

    this.blink = setInterval(() => {
      if (countdown % 2 === 0) {
        this.mesh.material.color.set(0xffff00);
      } else {
        this.mesh.material.color.set(this.originColor);
      }

      countdown--;
      if (countdown <= 0) {
        this.mesh.material.color.set(this.originColor);
        stopBlink(this);
      }
    }, intervalDuration);
  }
}

// `clearInterval` et `clearTimeout` partagent la même table de timers : un seul
// appel suffit pour les deux formes que prend le clignotement.
function stopBlink(pad) {
  clearInterval(pad.blink);
  pad.blink = null;
}
