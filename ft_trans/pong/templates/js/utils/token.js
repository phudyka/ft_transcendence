import { navigateTo } from '../app.js';
import { getCookie } from '../views/settingsv.js';
import { removeDashboardEventListeners } from '../views/dashboard.js';
import { setLoggingOut } from './socketManager.js';
// Déclarez une variable globale pour stocker la référence au socket
let globalSocket;

// Fonction pour définir le socket global
export function setGlobalSocket(socket) {
    globalSocket = socket;
}

function refreshToken() {
    return fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            refresh: sessionStorage.getItem('refreshToken')
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.access) {
            sessionStorage.setItem('accessToken', data.access);
            return true;
        } else {
            return false;
        }
    })
    .catch(() => false);
}

export async function getCsrfToken() {
    const response = await fetch('/api/set-csrf-token/', {
        method: 'GET',
        credentials: 'include',
    });
    if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
    }
    throw new Error('Failed to get CSRF token');
}

export function generateToken() {
    return fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: 'admin',
            password: 'admin',
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.access && data.refresh) {
            sessionStorage.setItem('accessToken', data.access);
            sessionStorage.setItem('refreshToken', data.refresh);
            return true;
        } else {
            return false;
        }
    })
    .catch(() => false);
}

export async function logout() {
    setLoggingOut(true);

    // Mise à jour du statut en ligne avant de déconnecter
    const accessToken = sessionStorage.getItem('accessToken');
    const displayName = sessionStorage.getItem('display_name');
    if (accessToken && displayName) {
        try {
            await fetch('/api/update-online-status/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ is_online: false }),
            });
            console.log('Online status updated before logout.');
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    }

    // remove dashboard event listeners
    removeDashboardEventListeners();

    // disconnect socket if it exists
    if (globalSocket && globalSocket.connected) {
        globalSocket.disconnect();
        console.log('Utilisateur déconnecté du socket');
    }

    // clean session and cookies
    sessionStorage.clear();
    document.cookie = '';
    setLoggingOut(false);
    navigateTo('/login');
    console.log('Redirection vers la page de login et rechargement de la page');
    window.location.reload();
}

export async function refreshAccessToken() {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!refreshToken) {
        console.log('Aucun refresh token disponible.');
        logout();
        return false;
    }

    try {
        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        const data = await response.json();
        if (data.access) {
            sessionStorage.setItem('accessToken', data.access);
            return true;
        } else {
            logout();
            return false;
        }
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token :', error);
        logout();
        return false;
    }
}
