# 构建上下文是仓库根目录（工作区需要 libs/*）：docker build -f apps/api/Dockerfile .
FROM node:24-slim AS build
RUN npm install -g pnpm@12.16.1
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm --filter "@gdcs/api..." run build \
 && pnpm --filter @gdcs/api deploy --prod /out

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out .
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
