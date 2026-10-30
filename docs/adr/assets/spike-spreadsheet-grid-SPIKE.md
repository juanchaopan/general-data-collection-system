# SPIKE: 浏览器电子表格组件（Q-008）

**不合并。** 探针代码只为回答问题；结论见 `docs/adr/`。

## 问题
有没有一个浏览器端网格 + 公式引擎的组合，能同时满足：WCAG 2.1 AA、公式、性能、授权成本（REQ-021/022/030）？

## 判据（我在 fork 中自拟，待用户确认）
| # | 判据 | 通过条件 |
|---|---|---|
| C1 | 渲染 | 典型模板（100 行 × 51 列，约 5000 单元格，约 150 个公式）加载到可交互 < 3 秒 |
| C2 | 编辑响应 | 编辑一个输入格并重算依赖链后刷新，P95 < 100 ms（愿景要求服务端保存 < 500 ms，浏览器端应更快） |
| C3 | 公式 | SUM 的行/列/总计级联结果正确；引擎在 Node 里也能跑（服务端重算，REQ-022） |
| C4 | 无障碍 | axe-core 按 wcag2a/2aa/21a/21aa 标签扫描，严重/重要违规为 0；键盘能进入、移动、编辑、退出 |
| C5 | 授权 | 许可证可被政府项目接受（MIT/Apache 优先；GPL 或商业需单独评估） |

## 时间盒
一轮：两个候选 + 引擎基准。到时间没有结论也记录。

## 不管的事
读屏软件（NVDA/JAWS）真机测试、多语言、协同、移动端、公式语言子集（Q-009）、真实模板样例（Q-017，尚未取得）。

## 运行
```
npm install && npm run build && node bench-engine.mjs && node run-browser.mjs
```

## 结果（一轮，2026-10-30）

### 环境限制与补测方式
本机的 Chrome 和 Edge 的远程调试被系统管理员策略禁用（`DevTools remote debugging is disallowed by the system admin`），第一轮因此没能做浏览器实测。补测改用用户提供的便携版 ungoogled-chromium 149.0.7827.114（`C:\ungoogled-chromium_149.0.7827.114-1.1_windows_x64\chrome.exe`），Playwright 可以驱动它。`run-browser.mjs` 默认指向它，可用环境变量 `SPIKE_BROWSER` 覆盖。

两个踩坑：页面必须用 `127.0.0.1` 访问，并加 `--no-proxy-server`；用 `localhost` 会经系统代理，`page.goto` 超时。

### C1 / C2 / C4：真实浏览器（ungoogled-chromium 149，headless），`run-browser.mjs`，原始数据在 `results-browser.json`
典型模板：100 行 × 51 列（5151 格，约 150 个公式）。AG Grid 用默认的行列虚拟化（上面 jsdom 那一轮是关闭虚拟化渲染全部）。

| | AG Grid Community 36.2 + HyperFormula | Handsontable 18.1 + HyperFormula |
|---|---|---|
| C1 可交互时间（含页面加载） | 384 ms | 617 ms |
| 脚本内就绪（`__ready`） | 184 ms | 498 ms |
| C2 编辑 P50 / P95 / 最大 | 1.1 / 3.1 / 115.4 ms | 24.8 / 33.4 / 49.0 ms |
| 键盘：方向键移动、Enter 编辑、输入 777、Enter 提交 | 通过，格值 777，总计由 2455850 变为 2456527 | 通过，格值 777，总计同样变化 |
| axe 违规（wcag2a/2aa/21a/21aa） | 0 | 2 条 critical：`aria-required-children`（1 个节点）、`label`（1 个节点，表单元素无标签） |
| 页面脚本错误 | 无 | 无 |

解读与限制：
- **C1 通过**（远小于 3 秒），两者都通过。
- **C2 通过**（P95 远小于 100 ms），但这里测的是"改数据、重算、调用刷新"所花的脚本时间，**不含浏览器绘制**。AG Grid 的最大值 115 ms 出现在第一次调用，疑似首次渲染/JIT，P95 不受影响；没有做绘制耗时的测量。
- **C4 键盘部分只验证了一条路径**（点击、方向键、Enter 编辑、提交），没有测 Tab 离开网格、Esc 取消、Shift+方向键选区、粘贴等。
- **C4 颜色对比度没有得出结论**：两者的 `color-contrast` 都在 axe 的 `incomplete` 里，意思是自动检查判断不了，需要人工或带真实主题时复核。
- **读屏软件（NVDA/JAWS）仍然没测。** axe 零违规不等于读屏可用。
- 用的是 ungoogled-chromium，不是政府环境的标准浏览器（Edge）；渲染引擎同源，但仍建议在 Edge 上再跑一次。
- Handsontable 在真浏览器里同样有 `aria-required-children`，jsdom 那条结构违规得到复核；另外多出 `label` 违规。

### C3 / C2（仅公式引擎）：HyperFormula 3.5.0，Node 24，`bench-engine.mjs`
| 单元格数 | 加载 ms | 编辑 P50 ms | 编辑 P95 ms | 最大 ms | 总计正确 |
|---|---|---|---|---|---|
| 5,151 | 65.8 | 0.05 | 0.15 | 1.37 | 是 |
| 20,451 | 59.8 | 0.08 | 0.15 | 0.50 | 是 |
| 102,051 | 175.0 | 0.30 | 0.58 | 2.02 | 是 |

行合计、列合计、总计的级联在 300 次随机编辑后与独立求和一致。引擎在 Node 中可运行，可作服务端重算（前提是后端用 JS/TS；否则服务端需另选引擎，见 Q-009）。

### C4 ARIA 结构：jsdom + axe-core 4.14（wcag2a/2aa/21a/21aa，已关颜色对比度），`run-jsdom.mjs`
jsdom 无布局，AG Grid 用 `domLayout:'print'` 关闭虚拟化以渲染全部 5151 格；Handsontable 为其默认渲染。仅反映 ARIA 结构，不代表真实可访问性。
| | AG Grid Community 36.2 | Handsontable 18.1 |
|---|---|---|
| 网格角色 | `grid`，`row`/`columnheader`/`gridcell` 齐全 | `treegrid`，另有 `rowheader` |
| axe 违规 | 0 | 1 条 critical：`aria-required-children`（1 个节点） |

### C5 授权
| 组件 | 许可证 | 备注 |
|---|---|---|
| AG Grid Community | MIT | 无公式、无电子表格式填充/复制等；那些在付费的 Enterprise |
| HyperFormula | GPL-3.0-only，或另购商业许可 | 随网页分发给浏览器即构成分发，需开源整个应用或购买商业许可 |
| Handsontable | 专有（本次用的是评估密钥 `non-commercial-and-evaluation`） | 商用必须付费 |
| fast-formula-parser | MIT | 只是求值器，没有依赖图/增量重算，需自建；Excel 函数覆盖未验证 |
| Univer | Apache-2.0 | 未测。据一般了解是画布渲染，读屏支持可能差（**未验证**） |
| FortuneSheet | MIT | 未测。同上（**未验证**） |
| Syncfusion / DevExpress | 商业 | 老系统在用，授权成本即是问题之一，未测 |

### 判断（暂定，待用户拍板）
- 方向可行：**DOM 渲染的网格（AG Grid Community，MIT）+ 独立的公式引擎**。ARIA 结构干净，引擎性能余量极大（P95 < 1 ms ≪ 100 ms）。
- 最大的未决项不是性能，是**公式引擎的授权**：HyperFormula 要么买商业许可，要么改用 MIT 的求值器自建依赖图（Q-009）。
- Handsontable 不建议：专有许可，且有 1 条 critical 结构违规（jsdom 下，需浏览器复核）。
- **判据 C1、C2（网格部分）、C4（真实键盘/读屏/对比度）未满足验证**，不能算"采用"。建议下一轮在无调试策略的环境里补测，并加测 Univer 的无障碍。

### 判断更新（补测后）
- C1、C2 在真实浏览器里对 AG Grid Community + HyperFormula 通过；C4 的 axe 自动检查 0 违规、键盘主路径通过。
- 仍**未验证**：读屏软件、颜色对比度（axe 判不了）、绘制耗时、键盘的其他路径、Edge 上的表现。这些未完成前，不能把 C4 记为"通过"。
- Handsontable 在真实浏览器里确认有 2 条 critical 违规，且专有许可，淘汰理由更充分。
- 公式引擎授权（HyperFormula GPL-3.0 与商业许可，或自建）和后端语言是否为 JS/TS，仍是未决项（Q-009）。
- 判据 C1 到 C5 仍是 fork 中自拟，待用户确认。

## 第二轮（2026-10-30）：用户偏好"免费方案"，验证全 MIT 的公式引擎

用户明确偏好免费方案，因此 GPL 的 HyperFormula 和专有的 Handsontable 出局，只评估 MIT / Apache。代码在 `free-engine/`。

### 做了什么
用 MIT 的 `fast-formula-parser` 解析和求值公式，**依赖图与增量重算自建**（约 70 行，`engine.mjs`）：解析时用它自带的 `DepParser` 取出每个公式引用的单元格和区域，建正向和反向依赖，编辑后沿反向依赖找出受影响的公式，在子图内拓扑排序后依次求值。工作负载与第一轮相同（行合计、列合计、总计）。

### 性能（Node 24，`bench.mjs`）
| 单元格数 | 加载 ms | 编辑 P50 ms | 编辑 P95 ms | 最大 ms | 结果正确 |
|---|---|---|---|---|---|
| 5,151 | 32.7 | 0.09 | 0.25 | 0.52 | 是 |
| 20,451 | 52.6 | 0.30 | 0.69 | 1.89 | 是 |
| 102,051 | 279.4 | 4.11 | 6.87 | 9.98 | 是 |

对比 HyperFormula 的 P95 0.58 ms（10 万格）：自建慢约 12 倍，但仍比判据 C2 的 100 ms 小一个数量级以上。**结论：性能不是障碍。** 局限：负载只有 SUM；反向依赖按单元格展开区域，区域很大且很多时内存会涨（本负载约 2×单元格数条边，可接受）；没有测循环引用、跨工作表依赖的增量重算。

### 函数覆盖（`coverage.mjs`）：24 项中 20 项通过
通过：SUM、AVERAGE、COUNT、ROUND、ROUNDUP、ABS、IF、AND、IFERROR、SUMIF、COUNTIF、SUMPRODUCT、CONCATENATE、TEXT、ISBLANK、VLOOKUP、DATE、跨工作表引用 `Sheet2!A1`、四则运算、除零得到 `#DIV/0!`。
**未实现：MIN、MAX、PERCENTILE、LOOKUP**（引擎抛 "Function ... is not implemented"）。MIN 和 MAX 在报表模板里很常见，这是真实的缺口。

### 缺口能否补上（`adapters.mjs`）：6/6 通过
用同为 MIT 的 `@formulajs/formulajs`（约 399 个导出）作函数库，通过引擎的 `functions` 选项挂接，每个函数约一行适配。要点：自定义函数收到的参数是包了一层的对象（`{value, isRangeRef, ...}`），要先拆开再展平。MIN、MAX、PERCENTILE、LOOKUP 补完后结果全部正确。
**风险**：这只补了我测到的 4 个。模板可能用到的其他缺失函数要逐个发现；建议在模板上传时（REQ-015）静态检查函数白名单，遇到未支持的函数就拒绝并报错，而不是等到运行时。

### Univer（Apache-2.0）
**未测。** 它自己的包说明是 "Canvas rendering engine"，即单元格画在画布上，不是页面里的元素。这通常意味着读屏软件读不到单元格，和 AODA 要求冲突。这条来自包说明，不是实测。如需彻底排除，要在真浏览器里看 DOM 里有没有单元格节点，并用读屏软件试。

### 判断更新
全部 MIT 的组合可行：**AG Grid Community（网格）+ fast-formula-parser（求值）+ formulajs（补函数）+ 自建依赖图**。零授权费。代价是依赖图和函数白名单要自己维护，后端若不用 JS/TS，服务端重算要另配引擎或起一个 Node 计算服务。

### 仍然没有验证
读屏软件（NVDA/JAWS）、颜色对比度、绘制耗时、Tab 离开/Esc/选区/粘贴等键盘路径、Edge 上的表现、自建引擎在浏览器中的运行（本轮只在 Node 跑）。
