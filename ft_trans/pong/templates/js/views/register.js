export function register() {
  document.getElementById('ft_transcendence').innerHTML = `
  <ul class="nav navbar-expand-lg justify-content-center">
  </ul>
  <h1>Register</h1>
  <li class="breadcrumb-item active" id="arrowbackregister">Back</li>
  <div class="container login-container">
      <form id="registerForm">
          <p>
              <label for="username" style="margin-top:3%;">username</label>
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

          <div class="choose-avatar">
            <div id="carouselExampleControls" class="carousel slide" data-ride="carousel" data-interval="false" keyboard="true">
          <div class="carousel-inner">
            <div class="carousel-item active">
              <img class="d-block w-100 avatar-image" src="https://i.ibb.co/C2WLdyY/avatar1.png" alt="First slide">
            </div>
            <div class="carousel-item">
              <img class="d-block w-100 avatar-image" src="https://i.ibb.co/0t3JTMz/avatar2.png" alt="Second slide">
            </div>
            <div class="carousel-item">
              <img class="d-block w-100 avatar-image" src="https://i.ibb.co/K08BjJx/avatar3.png" alt="Third slide">
            </div>
            <a class="carousel-control-prev" role="button" data-slide="prev">
              <span class="carousel-control-prev-icon" id="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="sr-only">Previous</span>
            </a>
            <a class="carousel-control-next" role="button" data-slide="next">
              <span class="carousel-control-next-icon" id="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="sr-only">Next</span>
            </a>
          </div>
          </div>
        </div>
          </p>
          <button id="registerbutton" type="submit" class="btn btn-primary btn-block">Register</button>
          <button id="registerbutton42" type="button" class="btn btn-primary btn-block">Register with 42</button>
      </form>
  </div>
  <footer class="py-3 my-4">
      <p class="text-center text-body-secondary">© 2024 42Company, Inc</p>
  </footer>
  `;

	document.addEventListener('click', function (event) {
		if (event.target.classList.contains('unmask') || event.target.closest('.unmask')) {
		  const button = event.target.closest('.unmask');  // Target the entire button
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

  document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Account created successfully');
    navigateTo('login');
  });

  document.getElementById('arrowbackregister').addEventListener('click', function(event) {
    event.preventDefault();
    navigateTo('login');
  });

  //carrousel
  document.getElementById('carousel-control-next-icon').addEventListener('click', function(event) {
    event.preventDefault();
    $('#carouselExampleControls').carousel('next');
  });

  document.getElementById('carousel-control-prev-icon').addEventListener('click', function(event) {
    event.preventDefault();
    $('#carouselExampleControls').carousel('prev');
  });
}
