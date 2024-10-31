NAME = up

PROJECT = "ft_trans"

IMAGES =	ft_trans_web\
			ft_trans_db\
			ft_trans_game_server

VOLUMES =	ft_trans_static_volume\
			ft_trans_db_data

all: $(NAME)

$(NAME):
	@docker compose up -d

start: all

down:
	@docker compose down -t 0

stop: down

clean: down
	@docker image rm -f $(IMAGES) > /dev/null 2>&1
	@echo "Images supprimées."

fclean:
	docker compose down -v
	docker system prune -af --volumes
	@docker image rm -f $(IMAGES) > /dev/null 2>&1
	@docker volume rm -f $(VOLUMES) > /dev/null
	@docker system prune -af > /dev/null
	@rm -rf ./backend/postgres-data/* > /dev/null 2>&1
	@echo "Images supprimées."
	@echo "Volumes supprimés."
	@echo "Database supprimée."
	@echo "System pruned."

re: clean all

refclean: fclean all

debug:
	@docker compose logs -f

.PHONY: all up start down stop clean fclean re refclean debug
