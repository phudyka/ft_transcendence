import { AudioListener, Audio, AudioLoader } from './node_modules/three/build/three.module.js';


export default class Sound {
    constructor(camera) {
        this.listener = new AudioListener();
        camera.add(this.listener);
        
        this.sounds = {};

        this.loadSound('pong', '/sound/pong.wav', 0.2, false);
        this.loadSound('ambient', '/sound/ambient.wav', 0.2, true);
        this.loadSound('lobby', '/sound/lobby.wav', 0.1, true);
        this.loadSound('inGame', '/sound/inGame.mp3', 0.1, true);
        this.loadSound('Goal', '/sound/Goal.mp3', 0.3, false);
        this.loadSound('endTournament', '/sound/Fin-tournois.mp3', 0.3, false);
    }

    loadSound(name, url, volume = 1, loop = false) {
        const sound = new Audio(this.listener);
        const audioLoader = new AudioLoader();

        audioLoader.load(url, (buffer) => {
            sound.setBuffer(buffer);
            sound.setVolume(volume);
            sound.setLoop(loop);
            this.sounds[name] = sound;
        });
    }

    play(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.play();
        } else {
            console.error(`Sound ${name} not found!`);
        }
    }

    stop(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.stop();
        } else {
            console.error(`Sound ${name} not found!`);
        }
    }
}