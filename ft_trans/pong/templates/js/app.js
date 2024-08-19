import { login } from './views/login.js';
import { register } from './views/register.js';
import { dashboard } from './views/dashboard.js';
import { gameplay } from './views/gameplay.js';
import { profile } from './views/profile.js';

document.addEventListener('DOMContentLoaded', function () {
  function router() {
    const path = window.location.pathname;
    switch(path) {
        case '/':
            login();
            break;
        case '/login':
            login();
            break;
        case '/register':
            register();
            break;
        case '/dashboard':
            dashboard();
            break;
        case '/gameplay':
            gameplay();
            break;
        case '/gameplay_friends':
            gameplay_friends();
            break;
        case '/profile':
            profile();
            break;
        default:
            console.log('404: Page not found');
    }
}

  window.addEventListener('popstate', router);
  document.addEventListener('DOMContentLoaded', router);

  // Gestionnaire pour les clics sur les liens
  document.body.addEventListener('click', e => {
      if (e.target.matches('[data-link]')) {
          e.preventDefault();
          navigateTo(e.target.getAttribute('href'));
      }
  });

  // Initial route call
  router();
});

export function navigateTo(pathname) {
  window.history.pushState({}, pathname, window.location.origin + pathname);
  router();
}
