from django.urls import path
from . import views

urlpatterns = [
	path('content/', views.content, name='content'),
	path('create_user/', views.create_user, name='create_user'),
	path('api/login/', views.login_view, name='login'),
	path('', views.index, name='index'),
]
