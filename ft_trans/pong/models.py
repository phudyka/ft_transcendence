from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager, PermissionsMixin
from django.contrib.auth.hashers import make_password, check_password

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)  # Utilisez set_password au lieu de password_hash
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)

class CustomUser(AbstractUser):
    display_name = models.CharField(max_length=50, unique=True)
    avatar_url = models.CharField(max_length=255, default='default_avatar.png')
    created_at = models.DateTimeField(auto_now_add=True)
    is_online = models.BooleanField(default=False)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)

    # Les champs username, email, password, is_superuser, is_staff, is_active, last_login
    # sont déjà inclus dans AbstractUser

    USERNAME_FIELD = 'username'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['email', 'display_name']

    class Meta:
        db_table = 'users'  # Spécifie le nom de la table dans la base de données

    def __str__(self):
        return self.username

    def set_password(self, raw_password):
        self.password = make_password(raw_password)  # Utilisez self.password au lieu de self.password_hash

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)  # Utilisez self.password au lieu de self.password_hash


