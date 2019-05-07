FROM node:10
RUN mkdir -p /code
WORKDIR /code
COPY package.json /code

RUN npm install

COPY . /code

EXPOSE 4200
CMD [ "npm", "serve" ]
