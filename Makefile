COMPOSE = docker compose --project-directory src

# postgresql n'y est plus : le service prend l'image officielle telle quelle,
# il n'y a plus d'image locale à supprimer.
IMAGES =	src-nginx\
			src-django\
			src-realtime

VOLUMES =	src_static_files\
			src_postgres_data\
			src_media_files

# check_django.py demande les dépendances de src/django/conf/requirements.txt
# dans un .venv/ à la racine ; sans lui, python3 échoue sur les imports.
PYTHON = $(if $(wildcard .venv/bin/python),.venv/bin/python,python3)

all: up

# Les adresses ne sont plus en dur nulle part : src/.env porte celles du
# backend, frontend/.env celles du navigateur.
up:
	@$(COMPOSE) up -d
	@echo "API disponible sur $$(grep '^PUBLIC_API_URL' src/.env | cut -d= -f2- | tr -d '\"')"

down:
	@$(COMPOSE) down -t 0

clean: down
	@docker image rm -f $(IMAGES) > /dev/null 2>&1
	@echo "Images removed."

fclean: clean
	@docker volume rm -f $(VOLUMES) > /dev/null 2>&1
	@echo "Volumes removed."

# Aucun bind mount : Python, nginx et realtime sont copiés au build, donc
# toute modification du backend passe par re. Le frontend, servi par Vite
# depuis le disque, n'en a pas besoin.
re: clean all

refclean: fclean all

# Contrôles rapides, sans conteneur. Node 22+ et les dépendances de
# frontend/ et src/realtime/ doivent être installées.
check:
	@[ -d .venv ] || echo "note : .venv absent à la racine, check_django.py tombe sur python3 et échouera sur les imports Django."
	@node scripts/check-assets.mjs
	@node scripts/check-escaping.mjs
	@node scripts/check-physics.mjs
	@node scripts/check-controls.mjs
	@node scripts/check-realtime.mjs
	@$(PYTHON) scripts/check_django.py

# ESLint sur frontend/, src/realtime/ et scripts/ ; npm install à la racine requis.
lint:
	@npx eslint .

debug: up
	@$(COMPOSE) logs -f

.PHONY: all up down clean fclean re refclean check lint debug
