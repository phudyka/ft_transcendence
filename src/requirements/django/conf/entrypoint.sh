#!/bin/ash

source .env/bin/activate

cd src/

python3 manage.py createsuperuser --no-input
python3 manage.py migrate --no-input
# python3 manage.py collectstatic --no-input

exec gunicorn \
    --certfile=/app/ssl_certificates/gunicorn.crt \
    --keyfile=/app/ssl_certificates/gunicorn.key \
    --bind 0.0.0.0:443 \
    ft_transcendence.wsgi
