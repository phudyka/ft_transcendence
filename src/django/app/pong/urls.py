from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
	path('api/health/', views.health, name='health'),
	path('api/set-csrf-token/', views.set_csrf_token, name='set_csrf_token'),
	path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
	path('api/register/', views.register_view, name='register'),
	path('api/login/', views.login_view, name='login'),
	path('api/user/<str:display_name>/', views.get_user_by_display_name, name='get_user_by_display_name'),
	path('api/update-online-status/', views.update_online_status, name='update_online_status'),
	path('api/friends/', views.get_friend_list, name='get_friend_list'),
	path('api/send-friend-request/', views.send_friend_request, name='send_friend_request'),
	path('api/accept-friend-request/', views.accept_friend_request, name='accept_friend_request'),
	path('api/reject-friend-request/', views.reject_friend_request, name='reject_friend_request'),
	path('api/get-friend-requests/', views.get_friend_requests, name='get_friend_requests'),
	path('api/update-user-settings/', views.update_user_settings, name='update_user_settings'),
    path('api/check-friend-request/<str:username>/', views.check_friend_request, name='check_friend_request'),
	path('api/save-match-result/', views.save_match_result, name='save_match_result'),
	path('api/get-recent-matches/<str:username>/', views.get_recent_matches, name='get_recent_matches'),
	path('api/block-user/', views.block_user, name='block_user'),
	path('api/unblock-user/', views.unblock_user, name='unblock_user'),
	path('api/blocked-users/', views.get_blocked_users, name='get_blocked_users'),
	path('api/auth/42/login/', views.auth_42_login, name='auth_42_login'),
	path('api/auth/42/callback/', views.auth_42_callback, name='auth_42_callback'),
	# Les avatars sont servis par nginx depuis le volume media_files ; Django
	# écrit les fichiers mais ne les relit jamais.
]
