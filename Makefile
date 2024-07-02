NAME = up

PROJECT = "ft_transcendence"

IMAGES =	src-grafana\
			src-prometheus\
			src-alertmanager\
			src-node-exporter\
			src-cadvisor

VOLUMES =	src_prometheus_data

all: $(NAME)

$(NAME):
	@mkdir -p \
		src/data/monitoring/prometheus_data
	@docker compose --project-directory src up -d > /dev/null

start: all

down:
	@docker compose --project-directory src down > /dev/null

stop: down

clean: down
	@docker image rm -f $(IMAGES) > /dev/null

fclean: clean
	@docker volume rm -f $(VOLUMES) > /dev/null
	@rm -rf src/data/

re: fclean all

.PHONY: all up start down stop clean fclean re