---
paths:
  - "apps/web/**"
---

# React 规范：apps/web（Web 工作台）

来源：React 官方文档（https://react.dev/learn），以及社区通行的容器组件和展示组件（Container / Presentational）分层。格式由 Prettier 负责，Hooks 规则、复杂度和长度上限由模板自带的 linter（oxlint 或 ESLint）检查，类型由 TypeScript 检查，分层由 dependency-cruiser（`.dependency-cruiser.cjs`，`pnpm arch`）检查；这里写需要判断的部分。

## 分层：页面和展示组件

```
src/
├── app/                   应用外壳：路由、全局 Provider、布局
├── shared/ui/             几个功能共用的展示组件
├── shared/lib/            纯函数、通用 hooks
└── features/<功能>/
    ├── pages/             页面：路由指向它
    ├── components/        展示组件
    ├── data-access/       API 调用、服务器状态 hooks（例如 useOrders）、store
    └── model.ts           类型定义（也可以放在 data-access 里用 type 导出）
```

**页面（容器组件）**负责"数据从哪来、到哪去"：

- 调用 data-access 的 hooks 取数据、提交修改，处理加载中、出错和空数据。
- 持有页面状态，通过 props 交给子组件，通过子组件的回调（`onSelect`、`onChange`）更新状态；受控组件用 `value` 加 `onChange` 实现双向同步。
- 处理导航和路由参数。

**展示组件**只负责"长什么样"：

- 无状态：数据只从 props 进，变化只通过回调 props 出。内部只允许纯界面状态，例如展开、收起、悬停。
- 不取数据、不调 API、不访问全局状态和路由状态。需要什么数据，由页面传进来。
- 给定 props 就能独立渲染，这样才能在 Storybook 里展示、单独测试。

由 `pnpm arch` 强制的依赖规则：

- 展示组件（`components/`、`shared/ui/`）不能依赖 data-access、pages、app，也不能引用 TanStack Query、axios、SWR、Zustand、Redux 这类取数据和全局状态的库；可以用 `import type` 引用类型。
- data-access 不依赖界面。
- 功能之间不互相引用，几个功能共用的东西提到 `shared/`。shared 不依赖任何功能。
- 不允许循环依赖。

## 组件写法

- 只写函数组件。props 用 TypeScript 类型描述，不用 `any`。
- 组件文件名用 PascalCase（`OrderList.tsx`），hook 文件用 `useXxx.ts`。
- 一个组件太长或者做了几件事时拆开；函数长度和复杂度的上限由 lint 检查。
- 列表的 key 用稳定的业务 ID，不用数组下标。

## 状态

- 状态放在用到它的最近的组件里；几个组件共享时再往上提，或者放进 context 或状态库。
- 从服务器来的数据用专门的库管理（例如 TanStack Query），封装成 data-access 里的 hook，不用 useEffect 加 useState 自己拼。
- 能从现有状态算出来的值直接计算，不另存一份。
- useEffect 只用来和外部系统同步（订阅、DOM、定时器），并写好清理函数；不用它响应用户操作或派生状态。

## 数据和安全

- API 调用集中在 data-access 里，统一处理错误和认证。
- 不用 `dangerouslySetInnerHTML` 渲染用户输入的内容。
- `import.meta.env` 里的变量会被打包进前端，只放公开的配置，不放密钥。

## 样式

- 颜色、字号、间距、圆角用设计令牌（CSS 自定义属性 `var(--...)`），不写死颜色值和像素值。
- 展示组件的样式只作用于自己（CSS Modules 或所选样式方案的作用域机制），不改写子组件和全局样式。

## 质量

- 可交互元素用语义化的标签（button、a、label），能用键盘操作。
- 加载中、出错、空数据三种状态都要有界面。
- 测试用 Testing Library，按用户看得到的内容查找元素（role、label、文字），不测内部状态。展示组件测"给定 props 显示什么、点了调用什么回调"；页面测和 data-access 的配合。
- 生产代码里不留 `console.log`。

## 本项目约定

- 网格用 AG Grid Community，公式预览用 `@gdcs/formula`（ADR-0001）；组件库用 React Aria Components，样式用 CSS Modules 加 `@gdcs/tokens` 的设计令牌（ADR-0009）。
- 所有界面文案走 `@gdcs/i18n`，英法两种语言；不在组件里写死文案。
- 无障碍是硬性要求：每个展示组件有 story（开启无障碍检查），页面级由 Playwright 的 axe 检查，AA 违规不允许合并。
- 视觉回归的基准截图只在 Playwright 官方镜像里生成：`apps/web/scripts/update-snapshots.sh`；外观是有意改的，基准图随代码一起提交。
