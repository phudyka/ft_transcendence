/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   light.mjs                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: phudyka <phudyka@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/26 16:25:19 by phudyka           #+#    #+#             */
/*   Updated: 2024/07/26 16:25:20 by phudyka          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from './node_modules/three/build/three.module.js';

export class sunLight extends THREE.DirectionalLight {
    constructor(color, intensity) {
        super(color, intensity);
        this.castShadow = true;

        this.position.set(-6, 11, -10);

        const target = new THREE.Object3D();
        target.position.set(0, 0, 0);
        this.target = target;

        this.shadow.mapSize.width = 2048;
        this.shadow.mapSize.height = 2048;
        this.shadow.camera.near = 0.5;
        this.shadow.camera.far = 500;

        this.shadow.camera.left = -10;
        this.shadow.camera.right = 10;
        this.shadow.camera.top = 10;
        this.shadow.camera.bottom = -10;
    }
}