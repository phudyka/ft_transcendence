from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate,login
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import render
from django.middleware.csrf import get_token
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError
import json
import logging
logger = logging.getLogger(__name__)
from .models import CustomUser
from django.utils import timezone

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
    print('login_view url')
    if request.method == 'POST':
        data = json.loads(request.body)
        logger.info(data)
        username = data.get('username')
        password = data.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Login successful
            refresh = RefreshToken.for_user(user)
            return JsonResponse({
                'success': True,
                'username': user.username,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        else:
            # Login failed
            return JsonResponse({'success': False}, status=401)
    return JsonResponse({'error': 'Invalid request method.'}, status=400)


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

            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse({'success': False, 'error': 'This username is already taken.'})
            if CustomUser.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'error': 'This email is already in use.'})

            # Créer l'utilisateur avec les données fournies
            user = CustomUser.objects.create_user(
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


