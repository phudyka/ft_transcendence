
import * as THREE from './node_modules/three/build/three.module.js';

import { scene, ball, pad1, pad2, pad3, pad4 } from './main.mjs'

export function initSocketEvent(socket){

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

    document.getElementById('quit-tournament').addEventListener('click', () => {
        socket.emit('quit-tournament');
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
    
    socket.on('tournament-updated', (socketIds) => {
        displayTournamentPage(socketIds);
    });

    socket.on('tournament-full', (socketIds) => {
        document.getElementById('space').classList.remove('hidden');
        console.log("tournament full");
        document.addEventListener('keydown', (event) => {
            const { key } = event;
                if (key === ' '){
                    socket.emit('player_ready');
                    console.log('key space');
                }     
        });
    });
    
    function displayTournamentPage(socketIds) {
        document.getElementById('tournament').classList.add('hidden');
        document.getElementById('tournament-details').classList.remove('hidden');
        document.getElementById('tournament-details').classList.add('flex');
        document.getElementById('player-1').textContent = socketIds.room[0];
        document.getElementById('player-2').textContent = socketIds.room[1];
        document.getElementById('player-3').textContent = socketIds.room[2];
        document.getElementById('player-4').textContent = socketIds.room[3];
    }
    
    document.getElementById('tournament-back-button').addEventListener('click', () => {
        document.getElementById('tournament').classList.remove('active');
        document.getElementById('multi').classList.add('active');
        document.getElementById('tournament-page').style.display = 'none';
    });

    socket.on('match-info', (data) => {
        const matchInfoDiv = document.getElementById('match-info');
        document.getElementById('match-info').classList.remove('hidden');
        
        matchInfoDiv.innerHTML = `<p>${data.message}</p><p>Début du match dans <span id="countdown">${data.countdown}</span> secondes...</p>`;
        
        let countdown = data.countdown;
        const countdownInterval = setInterval(() => {
            countdown--;
            document.getElementById('countdown').innerText = countdown;
    
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                matchInfoDiv.innerHTML = '';
                document.getElementById('match-info').classList.add('hidden');
            }
        }, 1000);
    });

    // socket.on('matchOver', (data) => {
    //     const winner = data.winner;
    //     const currentRoom = data.roomName;
    //     document.getElementById('score').classList.add('hidden');
    //     document.getElementById('score').classList.remove('score-container');
    //     document.getElementById('scoreLeft').textContent = 0;
    //     document.getElementById('scoreRight').textContent = 0;
    //     document.getElementById('tournament-details').classList.remove('hidden');
    //     document.getElementById('tournament-details').classList.add('flex');
    
    //     if (winner === socket.id) {
    //         socket.emit('match-finished', { playerWinner: winner, room: currentRoom });
    //     }

    //     //updateTournamentDisplay(winner);
    // });
    
    socket.on('update tournament', (winner) => {
        const winner1 = winner[0];
        const winner2 = winner[1];
        updateTournamentDisplay(winner2);
        updateTournamentDisplay(winner1);
    })

    function updateTournamentDisplay(winner) {
        const player1 = document.getElementById('player-1').textContent;
        const player2 = document.getElementById('player-2').textContent;
        const player3 = document.getElementById('player-3').textContent;
        const player4 = document.getElementById('player-4').textContent;
        
        const gagnant1 = document.getElementById('Gagnant-1');
        const gagnant2 = document.getElementById('Gagnant-2');
        
        if (winner === player1 || winner === player2) {
            if (gagnant1.textContent === '') {
                gagnant1.textContent = winner;
            } else {
                gagnant2.textContent = winner;
            }
        } else if (winner === player3 || winner === player4) {
            if (gagnant2.textContent === '') {
                gagnant2.textContent = winner;
            } else {
                gagnant1.textContent = winner;
            }
        }
        
        if (gagnant1.textContent && gagnant2.textContent) {
            const gagnantFinale = document.querySelector('div.colonne:nth-of-type(3) span');
            gagnantFinale.textContent = '';
        }
    }
    
    

    // socket.on('gameOver', (data) => {
    //     const winner = data.winner;
    //     const gameOverSection = document.getElementById('game-over');
    //     const winnerMessage = document.getElementById('winner-message');
    //     winnerMessage.textContent = `Le gagnant est ${winner}!`;
    //     gameOverSection.style.display = 'flex';
        
    //     document.getElementById('score').classList.add('hidden');
    //     document.getElementById('score').classList.remove('score-container');
    //     document.getElementById('scoreLeft').textContent = 0;
    //     document.getElementById('scoreRight').textContent = 0;
    //     //document.getElementById('menu').classList.add('active');
    //     document.getElementById('tournament').classList.remove('active');
        
    //     document.getElementById('back-to-menu-button').addEventListener('click', () => {
    //         gameOverSection.style.display = 'none';
    //         document.getElementById('menu').classList.remove('hidden');
    //     });
    //     socket.emit('endGame');
    // });

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
