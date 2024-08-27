from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
	path('api/content/', views.content, name='content'),
	path('api/create_user/', views.create_user, name='create_user'),
	path('api/login/', views.login_view, name='login'),
	path('', views.index, name='index'),
	path('<path:path>', views.index, name='catch_all'),
	path('api/register/', views.register_view, name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
	path('api/set-csrf-token/', views.set_csrf_token, name='set_csrf_token'),
]
