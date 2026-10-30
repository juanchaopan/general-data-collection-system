# ADR-0009 前端的技术细节（apps/web、apps/addin）

- 状态：已接受
- 日期：2026-10-30
- 相关需求：REQ-014、021、022、029、030

## 背景

两个前端：登录后的 Web 工作台（管理界面、模板预览、在线填报），和 Excel 加载项的任务窗格。无障碍（AODA）、英法双语是硬性要求；偏好免费开源；用户熟悉 TypeScript。按规范库 `react-ts` 的决策点逐项决定。

## 决策

| 决策 | 选择 | 理由 |
|---|---|---|
| 框架 | React + Vite 单页应用 | 登录后的工作台，不需要服务端渲染；AG Grid 有成熟的 React 封装 |
| 电子表格网格 | AG Grid Community（MIT） | ADR-0001 |
| 公式引擎 | `libs/formula`（浏览器内即时预览） | ADR-0001、ADR-0008 |
| 组件分层 | 页面 + 展示组件 | 规范库默认；展示组件不取数据，便于 Storybook 和测试 |
| 路由 | React Router | 规范库默认 |
| 服务器状态 | TanStack Query | 缓存、重试、乐观更新；适合自动保存、锁心跳、SSE 触发的重新取数 |
| 全局状态 | 不需要；需要时再加 Zustand | 避免过早复杂化 |
| 样式 | CSS Modules + 设计令牌（CSS 自定义属性） | 对比度、字号、间距集中管理，利于无障碍 |
| 组件库 | React Aria Components（Adobe，Apache-2.0） | 无障碍是首要目标；自带国际化和日期数字格式；无样式，配合 CSS Modules |
| 展示组件目录 | Storybook，开启无障碍插件 | 每个展示组件一个 story；英法两种语言预览；自动检查对比度和属性 |
| 端到端与视觉验证 | Playwright：关键流程端到端 + 每页 axe 检查 + 视觉回归截图 | 用户选择加视觉回归；英法两种语言会让截图基线加倍，需要控制范围（只截关键页面） |
| 国际化 | `libs/i18n` 的英、法文案；用 React Aria 的 I18nProvider 处理格式 | 可扩展语言 |
| 单元和组件测试 | Vitest + Testing Library | 规范库默认 |
| lint 与格式化 | 模板自带的 linter（oxlint 或 ESLint）+ Prettier | 规范库默认 |
| 架构检查 | dependency-cruiser，规则按规范库 `react-ts` | 展示组件不得引用取数据库 |
| 加载项前端 | 同样的 React + Vite + React Aria Components，构建成静态文件放在 `/addin/` | 复用共享包和无障碍组件；界面很小 |
| TypeScript 版本 | 先固定 6.x | 同后端 |

## 视觉验证方式

- **设计来源**：没有设计稿；设计令牌（颜色、字号、间距、圆角）作为设计的唯一来源，放在 `apps/web/src/shared/tokens`，加载项共用。
- **Storybook**：展示组件的展示与检查。
- **视觉回归**：Playwright 对关键页面截图比对，基线放进仓库；英法两种语言只对少数关键页面各做一份。
- **无障碍**：Storybook 的无障碍插件（组件级）+ Playwright 的 axe（页面级）；**读屏软件的真人测试不能自动化**，在 1b 开发前做（Q-021）。

## 证据

ADR-0001（网格与公式引擎）；其他无探针。

## 后果

- 好处：免费；无障碍从组件库就开始；两个前端共享包与令牌；展示组件可独立测试。
- 代价：React Aria 无样式，要自己写样式；视觉回归的基线要维护（英法加倍）；AG Grid Community 没有区域选择和填充柄（Q-023）；Storybook 增加构建时间和 CI 步骤。
- 什么时候应该重新考虑：读屏测试发现 AG Grid 不合格（ADR-0001）；视觉回归基线维护成本超过收益；需要服务端渲染。
