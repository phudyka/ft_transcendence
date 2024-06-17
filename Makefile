NAME = up

PROJECT = "ft_transcendence"

IMAGES =	src-grafana\
			src-prometheus\
			src-node-exporter\
			src-cadvisor\
			src-elasticsearch\
			src-kibana

VOLUMES =	src_prometheus_data

all: $(NAME)

$(NAME):
	@mkdir -p src/data/prometheus
	@docker compose --project-directory src up -d

start: all

down:
	@docker compose --project-directory src down

stop: down

clean: down
	@docker image rm -f $(IMAGES)

fclean: clean
	@docker volume rm -f $(VOLUMES)
	@rm -rf src/data

re: fclean all

.PHONY: all up start down stop clean fclean re