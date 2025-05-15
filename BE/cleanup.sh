#!/bin/bash
echo "Stopping and removing all containers..."
docker stop $(docker ps -a -q) 2>/dev/null || true
docker rm $(docker ps -a -q) 2>/dev/null || true

echo "Removing unused volumes..."
docker volume prune -f

echo "Removing unused images..."
docker image prune -a -f

echo "Cleaning up node_modules..."
rm -rf node_modules
npm install

echo "Done! Now try running docker-compose up --build"