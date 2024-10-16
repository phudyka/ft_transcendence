FROM node:18

RUN apt update && apt install curl -y

WORKDIR /app

COPY /config /app

RUN npm install

COPY /game /app

EXPOSE 4000

CMD [ "node", "server.mjs" ]
