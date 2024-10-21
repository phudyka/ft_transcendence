import { login, removeLoginEventListeners } from './views/login.js';
import { register } from './views/register.js';
import { dashboard } from './views/dashboard.js';
import { profile } from './views/profile.js';
import { settings } from './views/settingsv.js';
import { notFound } from './views/notfound.js';
import { initializeSocket, disconnectSocket } from './utils/socketManager.js';
import { getCookie } from './views/settingsv.js';

// Déclaration de router comme une variable globale au module
let router;


function initRouter() {
    router = function() {
        const path = window.location.pathname;

        // Liste des routes protégées
        const protectedRoutes = ['/dashboard', '/settings', '/profile/*'];

        // Vérifier si l'utilisateur tente d'accéder à une route protégée sans être connecté
        if (protectedRoutes.includes(path) && !isUserLoggedIn()) {
            console.log('Accès non autorisé. Redirection vers la page de connexion.');
            navigateTo('/login');
            return;
        }

        if (path.startsWith('/profile/') && isUserLoggedIn()) {
            const friendName = decodeURIComponent(path.split('/').pop());
            profile(friendName);
        } else {
            switch (path) {
                case '/':
                    login();
                    break;
                case '/login':
                    if (isUserLoggedIn()) {
                        navigateTo('/dashboard');
                    } else {
                        login();
                    }
                    break;
                case '/dashboard':
                    dashboard();
                    break;
                case '/register':
                    if (isUserLoggedIn()) {
                        navigateTo('/dashboard');
                    } else {
                        register();
                    }
                    break;
                case '/settings':
                    settings();
                    break;
                default:
                    notFound();
                    console.log('404: Page not found');
            }
        }
    };

    window.addEventListener('popstate', router);

    // Gestionnaire pour les clics sur les liens
    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]')) {
            e.preventDefault();
            navigateTo(e.target.getAttribute('href'));
        }
    });

    // Initial route call
    router();

    function handleSocketConnection() {
        const username = sessionStorage.getItem('username');
        if (username) {
            const socket = initializeSocket(username);
            if (socket) {
                console.log('Socket initialisé avec succès');
            } else {
                console.error('Échec de l\'initialisation du socket');
            }
        } else {
            disconnectSocket();
        }
    }

    handleSocketConnection();

    window.addEventListener('storage', (event) => {
        if (event.key === 'username') {
            handleSocketConnection();
        }
    });
}

export function navigateTo(pathname) {
    const protectedRoutes = ['/dashboard', '/settings', '/profile/*'];

    if (protectedRoutes.includes(pathname) && !isUserLoggedIn()) {
        console.log('Accès non autorisé. Redirection vers la page de connexion.');
        pathname = '/login';
    }

    const fullPath = window.location.origin + pathname;
    window.history.pushState({}, pathname, fullPath);
    router();
}

document.addEventListener('DOMContentLoaded', initRouter);

function isUserLoggedIn() {
    return sessionStorage.getItem('username') !== null;
}

// Exportez également initRouter si vous en avez besoin ailleurs
export { initRouter };
