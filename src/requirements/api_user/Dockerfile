FROM alpine:3.18

WORKDIR /app

RUN apk update &&\
    apk add npm=9.6.6-r0 openssl=3.1.6-r0 &&\
    mkdir -p /app/ssl_certificates &&\
    openssl \
    req \
    -x509 \
    -nodes \
    -out /app/ssl_certificates/api_user.crt \
    -keyout /app/ssl_certificates/api_user.key \
    -subj "/C=FR/ST=PACA/L=Nice/O=42/OU=42Nice/CN=ft_transcendence.42nice.fr/UID=efirmino" &&\
    npm init -y &&\
    npm install express

COPY index.js /app

EXPOSE 443

ENTRYPOINT [ "node", "." ]