# 构建上下文是仓库根目录：docker build -f apps/web/Dockerfile .
FROM node:24-slim AS build
RUN npm install -g pnpm@12.16.1
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter "@gdcs/web..." run build

# 静态文件由一个很小的 Caddy 提供；对外的 HTTPS 和路径分发由 infra/caddy 负责。
FROM caddy:2-alpine
COPY infra/caddy/Caddyfile.static /etc/caddy/Caddyfile
COPY --from=build /repo/apps/web/dist /srv
EXPOSE 8080
