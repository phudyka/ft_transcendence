import json
import logging
import requests
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import render
from django.middleware.csrf import get_token
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import IntegrityError
from django.shortcuts import redirect
from rest_framework import viewsets, status
from .serializers import CustomUserSerializer
logger = logging.getLogger(__name__)
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import CustomUser, Friendship, FriendRequest, MatchHistory, BlockedUser
from django.contrib.auth.hashers import check_password, make_password
from django.views.decorators.http import require_GET
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.http import require_http_methods
from .serializers import FriendshipSerializer
from django.core.exceptions import ValidationError
from django.core.files.images import get_image_dimensions
from django.core.validators import validate_email
from PIL import Image
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required


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

@permission_classes([IsAuthenticated])
class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer

    @action(detail=False, methods=['put'], url_path='display_name/(?P<display_name>[^/.]+)/update_stats')
    def update_stats_by_display_name(self, request, display_name=None):
        user = CustomUser.objects.get(display_name=display_name)
        data = request.data

        user.is_online = data.get('is_online', user.is_online)
        user.wins = data.get('wins', user.wins)
        user.losses = data.get('losses', user.losses)
        user.save()

        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

@ensure_csrf_cookie
def login_view(request):
	if request.method == 'POST':
		try:
			data = json.loads(request.body)
			username = data.get('username')
			password = data.get('password')

			user = authenticate(request, username=username, password=password)
			if user is not None:
				login(request, user)

				refresh = RefreshToken.for_user(user)

				return JsonResponse({
					'success': True,
					'message': 'Connection successful',
					'access': str(refresh.access_token),
					'refresh': str(refresh),
					'username': user.username,
					'display_name': user.display_name,
					'avatar_url': user.avatar_url,
				}, status=200)
			else:
				return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=401)
		except json.JSONDecodeError:
			return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
		except Exception as e:
			logger.error(f"Error during connection: {str(e)}")
			return JsonResponse({'success': False, 'message': 'An error occurred'}, status=500)

	return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

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
                return JsonResponse({'success': False, 'error': 'This username is already taken.'}, status=400)
            if User.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'error': 'This email is already in use.'}, status=400)

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                avatar_url=avatar_url,
                display_name=username,
                wins=0,
                losses=0,
                is_online=False,
            )

            refresh = RefreshToken.for_user(user)

            return JsonResponse({
                'success': True,
                'message': 'Compte créé avec succès.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=201)

        except IntegrityError as e:
            error_message = str(e)
            if 'users_display_name_key' in error_message:
                return JsonResponse({'success': False, 'error': 'This display name is already in use.'}, status=400)
            elif 'users_email_key' in error_message:
                return JsonResponse({'success': False, 'error': 'This email is already in use.'}, status=400)
            else:
                return JsonResponse({'success': False, 'error': 'An error occurred during registration.'}, status=500)
        except Exception as e:
            logger.error(f"Error during registration: {str(e)}")
            return JsonResponse({'success': False, 'error': 'An error occurred.'}, status=500)
    return JsonResponse({'success': False, 'error': 'Method not allowed.'}, status=405)

@ensure_csrf_cookie
def set_csrf_token(request):
    token = get_token(request)
    logger.info(f"CSRF Token generated: {token}")
    return JsonResponse({'csrfToken': get_token(request)})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def friend_requests(request):
    pass


@require_GET
@permission_classes([IsAuthenticated])
def get_user_by_display_name(request, display_name):
    try:
        user = User.objects.get(display_name=display_name)
        user_data = {
            'username': user.username,
            'email': user.email,
            'avatar_url': user.avatar_url,
            'display_name': user.display_name,
            'is_online': user.is_online,
            'wins': user.wins,
            'losses': user.losses,
        }
        return JsonResponse({'success': True, 'user': user_data})
    except User.DoesNotExist:
        logger.error(f"User not found: {display_name}")
        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error fetching user by display name: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@require_http_methods(["GET"])
@permission_classes([IsAuthenticated])
def get_user_stats(request):
    user = request.user

    user_data = {
        'username': user.username,
        'email': user.email,
        'avatar_url': user.avatar_url,
        'display_name': user.display_name,
        'is_online': user.is_online,
        'wins': user.wins,
        'losses': user.losses,
    }
    return JsonResponse({'success': True, 'user': user_data})

def auth_42_redirect(request):
    redirect_uri = request.build_absolute_uri('/api/auth/42/callback/')
    return redirect(
        f'https://api.intra.42.fr/oauth/authorize?client_id={settings.FT_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code'
    )

@csrf_exempt
def auth_42_callback(request):
    try:
        code = request.GET.get('code')
        logger.info(f"Code reçu : {code}")
        if not code:
            raise ValueError('Aucun code fourni')

        redirect_uri = request.build_absolute_uri('/api/auth/42/callback/')
        logger.info(f"URI de redirection : {redirect_uri}")

        # Échange du code contre un token
        token_response = requests.post('https://api.intra.42.fr/oauth/token', data={
            'grant_type': 'authorization_code',
            'client_id': settings.FT_CLIENT_ID,
            'client_secret': settings.FT_CLIENT_SECRET,
            'code': code,
            'redirect_uri': redirect_uri
        })
        logger.info(f"Réponse du token : {token_response.status_code} - {token_response.text}")

        if token_response.status_code != 200:
            raise ValueError(f'Échec de l\'obtention du token d\'accès : {token_response.text}')

        access_token = token_response.json().get('access_token')
        logger.info(f"Token d'accès obtenu : {access_token}")

        if not access_token:
            raise ValueError('Token d\'accès non obtenu')

        # Récupération des informations de l'utilisateur
        user_info_response = requests.get('https://api.intra.42.fr/v2/me', headers={
            'Authorization': f'Bearer {access_token}'
        })
        logger.info(f"Réponse des informations utilisateur : {user_info_response.status_code} - {user_info_response.text}")

        if user_info_response.status_code != 200:
            raise ValueError(f'Échec de la récupération des informations utilisateur : {user_info_response.text}')

        user_info = user_info_response.json()
        logger.info(f"Informations utilisateur récupérées : {user_info}")

        # Création ou mise à jour de l'utilisateur dans la base de données
        username = user_info.get('login')
        email = user_info.get('email', '')
        display_name = user_info.get('displayname', username)
        avatar_url = user_info.get('image', {}).get('link', '')

        if not username:
            raise ValueError('Nom d\'utilisateur non trouvé dans les informations récupérées')

        user, created = CustomUser.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'avatar_url': avatar_url,
                'display_name': display_name,
            }
        )
        logger.info(f"Utilisateur {'créé' if created else 'existant'} : {user.username}")

        if not created:
            # Mise à jour des informations si l'utilisateur existe déjà
            user.email = email
            user.avatar_url = avatar_url
            user.display_name = display_name
            user.save()
            logger.info(f"Informations utilisateur mises à jour pour : {user.username}")

        # Connexion de l'utilisateur
        login(request, user)
        logger.info(f"Utilisateur connecté : {user.username}")

        # Redirection vers la page d'accueil avec un paramètre de succès
        return redirect('/?create_success=true')

    except Exception as e:
        logger.error(f"Erreur lors de l'authentification avec 42 : {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request, display_name):
    logger.info(f"Tentative d'accès au profil de {display_name}")
    logger.info(f"Utilisateur authentifié : {request.user}")
    try:
        user = User.objects.get(display_name=display_name)
        profile_data = {
            # 'username': user.username,
            'display_name': user.display_name,
            'avatar_url': user.avatar_url,
            'wins': user.wins,
            'losses': user.losses,
            'is_online': user.is_online,
            # Ajoutez d'autres champs selon vos besoins
        }
        return JsonResponse({'success': True, 'profile': profile_data})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Utilisateur non trouvé'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    to_username = request.data.get('to_username')
    try:
        to_user = CustomUser.objects.get(username=to_username)

        if Friendship.objects.filter(user=request.user, friend=to_user).exists():
            return JsonResponse({'success': False, 'message': 'You are already friends with this user.'}, status=400)

        if FriendRequest.objects.filter(from_user=request.user, to_user=to_user, status='pending').exists():
            return JsonResponse({'success': False, 'message': 'A friend request is already pending for this user.'}, status=400)

        FriendRequest.objects.create(from_user=request.user, to_user=to_user)
        return JsonResponse({'success': True, 'message': 'Friend request sent'})
    except CustomUser.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'User not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request):
    request_id = request.data.get('request_id')
    try:
        friend_request = FriendRequest.objects.get(id=request_id, to_user=request.user, status='pending')
        friend_request.status = 'accepted'
        friend_request.save()
        Friendship.objects.create(user=request.user, friend=friend_request.from_user)
        Friendship.objects.create(user=friend_request.from_user, friend=request.user)
        return JsonResponse({'success': True, 'message': 'Friend request accepted'})
    except FriendRequest.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Friend request not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_friend_request(request):
    request_id = request.data.get('request_id')
    try:
        friend_request = FriendRequest.objects.get(id=request_id, to_user=request.user, status='pending')
        friend_request.status = 'rejected'
        friend_request.save()
        return JsonResponse({'success': True, 'message': 'Friend request rejected'})
    except FriendRequest.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Friend request not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friend_requests(request):
    friend_requests = FriendRequest.objects.filter(to_user=request.user, status='pending')
    requests_data = [{
        'id': fr.id,
        'from_username': fr.from_user.username,
        'created_at': fr.created_at
    } for fr in friend_requests]
    return JsonResponse({'success': True, 'friend_requests': requests_data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user_settings(request):
    logger.info(f"Requête reçue pour update_user_settings: {request.data}")
    logger.info(f"Utilisateur authentifié: {request.user}")
    user = request.user
    display_name = request.data.get('displayName')
    email = request.data.get('email')
    avatar = request.FILES.get('avatar')

    if display_name:
        if CustomUser.objects.filter(display_name=display_name).exclude(id=user.id).exists():
            return JsonResponse({'success': False, 'message': 'This display name is already in use.'}, status=400)
        user.display_name = display_name

    if email:
        try:
            validate_email(email)
            if CustomUser.objects.filter(email=email).exclude(id=user.id).exists():
                return JsonResponse({'success': False, 'message': 'This email is already in use.'}, status=400)
            user.email = email
        except ValidationError:
            return JsonResponse({'success': False, 'message': 'Invalid email.'}, status=400)

    if avatar:
        if avatar.size > 5 * 1024 * 1024:  # 5 MB
            return JsonResponse({'success': False, 'message': 'The file is too large. Maximum size is 5 MB.'}, status=400)

        try:
            img = Image.open(avatar)
            width, height = img.size
            if width < 100 or height < 100 or width > 1000 or height > 1000:
                return JsonResponse({'success': False, 'message': 'Image dimensions must be between 100x100 and 1000x1000 pixels.'}, status=400)
        except:
            return JsonResponse({'success': False, 'message': 'Invalid image file.'}, status=400)

        user.avatar_url = avatar

    user.save()
    return JsonResponse({'success': True, 'message': 'Settings updated successfully.'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_friendship_status(request, username):
    try:
        target_user = CustomUser.objects.get(username=username)
        is_friend = Friendship.objects.filter(user=request.user, friend=target_user).exists()
        request_sent = FriendRequest.objects.filter(
            from_user=request.user,
            to_user=target_user,
            status='pending'
        ).exists()

        return JsonResponse({
            'is_friend': is_friend,
            'request_sent': request_sent
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouvé'}, status=404)

def auth_42_login_redirect(request):
    auth_url = 'https://api.intra.42.fr/oauth/authorize'
    callback_url = request.build_absolute_uri('/api/auth/42/login/callback/')
    
    params = {
        'client_id': settings.FT_CLIENT_ID,
        'redirect_uri': callback_url,
        'response_type': 'code',
        'scope': 'public'
    }
    
    auth_url = f"{auth_url}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return JsonResponse({
        'success': True,
        'redirect_url': auth_url
    })

@csrf_exempt
def auth_42_login_callback(request):
    code = request.GET.get('code')
    if not code:
        return JsonResponse({
            'success': False,
            'error': 'No authorization code provided'
        }, status=400)

    try:
        # Échange du code contre un token
        token_url = 'https://api.intra.42.fr/oauth/token'
        callback_url = request.build_absolute_uri('/api/auth/42/login/callback/')
        
        token_response = requests.post(token_url, data={
            'grant_type': 'authorization_code',
            'client_id': settings.FT_CLIENT_ID,
            'client_secret': settings.FT_CLIENT_SECRET,
            'code': code,
            'redirect_uri': callback_url
        })
        
        if token_response.status_code != 200:
            return JsonResponse({
                'success': False,
                'error': 'Failed to get access token'
            }, status=400)

        token_data = token_response.json()
        
        # Récupération des informations utilisateur
        user_response = requests.get(
            'https://api.intra.42.fr/v2/me',
            headers={'Authorization': f"Bearer {token_data['access_token']}"}
        )
        
        if user_response.status_code != 200:
            return JsonResponse({
                'success': False, 
                'error': 'Failed to get user info'
            }, status=400)

        user_data = user_response.json()
        
        # Récupération ou création de l'utilisateur
        try:
            user = CustomUser.objects.get(username=user_data['login'])
        except CustomUser.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'User not found. Please register first.'
            }, status=404)

        # Génération des tokens JWT
        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            'success': True,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'display_name': user.display_name,
            'avatar_url': user.avatar_url
        })

    except Exception as e:
        logger.error(f"Erreur lors de l'authentification 42: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    return JsonResponse({'success': True, 'message': 'Token valide'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friend_list(request):
    friendships = Friendship.objects.filter(user=request.user)
    blocked_users = BlockedUser.objects.filter(user=request.user).values_list('blocked_user__username', flat=True)
    friends_data = []
    for friendship in friendships:
        friend = friendship.friend
        friends_data.append({
            'username': friend.username,
            'display_name': friend.display_name,
            'is_online': friend.is_online,
            'avatar_url': friend.avatar_url,
            'is_blocked': friend.username in blocked_users  # Indique si l'ami est bloqué
        })
    return JsonResponse({'friends': friends_data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_ping(request):
    user = request.user
    user.last_activity = timezone.now()
    user.save()
    return JsonResponse({'status': 'success'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_online_status(request):
    user = request.user
    data = request.data
    user.is_online = data.get('is_online', user.is_online)
    user.last_activity = timezone.now()
    user.save()
    return Response({'status': 'success'})

# Gardez la fonction utilitaire séparée si nécessaire
def update_offline_status():
    five_minutes_ago = timezone.now() - timezone.timedelta(minutes=5)
    CustomUser.objects.filter(last_activity__lt=five_minutes_ago, is_online=True).update(is_online=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_friend_request(request, username):
    try:
        target_user = CustomUser.objects.get(username=username)
        is_friend = Friendship.objects.filter(user=request.user, friend=target_user).exists()
        request_sent = FriendRequest.objects.filter(
            from_user=request.user,
            to_user=target_user,
            status='pending'
        ).exists()

        return JsonResponse({
            'is_friend': is_friend,
            'request_sent': request_sent
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouv'}, status=404)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_stats(request, display_name):
    try:
        user = CustomUser.objects.get(display_name=display_name)
        data = request.data

        user.wins = data.get('wins', user.wins)
        user.losses = data.get('losses', user.losses)
        user.is_online = data.get('is_online', user.is_online)
        user.save()

        return Response({
            'success': True,
            'message': 'User stats updated successfully',
            'user': {
                'username': user.username,
                'display_name': user.display_name,
                'wins': user.wins,
                'losses': user.losses,
                'is_online': user.is_online
            }
        }, status=status.HTTP_200_OK)
    except CustomUser.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_match_result(request):
    result = request.data.get('result')
    if result not in ['win', 'loss']:
        return Response({'error': 'Invalid result'}, status=status.HTTP_400_BAD_REQUEST)

    MatchHistory.objects.create(user=request.user, result=result)
    return Response({'success': True}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_matches(request, username):
    try:
        user = CustomUser.objects.get(username=username)
        recent_matches = MatchHistory.objects.filter(user=user).order_by('-date')[:3]
        matches_data = [{'result': match.result, 'date': match.date.strftime('%Y-%m-%d')} for match in recent_matches]
        return Response({'matches': matches_data})
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_user(request):
    blocked_username = request.data.get('display_name')
    try:
        blocked_user = CustomUser.objects.get(display_name=blocked_username)
        
        # Vérifier si l'utilisateur essaie de se bloquer lui-même
        if blocked_user == request.user:
            return JsonResponse({
                'success': False,
                'message': 'You cannot block yourself'
            }, status=400)

        # Créer l'entrée de blocage
        BlockedUser.objects.get_or_create(
            user=request.user,
            blocked_user=blocked_user
        )

        return JsonResponse({
            'success': True,
            'message': f'Successfully blocked {blocked_username}'
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'User not found'
        }, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unblock_user(request):
    username = request.data.get('username')
    try:
        blocked_user = CustomUser.objects.get(username=username)
        # Vérifier si l'utilisateur est celui qui a bloqué
        block = BlockedUser.objects.filter(
            user=request.user,
            blocked_user=blocked_user
        ).first()
        
        if not block:
            return JsonResponse({
                'success': False,
                'message': 'You cannot unblock this user as you are not the one who blocked them'
            }, status=403)
            
        block.delete()
        return JsonResponse({
            'success': True,
            'message': f'Successfully unblocked {username}'
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'User not found'
        }, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_blocked_users(request):
    blocked_users = BlockedUser.objects.filter(user=request.user)
    blocked_list = [{
        'username': block.blocked_user.username,
        'display_name': block.blocked_user.display_name,
        'blocked_at': block.created_at
    } for block in blocked_users]
    return JsonResponse({
        'success': True,
        'blocked_users': blocked_list
    })



