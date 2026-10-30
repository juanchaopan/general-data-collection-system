#!/bin/sh
# 在 Playwright 官方镜像里生成视觉回归的基准截图（本地与 CI 渲染一致）。
# 用法（仓库根目录，版本号取 @playwright/test 的版本）：
#   docker run --rm --ipc=host -v "<仓库绝对路径>:/src" -w /src mcr.microsoft.com/playwright:v<版本号>-noble sh apps/web/scripts/update-snapshots.sh
# 在容器内的副本里安装、构建、截图，再把基准图拷回挂载目录，避免 Windows 的 node_modules 混进 Linux。
set -e
mkdir -p /work
tar --exclude=node_modules --exclude=dist --exclude=.git --exclude=storybook-static --exclude=test-results -cf - . | tar -xf - -C /work
cd /work
npm install -g pnpm@"$(node -p "require('./package.json').packageManager.split('@')[1]")" >/dev/null
pnpm install --frozen-lockfile
pnpm --filter "./libs/*" run build
cd apps/web
pnpm exec playwright test --update-snapshots
mkdir -p /src/apps/web/e2e
cp -r e2e/. /src/apps/web/e2e/
