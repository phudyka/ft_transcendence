import * as THREE from './node_modules/three/build/three.module.js';

export class Ball {
    constructor(radius, segments) {
        this.maxSpeed = 0.1;
        this.initialSpeed = 0.02;
        this.acceleration = 0.01;
        this.bounceFactor = 0.8; 

        const ballGeometry = new THREE.SphereGeometry(radius, segments, segments);
        const ballMaterial = new THREE.MeshStandardMaterial({
            color: 0xff8f00,
            metalness: 0.3,
            roughness: 0.3,
        });

        this.mesh = new THREE.Mesh(ballGeometry, ballMaterial);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.position.z = 0.03;

        this.radius = radius;
        this.speed = this.initialSpeed;
        this.direction = new THREE.Vector2(Math.random() > 0.5 ? 1 : -1, Math.random() > 0.5 ? 1 : -1).normalize();
        this.collided = false;

        this.paddleBox = new THREE.Box3();
        this.ballBox = new THREE.Box3();
        this.paddleCenter = new THREE.Vector3();
        this.ballPosition = new THREE.Vector3();
        this.relativePosition = new THREE.Vector3();

        this.fieldWidth = 10;
        this.fieldHeight = 10;
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    updatePosition() {
        this.mesh.position.x += this.direction.x * this.speed;
        this.mesh.position.y += this.direction.y * this.speed;

        if (Math.abs(this.mesh.position.x) > this.fieldWidth / 2) {
            this.direction.x = -this.direction.x * this.bounceFactor;
            this.speed = Math.max(this.initialSpeed, this.speed * this.bounceFactor);
        }
        if (Math.abs(this.mesh.position.y) > this.fieldHeight / 2) {
            this.direction.y = -this.direction.y * this.bounceFactor;
            this.speed = Math.max(this.initialSpeed, this.speed * this.bounceFactor);
        }
    }

    resetPosition() {
        this.mesh.position.set(0, 0, 0.05);
        this.speed = this.initialSpeed;
        this.direction.set(Math.random() > 0.5 ? 1 : -1, Math.random() > 0.5 ? 1 : -1).normalize();
    }

    checkCollision(paddle) {
        this.paddleBox.setFromObject(paddle.mesh);
        this.ballBox.setFromObject(this.mesh);

        if (this.ballBox.intersectsBox(this.paddleBox)) {
            this.paddleCenter.copy(this.paddleBox.getCenter(this.paddleCenter));
            this.ballPosition.copy(this.mesh.position);

            const distance = this.ballPosition.distanceTo(this.paddleCenter);

            if (distance <= this.radius + Math.max(paddle.mesh.scale.x, paddle.mesh.scale.y)) {
                this.relativePosition.copy(this.ballPosition).sub(this.paddleCenter).normalize();
                this.direction.copy(this.relativePosition);

                this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
                this.collided = true;
            }
        }
    }
}