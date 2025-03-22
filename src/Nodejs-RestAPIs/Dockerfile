FROM oven/bun:latest
WORKDIR /code
COPY package.json bun.lockb /code
RUN bun install --production

COPY . /code

EXPOSE 8080
CMD [ "bun", "run", "server.js" ]
