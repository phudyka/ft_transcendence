NAME = up

PROJECT = "ft_transcendence"

IMAGES =	src-nginx\
			src-django\
			src-postgresql\
			src-realtime\


VOLUMES =	src_static_files\
			src_postgres_data\
			src_media_files

all: $(NAME)

# Les adresses ne sont plus en dur nulle part : src/.env porte celles du
# backend, frontend/.env celles du navigateur.
$(NAME):
	@docker compose --project-directory src up -d
	@echo "API disponible sur $$(grep PUBLIC_API_URL src/.env | cut -d'"' -f2)"

down:
	@docker compose --project-directory src down -t 0

clean: down
	@docker image rm -f $(IMAGES) > /dev/null 2>&1
	@echo "Images removed."

fclean: clean
	@docker volume rm -f $(VOLUMES) > /dev/null
	@echo "Volumes removed."

re: clean all

refclean: fclean all

# Contrôles rapides, sans conteneur. Node 22+ et les dépendances de
# frontend/ et src/realtime/ doivent être installés ; check_django
# demande celles de src/django/conf/requirements.txt.
check:
	@node scripts/check-assets.mjs
	@node scripts/check-escaping.mjs
	@node scripts/check-physics.mjs
	@node scripts/check-controls.mjs
	@node scripts/check-design.mjs
	@node scripts/check-realtime.mjs
	@$(if $(wildcard .venv/bin/python),.venv/bin/python,python3) scripts/check_django.py

# ESLint sur frontend/, realtime/ et scripts/ ; npm install à la racine requis.
lint:
	@npx eslint .

debug: $(NAME)
	@docker compose --project-directory src logs -f

.PHONY: all up start down stop clean fclean re refclean check lint debug