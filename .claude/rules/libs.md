---
paths:
  - "libs/**"
---

# 共享包规范：libs/schemas、libs/formula、libs/i18n

- 共享包不依赖任何应用（`apps/*`），不允许循环依赖，由 `pnpm arch` 检查。
- `libs/formula` 和 `libs/i18n` 必须能在 Node 和浏览器里运行：tsconfig 不引入 Node 类型，不用 `fs`、`process`、`Buffer` 等 Node 专有接口。公式引擎的黄金测试要在 Node 和浏览器里各跑一遍（ADR-0008）。
- `libs/schemas` 只放 zod 结构和由它推导的类型，不放业务逻辑。
- 对外只通过 `src/index.ts` 导出；消费方引用包名，不引用包内部路径。
- 其余规则（类型、异步、测试、复杂度上限）同 `.claude/rules/api.md` 的"类型和校验"到"测试"各节。
