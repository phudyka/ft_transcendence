from django.urls import path
from . import views

urlpatterns = [
	path('api/content/', views.content, name='content'),
	path('api/create_user/', views.create_user, name='create_user'),
	path('api/login/', views.login_view, name='login'),
	path('', views.index, name='index'),
	path('<path:path>', views.index, name='catch_all'),
	path('api/register/', views.register_view, name='register'),
]
