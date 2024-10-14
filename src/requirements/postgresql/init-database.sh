#!/bin/bash
set -e

# Fonction pour exécuter des commandes SQL
psql_execute() {
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "$1"
}

# Vérifier si la base de données existe déjà
if psql_execute "\l" | grep -q "$POSTGRES_DB"; then
    echo "La base de données $POSTGRES_DB existe déjà. Utilisation de la base existante."
else
    echo "La base de données $POSTGRES_DB n'existe pas. Création de la base de données..."
    
    # Créer la base de données
    psql_execute "CREATE DATABASE $POSTGRES_DB;"
    
    # Se connecter à la nouvelle base de données
    psql_execute "\c $POSTGRES_DB"
    
    # Exécuter le script SQL pour créer les tables
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/init-database.sql
    
    echo "Base de données $POSTGRES_DB créée et initialisée avec succès."
fi