import * as THREE from './node_modules/three/build/three.module.js';

export class Ball {
    constructor(Radius, number) {
        const ballGeometry = new THREE.SphereGeometry(Radius, number, number);
        const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff8f00,
            metalness : 0.3,
            roughness: 0.3,
        });
        this.mesh = new THREE.Mesh(ballGeometry, ballMaterial);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.position.z = 0.03;
        this.maxSpeed = 0.06;
        this.speed = 0.02;
        this.collided = false;
        this.radius = Radius;
        this.direction = new THREE.Vector2(1, 1).normalize();
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    updatePosition() {
        this.mesh.position.x += this.direction.x * this.speed;
        this.mesh.position.y += this.direction.y * this.speed;
    }

    resetPosition() {
        this.mesh.position.set(0, 0, 0.05);
        this.speed = 0.02;
        this.direction.set(Math.random() > 0.5 ? 1 : -1, Math.random() > 0.5 ? 1 : -1).normalize();
    }

    checkCollision(paddle) {
        const paddleBox = new THREE.Box3().setFromObject(paddle.mesh);
        const ballBox = new THREE.Box3().setFromObject(this.mesh);
    
        if (ballBox.intersectsBox(paddleBox)) {
            const paddleCenter = paddleBox.getCenter(new THREE.Vector3());
            const ballPosition = this.mesh.position.clone();
            
            const distance = ballPosition.distanceTo(paddleCenter);
            
            if (distance <= this.radius + Math.max(paddle.mesh.scale.x, paddle.mesh.scale.y)) {
                const relativePosition = ballPosition.clone().sub(paddleCenter);
                relativePosition.normalize();
                
                this.direction.copy(relativePosition);
    
                if (this.speed < this.maxSpeed) {
                    this.speed += 0.01;
                }
                this.collided = true;
            }
        }
    }
}
    
