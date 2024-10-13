import { getCookie } from '../views/settingsv.js';

export async function fetchWithToken(url, options = {}) {
    const token = localStorage.getItem('accessToken');
    const csrfToken = getCookie('csrftoken');
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': csrfToken,
    };

    console.log('En-têtes de la requête:', headers);
    const method = options.method || 'GET';
    const response = await fetch(url, { ...options, method, headers });
    return response;
}
