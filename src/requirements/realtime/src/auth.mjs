import jwt from 'jsonwebtoken';

// Vérification des JWT émis par Django (djangorestframework-simplejwt).
//
// Avant, le serveur de chat croyait sur parole le `username` du handshake et le
// serveur de jeu le `username` de l'événement du même nom : n'importe qui
// pouvait se présenter sous l'identité d'un autre, envoyer des messages privés
// en son nom ou faire enregistrer ses statistiques sur son compte.
//
// simplejwt signe en HS256 avec SECRET_KEY. L'algorithme est imposé ici :
// laisser la bibliothèque le lire dans l'en-tête ouvrirait la confusion
// d'algorithme (un jeton `alg: none` ou signé HMAC avec une clé publique).

const SECRET = process.env.DJANGO_SECRET_KEY;

if (!SECRET) {
    throw new Error('DJANGO_SECRET_KEY manquant : impossible de vérifier les jetons.');
}

export function verifyAccessToken(token) {
    if (!token) return null;
    try {
        const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
        // Un jeton de rafraîchissement ne doit pas ouvrir de socket.
        if (payload.token_type !== 'access') return null;
        if (!payload.display_name) return null;
        // simplejwt sérialise l'identifiant en chaîne, pas en nombre.
        return { id: String(payload.user_id), displayName: payload.display_name };
    } catch {
        return null;
    }
}

// Middleware de namespace socket.io : refuse la connexion sans jeton valide et
// attache l'identité vérifiée. Tout le reste du code lit `socket.data.user`
// plutôt que ce que le client prétend être.
export function requireAuth(socket, next) {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const user = verifyAccessToken(token);
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = user;
    socket.data.token = token;
    next();
}
