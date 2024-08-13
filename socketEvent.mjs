
export function initSocketEvent(socket, ball, pad1, pad2, pad3, pad4){

    socket.on('initBall', (data) => {
        ball.mesh.position.x = data.position.x;
        ball.mesh.position.z = data.position.z;
        console.log('Initial ball data received:', data);
    });
    
    socket.on('moveBall', (data) => {
        ball.mesh.position.x = data.position.x;
        ball.mesh.position.z = data.position.z;
        ball.speed = data.speed;
    });
    
    socket.on('updateScores', (scores) => {
        document.getElementById('scoreLeft').textContent = scores.score1;
        document.getElementById('scoreRight').textContent = scores.score2;
    });
    
    socket.on('LeaveRoom', (room) => {
        socket.emit('disconnect');
    });
    
    document.getElementById('multi-2-local').addEventListener('click', () => {
        socket.emit('multi-2-local');
    });

    document.getElementById('multi-2-online').addEventListener('click', () => {
        socket.emit('multi-2-online');
    });
    
    document.getElementById('solo-ia').addEventListener('click', () => {
        socket.emit('solo_vs_ia');
    });
    
    document.getElementById('multi-four').addEventListener('click', () => {
        socket.emit('multi-four');
    });

    document.getElementById('tournament').addEventListener('click', () => {
        socket.emit('tournament');
    });

    socket.on('gameOver', (data) => {
        const winner = data.winner;
        document.getElementById('score').classList.remove('score-container');
        document.getElementById('menu').classList.add('active');
        document.getElementById('menu').innerHTML = `<h1>${winner} Wins!</h1>
            <button class="menu-button" id="back-to-menu-button">Back to Menu</button>`;
        socket.disconnect();
        document.getElementById('back-to-menu-button').addEventListener('click', () => {
            // Reconnecter le socket
            socket.connect();
            document.getElementById('menu').classList.remove('active');
            document.getElementById('menu').classList.add('active');
        });
    });

}

export function hitPadEvent(socket, sound, listener){
    socket.on('hitPad', ()=> {
        if (listener.context.state === 'suspended') {
            listener.context.resume().then(() => {
                console.log('AudioContext resumed');
                if (sound.isPlaying){
                    sound.stop();
                }
                sound.play();
            });
        } else {
            if (sound.isPlaying){
                sound.stop();
            }
            sound.play();
        }
    });

}

