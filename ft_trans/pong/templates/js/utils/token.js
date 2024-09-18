import { navigateTo } from '../app.js';

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
            refresh: localStorage.getItem('refreshToken')
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.access) {
            localStorage.setItem('accessToken', data.access);
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
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);
            return true;
        } else {
            return false;
        }
    })
    .catch(() => false);
}

export function logout() {
    // Déconnexion du socket si il existe
    if (globalSocket && globalSocket.connected) {
        globalSocket.disconnect();
        console.log('Utilisateur déconnecté du socket');
    }

    // Suppression des données locales
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('display_name');
    localStorage.removeItem('avatar_url');

    // Redirection vers la page de connexion
    navigateTo('/login');
}
