// Version serveur : la raquette n'est plus qu'une position et un score.
// Le rendu, la couleur et l'ajout à la scène restent côté client.
export class Pad {
    constructor(x = -2.13, y = 3.59, z = 0) {
        this.position = { x, y, z };
        this.speed = 0.03;
        this.score = 0;
        // Dernière position diffusée aux clients ; voir Movepad() dans game.mjs.
        // NaN pour garantir une première émission, quelle que soit la position.
        this.lastSentZ = NaN;
    }
}
