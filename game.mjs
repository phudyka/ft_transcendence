/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.mjs                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: phudyka <phudyka@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/26 16:25:17 by phudyka           #+#    #+#             */
/*   Updated: 2024/07/26 16:25:18 by phudyka          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { tableHeight, tableWidth, padHeight } from './config.mjs';
import { Ball } from './ball.mjs';
import { Pad } from './pad.mjs';

let maxScore = 3; // (11 points to win)

function IApad(pad2, ball) {
    const speed = 0.1;
    const impreciseSpeed = 0.03;
    const padHeight = 0.5;
    const pad2Limit = tableHeight / 2 - padHeight / 2;
    const padPosition = pad2.mesh.position.clone();
    const ballPosition = ball.mesh.position.clone();

    const distance = ballPosition.distanceTo(padPosition);

    if (distance < 1.50) {
        const deltaY = ballPosition.z - padPosition.z;
        let newY = padPosition.z + deltaY * speed;

        if (newY > pad2Limit) {
            newY = pad2Limit;
        } else if (newY < -pad2Limit) {
            newY = -pad2Limit;
        }

        pad2.mesh.position.z = newY;
    } else {
        const imprecise = (Math.random() - 0.5) * 0.4;
        const targetPosition = ballPosition.z + imprecise;
        const deltaY = targetPosition - padPosition.z;
        let newY = padPosition.z + deltaY * impreciseSpeed;

        if (newY > pad2Limit) {
            newY = pad2Limit;
        } else if (newY < -pad2Limit) {
            newY = -pad2Limit;
        }
        pad2.mesh.position.z = newY;
    }
}

function checkWallCollision(ball, pad1, pad2, io, room) {

    if (ball.mesh.position.z + ball.direction.z * ball.speed > tableHeight / 2 - ball.radius - 0.02) {
        ball.direction.z *= -1;
        ball.mesh.position.z = tableHeight / 2 - ball.radius - 0.02;
    } else if (ball.mesh.position.z + ball.direction.z * ball.speed < -tableHeight / 2 + ball.radius + 0.02) {
        ball.direction.z *= -1;
        ball.mesh.position.z = -tableHeight / 2 + ball.radius + 0.02;
    }
    if (ball.mesh.position.x > tableWidth / 2 + ball.radius) {
        ball.resetPosition();
        pad1.score++;
        io.in(room).emit('updateScores', { score1: pad1.score, score2: pad2.score });
        if (pad1.score >= maxScore) { 
            io.in(room).emit('gameOver', { winner: 'Player 1', score1: pad1.score, score2: pad2.score });
            pad1.score = 0;
            pad2.score = 0;
            return true;
        }
    }
    if (ball.mesh.position.x < -tableWidth / 2 - ball.radius) {
        ball.resetPosition();
        pad2.score++;
        io.in(room).emit('updateScores', { score1: pad1.score, score2: pad2.score });
        if (pad2.score >= maxScore) { 
            io.in(room).emit('gameOver', { winner: 'Player 2', score1: pad1.score, score2: pad2.score });
            pad1.score = 0;
            pad2.score = 0;
            return true;
        }
    }
}

function updateBallPosition(ball, pad1, pad2, io, room, soloMode, keysPressed) {
    if (soloMode) {
        IApad(pad2, ball);
    }
    ball.updatePosition();
    checkWallCollision(ball, pad1, pad2, io, room);
    if (ball.checkCollision(pad1) === true) {
        io.in(room).emit('hitPad');
    }
    if (ball.checkCollision(pad2) === true) {
        io.in(room).emit('hitPad');
    }
    io.in(room).emit('moveBall', {
        position: { x: ball.mesh.position.x, z: ball.mesh.position.z },
        direction: { x: ball.direction.x, z: ball.direction.z },
        speed: ball.speed,
    }); 
    Movepad(pad1, pad2, keysPressed, room, io)
}

export function setupSoloGame(io, room, socket, rooms, roomsTypes, keysPressed) {
    const ball = new Ball(0.07, 32);
    const pad1 = new Pad(0xc4d418, 0.045, 0.50, 16, -2.13, 3.59, 0);
    const pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 2.10, 3.59, 0); // 2.10

    io.in(room).emit('initBall', {
        position: { x: ball.mesh.position.x, z: ball.mesh.position.z },
        direction: { x: ball.direction.x, z: ball.direction.z },
        speed: ball.speed,
    });

    let soloMode = false;
    if (roomsTypes === 'solo_vs_ia')
        soloMode = true;
    const interval = setInterval(() => updateBallPosition(ball, pad1, pad2, io, room, soloMode, keysPressed), 16);

    socket.on('disconnect', () => {
        clearInterval(interval);
        if (rooms[room]) {
            rooms[room] = rooms[room].filter(id => id !== socket.id);
            if (rooms[room].length === 0 && roomsTypes[room] === 'solo_vs_ia' || roomsTypes[room] === 'multi-2-local') {
                delete rooms[room];
                delete roomsTypes[room];
            }
        }
    });
}

function updateBallPositionFourPlayers(ball, pad1, pad2, pad3, pad4, io, room, keysPressed) {
        ball.updatePosition();
        checkWallCollision(ball, pad1, pad2, io, room);
        ball.checkCollision(pad1);
        ball.checkCollision(pad2);
        ball.checkCollision(pad3);
        ball.checkCollision(pad4);
        io.in(room).emit('moveBall', {
            position: { x: ball.mesh.position.x, z: ball.mesh.position.z },
            direction: { x: ball.direction.x, z: ball.direction.z },
            speed: ball.speed,
        });
        Movepad(pad1, pad2, keysPressed, room, io, pad3, pad4)
}

export function setupMultiGame(io, room, ball, pad1, pad2, keysPressed) {

    const interval = setInterval(() => updateBallPosition(ball, pad1, pad2, io, room, false, keysPressed), 16);
}

export function setupMultiGameFour(io, room, ball, pad1, pad2, pad3, pad4, keysPressed) {
    const interval = setInterval(() => updateBallPositionFourPlayers(ball, pad1, pad2, pad3, pad4, io, room, keysPressed), 16);
}

function Movepad(pad1, pad2, keysPressed, room, io, pad3, pad4) {

    const padLimit = tableHeight / 2 - padHeight / 2;
    
            if (keysPressed.pad1MoveDown && pad1.mesh.position.z + pad1.speed < padLimit) {
                pad1.mesh.position.z += pad1.speed;
            }
            if (keysPressed.pad1MoveUp && pad1.mesh.position.z - pad1.speed > -padLimit) {
                pad1.mesh.position.z -= pad1.speed;
            }
            if (keysPressed.pad2MoveDown && pad2.mesh.position.z + pad2.speed < padLimit) {
                pad2.mesh.position.z += pad2.speed;
            }
            if (keysPressed.pad2MoveUp && pad2.mesh.position.z - pad2.speed > -padLimit) {
                pad2.mesh.position.z -= pad2.speed;
            }
            if (pad4){
                if (keysPressed.pad3MoveDown && pad3.mesh.position.z + pad3.speed < padLimit) {
                    pad3.mesh.position.z += pad3.speed;
                }
                if (keysPressed.pad3MoveUp && pad3.mesh.position.z - pad3.speed > -padLimit) {
                    pad3.mesh.position.z -= pad3.speed;
                }
                if (keysPressed.pad4MoveDown && pad4.mesh.position.z + pad4.speed < padLimit) {
                    pad4.mesh.position.z += pad4.speed;
                }
                if (keysPressed.pad4MoveUp && pad4.mesh.position.z - pad4.speed > -padLimit) {
                    pad4.mesh.position.z -= pad4.speed;
                }
            }
            if (pad4)
            {
                io.in(room).emit('movePad', {
                    pad1: pad1.mesh.position.z,
                    pad2: pad2.mesh.position.z,
                    pad3: pad3.mesh.position.z,
                    pad4: pad4.mesh.position.z
                });   
            } else {
                io.in(room).emit('movePad', {
                    pad1: pad1.mesh.position.z,
                    pad2: pad2.mesh.position.z
                });
            }
}

export function setupTournamentGame(io, room, keysPressed)
{
    const ball = new Ball(0.07, 32);
    const pad1 = new Pad(0xc4d418, 0.045, 0.50, 16, -2.13, 3.59, 0);
    const pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 2.10, 3.59, 0);

    //let maxGame = 7;

    io.in(room).emit('tournament-full', {
        room: room
    });
}