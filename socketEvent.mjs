
import * as THREE from './node_modules/three/build/three.module.js';

export function initSocketEvent(socket, ball){

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

    document.getElementById('multi-tournament').addEventListener('click', () => {
        socket.emit('return-list');
    });

    document.getElementById('create-tournament').addEventListener('click', () => {
        socket.emit('create-tournament');
    });

    socket.on('tournament-list', (tournamentList) => {
        const tournamentMenu = document.getElementById('tournament-list');
        tournamentMenu.innerHTML = '';
    
        tournamentList.forEach(roomName => {
            const listItem = document.createElement('li');
            listItem.textContent = roomName;
            listItem.classList.add('tournament-item');
            
            listItem.addEventListener('click', () => {
                socket.emit('join-tournament', { roomName });
            });
            tournamentMenu.appendChild(listItem);
        });
    });

    socket.on('tournament-created', () => {
        displayTournamentPage();
    });
    
    socket.on('tournament-joined', () => {
        displayTournamentPage();
    });
    
    function displayTournamentPage() {
        document.getElementById('tournament').classList.remove('active');
        document.getElementById('tournament-page').style.display = 'flex';
    }
    
    document.getElementById('tournament-back-button').addEventListener('click', () => {
        document.getElementById('tournament').classList.remove('active');
        document.getElementById('multi').classList.add('active');
        document.getElementById('tournament-page').style.display = 'none';
    });

    socket.on('gameOver', (data) => {
        const winner = data.winner;
        const gameOverSection = document.getElementById('game-over');
        const winnerMessage = document.getElementById('winner-message');
        winnerMessage.textContent = `Le gagnant est ${winner}!`;
        gameOverSection.style.display = 'flex';
        
        document.getElementById('score').style.display = 'none';
        //document.getElementById('menu').classList.add('active');
        document.getElementById('tournament').classList.remove('active');
        
        document.getElementById('back-to-menu-button').addEventListener('click', () => {
            gameOverSection.style.display = 'none';
            document.getElementById('menu').classList.add('active');
        });
        socket.emit('endGame');
    });

}

export function hitPadEvent(socket, sounds) {
    socket.on('hitPad', () => {
        const audioContext = sounds.listener.context;

        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext resumed');
                sounds.play('pong');
            }).catch((err) => {
                console.error('Failed to resume AudioContext:', err);
            });
        } else {
            sounds.play('pong');
        }
    });
}

export function SoundLobby(socket, sounds) {
    socket.on('lobby', () => {
        const audioContext = sounds.listener.context;

        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext resumed');
                sounds.play('lobby');
            }).catch((err) => {
                console.error('Failed to resume AudioContext:', err);
            });
        } else {
            sounds.play('lobby');
        }
    });
}