NAME = up

PROJECT = "ft_transcendence"

IMAGES =	src-grafana\
			src-prometheus\
			src-alertmanager\
			src-node-exporter\
			src-cadvisor\
			\
			src-nginx\
			src-django\
			src-postgresql\
			src-game_server\
			src-chat_server\
			

VOLUMES =	src_static_files\

all: $(NAME)

$(NAME):
	@docker compose --project-directory src up -d

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

.PHONY: all up start down stop clean fclean re refclean