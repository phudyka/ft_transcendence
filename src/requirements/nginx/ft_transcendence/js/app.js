document.addEventListener('DOMContentLoaded', function () { 
  
  function navigateTo(url, updateHistory = true) {
    console.log('Navigating to', url);
    const viewId = url.startsWith('/') ? url.slice(1) : url;
    hideCurrentView();
    showView(viewId);
    if (updateHistory) {
      history.pushState({}, '', url);
    }
  }

  function hideCurrentView() {
    const activeView = document.querySelector('.active-view');
    if (activeView) {
      activeView.classList.remove('active-view');
      activeView.style.display = 'none';
    }
  }

  const viewActions = {
    register: (navigateTo) => RegistrationForm(navigateTo),
    login: (navigateTo) => login(navigateTo),
    dashboard: (navigateTo) => dashboard(navigateTo),
    gameplay: (navigateTo) => gameplay(navigateTo)
  };
  

  function showView(viewId) {
    const view = document.getElementById(viewId);

    if (view) {
      view.classList.add('active-view');
      view.style.display = 'block';
    } else if (viewActions[viewId]) {
      viewActions[viewId](navigateTo);
    } else {
      console.error(`View with ID "${viewId}" not found`);
    }
  }

  window.addEventListener('hashchange', function () {
    const hash = window.location.hash;
    if (hash) {
      const viewId = hash.slice(1);
      hideCurrentView();
      showView(viewId);
    }
  });

  const initialHash = window.location.hash;
  if (initialHash) {
    const viewId = initialHash.slice(1);
    showView(viewId);
  }

  document.addEventListener('click', function (event) {
    if (event.target.matches('[data-link]')) {
      event.preventDefault();
      const link = event.target.getAttribute('data-link');
      navigateTo(link);
    }
  });

  document.addEventListener('click', function (event) {
    if (event.target.matches('[data-link="/views/register"]')) {
      event.preventDefault();
      hideCurrentView();
      showView('register');
    }
  });

    function router() {
        console.log('Current path:', window.location.pathname);
        const routes = {
            '/views/login': () => login(navigateTo),
            '/views/dashboard': () => dashboard(navigateTo),
            '/views/chat': chat,
            '/views/gameplay': gameplay,
            '/views/register' : RegistrationForm,
        };

        const path = window.location.pathname;
        const route = routes[path] || login(navigateTo);
        route();
    }

    window.addEventListener('popstate', router);

    document.addEventListener('click', function (event) {
        if (event.target.matches('[data-link]')) {
            event.preventDefault();
            navigateTo(event.target.getAttribute('data-link'));
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('unmask') || event.target.closest('.unmask')) {
          const button = event.target.closest('.unmask');
          const input = button.previousElementSibling;
          if (input.type === 'password') {
            input.type = 'text';
            button.querySelector('i').classList.remove('fa-lock');
            button.querySelector('i').classList.add('fa-lock-open');
          } else {
            input.type = 'password';
            button.querySelector('i').classList.remove('fa-lock-open');
            button.querySelector('i').classList.add('fa-lock');
          }
        }
      });

    router();
});