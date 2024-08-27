from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import render
from django.middleware.csrf import get_token
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError
import json

@csrf_exempt
def create_user(request):
	if request.method == 'POST':
		data = json.loads(request.body)
		user = User.create_user(data['username'], data=data['password'])
		return JsonResponse({'message': 'user created with id ' + str(user.id)}, status=201)
	else:
		return JsonResponse({'error': 'invalid request'}, status=400)

def index(request, path=''):
	return render(request, 'index.html')

def login(request):
	return JsonResponse({'message': 'login page'}, status=200)

@ensure_csrf_cookie
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
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

            if User.objects.filter(username=username).exists():
                return JsonResponse({'success': False, 'error': 'This username is already taken.'})

            if User.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'error': 'This email is already in use.'})

            user = User.objects.create_user(username=username, email=email, password=password)

            # Si vous avez un modèle de profil séparé, vous pouvez l'utiliser ici
            # user.profile.avatar_url = avatar_url
            # user.profile.save()

            return JsonResponse({'success': True, 'message': 'Account created successfully.'})
        except IntegrityError as e:
            return JsonResponse({'success': False, 'error': 'Database integrity error. Please try again.'})
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON data.'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': f'An error occurred: {str(e)}'})

    return JsonResponse({'success': False, 'error': 'Invalid request method.'})

@ensure_csrf_cookie
def set_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})
