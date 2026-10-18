# Stufe 1: Build (Katalog liegt bereits in public/data; nur Vite-Build + Kompression)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stufe 2: statische Auslieferung mit nginx (unprivilegiert auf Port 8080)
FROM nginx:1.27-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY deploy/nginx.conf /etc/nginx/conf.d/theorie-trainer.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
