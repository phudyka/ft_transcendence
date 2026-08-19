FROM node:22-alpine

WORKDIR /app

# Les dépendances d'abord : la couche est réutilisée tant que le lock ne bouge pas.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

# Le TLS est terminé en amont (nginx en local, la plateforme en production),
# on écoute donc en clair — plus de certificat auto-signé à générer au build.
EXPOSE 3000

USER node

CMD ["node", "src/index.mjs"]
