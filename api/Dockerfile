# syntax=docker/dockerfile:1

FROM node:16

WORKDIR /api_infinity

COPY package*.json .

RUN npm i

COPY . .

RUN npm run build

EXPOSE 3000

CMD [ "npm", "run", "start:prod" ]