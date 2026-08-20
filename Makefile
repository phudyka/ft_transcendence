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

start: all

down:
	@docker compose --project-directory src down -t 0

stop: down

clean: down
	@docker image rm -f $(IMAGES) > /dev/null 2>&1
	@echo "Images removed."

fclean: clean
	@docker volume rm -f $(VOLUMES) > /dev/null
	@echo "Volumes removed."

re: clean all

refclean: fclean all

# Contrôles rapides, sans conteneur. Node 22+ et les dépendances de
# frontend/ et src/requirements/realtime/ doivent être installés ; check_django
# demande celles de src/requirements/django/conf/requirements.txt.
check:
	@node scripts/check-assets.mjs
	@node scripts/check-escaping.mjs
	@node scripts/check-physics.mjs
	@node scripts/check-realtime.mjs
	@$(if $(wildcard .venv/bin/python),.venv/bin/python,python3) scripts/check_django.py

debug: $(NAME)
	@docker compose --project-directory src logs -f

.PHONY: all up start down stop clean fclean re refclean check debug