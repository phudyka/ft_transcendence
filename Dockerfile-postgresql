FROM postgres:16

# Copiez le script d'initialisation
COPY init-database.sh /docker-entrypoint-initdb.d/
COPY init-database.sql /docker-entrypoint-initdb.d/

# Définissez les variables d'environnement
ENV POSTGRES_DB=db
ENV POSTGRES_USER=fabriciopa
ENV POSTGRES_PASSWORD=5472

# Exposez le port PostgreSQL
EXPOSE 5432