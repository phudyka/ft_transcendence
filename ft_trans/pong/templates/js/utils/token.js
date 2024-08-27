export function callAPI(url, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    };

    const options = {
        method: method,
        headers: headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    return fetch(url, options)
        .then(response => {
            if (response.status === 401) {
                // Token expiré, essayez de le rafraîchir
                return refreshToken().then(success => {
                    if (success) {
                        // Token rafraîchi, réessayez l'appel original
                        headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
                        return fetch(url, options);
                    } else {
                        // Échec du rafraîchissement, redirigez vers la page de connexion
                        navigateTo('/login');
                        throw new Error('Session expirée');
                    }
                });
            }
            return response;
        })
        .then(response => response.json());
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
