/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   pad.mjs                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: phudyka <phudyka@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/26 16:25:29 by phudyka           #+#    #+#             */
/*   Updated: 2024/07/26 16:27:14 by phudyka          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from './node_modules/three/build/three.module.js';

export class Pad {
    constructor(color, length = 0.045, height = 0.50, seg = 16, x = -2.13, y = 3.59, z = 0) {
        const geometry = new THREE.CapsuleGeometry(length, height, seg, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            metalness: 0.3,
            roughness: 0.3
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.position.set(x, y, z);
        this.mesh.rotation.set(1.56,0,0)
        this.targetY = this.mesh.position.y;
        this.speed = 0.04;
        this.score = 0;
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
}