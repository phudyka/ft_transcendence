#!/bin/ash

source .env/bin/activate

cd src/

exec gunicorn \
    --certfile=/app/ssl_certificates/gunicorn.crt \
    --keyfile=/app/ssl_certificates/gunicorn.key \
    --bind 0.0.0.0:443 \
    ft_transcendence.wsgi
