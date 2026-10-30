# ADR-0008 后端的技术细节（apps/api、libs/*）

- 状态：已接受
- 日期：2026-10-30
- 相关需求：REQ-013、015、019、022、025、031、032

## 背景

后端是 TypeScript 的模块化单体（ADR-0003）。用户熟悉 TypeScript/Node.js。偏好免费开源。按规范库 `node-ts` 的决策点逐项决定。

## 决策

| 决策 | 选择 | 理由 |
|---|---|---|
| 语言与运行时 | TypeScript（严格模式）、Node.js 当前 LTS | 用户熟悉；与公式引擎和前端同一语言 |
| Web 框架 | Fastify | 快、自带 schema 校验和 `inject` 测试；比 NestJS 少"魔法"，更适合 AI 和审阅者 |
| 输入校验与接口定义 | zod，同时生成 OpenAPI | 一份结构前后端和加载项共用（ADR-0007） |
| 数据访问 | Drizzle（查询）+ 手写 SQL 迁移 | 类型安全且接近 SQL；分区、行级安全、约束都要手写 SQL |
| 数据库驱动 | node-postgres（pg） | Drizzle 的底层驱动；`LISTEN/NOTIFY` 用单独的非池连接 |
| 任务队列 | pg-boss | ADR-0005 |
| 包管理器与仓库 | 单仓库 + pnpm 工作区 | 多个 Node 包共享 `libs/*` |
| 测试 | Vitest；数据库用真实的测试实例（容器），不模拟查询结果 | 规范库默认；行级安全和分区必须真实测试 |
| Excel 读写 | ExcelJS（MIT） | 免费；拒绝含宏文件、限制体积（REQ-015、025、026） |
| 邮件 | nodemailer 经 SMTP；本地用 Mailpit | 与提供商无关；线上提供商见 Q-025 |
| JWT 校验 | jose（MIT），JWKS 缓存 | 不依赖 Keycloak 在线 |
| 日志 | pino，结构化，带请求编号 | 规范库推荐 |
| 指标与追踪 | OpenTelemetry SDK + `/metrics`（Prometheus 格式） | 采集后端按线上平台再定，业务代码不变 |
| lint / 格式化 | ESLint + typescript-eslint + Prettier | 规范库默认 |
| 架构检查 | dependency-cruiser，规则按 ADR-0004 | 规范库默认，规则已按本项目修改 |
| TypeScript 版本 | 先固定 6.x | 规范库说明：typescript-eslint 和 dependency-cruiser 暂不支持 7 |

## 共享包

| 包 | 内容 | 约束 |
|---|---|---|
| `libs/schemas` | zod 结构：API 请求响应、领域 DTO | 无运行时依赖于应用 |
| `libs/formula` | 公式引擎封装：解析、依赖图、增量重算、函数白名单 | **能在 Node 和浏览器里运行**；基于 `fast-formula-parser`（MIT）、`@formulajs/formulajs`（MIT）和自建依赖图（ADR-0001）；用同一组黄金测试在 Node 和浏览器里各跑一遍 |
| `libs/i18n` | 英、法文案和格式 | 可扩展到更多语言 |

## 证据

- 公式引擎方案：ADR-0001 的探针。
- 其他：无探针，依据规范库默认和项目约束。

## 后果

- 好处：全免费；一种语言覆盖浏览器、服务端、加载项；类型贯穿。
- 代价：依赖图和函数白名单自己维护；手写 SQL 迁移要纪律；Drizzle 对分区表和行级安全的类型支持有限，这部分用原生 SQL。
- 什么时候应该重新考虑：Drizzle 的限制让手写 SQL 占比失控（改 Kysely）；需要更强的模块约束（改 NestJS）；TypeScript 7 工具链就绪后取消版本固定。
