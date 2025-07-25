FROM docker.io/oven/bun:alpine
WORKDIR /code
COPY package.json bun.lockb /code
RUN apk add --no-cache python3 py3-pip make g++
# debian RUN apt-get update && apt-get install -y python3 python3-distutils-extra make g++
RUN bun install --production

COPY . /code

EXPOSE 8080
CMD [ "bun", "run", "server.js" ]
