import { navigateTo } from '../app.js';
import { getCsrfToken } from '../utils/token.js';

export function register() {
  document.getElementById('ft_transcendence').innerHTML = `
  <ul class="nav navbar-expand-lg justify-content-center"></ul>
  <h1>Register</h1>
  <li class="breadcrumb-item active" id="arrowbackregister">Back</li>
  <div class="container login-container">
    <form id="registerForm">
      <p>
        <label for="username" style="margin-top:3%;">username</label>
        <input type="text" value="" placeholder="Enter Username" id="username" required>
      </p>
      <p>
        <label for="email">Email</label>
        <input type="email" value="" placeholder="Enter Email" id="email" required>
      </p>
      <p>
        <label for="password">password</label>
      <div class="password-wrapper">
        <input type="password" value="" placeholder="Enter Password" id="password" class="password" required>
        <button class="unmask" type="button" title="Mask/Unmask password to check content">
          <i class="fas fa-lock"></i>
        </button>
      </div>
      </p>
      <p>
      <p>
        <label for="confirmPassword">confirm password</label>
      <div class="password-wrapper">
        <input type="password" value="" placeholder="Confirm Password" id="confirmPassword" class="password">
        <button class="unmask" type="button" title="Mask/Unmask password to check content">
          <i class="fas fa-lock"></i> 
        </button>
      </div>
      </p>
      <label for="email">choose avatar</label>
      <div class="choose-avatar-container">
      <a class="carousel-control-prev" role="button" data-slide="prev">
        <span class="carousel-control-prev-icon" id="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="sr-only">Previous</span>
      </a>
      <div class="choose-avatar">
        <div id="carouselExampleControls" class="carousel slide" data-ride="carousel" data-interval="false">
          <div class="carousel-inner">
            <div class="carousel-item active">
              <img class="d-block avatar-image" src="https://i.ibb.co/C2WLdyY/avatar1.png" alt="First slide">
            </div>
            <div class="carousel-item">
              <img class="d-block avatar-image" src="https://i.ibb.co/0t3JTMz/avatar2.png" alt="Second slide">
            </div>
            <div class="carousel-item">
              <img class="d-block avatar-image" src="https://i.ibb.co/K08BjJx/avatar3.png" alt="Third slide">
            </div>
            <div class="carousel-item">
              <img class="d-block avatar-image" src="https://i.ibb.co/6XW1X2L/avatar4.png" alt="Fourth slide">
            </div>
            <div class="carousel-item">
              <img class="d-block avatar-image" src="https://i.ibb.co/DVfTxB2/avatar5.png" alt="Fith slide">
            </div>
            <div class="carousel-item">
              <img class="d-block avatar-image" src="https://i.ibb.co/Bzvqgg3/avatar6.png" alt="Sixth slide">
            </div>
            <div class="carousel-item">
              <img class="d-block avatar-image" src="https://i.ibb.co/FDg3t8m/avatar7.png" alt="Seventh slide">
            </div>
          </div>
        </div>
      </div>
      <a class="carousel-control-next" role="button" data-slide="next">
        <span class="carousel-control-next-icon" id="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="sr-only">Next</span>
      </a>
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

    setupRegisterEvents(navigateTo);
}



function setupRegisterEvents(navigateTo) {

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

    document.getElementById('registerForm').addEventListener('submit', async function(event) {
      event.preventDefault();
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (password !== confirmPassword) {
          alert('Passwords do not match. Please try again.');
          return;
      }

      const selectedAvatar = document.querySelector('.carousel-item.active img').src;

      try {
          const csrfToken = await getCsrfToken();
          const response = await fetch('/api/register/', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'X-CSRFToken': csrfToken,
              },
              body: JSON.stringify({
                  username: username,
                  email: email,
                  password: password,
                  avatar_url: selectedAvatar
              }),
              credentials: 'include',
          });

          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
              const data = await response.json();
              if (data.success) {
                  alert(data.message);
                  navigateTo('/login');
              } else {
                  alert('Error during registration: ' + data.error);
              }
          } else {
              console.error("Received non-JSON response:", await response.text());
              alert('Received an unexpected response from the server. Please try again.');
          }
      } catch (error) {
          console.error('Error:', error);
          alert('An error occurred during registration: ' + error.message);
      }
  });

  document.getElementById('arrowbackregister').addEventListener('click', function(event) {
    event.preventDefault();
    navigateTo('/login');
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

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}
