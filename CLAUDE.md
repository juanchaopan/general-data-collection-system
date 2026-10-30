# 通用数据采集系统（GDCS）

多租户的通用数据采集平台：模板设计人在 Excel 里设计模板，各机构的填报人在浏览器里填报；从零重建，老系统（GDCT_PlanB、GDCT_TDT）只作需求参照。需求见 `docs/product/`，架构见 `docs/architecture/overview.md` 和 `docs/adr/`。

## 组件

| 组件 | 目录 | 技术栈 | 职责 |
|---|---|---|---|
| API 与后台任务 | `apps/api` | TypeScript 6、Node 24、Fastify、zod、Drizzle、pg-boss | 业务逻辑、授权、校验、公式重算；`ROLE=worker` 时跑后台任务 |
| Web 工作台 | `apps/web` | React 19、Vite、AG Grid、React Aria Components | 管理界面、模板预览、在线填报 |
| Excel 加载项 | `apps/addin` | React 19、Vite、Office.js | 模板设计工具的任务窗格 |
| 共享：结构 | `libs/schemas` | TypeScript、zod | API 请求响应结构 |
| 共享：公式引擎 | `libs/formula` | TypeScript（Node 与浏览器通用） | 公式解析、依赖图、增量重算 |
| 共享：文案 | `libs/i18n` | TypeScript | 英、法文案 |
| 共享：设计令牌 | `libs/tokens` | CSS | 颜色、字号、间距、圆角 |
| 本地环境 | `infra/` | docker compose、Caddy、PostgreSQL、Keycloak、Mailpit | 一条命令启动整套系统 |

## 自检命令

完成任何改动后，对改到的每个组件依次运行下面的命令，并在回复里贴出真实输出。有失败就继续修，不要只说"已完成"。包管理器是 pnpm，命令都在组件目录下运行（`libs/tokens` 只有 CSS，没有检查命令）。apps 引用 libs 的构建产物，改了 libs 后先在仓库根目录运行 `pnpm build`。`apps/web` 的 `pnpm test` 会在浏览器里跑每个 story（含无障碍检查），首次需要 `pnpm exec playwright install chromium`；另有 `pnpm build-storybook`。视觉回归和 axe 的 e2e 只在 Playwright 官方镜像里跑（CI 的 `web-visual`），基准截图用 `apps/web/scripts/update-snapshots.sh` 生成。

| 组件 | 格式化 | lint 和架构检查 | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|---|
| apps/api | `pnpm format` | `pnpm lint && pnpm arch` | `pnpm typecheck` | `pnpm test` | `pnpm build` |
| apps/web | `pnpm format` | `pnpm lint && pnpm arch` | `pnpm typecheck` | `pnpm test` | `pnpm build` |
| apps/addin | `pnpm format` | `pnpm lint && pnpm arch` | `pnpm typecheck` | `pnpm test` | `pnpm build` |
| libs/schemas | `pnpm format` | `pnpm lint && pnpm arch` | `pnpm typecheck` | `pnpm test` | `pnpm build` |
| libs/formula | `pnpm format` | `pnpm lint && pnpm arch` | `pnpm typecheck` | `pnpm test` | `pnpm build` |
| libs/i18n | `pnpm format` | `pnpm lint && pnpm arch` | `pnpm typecheck` | `pnpm test` | `pnpm build` |

整个仓库还有一项重复代码检查：`npx jscpd .`（在仓库根目录运行）。

## 代码规范

- 各技术栈的规范在 `.claude/rules/`，改到对应目录的文件时会自动加载。里面的分层规则由架构检查强制，检查不通过时改代码的结构，不要改规则来迁就代码；确实需要改规则时，先问。
- 后端模块边界与规范库默认规则不同，见 ADR-0004 和 `.claude/rules/api.md`；新增模块依赖先改架构文档和 `apps/api/.dependency-cruiser.cjs` 顶部的依赖图。
- 界面文案走 `libs/i18n`（英、法），样式只用 `libs/tokens` 的设计令牌；无障碍按 WCAG 2.1 AA。
- 全部使用免费开源的依赖（MIT、Apache、BSD）；引入 GPL 或商业组件前先问。
- TypeScript 固定在 6.x，等 typescript-eslint 和 dependency-cruiser 支持 7 后再升级。
- 新逻辑要带测试。测试要能在代码出错时失败，不能和实现犯同一个错。
- 不提交密钥、令牌和个人数据；这些通过环境变量或密钥管理读取。

## 写代码的方式

- 改完的代码要读起来像一次写成的。注释只说明现在的代码做什么、为什么这样设计；不写"改为…""新增…""修复…""原来是…"这类修改记录，修改历史留给提交信息。
- 不留死代码、注释掉的代码、不再使用的参数和分支，也不为兼容旧写法保留代码，除非有调用方确实还在用。
- 新需求放不进现有结构时，先调整结构，再加新功能：先做一个不改变行为的重构提交（测试保持通过），再做功能提交。不要往旧函数里不断追加 if 和参数。
- 同样的逻辑出现第二次时考虑提取，第三次时必须提取。
- 函数和文件变长、变复杂时拆开。复杂度和长度的上限由 lint 检查，重复代码由 jscpd 检查。
- 改动会大面积影响现有的类、接口或模块划分时，先停下来，用 /change 评估设计影响，不要边写边改。

## 目标与非目标

- 目标：第一期（1a 实例与权限、机构、科目表、加载项、模板发布、审计；1b 在线填报、校验计算、提交、邮件）在本地 docker compose 上跑通，CI 全绿。
- 非目标：第一期不建线上环境、不配部署流水线；审批流程和数据输出（报表、仪表盘）在第二期；离线 Excel 填报在第三期。

## 分支与提交

- 分支策略：GitHub Flow。从 main 拉分支，PR 合回 main；发布就是在 main 上打版本标签。
- 分支命名：feature/<issue 号>-<简述>、fix/<issue 号>-<简述>、refactor/<issue 号>-<简述>、docs/<简述>、chore/<简述>、spike/<简述>。
- 提交信息用 Conventional Commits：`<类型>(<范围>): <描述> (#<issue 号>)`，例如 `feat(auth): 支持邮箱登录 (#12)`。`.githooks/commit-msg` 和 CI 都会检查。
- 一个提交只做一件事，每个提交都能单独通过自检命令，不把无关改动混进来。
- 合并方式：merge commit，保留每个小提交。PR 开启自动合并，检查全部通过后由 GitHub 合并。

## 工作流程

- 不直接提交到受保护的分支，所有改动通过 PR 合并。
- 开 PR 用 `/open-pr`：它会先跑自检命令、本地简化审查、code-review 和 security-review，再按模板填写 PR。
- 新功能尽量做成可以关掉的（开关或配置项），出了问题不用回滚代码就能停用。
- 改动涉及 `.github/risk-rules.txt` 里 `[high]` 下的路径时，在 PR 的 Risk 一栏写明原因。
- 实现时发现需求或架构文档不够用、或者和代码对不上，先停下来问，不要自己拍板。
- 方案不确定、风险大时，先用 /spike 做一个用完就扔的验证，结论写进 ADR 再正式实现。

## 文档

- 审查标准：`REVIEW.md`
- 给其他 AI 工具的入口：`AGENTS.md`
- 文档索引：`docs/README.md`（需求、架构、决策记录；路线图由 /roadmap 生成）
- 本地环境：`infra/docker-compose.yml`，先把 `infra/.env.example` 复制为 `infra/.env`，再 `docker compose -f infra/docker-compose.yml up --build`，入口 https://localhost
