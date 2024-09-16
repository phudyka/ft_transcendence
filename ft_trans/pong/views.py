from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import render
from django.middleware.csrf import get_token
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError
import json
import logging
logger = logging.getLogger(__name__)
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import CustomUser
from django.contrib.auth.hashers import check_password

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
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')

    try:
        user = CustomUser.objects.get(username=username)
        if check_password(password, user.password_hash):
            login(request, user)
            return JsonResponse({
                'success': True,
                'message': 'Login successful',
                'username': user.username,
            })
        else:
            return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=401)
    except CustomUser.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=401)

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
                password_hash=password,
                avatar_url=avatar_url,
                display_name=username,  # Utiliser le username comme display_name par défaut
                created_at=timezone.now(),
                last_login=None,
                is_online=False,
                wins=0,
                losses=0
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
