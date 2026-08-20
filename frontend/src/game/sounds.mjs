import { Audio, AudioListener, AudioLoader } from "three";

// Sons chargés au démarrage : écran titre et effets courts (~3,5 Mo au total).
const EAGER = {
  woosh: { url: "/sound/woosh.mp3", volume: 1, loop: false },
  pong: { url: "/sound/pong.mp3", volume: 0.2, loop: false },
  ambient: { url: "/sound/ambient.mp3", volume: 0.2, loop: true },
  win: { url: "/sound/win.mp3", volume: 0.1, loop: false },
  loose: { url: "/sound/loose.mp3", volume: 0.1, loop: false },
  goal: { url: "/sound/goal.mp3", volume: 0.3, loop: false },
  endTournament: { url: "/sound/tournament-end.mp3", volume: 0.3, loop: false },
};

// Boucles longues : lues en flux, jamais décodées entièrement.
//
// `AudioLoader` passe par `decodeAudioData` : le MP3 devient du PCM Float32 en
// mémoire. `in-game.mp3` (4,3 Mo) pèse une bonne quatre-vingtaine de mégaoctets
// une fois décodé, et rien n'était jamais libéré — les six pistes réunies
// approchaient les 300 Mo sur une session qui enchaîne les parties, soit un
// onglet qui tombe en pleine partie sur un téléphone d'entrée de gamme.
//
// `HTMLAudioElement` lit en flux : quelques secondes tamponnées, pas le
// fichier. Ces pistes ne sont pas spatialisées — aucune ne perd quoi que ce
// soit à sortir du graphe three.js.
const STREAMED = {
  lobby: { url: "/sound/lobby.mp3", volume: 0.1, loop: true },
  inGame: { url: "/sound/in-game.mp3", volume: 0.1, loop: true },
  song1: { url: "/sound/song1.mp3", volume: 0.2, loop: false },
  song2: { url: "/sound/song2.mp3", volume: 0.2, loop: false },
  song3: { url: "/sound/song3.mp3", volume: 0.2, loop: false },
  song4: { url: "/sound/song4.mp3", volume: 0.2, loop: false },
  song5: { url: "/sound/song5.mp3", volume: 0.2, loop: false },
};

const SONG_KEYS = ["song1", "song2", "song3", "song4", "song5"];

export default class Sound {
  constructor(camera) {
    this.listener = new AudioListener();
    camera.add(this.listener);

    this.loader = new AudioLoader();
    this.sounds = {}; // name -> THREE.Audio, une fois chargé
    this.pending = {}; // name -> Promise, pour ne charger qu'une fois
    this.streams = {}; // name -> HTMLAudioElement, pour les boucles longues

    for (const name of Object.keys(EAGER)) {
      this.load(name);
    }
  }

  // Une boucle longue : un élément média, créé au premier usage et réutilisé.
  stream(name) {
    if (this.streams[name]) return this.streams[name];
    const spec = STREAMED[name];
    if (!spec) return null;
    const element = new window.Audio(spec.url);
    element.preload = "none";
    element.volume = spec.volume;
    element.loop = spec.loop;
    this.streams[name] = element;
    return element;
  }

  // Charge un son si besoin et résout sur l'objet Audio prêt à jouer.
  load(name) {
    if (this.sounds[name]) return Promise.resolve(this.sounds[name]);
    if (this.pending[name]) return this.pending[name];

    const spec = EAGER[name];
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
          this.sounds[name] = sound;
          resolve(sound);
        },
        undefined,
        (error) => {
          console.error(`Échec du chargement de ${spec.url}`, error);
          resolve(null);
        },
      );
    });
    return this.pending[name];
  }

  play(name) {
    if (STREAMED[name]) {
      const element = this.stream(name);
      // `currentTime` avant que les métadonnées ne soient là lève une
      // InvalidStateError sur certains navigateurs : le fichier n'est pas
      // préchargé, la première lecture part de zéro de toute façon.
      if (element.readyState > 0) element.currentTime = 0;
      // Le navigateur refuse la lecture tant qu'aucun geste n'a eu lieu ; ici
      // il y en a toujours eu un (le bouton START), mais la promesse rejetée
      // ne doit pas remonter en erreur non gérée.
      element.play().catch(() => {});
      return;
    }

    const sound = this.sounds[name];
    if (sound) {
      sound.play();
      return;
    }
    this.load(name).then((loaded) => loaded && loaded.play());
  }

  stop(name) {
    if (STREAMED[name]) {
      this.streams[name]?.pause();
      return;
    }
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
    this.currentSong?.pause();

    const name = this.activeSongs[this.currentSongIndex];
    const element = this.stream(name);
    if (!element) return;
    this.currentSong = element;
    if (element.readyState > 0) element.currentTime = 0;
    element.onended = () => this.onSongEnd();
    element.play().catch(() => {});
  }

  onSongEnd() {
    this.currentSongIndex++;
    if (this.currentSongIndex >= this.activeSongs.length) {
      this.currentSongIndex = 0;
    }
    this.playNextSong();
  }

  stopMusic() {
    this.currentSong?.pause();
    this.currentSong = null;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
