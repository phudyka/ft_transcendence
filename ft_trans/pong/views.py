from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import render
from django.middleware.csrf import get_token
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError
from django.shortcuts import redirect
import json
import logging
import requests
logger = logging.getLogger(__name__)
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import CustomUser
from django.contrib.auth.hashers import check_password, make_password
from django.conf import settings

User = get_user_model()

def create_user(request):
	if request.method == 'POST':
		data = json.loads(request.body)
		user = User.create_user(data['username'], data=data['password'])
		return JsonResponse({'message': 'user created with id ' + str(user.id)}, status=201)
	else:
		return JsonResponse({'error': 'invalid request'}, status=400)

def index(request, path=''):
	return render(request, 'index.html')

@ensure_csrf_cookie
def login_view(request):
	if request.method == 'POST':
		data = json.loads(request.body)
		username = data.get('username')
		password = data.get('password')

		user = authenticate(request, username=username, password=password)
		if user is not None:
			login(request, user)
			return JsonResponse({
				'success': True,
				'message': 'Connexion réussie',
				'username': user.username,
				'display_name': user.display_name,
				'avatar_url': user.avatar_url,
			})
		else:
			return JsonResponse({'success': False, 'message': 'Identifiants invalides'}, status=401)

	return JsonResponse({'success': False, 'message': 'Méthode non autorisée'}, status=405)

def content(request):
	return JsonResponse({'message': 'content page'}, status=200)

@ensure_csrf_cookie
def register_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            avatar_url = data.get('avatar_url')

            if User.objects.filter(username=username).exists():
                return JsonResponse({'success': False, 'error': 'This username is already taken.'})
            if User.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'error': 'This email is already in use.'})

            # Créer l'utilisateur avec les données fournies
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                avatar_url=avatar_url,
                display_name=username,
            )

            return JsonResponse({'success': True, 'message': 'Account created successfully.'})
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON data.'})
        except Exception as e:
            logger.error(f"Error during registration: {str(e)}")
            return JsonResponse({'success': False, 'error': f'An error occurred: {str(e)}'})

    return JsonResponse({'success': False, 'error': 'Invalid request method.'})

@ensure_csrf_cookie
def set_csrf_token(request):
    token = get_token(request)
    logger.info(f"CSRF Token generated: {token}")
    return JsonResponse({'csrfToken': get_token(request)})


def friend_requests(request):
    pass

def auth_42_redirect(request):
    redirect_uri = request.build_absolute_uri('/api/auth/42/callback/')
    return redirect(f'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-0bdec356ea53d09b3992d0f90a9e4b9cdf8d0659d321388f9ba8ee3a41448165&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2F&response_type=code')

@csrf_exempt
def auth_42_callback(request):
    try:
        code = request.GET.get('code')
        if not code:
            raise ValueError('No code provided')

        redirect_uri = request.build_absolute_uri('/api/auth/42/callback/')

        # Échange du code contre un token
        response = requests.post('https://api.intra.42.fr/oauth/token', data={
            'grant_type': 'authorization_code',
            'client_id': settings.FT_CLIENT_ID,
            'client_secret': settings.FT_CLIENT_SECRET,
            'code': code,
            'redirect_uri': redirect_uri
        })

        if response.status_code != 200:
            raise ValueError(f'Failed to obtain access token: {response.text}')

        access_token = response.json()['access_token']

        # Récupération des informations de l'utilisateur
        user_info_response = requests.get('https://api.intra.42.fr/v2/me', headers={
            'Authorization': f'Bearer {access_token}'
        })

        if user_info_response.status_code != 200:
            raise ValueError(f'Failed to get user info: {user_info_response.text}')

        user_info = user_info_response.json()

        # Création ou mise à jour de l'utilisateur dans la base de données
        user, created = CustomUser.objects.get_or_create(
            username=user_info['login'],
            defaults={
                'email': user_info['email'],
                'avatar_url': user_info.get('image_url', '')
            }
        )

        if created:
            logger.info(f"New user created: {user.username}")
        else:
            logger.info(f"Existing user updated: {user.username}")

        # Connexion de l'utilisateur
        login(request, user)
        logger.info(f"User {user.username} logged in successfully")

        # Redirection vers la page d'accueil avec un paramètre de succès
        return redirect('/?auth_success=true')

    except Exception as e:
        logger.error(f"Error during 42 authentication: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
