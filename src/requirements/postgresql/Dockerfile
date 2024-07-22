FROM alpine:3.18

RUN apk update &&\
    apk add postgresql-common=1.2-r1

WORKDIR /db

COPY conf/entrypoint.sh /

ENTRYPOINT [ "/entrypoint.sh" ]