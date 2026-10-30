# Spike: Excel 加载项如何登录平台（Q-011）

分支 `spike/addin-auth`。**探针代码，永不合并。** 判据由 AI 在分支任务里自拟（无法当场向用户确认），请用户审阅。

## 要回答的问题

在第一期只有本地账号、上线后身份提供者（IdP）未定（Q-001）的前提下，Excel 桌面版加载项能否登录平台，并带着令牌调用受保护的 API（REQ-014、REQ-002）？
候选：

| 方案 | 说明 |
|---|---|
| A. Office SSO | `Office.auth.getAccessToken()` + 服务端 OBO。要求 Entra ID 应用注册和 Microsoft 365 账号 |
| B. 对话框 + OAuth2 授权码 + PKCE | `Office.context.ui.displayDialogAsync` 打开平台登录页，回调页 `messageParent` 把授权码交回任务窗格，任务窗格用 PKCE 换令牌。与 IdP 无关 |
| C. 设备码流程 | 任务窗格显示一个码，用户去浏览器里输入 |

## 判据（自拟）

| 编号 | 判据 | 怎么测 |
|---|---|---|
| S1 | 协议层正确：错误 verifier 被拒；授权码只能用一次；未带令牌返回 401；令牌过期返回 401 且可用刷新令牌续期；刷新令牌轮换（旧的作废）；重定向地址只接受白名单 | `test-protocol.mjs`（无头） |
| S2 | 在桌面 Excel 里端到端跑通：任务窗格 → 对话框 → 登录 → 令牌回到任务窗格 → 调用 API 成功 | 服务端日志 + 任务窗格上报的步骤日志 |
| S3 | 令牌只在内存，不写入工作簿、`localStorage`、`sessionStorage`、文档设置 | 任务窗格自检上报 |
| S4 | 令牌过期后无需重新输入密码即可续期，且工作簿里已有内容不丢（REQ-014 验收 6 的反面：过期不丢内容） | 任务窗格自动测试：写 A1 → 等过期 → 调 API → 读 A1 |

## 时间盒

协议层一轮；Excel 集成最多 3 次尝试。到时仍没结论，本身就是结论。

## 不管的事

真实 Entra ID 租户、Office SSO 的实测（需要租户和应用注册，本机没有）、Mac 和 Excel 网页版、令牌的加密存储、生产级加固、浏览器版平台的登录体验。

## 怎么运行

```
# 导出本机已受信任的 localhost 开发证书（只放在临时目录，不入库）
dotnet dev-certs https -ep <tmp>/localhost.pfx -p spike
SPIKE_PFX=<tmp>/localhost.pfx node spikes/addin-auth/test-protocol.mjs   # S1
SPIKE_PFX=<tmp>/localhost.pfx node spikes/addin-auth/server.mjs          # 端口 3443
```
演示账号 `designer` / `（演示密码，已省略）` 是写死在探针里的假数据。

## 结果

测试环境：Windows 11 企业版，托管设备；Excel 16.0.20430（Microsoft 365）；Node 24.13；.NET 开发证书（本机已受信任）。

### S1 协议层 — 通过（12/12）

`node test-protocol.mjs`：错误密码、白名单外的 redirect_uri、错误 verifier 均被拒；授权码一次性（错误 verifier 也会烧掉该码）；无令牌与过期令牌返回 401；刷新令牌无需密码即可续期；刷新令牌轮换，旧的立即作废。

### S2、S3、S4 — **未测量**

任务窗格始终没有在 Excel 里打开，所以服务端日志里没有任何来自窗格的请求。三次尝试：

| 次数 | 做法 | 结果 |
|---|---|---|
| 1 | 在 `HKCU\...\WEF\Developer` 登记清单，在已运行的 Excel 里打开带自动显示部件的工作簿 | 无反应。该 Excel 是用户原有会话，不会为新登记的清单重新读取 |
| 2 | 用 `/x` 启动独立的新 Excel 进程再打开工作簿 | 工作簿正常打开（不在受保护的视图），但窗格不自动出现：**文档内嵌 `AutoShowTaskpaneWithDocument` 在本机无效** |
| 3 | 用 UI 自动化点 Home → Add-ins | 第一次成功：菜单里出现 **Developer Add-ins → GDCS auth spike**，证明侧载登记有效；之后菜单项无法稳定再现，点击没有完成 |

结论：侧载登记本身可用，但要让窗格打开，目前需要人手点一下（Home → Add-ins → Developer Add-ins → GDCS auth spike）。窗格一打开，`taskpane.js` 会自动跑完 登录 → 调 API → 写 A1 → 等令牌过期 → 续期 → 读 A1 → 存储自检，并把每一步上报到服务端日志，所以**只需要有人点一下**就能补齐 S2 到 S4。

### 环境观察（对 Q-012 分发方式有用）

- 菜单提示："Popular Add-ins：没有可用的加载项，请联系 IT 管理员，或调整可选连接体验的隐私设置"。同时策略 `disableomexcatalogs=1`。**应用商店类加载项在本机被策略关闭**；开发者侧载仍可用。
- 由此推断（未验证）：最终用户设计人大概率不能自行侧载，需要 IT 通过集中部署分发。要找 IT 确认。
- 本机的 Excel 带敏感度标签（"OPS - Unclassified Information"）。

### 方案对比（官方文档，未实测）

| 方案 | 要点 | 对本项目 |
|---|---|---|
| A. Office SSO（旧版 `getAccessToken`） | 需要 Identity API 1.3、清单里的 `WebApplicationInfo` 和 Entra 应用注册；用户不是有效的 Microsoft 账号或 M365 工作/学校账号时报错 13003（"User Type not supported"，例如本地域账号）；文档建议始终提供对话框回退 | 第一期是本地账号，**用不了**。上线用 Entra 后可作为可选的无感登录 |
| B. 对话框 + 授权码 + PKCE（本探针） | 与 IdP 无关；对话框首页必须与任务窗格同一域（协议、子域、端口都要一致）；`messageParent` 只能传字符串；登录应在对话框而不是任务窗格里进行；令牌不能靠浏览器存储在窗格与对话框间共享（存储按源隔离） | **推荐作为基线**：同一套代码对本地账号和之后的 Entra 都适用 |
| C. 设备码 | 未研究 | 对话框被策略阻止时的备选，暂不实现 |

### 判断（待用户确认）

- 采用 B 作为 REQ-014 的登录方式，平台自己提供 OAuth2 授权码 + PKCE 端点（后续可前置到 Entra）。**协议层已验证，Excel 内的端到端未验证**，所以结论是"方向可行，等一次人工点击补齐 S2 到 S4"。
- 平台 API 与加载项页面不同源时（真实部署几乎必然如此），需要为 API 配置 CORS，并保证对话框首页与任务窗格同域。本探针为了简单用了同源，**没有验证跨域**。
- 公开客户端用 PKCE 无需客户端密钥；令牌只保存在内存，窗格关闭即失效，刷新令牌也不落盘。S3 的"存储自检"需要窗格运行才能确认。

### 补做 S2 到 S4 的步骤

1. `dotnet dev-certs https -ep <tmp>/localhost.pfx -p spike`
2. `SPIKE_PFX=<tmp>/localhost.pfx ACCESS_TTL=15 node spikes/addin-auth/server.mjs`
3. `powershell -File spikes/addin-auth/sideload.ps1`（会写 HKCU 注册表；`-Remove` 撤销）
4. 用 `/x` 启动新的 Excel 进程，Home → Add-ins → Developer Add-ins → GDCS auth spike。
5. 看服务端日志里 `PANE>` 开头的行，应依次出现 `pane_loaded`、`signed_in`、`api_result`、`wrote_A1`、`api_401_then_refresh`、`refreshed_without_password`、`after_expiry`（`A1_unchanged:true`）、`storage_audit`（`tokenFoundIn:[]`）、`DONE`。

### 清理状态

已撤销注册表登记；已停掉测试服务器；已删除导出的证书文件和测试工作簿；关闭了本次启动的 Excel 进程（用户原有的 Excel 会话未动，只在其中临时打开并关闭过 `spike.xlsx`）。

### 未回答的问题

- 对话框方式在本机策略下是否被拦截？（窗格没打开，未知）
- 跨域部署下的 CORS 与 `targetOrigin`。
- 真实 Entra ID 下 Office SSO 与 NAA（嵌套应用认证）的表现。

### 官方文档来源

- https://learn.microsoft.com/en-us/office/dev/add-ins/develop/sso-in-office-add-ins
- https://learn.microsoft.com/en-us/office/dev/add-ins/develop/troubleshoot-sso-in-office-add-ins
- https://learn.microsoft.com/en-us/office/dev/add-ins/develop/auth-with-office-dialog-api
- https://learn.microsoft.com/en-us/office/dev/add-ins/develop/dialog-best-practices
- https://learn.microsoft.com/en-us/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in

## 第二轮（2026-10-30）：用户手动点开窗格，S2 到 S4 补测完成

做法：按"补做 S2 到 S4 的步骤"准备环境（服务 `ACCESS_TTL=15`，侧载登记），用户用 `excel /x` 新开 Excel，从 Home → Add-ins → Developer Add-ins → GDCS auth spike 打开窗格。窗格自动跑完全流程，服务端日志（`PANE>` 行）与用户贴出的窗格输出一致。

| 判据 | 结果 | 证据（服务端日志，时间 16:43） |
|---|---|---|
| S2 端到端 | **通过** | `pane_loaded`（host=Excel，platform=PC）→ `GET/POST /authorize` → `POST /token` → `signed_in` → `api_result 200`，属性列表 `ATTR-OPENING`、`ATTR-CLOSING` 回到窗格 |
| S3 令牌不落盘 | **通过（范围见下）** | `storage_audit`：`tokenFoundIn: []`；`localStorage` 有 3 个键、`sessionStorage` 有 2 个键，其中没有令牌 |
| S4 过期续期且内容不丢 | **通过** | 写入 A1 后等待约 18 秒（令牌 15 秒过期）→ `api_401_then_refresh` → `POST /token`（刷新）→ `refreshed_without_password` → `api_result 200` → `after_expiry: apiOk=true, A1_unchanged=true` |

### 这轮回答了的问题
- **对话框方式在本机策略下没有被拦截。** `displayDialogAsync` 打开了对话框，`messageParent` 把授权码交回窗格，PKCE 换令牌成功。这是上一轮标为"未知"的问题。
- 窗格打开方式：必须是新开的 Excel 进程（`excel /x`）；在已运行的 Excel 里新登记的清单不会被读取。

### 这轮没有证明的事（诚实说明）
- **登录是探针自动完成的，不是人在对话框里输入。** 从 `GET /authorize` 到 `POST /authorize` 只隔了约 76 毫秒，对话框页自动提交了演示账号。所以"真人输入账号密码的体验"、对话框的大小与位置、输错密码的提示都没测。机制通了，体验没测。
- 仍然**同源**；跨域部署（CORS、对话框首页与窗格同域的要求）没测。
- 只测了 Windows 桌面版 Excel 16（Microsoft 365，托管设备）。Mac、Excel 网页版没测。
- `storage_audit` 只能说在这几个存储位置没找到令牌；它不证明令牌不在别处（例如进程内存之外的日志）。
- 真实 Entra ID 下的 Office SSO 与 NAA 没测。
- S1 到 S4 判据是 AI 在分支任务里自拟的，用户还没确认。

### 判断更新
**方案 B（对话框 + 授权码 + PKCE，平台自己做授权服务器）在 Excel 桌面版上可行。** 全部使用免费组件（Node 内置模块与浏览器标准接口），零授权费。建议作为 REQ-014 的基线登录方式。分发方式（Q-012）仍待 IT 确认：本机"商店类加载项"被策略关闭，最终用户大概率需要集中部署。

### 清理状态（本轮）
已撤销 `HKCU\...\WEF\Developer` 登记（验证：键已不存在）；已停掉测试服务（3443 无监听）；已删除导出的证书文件（含私钥）；用户新开的 Excel 由用户自行关闭。
