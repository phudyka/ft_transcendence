FROM alpine:3.18

WORKDIR /app

COPY conf/requirement.txt /app

RUN apk update &&\
    apk add python3 openssl &&\
    mkdir -p /app/ssl_certificates &&\
    openssl \
    req \
    -x509 \
    -nodes \
    -out /app/ssl_certificates/gunicorn.crt \
    -keyout /app/ssl_certificates/gunicorn.key \
    -subj "/C=FR/ST=PACA/L=Nice/O=42/OU=42Nice/CN=ft_transcendence.42nice.fr/UID=efirmino" &&\
    python3 -m venv /app/.env &&\
    source /app/.env/bin/activate &&\
    pip install --upgrade pip &&\
    pip install -r requirement.txt

COPY ft_transcendence/ /app

EXPOSE 8000

COPY conf/entrypoint.sh /

ENTRYPOINT [ "/entrypoint.sh" ]