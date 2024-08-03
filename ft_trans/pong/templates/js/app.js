document.addEventListener('DOMContentLoaded', function () {

  function navigateTo(viewId, ...args) {
    console.log('Navigating to', viewId);
    hideCurrentView();
    showView(viewId, ...args);
  }

  function hideCurrentView() {
    const activeView = document.querySelector('.active-view');
    if (activeView) {
      activeView.classList.remove('active-view');
      activeView.style.display = 'none';
    }
  }

  const viewActions = {
    register: (navigateTo) => register(navigateTo),
    login: (navigateTo) => login(navigateTo),
    dashboard: (navigateTo, ...args) => dashboard(navigateTo, ...args),
    gameplay: (navigateTo, ...args) => gameplay(navigateTo, ...args),
    gameplay_friends: (navigateTo, ...args) => gameplay_friends(navigateTo, ...args),
    profile: (navigateTo, playerName) => profile(navigateTo, playerName),
  };

  function showView(viewId, ...args) {
    const view = document.getElementById(viewId);

    if (view) {
      view.classList.add('active-view');
      view.style.display = 'block';
    } else if (viewActions[viewId]) {
      viewActions[viewId](navigateTo, ...args);
    } else {
      console.error(`View with ID "${viewId}" not found`);
    }
  }

  // Initial view display
  const initialViewId = 'dashboard';  // Default view to show on initial load
  showView(initialViewId);

  document.addEventListener('click', function (event) {
    if (event.target.matches('[data-link]')) {
      event.preventDefault();
      const link = event.target.getAttribute('data-link');
      navigateTo(link);
    }
  });
});
