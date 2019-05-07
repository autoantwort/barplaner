#!/bin/sh

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

if [ -x "$(command -v docker)" ]; then
    echo "docker installation satisfied"
else
    echo "Install docker please"
    exit 1
fi

if [ -x "$(command -v docker-compose)" ]; then
    echo "docker-compose installation satisfied"
else
    echo "Install docker-compose please"
    exit 1
fi

echo ""
echo "All requirements satisfied, building and deploying the project now..."
sleep 1

docker-compose up --build
