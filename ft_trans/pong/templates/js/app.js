import { login } from './views/login.js';
import { register } from './views/register.js';
import { dashboard } from './views/dashboard.js';
import { profile } from './views/profile.js';
import { settings } from './views/settings.js';
import { generateRandomUsername } from './views/dashboard.js';

// Déclaration de router comme une variable globale au module
let router;


function initRouter() {
    router = function() {
        const path = window.location.pathname;

        // Liste des routes protégées
        const protectedRoutes = ['/dashboard', '/settings'];

        // Vérifier si l'utilisateur tente d'accéder à une route protégée sans être connecté
        if (protectedRoutes.includes(path) && !isUserLoggedIn()) {
            console.log('Accès non autorisé. Redirection vers la page de connexion.');
            navigateTo('/login');
            return;
        }

        if (path.startsWith('/profile/')) {
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
}

export function navigateTo(pathname) {
    const protectedRoutes = ['/dashboard', '/settings'];

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
    return localStorage.getItem('username') !== null;
}

// Exportez également initRouter si vous en avez besoin ailleurs
export { initRouter };
