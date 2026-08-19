import { BALL_HALF, PAD_HALF } from './config.mjs';

// Version serveur : uniquement la physique, sans three.
//
// L'original construisait un THREE.Mesh et faisait ses collisions avec
// Box3.setFromObject à chaque tick. Les demi-extents des boîtes sont fixes :
// ils sont figés dans config.mjs et vérifiés contre three par
// scripts/check-physics.mjs. Le reste est de l'arithmétique 2D.
//
// La position garde un `y` constant (3,59) parce que le client l'attend dans
// la scène, mais aucun calcul ne s'en sert : les deux boîtes sont à la même
// hauteur, donc l'écart vertical est toujours nul.

export class Ball {
    constructor() {
        this.maxSpeed = 0.1;
        this.initialSpeed = 0.02;
        this.acceleration = 0.01;
        this.bounceFactor = 0.8;

        this.position = { x: 0, y: 3.59, z: 0 };
        this.radius = BALL_HALF;
        this.speed = this.initialSpeed;

        // Le service d'engagement partait d'un Vector3(±1, ±1) — le troisième
        // argument était omis, donc z valait 0 : la balle démarre à plat sur x.
        // resetPosition, lui, tire bien trois composantes. Comportement d'origine
        // conservé tel quel, il change le ressenti du premier point.
        this.direction = normalize({ x: randomSign(), z: 0 });

        this.fieldWidth = 10;
        this.fieldHeight = 10;
    }

    updatePosition() {
        this.position.x += this.direction.x * this.speed;
        this.position.z += this.direction.z * this.speed;

        // Inatteignable avec la table actuelle (4,70 × 2,715) : le score est
        // marqué bien avant ±5. Conservé au cas où les dimensions changeraient.
        if (Math.abs(this.position.x) > this.fieldWidth / 2) {
            this.direction.x = -this.direction.x * this.bounceFactor;
            this.speed = Math.max(this.initialSpeed, this.speed * this.bounceFactor);
        }
        if (Math.abs(this.position.z) > this.fieldHeight / 2) {
            this.direction.z = -this.direction.z * this.bounceFactor;
            this.speed = Math.max(this.initialSpeed, this.speed * this.bounceFactor);
        }
    }

    resetPosition() {
        this.position.x = 0;
        this.position.z = 0;
        this.speed = this.initialSpeed;
        // Trois composantes tirées, comme l'original : la composante y, bien que
        // jamais utilisée pour le déplacement, réduit x et z de 1/√2 à 1/√3.
        this.direction = normalize3({ x: randomSign(), y: randomSign(), z: randomSign() });
    }

    checkCollision(pad) {
        if (!intersects(this.position, BALL_HALF_BOX, pad.position, PAD_HALF)) return false;

        // L'original comparait ensuite la distance des centres à
        // `radius + max(scale.x, scale.z)`, soit 1,07 pour une échelle de 1.
        // Deux boîtes qui se touchent ont leurs centres à moins de 0,4 : le test
        // était toujours vrai. Il n'est pas reconduit.
        const dx = this.position.x - pad.position.x;
        const dz = this.position.z - pad.position.z;
        const length = Math.hypot(dx, dz);
        if (length === 0) return false;

        this.direction = { x: dx / length, z: dz / length };
        this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
        return true;
    }
}

const BALL_HALF_BOX = { x: BALL_HALF, y: BALL_HALF, z: BALL_HALF };

// Box3.intersectsBox : recouvrement inclusif sur les trois axes.
function intersects(centerA, halfA, centerB, halfB) {
    return Math.abs(centerA.x - centerB.x) <= halfA.x + halfB.x
        && Math.abs(centerA.y - centerB.y) <= halfA.y + halfB.y
        && Math.abs(centerA.z - centerB.z) <= halfA.z + halfB.z;
}

function randomSign() {
    return Math.random() > 0.5 ? 1 : -1;
}

function normalize({ x, z }) {
    const length = Math.hypot(x, z) || 1;
    return { x: x / length, z: z / length };
}

// Normalisation sur trois axes : y n'est pas conservé (le déplacement est plan)
// mais il pèse dans la norme, exactement comme le Vector3 d'origine.
function normalize3({ x, y, z }) {
    const length = Math.hypot(x, y, z) || 1;
    return { x: x / length, z: z / length };
}
