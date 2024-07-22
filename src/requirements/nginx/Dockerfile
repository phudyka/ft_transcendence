FROM alpine:3.18

RUN apk update && apk add --no-cache nginx=1.24.0-r7 openssl=3.1.6-r0

RUN mkdir -p /etc/nginx/ssl_certificates

RUN openssl \
    req \
    -x509 \
    -nodes \
    -out /etc/nginx/ssl_certificates/nginx.crt \
    -keyout /etc/nginx/ssl_certificates/nginx.key \
    -subj "/C=FR/ST=PACA/L=Nice/O=42/OU=42Nice/CN=ft_transcendence.42nice.fr/UID=efirmino"

COPY conf/nginx.conf /etc/nginx/nginx.conf

WORKDIR /app

COPY ft_transcendence/ /app

EXPOSE 443

CMD [ "nginx", "-g", "daemon off;" ]