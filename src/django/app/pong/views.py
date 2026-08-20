import json
import re
import logging
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from rest_framework.response import Response
from django.db import IntegrityError
from django.db.models import F
from django.shortcuts import redirect
logger = logging.getLogger(__name__)
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import CustomUser, Friendship, FriendRequest, MatchHistory, BlockedUser
from django.views.decorators.http import require_GET
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import os


from .tokens import tokens_for_user

User = get_user_model()

# Ni `create_user()` ni `save()` ne déclenchent les validateurs de champs Django :
# sans ce contrôle explicite, `username` et `display_name` acceptent n'importe
# quoi, y compris du balisage. L'échappement côté client ferme la faille, ceci
# est la seconde barrière, à la frontière de confiance.
ALLOWED_AVATAR_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_AVATAR_BYTES = 2 * 1024 * 1024

DISPLAY_NAME_RE = re.compile(r'^[\w .\-]{3,50}$', re.UNICODE)


def clean_display_name(value):
    """Renvoie le nom nettoyé, ou lève ValueError avec un message affichable."""
    value = (value or '').strip()
    if not DISPLAY_NAME_RE.match(value):
        raise ValueError(
            'Display name must be 3 to 50 characters, letters, digits, '
            'spaces, dots, dashes and underscores only.'
        )
    return value


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

				refresh = tokens_for_user(user)

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
				return JsonResponse({'success': False, 'message': 'Account name or password incorrect'}, status=401)
		except json.JSONDecodeError:
			return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
		except Exception as e:
			logger.error(f"Error during connection: {str(e)}")
			return JsonResponse({'success': False, 'message': 'An error occurred'}, status=500)

	return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

def health(request):
	"""Sonde de démarrage : interrogée par les healthchecks docker de django et
	de nginx. Doit rester sans authentification et sans accès à la base."""
	return JsonResponse({'status': 'ok'}, status=200)


@ensure_csrf_cookie
def register_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            avatar_url = data.get('avatar_url')


            try:
                username = clean_display_name(username)
            except ValueError as exc:
                return JsonResponse({'success': False, 'error': str(exc)}, status=400)

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

            refresh = tokens_for_user(user)

            # Les trois champs d'identité partent avec les jetons : sans eux le
            # client ne pouvait pas ouvrir la session qu'il vient de créer et
            # renvoyait l'utilisateur taper ses identifiants une seconde fois.
            return JsonResponse({
                'success': True,
                'message': 'Compte créé avec succès.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'username': user.username,
                'display_name': user.display_name,
                'avatar_url': user.avatar_url,
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
    # Le jeton n'est plus journalisé : il partait en clair dans les logs, où il
    # se lit sans authentification et suffit à monter une requête CSRF valide.
    return JsonResponse({'csrfToken': get_token(request)})

# @permission_classes ne fait rien sur une vue Django nue : la route était
# ouverte à tous et rendait l'adresse email de n'importe quel compte.
@api_view(['GET'])
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    to_username = request.data.get('to_username')
    try:
        to_user = CustomUser.objects.get(display_name=to_username)

        if request.user == to_user:
            return JsonResponse({ 'success': False,  'message': 'You cannot send a friend request to yourself.'}, status=400)

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
        friend_request.delete()
        return JsonResponse({'success': True, 'message': 'Friend request rejected'})
    except FriendRequest.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Friend request not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friend_requests(request):
    friend_requests = FriendRequest.objects.filter(to_user=request.user, status='pending')
    requests_data = [{
        'id': fr.id,
        'from_username': fr.from_user.display_name,
        'created_at': fr.created_at
    } for fr in friend_requests]
    return JsonResponse({'success': True, 'friend_requests': requests_data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user_settings(request):
    try:
        user = request.user
        avatar_file = request.FILES.get('avatar')

        if avatar_file:
            # Écrivait dans pong/templates/content/avatars, dossier supprimé avec
            # le passage du frontend sous Vite. Les fichiers vont désormais dans
            # MEDIA_ROOT et sont servis par la route /media/.
            extension = os.path.splitext(avatar_file.name)[1].lower()
            if extension not in ALLOWED_AVATAR_EXTENSIONS:
                return JsonResponse({
                    'success': False,
                    'error': f'Unsupported image type: {extension or "unknown"}'
                }, status=400)
            if avatar_file.size > MAX_AVATAR_BYTES:
                return JsonResponse({
                    'success': False,
                    'error': 'Avatar must be 2 MB or smaller.'
                }, status=400)

            avatars_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
            os.makedirs(avatars_dir, exist_ok=True)

            # Le nom vient de la base, pas du fichier envoyé : un nom de fichier
            # attaquant ne doit pas pouvoir sortir du dossier.
            filename = f'avatar_{user.pk}_{int(timezone.now().timestamp())}{extension}'

            with open(os.path.join(avatars_dir, filename), 'wb+') as destination:
                for chunk in avatar_file.chunks():
                    destination.write(chunk)

            user.avatar_url = f'/media/avatars/{filename}'

        if 'display_name' in request.data:
            try:
                user.display_name = clean_display_name(request.data['display_name'])
            except ValueError as exc:
                return JsonResponse({'success': False, 'error': str(exc)}, status=400)

        if 'email' in request.data:
            user.email = request.data['email']

        user.save()

        return JsonResponse({
            'success': True,
            'message': 'Settings updated successfully',
            'avatar_url': user.avatar_url,
            'display_name': user.display_name,
            'email': user.email
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friend_list(request):
    friendships = Friendship.objects.filter(user=request.user)
    blocked_users = BlockedUser.objects.filter(user=request.user).values_list('blocked_user__display_name', flat=True)
    friends_data = []
    for friendship in friendships:
        friend = friendship.friend
        friends_data.append({
            'display_name': friend.display_name,
            'is_online': friend.is_online,
            'avatar_url': friend.avatar_url,
            'is_blocked': friend.display_name in blocked_users
        })
    return JsonResponse({'friends': friends_data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_online_status(request):
    user = request.user
    data = request.data
    user.is_online = data.get('is_online', user.is_online)
    user.save()
    return Response({'status': 'success'})

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
        return JsonResponse({'error': 'User not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_match_result(request):
    """Enregistre le match et incrémente le compteur du joueur.

    Le client lisait auparavant wins/losses, ajoutait un et renvoyait le total
    à /update_stats/ : n'importe quel compte pouvait donc écrire les statistiques
    de n'importe quel autre, et deux parties terminées en même temps s'écrasaient.
    L'incrément se fait ici, sur `request.user`, avec F() pour rester atomique.
    """
    try:
        result = request.data.get('result')
        opponent = request.data.get('opponent')

        # Validation des données
        if result not in ['win', 'loss']:
            return Response({
                'status': 'error',
                'message': 'Invalid result value. Must be "win" or "loss".'
            }, status=400)

        match = MatchHistory.objects.create(
            user=request.user,
            result=result,
            opponent=opponent
        )

        field = 'wins' if result == 'win' else 'losses'
        CustomUser.objects.filter(pk=request.user.pk).update(**{field: F(field) + 1})
        request.user.refresh_from_db(fields=['wins', 'losses'])

        return Response({
            'status': 'success',
            'message': 'Match result saved successfully',
            'match': {
                'result': match.result,
                'opponent': match.opponent,
                'date': match.date.isoformat()
            },
            'wins': request.user.wins,
            'losses': request.user.losses,
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_matches(request, username):
    try:
        user = CustomUser.objects.get(username=username)
        matches = MatchHistory.objects.filter(user=user).order_by('-date')[:10]

        matches_data = [{
            'result': match.result,
            'opponent': match.opponent,
            'date': match.date
        } for match in matches]

        return Response({
            'status': 'success',
            'matches': matches_data
        })
    except CustomUser.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=404)

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
    display_name = request.data.get('display_name')
    try:
        blocked_user = CustomUser.objects.get(display_name=display_name)
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
            'message': f'Successfully unblocked {display_name}'
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
    blocked_list = [block.blocked_user.display_name for block in blocked_users]
    return JsonResponse({
        'success': True,
        'blocked_users': blocked_list
    })

# `requests` ne servait qu'aux deux appels ci-dessous ; urllib les fait depuis
# la bibliothèque standard, et avec un délai d'attente que requests n'avait pas.
def _fetch_json(url, data=None, headers=None):
    body = urlencode(data).encode() if data else None
    with urlopen(Request(url, data=body, headers=headers or {}), timeout=10) as response:
        return json.load(response)


def auth_42_login(request):
    auth_url = 'https://api.intra.42.fr/oauth/authorize'
    params = {
        'client_id': settings.FT_CLIENT_ID,
        'redirect_uri': f'{settings.PUBLIC_API_URL}/api/auth/42/callback/',
        'response_type': 'code',
        'scope': 'public'
    }
    return redirect(f'{auth_url}?{urlencode(params)}')

def auth_42_callback(request):
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'success': False, 'error': 'No authorization code'})

    token_url = 'https://api.intra.42.fr/oauth/token'
    data = {
        'grant_type': 'authorization_code',
        'client_id': settings.FT_CLIENT_ID,
        'client_secret': settings.FT_CLIENT_SECRET,
        'code': code,
        'redirect_uri': f'{settings.PUBLIC_API_URL}/api/auth/42/callback/'
    }

    try:
        token_data = _fetch_json(token_url, data=data)
    except (HTTPError, URLError, ValueError):
        return redirect(f'{settings.FRONTEND_URL}/register?error=auth_failed')

    access_token = token_data.get('access_token')

    try:
        user_data = _fetch_json(
            'https://api.intra.42.fr/v2/me',
            headers={'Authorization': f'Bearer {access_token}'},
        )
    except (HTTPError, URLError, ValueError):
        return redirect(f'{settings.FRONTEND_URL}/register?error=profile_fetch_failed')

    try:
        user = User.objects.get(email=user_data['email'])
    except User.DoesNotExist:
        # Formater l'URL de l'avatar comme les autres
        user = User.objects.create_user(
            username=user_data['login'],
            email=user_data['email'],
            display_name=user_data['login'],
            avatar_url=f'url("{user_data["image"]["versions"]["small"]}")',
            password=None
        )

    refresh = tokens_for_user(user)
    response_data = {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'username': user.username,
        'display_name': user.display_name,
        'avatar_url': user.avatar_url
    }
    return redirect(f'{settings.FRONTEND_URL}/login?auth_success=true&{urlencode(response_data)}')
