#!/bin/bash

launchctl stop $(launchctl list | awk '/com.docker.docker/ {print $3}') 2> /dev/null
rm -rf ~/.docker
rm -rf ~/Library/Containers
mkdir -p  ~/goinfre/Containers
ln -sf ~/goinfre/Containers ~/Library/

if [ ! -d "/Applications/Docker.app" ] && [ ! -d "~/Applications/Docker.app" ]; then
	echo "Please install Docker from Managed Software Center"
	open -a "Managed Software Center"
	read -n1 -p "Press RETURN when you have successfully installed Docker ..."
	echo ""
fi

echo "Start docker"
docker ps > /dev/null 2>&1 || open --background -a Docker;
