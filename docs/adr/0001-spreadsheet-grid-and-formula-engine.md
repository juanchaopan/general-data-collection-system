# ADR-0001 浏览器电子表格网格与公式引擎

- 状态：已接受（含必须在 1b 开发前补齐的验证，见"后果"）
- 日期：2026-10-30
- 相关需求：REQ-015、REQ-021、REQ-022、REQ-030；Q-008、Q-009

## 背景

填报人要在浏览器里像用 Excel 一样填模板（REQ-021），要求实时公式计算和校验（REQ-022），并且必须满足无障碍 WCAG 2.1 AA（REQ-030，AODA）。老系统同时依赖 DevExpress 和 Syncfusion 两套商业组件，授权成本是它的问题之一。

约束：
- 用户偏好免费方案（2026-10-30 明确）。默认只考虑 MIT、Apache 等宽松的开源许可。
- 服务端必须能重算公式，以服务端结果为准（REQ-022）。
- 典型模板约 100 行 × 51 列（约 5000 格），需验证到 10 万格的余量（真实规模见 Q-017，尚无样例）。

## 候选方案

| 方案 | 优点 | 缺点 | 适合条件 |
|---|---|---|---|
| A. AG Grid Community（MIT）+ fast-formula-parser（MIT）+ formulajs（MIT）+ 自建依赖图 | 全免费；网格是 DOM 渲染，ARIA 结构 axe 零违规；性能余量大 | 依赖图和函数白名单自己维护；缺失函数要补；AG Grid Community 没有电子表格式的区域选择、填充柄、区域粘贴（这些在付费的 Enterprise） | 要免费、要无障碍、模板结构相对规整 |
| B. AG Grid Community + HyperFormula | 公式引擎成熟，编辑 P95 0.58 ms（10 万格） | HyperFormula 是 GPL-3.0，随网页分发要么开源整个应用、要么买商业许可 | 愿意付费或接受开源整个应用 |
| C. Handsontable + HyperFormula | 自带电子表格交互 | Handsontable 是专有许可；真浏览器里 axe 有 2 条 critical 违规；编辑 P95 33 ms | 不在乎授权成本且无障碍要求低 |
| D. Univer（Apache-2.0） | 免费，网格和公式一体 | 按其包说明是画布渲染（"Canvas rendering engine"），读屏软件大概率读不到单元格，与 AODA 冲突；**未实测** | 无障碍要求低 |
| E. Syncfusion / DevExpress | 功能全 | 商业授权；老系统的成本问题；无障碍未测 | 预算充足 |

## 决策

采用方案 A：

- **网格**：AG Grid Community。
- **公式求值**：`fast-formula-parser`；缺失的函数用 `@formulajs/formulajs` 通过 `functions` 选项补上（探针里已补 MIN、MAX、PERCENTILE、LOOKUP）。
- **依赖图与增量重算**：自建（探针约 70 行），解析时用 `DepParser` 取引用，编辑后沿反向依赖拓扑排序重算。
- **服务端权威**：保存和提交时服务端重算和校验，浏览器端只作即时预览（REQ-022）。
- **函数白名单**：模板上传时（REQ-015）静态检查公式用到的函数，遇到引擎不支持的就拒绝并报错，不留到运行时。
- **判据**：C1 到 C5（渲染 3 秒内、编辑 P95 100 ms 内、公式正确、无障碍、授权可接受）经用户确认（2026-10-30）。C5 按用户偏好具体化为"优先免费"。

否决 B、C：授权。否决 D 的理由是推断（画布渲染），但与 AODA 冲突的风险足以排除；若以后想重新评估要先实测 DOM 和读屏。

## 证据

探针分支 `spike/spreadsheet-grid`，归档标签 `archive/spike-spreadsheet-grid`。完整记录见 `assets/spike-spreadsheet-grid-SPIKE.md`。

| 项 | 结果 |
|---|---|
| C1 可交互时间（真实浏览器，ungoogled-chromium 149，5151 格） | AG Grid 384 ms；Handsontable 617 ms |
| C2 编辑 P95（浏览器，含重算与刷新调用，不含绘制） | AG Grid + HyperFormula 3.1 ms；Handsontable + HyperFormula 33.4 ms |
| 自建引擎编辑 P95（Node，10 万格） | 6.87 ms（HyperFormula 0.58 ms）；结果与独立求和一致 |
| C4 axe 自动检查（wcag2a/2aa/21a/21aa） | AG Grid 0 违规；Handsontable 2 条 critical |
| 键盘主路径（方向键、Enter 编辑、输入、Enter 提交） | 两者通过 |
| 函数覆盖 | 24 项常用公式中 20 项通过，缺 MIN、MAX、PERCENTILE、LOOKUP；适配后 6/6 通过 |
| 截图 | `assets/spike-spreadsheet-grid-ag-grid.png`、`assets/spike-spreadsheet-grid-handsontable.png` |
| 原始数据 | `assets/spike-spreadsheet-grid-results-browser.json` |

局限：浏览器是 ungoogled-chromium 不是 Edge；C2 不含绘制耗时；自建引擎只在 Node 里测；负载只有 SUM 级联；没有用真实模板（Q-017）。

## 后果

- 好处：零授权费；DOM 渲染的网格利于无障碍；性能余量比判据大一到两个数量级；不被任何厂商绑定。
- 代价：
  - **依赖图、函数白名单、跨工作表引用、循环引用检测要自己做并持续维护**。
  - **AG Grid Community 没有区域选择、填充柄、区域粘贴**。REQ-021 要求"与 Excel 的习惯一致"，这部分要么自己实现，要么降低期望（只支持单格编辑与逐格粘贴）。这是 Q-023。
  - **公式引擎是 JavaScript**。后端若也用 TypeScript，浏览器与服务端可复用同一份代码；若不是，要另起一个 Node 计算服务，或在后端语言里另选免费引擎并用同一组"黄金测试"保证两边结果一致。这是 /architect 要决定的（Q-009）。
- **必须在 1b 开发前完成的验证**（不是现在放行就不用做，是现在放行但记账）：
  1. 真人用读屏软件（NVDA、JAWS）在 AG Grid 上试填一份模板（Q-021）。
  2. 颜色对比度（axe 判断不了，需人工或带真实主题复核）。
  3. 在 Edge 上重跑；补测 Tab 离开网格、Esc 取消、选区、粘贴等键盘路径。
  4. 用真实模板样例复测规模（Q-017）。
  5. 把自建引擎放进浏览器里跑一遍。
- 什么时候应该重新考虑：读屏测试发现 AG Grid 读不出单元格地址、行列标题或值；真实模板里大量用到引擎不支持且难以补的函数；单个模板超过 10 万格且编辑 P95 超过 100 ms；需要区域选择等 Enterprise 功能且自建成本过高；愿意为公式引擎或网格付费。
