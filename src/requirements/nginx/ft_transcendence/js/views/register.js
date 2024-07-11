function RegistrationForm(navigateTo) {
  document.getElementById('ft_transcendence').innerHTML = `
    <h1>Register</h1>
    <div class="container login-container">
      <form id="registerForm">
        <p>
          <label for="username">username</label>
          <input type="text" value="" placeholder="Enter Username" id="username">
        </p>
        <p>
          <label for="password">password</label>
          <div class="password-wrapper">
            <input type="password" value="" placeholder="Enter Password" id="password" class="password">
            <button class="unmask" type="button" title="Mask/Unmask password to check content">
						  <i class="fas fa-lock"></i>
					  </button>
          </div>
        </p>
        <p>
          <label for="profile-photo">Choose profil picture</label>
          <div class="text-center" id=chose_pp>
            <img src="../../content/profil.png" class="img-thumbnail rounded-circle d-flex justify-content-center" style="width: 200px; height: 200px; " alt="Profile Picture">
          </div>
        </p>
        <button id ="registerbutton" type="submit" class="btn btn-primary btn-block">Register</button>
        <button id ="registerbutton42"type="submit" class="btn btn-primary btn-block">Register with 42</button>
        <button id ="arrowbackregister" class="btn btn-primary ">  
          <i class="bi bi-arrow-left"></i>
        </button>
      </form>
    </div>
    <footer class="py-3 my-4">
		  <p class="text-center text-body-secondary">© 2024 42Company, Inc</p>
	  </footer>
  `;

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

  document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // create account and add to database

    alert('Account created successfully');
    navigateTo('login');
  });

  document.getElementById('arrowbackregister').addEventListener('click', function (event) {
    event.preventDefault();
    navigateTo('login');
  });
}