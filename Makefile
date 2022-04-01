GREEN = "\033[32m"
WHITE = "\033[0m"

define print
	echo -e $(GREEN)$(1)$(WHITE)
endef

_C = docker ps -aq
_I = docker images -aq
_V = docker volume ls -q
_N = docker network ls -q
 
NB_C = $$($(_C) | wc -l)
NB_I = $$($(_I) | wc -l)
NB_V = $$($(_V) | wc -l)
NB_N = $$($(_N) | wc -l)

clean	: SHELL:=/bin/bash
fclean	: SHELL:=/bin/bash
install	: SHELL:=/bin/bash
all	: SHELL:=/bin/bash

all	:
	@$(call print,"- docker-compose  up --build")
	@docker-compose up --build

install	:
	@$(call print,"- Install docker")
	sudo apt-get remove docker docker-engine docker.io containerd runc ; true
	sudo apt-get -y update
	sudo apt-get -y install \
	apt-transport-https \
	ca-certificates \
	curl \
	gnupg \
	lsb-release
	curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
	echo \
  	"deb [arch=$$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
	sudo apt-get -y update
	sudo apt-get -y install docker-ce docker-ce-cli containerd.io
	sudo usermod -a -G docker $$(whoami)
	@$(call print,"- Install docker compose")
	sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$$(uname -s)-$$(uname -m)" \
	-o /usr/local/bin/docker-compose
	sudo chmod +x /usr/local/bin/docker-compose
	sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

clean   : 
	@$(call print,"- Clean containers")
	@[ $(NB_C) -ne 0 ] && docker rm -f $$($(_C)); true
	@$(call print,"- Clean volumes")
	@[ $(NB_V) -ne 0 ] && docker volume rm -f $$($(_V)); true
	@$(call print,"- Clean networks")
	@[ $(NB_N) -ne 0 ] && docker network rm $$($(_N)) 2> /dev/null ; true

fclean  : clean
	@$(call print,"- Clean images")
	@[ $(NB_I) -ne 0 ] && docker rmi -f $$($(_I)); true

re	: fclean all

.PHONY: all clean fclean re