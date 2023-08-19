FROM node:latest as build
WORKDIR /app
COPY . /app/

FROM nginx:1.23-alpine
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]