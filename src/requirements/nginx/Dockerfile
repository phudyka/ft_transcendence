FROM alpine:3.18

RUN apk update && apk add --no-cache nginx

COPY conf/nginx.conf /etc/nginx/nginx.conf

WORKDIR /nginx

COPY ft_transcendence/ /nginx

EXPOSE 80

CMD [ "nginx", "-g", "daemon off;" ]