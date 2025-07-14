# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* .
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM caddy:2-alpine
COPY --from=builder /app/dist /srv
COPY --from=builder /app/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"] 