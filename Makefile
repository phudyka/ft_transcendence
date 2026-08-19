NAME = up

PROJECT = "ft_transcendence"

HOSTNAME ?= $(shell hostname -A | cut -d' ' -f1)

IMAGES =	src-nginx\
			src-django\
			src-postgresql\
			src-realtime\


VOLUMES =	src_static_files\
			src_postgres_data

all: $(NAME)

$(NAME): update-hostname
	@docker compose --project-directory src up -d
	@echo Project available at https://$(HOSTNAME):8080

# Les adresses ne sont plus en dur dans le code : seul src/.env, non versionné,
# porte encore l'hôte. Les URL du frontend viennent de frontend/.env.
update-hostname:
	@sed -i 's|https://[^:]*:8080|https://$(HOSTNAME):8080|g' src/.env
	@echo "Hostname updated to $(HOSTNAME)"

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
	@python3 scripts/check_django.py

debug: $(NAME)
	@docker compose --project-directory src logs -f

.PHONY: all up start down stop clean fclean re refclean update-hostname check debug