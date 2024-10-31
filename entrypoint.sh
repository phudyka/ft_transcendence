#!/bin/bash

# Appliquer les migrations
python manage.py makemigrations --noinput
python manage.py migrate --noinput

# Décommenter exec "$@" pour exécuter la commande CMD
exec "$@"
