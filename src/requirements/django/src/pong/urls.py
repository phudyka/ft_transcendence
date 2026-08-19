from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from . import views
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .tokens import DisplayNameTokenObtainPairView

urlpatterns = [
	path('api/content/', views.content, name='content'),
	path('api/set-csrf-token/', views.set_csrf_token, name='set_csrf_token'),
	path('api/token/', DisplayNameTokenObtainPairView.as_view(), name='token_obtain_pair'),
	path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
	path('api/verify-token/', views.verify_token, name='verify_token'),
	path('api/create_user/', views.create_user, name='create_user'),
	path('api/register/', views.register_view, name='register'),
	path('api/login/', views.login_view, name='login'),
	path('api/friend-requests', views.friend_requests, name='friend_requests'),
	path('api/user/<str:display_name>/', views.get_user_by_display_name, name='get_user_by_display_name'),
	path('api/user/stats/', views.get_user_stats, name='get_user_stats'),
	path('api/update-online-status/', views.update_online_status, name='update_online_status'),
	path('api/friends/', views.get_friend_list, name='get_friend_list'),
	path('api/send-friend-request/', views.send_friend_request, name='send_friend_request'),
	path('api/accept-friend-request/', views.accept_friend_request, name='accept_friend_request'),
	path('api/reject-friend-request/', views.reject_friend_request, name='reject_friend_request'),
	path('api/get-friend-requests/', views.get_friend_requests, name='get_friend_requests'),
	path('api/update-user-settings/', views.update_user_settings, name='update_user_settings'),
    path('api/check-friend-request/<str:username>/', views.check_friend_request, name='check_friend_request'),
	path('api/profile/<str:username>/', views.user_profile, name='user_profile'),
	path('api/users/display_name/<str:display_name>/update_stats/', views.update_user_stats, name='update_user_stats'),
	path('api/save-match-result/', views.save_match_result, name='save_match_result'),
	path('api/get-recent-matches/<str:username>/', views.get_recent_matches, name='get_recent_matches'),
	path('api/block-user/', views.block_user, name='block_user'),
	path('api/unblock-user/', views.unblock_user, name='unblock_user'),
	path('api/blocked-users/', views.get_blocked_users, name='get_blocked_users'),
	path('api/auth/42/login/', views.auth_42_login, name='auth_42_login'),
	path('api/auth/42/callback/', views.auth_42_callback, name='auth_42_callback'),
	# Avatars envoyés par les utilisateurs. django.views.static.serve gère les
	# types MIME et refuse les remontées de chemin, mais lit le fichier depuis le
	# processus applicatif.
	# ponytail: suffisant pour quelques avatars ; passer par un stockage objet ou
	# un CDN si le volume grimpe.
	re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
