---
paths:
  - "apps/api/**"
---

# Node.js 规范：apps/api（后端 API 与后台任务）

来源：typescript-eslint 推荐规则、Node.js 官方文档。格式由 Prettier 负责，类型和常见问题由 TypeScript 严格模式和 ESLint 检查，分层由 dependency-cruiser（`.dependency-cruiser.cjs`，`pnpm arch`）检查；这里写需要判断的部分。

## 分层与模块边界（ADR-0004，与规范库默认规则不同）

后端是模块化单体：按业务模块分目录，每个模块内部分层。模块清单和允许的依赖见 `docs/architecture/overview.md`。

```
src/
├── <模块>/                 iam、organizations、periods、coa、templates、collection、notifications、audit
│   ├── index.ts            公开入口：其他模块只能 import 这里
│   ├── routes/             接收请求、用 zod 校验输入、调用 services、返回结果
│   ├── services/           业务逻辑和事务边界
│   ├── repositories/       数据访问（Drizzle），只操作本模块拥有的表
│   └── domain/             领域模型和业务规则，纯 TypeScript
├── shared/                 配置、错误类型、事务与租户上下文、批量导入框架、文件存储接口、任务封装
└── index.ts                组装模块、按 ROLE 以 API 或 worker 模式启动
```

由 `pnpm arch` 强制：

- 层内方向 routes → services → repositories → domain。里面的层不能依赖 routes；routes 和 domain 不能访问 repositories。
- domain 不依赖其他层、Web 框架、数据库驱动；services 不依赖 Web 框架（只允许引用类型）。
- 模块 A 用模块 B，只能 import B 的 `index.ts`；不能引用 B 内部的文件。
- 只能依赖架构文档"后端模块和允许的依赖"表里列出的模块；新增依赖要先改 `.dependency-cruiser.cjs` 顶部的依赖图和架构文档，并经评审。
- 每张表只有一个主人模块，只有主人的 repositories 可以读写；其他模块要数据，调用主人的公开入口。
- `audit` 不依赖任何业务模块；`notifications` 不被其他模块直接调用（其他模块入队任务，它消费）。
- `shared` 不依赖任何模块，不放业务规则。
- 不允许循环依赖。

公开入口要保持小而稳定：只导出别的模块确实需要的函数和类型。

## 类型和校验

- 不用 `any`。外部输入（请求体、查询参数、环境变量、消息）在 routes 里用 schema 校验（例如 zod），校验后的类型再往里传。
- 配置在启动时一次性读取并校验，缺了就报错退出。
- 用 ES 模块，相对导入写上 `.js` 扩展名（NodeNext 模块解析的要求）。

## 异步和错误

- 每个 Promise 都要 await 或显式处理（ESLint 的 no-floating-promises 会检查）。
- 错误统一由错误处理中间件转换成响应，不把堆栈返回给调用方。
- 调用外部服务都设置超时；只对幂等的操作做重试。
- 请求处理路径上不用同步的文件和加密 API（`readFileSync`、`pbkdf2Sync` 等），它们会卡住整个进程。

## 运行

- 日志用结构化日志库（例如 pino），每个请求带上追踪编号；不打印密码、令牌和完整的个人信息。
- 收到 SIGTERM 时优雅停机：停止接收新请求，处理完手上的再退出。
- 提供健康检查接口。
- 进程内不保存请求之间的状态，这样才能多实例部署。

## 测试

- 用 Vitest。services 用假的 repository 测业务逻辑；接口用框架自带的注入方式测（例如 Fastify 的 `inject`）或 supertest。
- 数据库用真实的测试实例（容器），不用模拟的查询结果；行级安全和分区必须真实测试。

## 本项目约定

- 所有租户表带 `instance_id`；每个事务开头 `SET LOCAL app.instance_id`，行级安全兜底（ADR-0005）。
- 数据库迁移是手写 SQL，先加后删，兼容上一版本代码。
- 提交、发布、导入接口要求 `Idempotency-Key`；单元格保存带变更编号。
- 错误统一转换成 RFC 7807 的 problem+json，带稳定错误码，不返回堆栈。
- 同一份代码以 `ROLE=api` 或 `ROLE=worker` 运行；进程内不保存请求之间的状态。
