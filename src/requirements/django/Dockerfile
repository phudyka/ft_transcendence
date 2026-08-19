FROM alpine:3.18

WORKDIR /app

COPY conf/requirements.txt /app

# Plus de certificat auto-signé : le TLS est terminé par le proxy en amont
# (nginx en local, la plateforme en production).
RUN apk update &&\
    apk add --no-cache python3 curl &&\
    python3 -m venv /app/.env &&\
    source /app/.env/bin/activate &&\
    pip install --upgrade pip &&\
    pip install -r requirements.txt

COPY src/ /app

EXPOSE 8000

COPY conf/entrypoint.sh /

ENTRYPOINT [ "/entrypoint.sh" ]