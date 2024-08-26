from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import render
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

@csrf_exempt
def login_view(request):
	if request.method == 'POST':
		data = json.loads(request.body)
		username = data.get('username')
		password = data.get('password')
		user = authenticate(request, username=username, password=password)
		if user is not None:
			# Login successful
			login(request, user)
			request.session['user_id'] = user.id
			request.session['username'] = user.username
			return JsonResponse({'success': True})
		else:
			# Login failed
			return JsonResponse({'success': False})


def content(request):
	return JsonResponse({'message': 'content page'}, status=200)

@ensure_csrf_cookie
def register_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        avatar_url = data.get('avatar_url')

        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'error': 'This username is already taken.'})
        if User.objects.filter(email=email).exists():
            return JsonResponse({'success': False, 'error': 'This email is already in use.'})

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            user.profile.avatar_url = avatar_url  # Assuming you have a Profile model with avatar_url field
            user.profile.save()
            return JsonResponse({'success': True, 'message': 'Account created successfully.'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': f'An error occurred: {str(e)}'})

    return JsonResponse({'success': False, 'error': 'Invalid request method.'})
