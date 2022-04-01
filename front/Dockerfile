# syntax=docker/dockerfile:1

FROM node:16 AS APP

WORKDIR /infinity

COPY package*.json .

RUN npm i

COPY . .

RUN npm run build

FROM nginx:1.21.6 AS NGINX
 
COPY --from=APP /infinity/dist/infinity /usr/share/nginx/html
COPY ./nginx.conf  /etc/nginx/conf.d/default.conf

EXPOSE 4200