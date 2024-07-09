import { tableHeight, tableWidth } from './config.mjs';
import { Ball } from './ball.mjs';
import { Pad } from './pad.mjs';

function IApad(pad2, ball) {
    const speed = 0.1;
    const impreciseSpeed = 0.03;
    const padHeight = 0.5;
    const pad2Limit = tableHeight / 2 - padHeight / 2;
    const padPosition = pad2.mesh.position.clone();
    const ballPosition = ball.mesh.position.clone();

    const distance = ballPosition.distanceTo(padPosition);

    if (distance < 1.50) {
        const deltaY = ballPosition.y - padPosition.y;
        let newY = padPosition.y + deltaY * speed;

        if (newY > pad2Limit) {
            newY = pad2Limit;
        } else if (newY < -pad2Limit) {
            newY = -pad2Limit;
        }

        pad2.mesh.position.y = newY;
    } else {
        const imprecise = (Math.random() - 0.5) * 0.4;
        const targetPosition = ballPosition.y + imprecise;
        const deltaY = targetPosition - padPosition.y;
        let newY = padPosition.y + deltaY * impreciseSpeed;

        if (newY > pad2Limit) {
            newY = pad2Limit;
        } else if (newY < -pad2Limit) {
            newY = -pad2Limit;
        }
        pad2.mesh.position.y = newY;
    }
}

function checkWallCollision(ball, pad1, pad2, io, room) {
    if (ball.mesh.position.y + ball.direction.y * ball.speed > tableHeight / 2 - ball.radius - 0.02) {
        ball.direction.y *= -1;
        ball.mesh.position.y = tableHeight / 2 - ball.radius - 0.02;
    } else if (ball.mesh.position.y + ball.direction.y * ball.speed < -tableHeight / 2 + ball.radius + 0.02) {
        ball.direction.y *= -1;
        ball.mesh.position.y = -tableHeight / 2 + ball.radius + 0.02;
    }

    if (ball.mesh.position.x > tableWidth / 2 + ball.radius) {
        ball.resetPosition();
        pad2.score++;
        io.in(room).emit('updateScores', { score1: pad1.score, score2: pad2.score });
    }
    if (ball.mesh.position.x < -tableWidth / 2 - ball.radius) {
        ball.resetPosition();
        pad1.score++;
        io.in(room).emit('updateScores', { score1: pad1.score, score2: pad2.score });
    }
}

function updateBallPosition(ball, pad1, pad2, io, room, soloMode) {
    if (soloMode) {
        IApad(pad2, ball);
    }
    ball.updatePosition();
    checkWallCollision(ball, pad1, pad2, io, room);
    ball.checkCollision(pad1);
    ball.checkCollision(pad2);
    io.in(room).emit('moveBall', {
        position: { x: ball.mesh.position.x, y: ball.mesh.position.y },
        direction: { x: ball.direction.x, y: ball.direction.y },
        speed: ball.speed,
    });
    io.in(room).emit('movePad', { pad1: pad1.mesh.position.y, pad2: pad2.mesh.position.y });
}

export function setupSoloGame(io, room, socket, rooms, roomsTypes) {
    const ball = new Ball(0.07, 32);
    const pad1 = new Pad(0xc4d418);
    const pad2 = new Pad(0xfa00ff, 0.045, 0.50, 16, 2.10, 0, 0);

    io.in(room).emit('initBall', {
        position: { x: ball.mesh.position.x, y: ball.mesh.position.y },
        direction: { x: ball.direction.x, y: ball.direction.y },
        speed: ball.speed,
    });

    socket.on('movePad', (data) => {
        if (data.pad === 1) {
            pad1.mesh.position.y = data.position;
        }
        io.in(room).emit('movePad', { pad1: pad1.mesh.position.y, pad2: pad2.mesh.position.y });
    });

    const interval = setInterval(() => updateBallPosition(ball, pad1, pad2, io, room, true), 16);

    socket.on('disconnect', () => {
        clearInterval(interval);
        if (rooms[room]) {
            rooms[room] = rooms[room].filter(id => id !== socket.id);
            if (rooms[room].length === 0 && roomsTypes[room] === 'solo') {
                delete rooms[room];
                delete roomsTypes[room];
            }
        }
    });
}

export function setupMultiGame(io, room, ball, pad1, pad2, interval) {
    interval = setInterval(() => updateBallPosition(ball, pad1, pad2, io, room, false), 16);
}
