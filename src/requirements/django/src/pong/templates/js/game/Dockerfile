FROM node:18

WORKDIR /usr/src/app/

COPY ./ft_trans/pong/templates/js/game/package*.json ./
RUN npm install
COPY ./ft_trans/pong/templates/js/game/ . 

EXPOSE 4000

CMD [ "node", "server.mjs" ]
