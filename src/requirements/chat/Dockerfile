FROM node:18

RUN apt update && apt install curl -y

WORKDIR /app

COPY ./package.json /app

RUN npm install

COPY ./server.js /app

EXPOSE 3000

CMD ["node", "server.js"]
