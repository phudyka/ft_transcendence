from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
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


def index(request):
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
			return JsonResponse({'success': True})
		else:
			# Invalid credentials
			return JsonResponse({'success': False, 'error': 'Invalid credentials'})
	else:
		# Invalid request method
		return JsonResponse({'success': False, 'error': 'Invalid request method'})


def content(request):
	return JsonResponse({'message': 'content page'}, status=200)
