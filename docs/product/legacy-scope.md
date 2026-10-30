# 老系统范围参照

本文件记录老系统想达成什么，供新系统的需求追溯。**老系统从未上线，用户决定不改造，只提取意图，从零重建。** 不复用它的设计和代码。

来源标记：本文件全部内容来自读代码和数据库脚本的**推断**，除非特别注明"用户确认"。

## 老系统在哪

| 仓库 | 路径 | 是什么 |
|---|---|---|
| GDCT_PlanB | `C:\Users\PanJov\OneDrive - Government of Ontario\Documents\source\repos\GDCT_PlanB` | .NET 8 Blazor Server 应用；数据库项目在 `GDCTDB/`；约 11.5 万行 C# 和 Razor；1946 次提交；Azure DevOps 仓库 `HSC-DTSB/GDCT-MS/_git/GDCT_PlanB` |
| GDCT_TDT | `C:\Users\PanJov\OneDrive - Government of Ontario\Documents\source\repos\GDCT_TDT` | "GDCS Template Design Tools"，Office.js 的 Excel 加载项（任务窗格）；87 次提交；仓库 `.../GDCS_TDT` |

## 它想做什么（一句话）

卫生部（MOH）的通用数据采集系统 GDCS：部委人员按财年、报告期和行业，用 Excel 设计采集模板，模板由"属性（列）× 分类（行）"构成，经审核批准发布给医院等机构；机构在线或离线 Excel 填报，提交后由审核人、批准人处理；数据按单元格存储，带公式计算；最后汇总成 Insights、仪表盘和合并报表。周边有机构、区域、行业、用户、角色、菜单权限、批量导入、消息和邮件通知、审计日志；还有"实例"概念，让一套系统服务多个采集项目。

## 老系统功能 → 新系统去向

| 老系统功能 | 证据 | 新系统 |
|---|---|---|
| 实例（多租户） | `Instance.razor`、`InstanceService.cs`、各表的 `InstanceId` | REQ-001（用户确认：实例即不同项目各用一套） |
| 登录 | Cookie 登录、Azure AD、JWT 接口 | REQ-002，可插拔 |
| 用户、角色、菜单权限 | `UserInfo`、`UserRole`、`NavMenu`、`NavMenuRole` | REQ-003、REQ-004，**重新设计为标准 RBAC** |
| 机构、区域、行业 | `Organizations`（写死医院字段）、`Region`、`Sector` | REQ-005、REQ-006，**通用化** |
| 财年、报告期 | `FiscalYear`、`ReportingPeriod` | REQ-007 |
| 计量单位、属性、分类组、分类 | `UnitofMeasure`、`Attribute`、`CategoryGroup`、`Category` | REQ-008 到 REQ-010 |
| COA 批量导入 | `COA_Import_Redesign.md`、`BulkImport/*` | REQ-013（该设计稿列出的 7 个问题都要避免） |
| 模板与 JSON 结构 | `Template.JSONSchema`、`TemplateStatus` | REQ-015、REQ-016 |
| 模板设计 Excel 加载项 | `GDCT_TDT`（用户确认要保留并改为联网拉取 COA） | REQ-014 |
| 发布模板给机构 | `PublishLogs`、`SubmissionSetting` | REQ-018 |
| 机构填报 | `Submissions`、`GDCTData`、`GDCTDataCalculation`、`GDCTData.razor`、`EditSubmission.razor`、`MySubmissions.razor` | REQ-020 到 REQ-027 |
| 审核批准 | `SubmissionApprover`、`SubmissionSetting.SubmissionReviewerId`、状态常量 | REQ-034（用户确认推到第二期） |
| Insights、汇总报表、仪表盘、合并报表 | `GDCTInsights*`、`SummaryReport*`、`CombineReport*` | REQ-035（用户确认推到第二期） |
| 离线 Excel 填报 | `OfflineTool/GDCS_Template.xlam` | REQ-036（第三期） |
| 站内消息 | `Messages`、`MessageUser` | REQ-037（第三期） |
| 邮件 | SendGrid | REQ-028 |
| 主题与设置 | `AppConfig`、`ThemeSettings` | REQ-038（第三期） |
| 审计日志 | `GDCTAuditLog` | REQ-019，**重新设计** |
| 批量导入用户、机构 | `UserImportHandler`、`OrganizationImportHandler` | REQ-004、REQ-005 |
| 性能测试页 | `*PerfTest.razor`（5 个） | 不继承。性能验证改用自动化测试 |
| 演示页 | `Counter.razor`、`Weather.razor` | 不继承 |

## 老系统的问题（新系统要避免）

以下问题是读代码发现的，作为设计的反面教材。

| 类别 | 问题 | 新系统怎么应对 |
|---|---|---|
| 数据库 | 几乎每张表一个通用的 `Status`（1/0）当逻辑删除，同时还有 `SubmissionStatus`、`TemplateStatus`，语义混乱 | REQ-012：不用通用逻辑删除，按对象明确生命周期 |
| 数据库 | 单元格值全存 `NVARCHAR(300)`，类型靠计量单位里的 `DataType` 字符串 | REQ-008：带类型的结构化值 |
| 数据库 | 多个表有自引用的外键（`Organizations.Id` 引用自己、`Messages` 引用自己）等明显错误；`Messages` 的主键声明成 `UNIQUEIDENTIFIER IDENTITY` | 新模型从零设计，加迁移脚本和数据库约束测试 |
| 数据库 | 表名里出现 `[[Messages]]`（括号写错） | 同上 |
| 权限 | `UserInfo` 只有一个 `UserRoleId`，另有 `UserInstanceRole` 补丁；菜单权限与功能权限混在一起；没有标准的权限↔角色多对多 | REQ-003 |
| 架构 | `WebFront` 一个项目约 6.4 万行；展示、业务和数据访问混杂；`async void` 处理器会击穿 Blazor 线路 | 分层由工具强制检查；见 /architect |
| 导入 | 无事务，逐行一次 HTTP 请求；重复键检测是死代码；错误是一整段拼接字符串 | REQ-013、REQ-025 |
| 技术栈 | 同时依赖 DevExpress 和 Syncfusion 两套商业组件 | Q-008 |
| 安全 | 密钥提交进了 git：`appsettings*.json` 里有 Azure AD 的客户端密钥、一个授权码、一个疑似 JWT 签名密钥；根目录还有一个明文测试账号 `config.json`。**这些值不会出现在新项目的任何文档里** | REQ-031；Q-020 |
| 加载项 | 无网络请求，靠工作簿里放好的 `Attribute` 工作表；三份 `FunctionFile` 副本（含个人命名的版本）；保护密码手工输入；无 README | REQ-014 |
| 工程 | 没有 CI；仓库里跟踪了 `.user`、zip、日志、docx 草稿；`UpgradeLog.htm` | 新项目从第一天建 CI 和 `.gitignore` |

## 模板的实际结构（来自加载项推断）

- 一个模板是一个 Excel 工作簿；每个工作表是一个 Tab。
- 列头是**属性**，行头是**分类**，交叉点是录入位，对应数据库里 `GDCTData(CategoryId, AttributeId, CellLocation)`。
- 工作表上有固定的表头区域（Tab、Tab-Line、分类组、分类、行号、计量单位），以及一些"返回主页"链接和引用 `Identification`、`Main Menu` 工作表的公式。
- 数据验证由工作簿内的一个配置工作表驱动；非 `Identification` 的工作表可被加密码保护。

**注意**：这是从加载项源码推断的结构，真实的模板样例（老仓库 `OfflineTool/GDCS_Template.zip`）我没有解压查看。需要 /spike 时必须使用真实样例（Q-017）。

## 没有做的事

- 没有运行老系统的构建、测试，也没有量化技术债基线，因为用户决定不改造它。
- 没有往老仓库写任何文件。
