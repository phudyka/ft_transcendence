FROM node:18

WORKDIR /app

COPY /config /app

RUN npm install

COPY /game /app

EXPOSE 4000

CMD [ "node", "server.mjs" ]
