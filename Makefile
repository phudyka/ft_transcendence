NAME = up

PROJECT = "ft_trans"

IMAGES =	ft_trans_web\
			ft_trans_db\
			ft_trans_game_server

VOLUMES =	ft_trans_static_volume\
			ft_trans_db_data

all: $(NAME)

$(NAME):
	@docker-compose up -d

start: all

down:
	@docker-compose down -t 0

stop: down

clean: down
	@docker image rm -f $(IMAGES) > /dev/null 2>&1
	@echo "Images supprimées."

fclean: clean
	@docker volume rm -f $(VOLUMES) > /dev/null
	@echo "Volumes supprimés."

re: clean all

refclean: fclean all

.PHONY: all up start down stop clean fclean re refclean

