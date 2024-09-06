#!/bin/bash

# Nom du conteneur
CONTAINER_NAME="097d5488300d"

# Commande pour entrer dans le conteneur et exécuter les migrations
docker exec -it $CONTAINER_NAME /bin/bash -c "cd /code && python manage.py makemigrations && python manage.py migrate"

echo "Migrations completed."