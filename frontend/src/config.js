import { io } from 'socket.io-client';

// Le jeu et le chat partagent désormais un seul service temps réel, séparés par
// deux namespaces socket.io (/game et /chat) sur le chemin par défaut. Avant,
// c'était deux serveurs distincts sur /g_socket.io et /c_socket.io.
//
// En développement, Vite proxifie /socket.io vers nginx (voir vite.config.js) :
// l'origine de la page suffit. En production le frontend est servi par un
// hébergeur statique et le service vit ailleurs — il faut renseigner
// VITE_REALTIME_URL.
//
// Les appels REST, eux, restent en chemin relatif (/api/...) : c'est l'hébergeur
// statique qui les réécrit vers l'API, ce qui évite CORS et garde les cookies
// CSRF en same-origin.

export const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || window.location.origin;

// Le service refuse toute connexion sans JWT valide et en tire l'identité :
// il ne croit plus le nom que le client annonce.
function connect(namespace, options = {}) {
    return io(`${REALTIME_URL}${namespace}`, {
        transports: ['websocket'],
        auth: { token: sessionStorage.getItem('accessToken') },
        ...options,
    });
}

export const connectGame = () => connect('/game');
export const connectChat = (options) => connect('/chat', options);
