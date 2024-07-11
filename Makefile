NAME = up

PROJECT = "ft_transcendence"

IMAGES =	src-grafana\
			src-prometheus\
			src-alertmanager\
			src-node-exporter\
			src-cadvisor\
			src-nginx\
			src-backend

VOLUMES =	src_prometheus_data

all: $(NAME)

$(NAME):
	@docker compose --project-directory src up -d

start: all

down:
	@docker compose --project-directory src down

stop: down

clean: down
	@docker image rm -f $(IMAGES) > /dev/null 2>&1

fclean: clean
	@docker volume rm -f $(VOLUMES) > /dev/null

re: fclean all

.PHONY: all up start down stop clean fclean re