# Stage 1: Build static assets
# Use Debian-based image for better native package compatibility during install.
FROM node:20-bookworm-slim AS build

WORKDIR /app

ENV npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

ENV NGINX_PORT=5004
ENV BACKEND_UPSTREAM=backend:5003

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 5004

CMD ["nginx", "-g", "daemon off;"]
