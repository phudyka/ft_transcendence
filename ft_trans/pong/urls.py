from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'users', views.CustomUserViewSet)

urlpatterns = [
	path('', include(router.urls)),
	path('api/auth/42/', views.auth_42_redirect, name='auth_42_redirect'),
	path('api/auth/42/callback/', views.auth_42_callback, name='auth_42_callback'),
	path('api/content/', views.content, name='content'),
	path('api/set-csrf-token/', views.set_csrf_token, name='set_csrf_token'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
	path('api/create_user/', views.create_user, name='create_user'),
	path('api/register/', views.register_view, name='register'),
	path('api/login/', views.login_view, name='login'),
	path('/api/friend-requests', views.friend_requests, name='friend_requests'),
	path('api/user/<str:display_name>/', views.get_user_by_display_name, name='get_user_by_display_name'),
	path('api/user/stats/', views.get_user_stats, name='get_user_stats'),
	path('', views.index, name='index'),
	path('<path:path>', views.index, name='catch_all'),
]
