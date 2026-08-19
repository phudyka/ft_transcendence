#!/bin/ash

source .env/bin/activate

python manage.py makemigrations --no-input
python manage.py migrate --no-input
python manage.py collectstatic --no-input

exec gunicorn --bind 0.0.0.0:8000 ft_trans.wsgi:application
