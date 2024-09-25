#!/bin/bash

# Appliquer les migrations
python manage.py makemigrations
python manage.py migrate

# # Démarrer le serveur Django
# exec "$@"
