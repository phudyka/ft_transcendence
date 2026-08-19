import { AudioListener, Audio, AudioLoader } from 'three';

// Sons chargés au démarrage : écran titre et effets courts (~3,5 Mo au total).
const EAGER = {
    woosh:         { url: '/sound/woosh.mp3',        volume: 1,   loop: false },
    pong:          { url: '/sound/pong.mp3',         volume: 0.2, loop: false },
    ambient:       { url: '/sound/ambient.mp3',      volume: 0.2, loop: true  },
    lobby:         { url: '/sound/lobby.mp3',        volume: 0.1, loop: true  },
    win:           { url: '/sound/win.mp3',          volume: 0.1, loop: false },
    loose:         { url: '/sound/loose.mp3',        volume: 0.1, loop: false },
    Goal:          { url: '/sound/Goal.mp3',         volume: 0.3, loop: false },
    endTournament: { url: '/sound/Fin-tournois.mp3', volume: 0.3, loop: false },
};

// Musiques de partie : ~17 Mo, chargées à la demande et jamais toutes à la fois.
const LAZY = {
    inGame: { url: '/sound/inGame.mp3', volume: 0.1, loop: true },
    song1:  { url: '/sound/song1.mp3',  volume: 0.2, loop: true },
    song2:  { url: '/sound/song2.mp3',  volume: 0.2, loop: true },
    song3:  { url: '/sound/song3.mp3',  volume: 0.2, loop: true },
    song4:  { url: '/sound/song4.mp3',  volume: 0.2, loop: true },
    song5:  { url: '/sound/song5.mp3',  volume: 0.2, loop: true },
};

const SONG_KEYS = ['song1', 'song2', 'song3', 'song4', 'song5'];

export default class Sound {
    constructor(camera) {
        this.listener = new AudioListener();
        camera.add(this.listener);

        this.loader = new AudioLoader();
        this.sounds = {};   // name -> THREE.Audio, une fois chargé
        this.pending = {};  // name -> Promise, pour ne charger qu'une fois

        for (const name of Object.keys(EAGER)) {
            this.load(name);
        }
    }

    // Charge un son si besoin et résout sur l'objet Audio prêt à jouer.
    load(name) {
        if (this.sounds[name]) return Promise.resolve(this.sounds[name]);
        if (this.pending[name]) return this.pending[name];

        const spec = EAGER[name] || LAZY[name];
        if (!spec) {
            console.error(`Sound ${name} not found!`);
            return Promise.resolve(null);
        }

        this.pending[name] = new Promise((resolve) => {
            this.loader.load(
                spec.url,
                (buffer) => {
                    const sound = new Audio(this.listener);
                    sound.setBuffer(buffer);
                    sound.setVolume(spec.volume);
                    sound.setLoop(spec.loop);
                    if (name.startsWith('song')) {
                        sound.onEnded = () => this.onSongEnd();
                    }
                    this.sounds[name] = sound;
                    resolve(sound);
                },
                undefined,
                (error) => {
                    console.error(`Échec du chargement de ${spec.url}`, error);
                    resolve(null);
                }
            );
        });
        return this.pending[name];
    }

    // Le second paramètre existait pour distinguer deux tables de sons ; il est
    // conservé pour ne pas toucher aux appelants, mais n'a plus d'effet.
    play(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.play();
            return;
        }
        this.load(name).then((loaded) => loaded && loaded.play());
    }

    stop(name) {
        const sound = this.sounds[name];
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    playMusic() {
        this.activeSongs = this.shuffleArray([...SONG_KEYS]);
        this.currentSongIndex = 0;
        this.playNextSong();
    }

    playNextSong() {
        if (this.currentSong && this.currentSong.isPlaying) {
            this.currentSong.stop();
        }

        const name = this.activeSongs[this.currentSongIndex];
        this.load(name).then((sound) => {
            if (!sound) return;
            // Une autre piste a pu démarrer pendant le téléchargement.
            if (this.activeSongs[this.currentSongIndex] !== name) return;
            this.currentSong = sound;
            sound.play();
        });

        // Précharge la suivante pour éviter un silence entre deux pistes.
        const next = this.activeSongs[(this.currentSongIndex + 1) % this.activeSongs.length];
        if (next !== name) this.load(next);
    }

    onSongEnd() {
        this.currentSongIndex++;
        if (this.currentSongIndex >= this.activeSongs.length) {
            this.currentSongIndex = 0;
        }
        this.playNextSong();
    }

    stopMusic() {
        if (this.currentSong && this.currentSong.isPlaying) {
            this.currentSong.stop();
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
