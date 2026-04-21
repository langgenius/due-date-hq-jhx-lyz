# DueDateHQ 行业深度调研报告

截至 2026-04-20  
基于内部材料与公开来源整理

参考输入材料：
- `工程师集训.html`（项目内未找到对应副本）
- [DueDateHQ - 商业计划书.html](docs/DueDateHQ%20-%20商业计划书.html)
- [DueDateHQ - 用户故事与价值主张画布.html](docs/DueDateHQ%20-%20用户故事与价值主张画布.html)

## 一句话结论

DueDateHQ 不是“给会计师做一个待办清单”，而是要做成一个面向独立 CPA 和小型事务所的 **deadline intelligence layer**：把分散在联邦、州、地方税务机关以及客户资料中的截止日、延期、影响范围和优先级，转成一张可以直接安排工作的控制台。

---

## 1. 这到底是什么行业

你切入的不是泛财务软件，也不是通用项目管理，而是美国 **tax compliance / tax practice management** 的一个细分场景：

- 用户：独立 CPA、1-3 人事务所、5 人以下小型会计所
- 客户：美国 SMB、小企业主、多州经营实体、合伙企业、S Corp、LLC 等
- 核心任务：确保客户不漏报、不迟报、不漏缴、不漏选举，并在变更出现时及时调整

这个市场足够大，也足够刚需：

- NASBA 披露，截至 **2025-08-28**，美国有 **653,408 名 active CPAs**，明显高于你内部材料里“40 万+”的口径，说明内部材料偏保守。来源： [NASBA](https://nasba.org/licensure/howmanycpas/)
- SBA Office of Advocacy 披露，美国有 **34.8 million small businesses**，占经济体量和就业都很大。来源： [SBA Office of Advocacy](https://advocacy.sba.gov/2024/11/19/new-advocacy-report-shows-small-business-total-reaches-34-8-million-accounting-for-2-6-million-net-new-jobs-in-latest-year-of-data/)
- Census 的 Business Formation Statistics 持续按月发布新企业申请数据，说明 SMB 供给端在持续生成。来源： [U.S. Census BFS](https://www.census.gov/econ/bfs/index.html)

**推断：** DueDateHQ 面对的不是一个“新需求教育市场”，而是一个已经存在、但长期被旧桌面软件、Excel 和通用事务所管理软件低质量满足的市场。

---

## 2. 目标用户真正的工作，不是“记住一个日期”

独立 CPA 在这个场景中的真实工作链条，大致是：

1. 接管客户资料
2. 判断客户实体类型和申报义务
3. 判断客户在哪些州有申报或缴税责任
4. 生成全年联邦/州/地方截止日
5. 在申报季持续追踪资料是否齐、是否需要延期
6. 处理季度预估税、工资税、年报、特许经营税、PTE 选举等并行事项
7. 当法规或灾害延期发生时，快速识别哪些客户受影响
8. 和客户沟通，留下可追溯记录

所以“截止日”在这里不是单一日期，而是一整条工作编排链上的锚点。

你的内部材料已经非常准确地抓住了三个核心场景：

- 每周分诊：这周先做什么
- 新客户导入：如何 30 分钟内从别的系统切进来
- 州税局突发延期：法规变化后哪些客户受影响

这三个场景本质上对应三类能力：

- `visibility`：看见全局
- `activation`：快速上手并生成日历
- `adaptation`：面对外部变化快速重排

---

## 3. 为什么这个行业对截止日特别敏感

### 3.1 联邦截止日本身就不是一个日期

IRS 官方说明，不同实体的业务申报截止日不同：

- Partnership 一般是税年结束后第 3 个月 15 日
- S corporation 一般也是第 3 个月 15 日
- C corporation 通常是第 4 个月 15 日
- Sole proprietor 跟随个人申报，通常是 4 月 15 日

来源： [IRS FAQ: business return due dates](https://www.irs.gov/faqs/small-business-self-employed-other-business/starting-or-ending-a-business/starting-or-ending-a-business-3)

这意味着同一个 CPA 面对的不是“4 月 15 日一个总 deadline”，而是一组穿插在 **3 月、4 月、6 月、9 月、年底** 的不同节点。

IRS 的 [Publication 509](https://www.irs.gov/publications/p509) 还说明，联邦税务日历按季度拆分，覆盖 filing、payment、employment tax、excise tax 等多种动作。  
这对产品的直接含义是：**DueDateHQ 不是一个日历提醒器，而是一个任务类型感知的合规日历。**

### 3.2 “延期”并不等于事情结束

IRS 明确说明：

- 你可以申请 extension
- 但 **extension of time to file 不是 extension of time to pay**

来源： [IRS when to file](https://www.eitc.irs.gov/filing/individuals/when-to-file)

这会直接带来一个产品要求：  
UI 里必须区分：

- 原始截止日
- 延期申请状态
- 延期后的 filing due date
- payment due date 是否仍然保留

如果你只做“延期后把日期往后推”，很容易在业务上做错。

### 3.3 州级复杂度是组合爆炸，不是简单加法

州税复杂度不是“联邦规则 + 50 份拷贝”，而是每州都有不同税种、选举、门槛、付款逻辑和后果。

几个官方例子：

- **New York PTET**：符合条件的实体必须在每年 **3 月 15 日前** 选择是否 opt in；估税支付也有季度要求。来源： [NY PTET](https://www.tax.ny.gov/bus/ptet/)
- **California PTE elective tax**：要求在税年内 **6 月 15 日前** 支付首笔款项，且规则在 2026-2030 又有变化。来源： [California FTB PTE](https://www.ftb.ca.gov/file/business/credits/pass-through-entity-elective-tax/index.html)
- **Texas franchise tax**：年度 franchise tax report 一般在 **5 月 15 日** 到期，即使 no tax due 也仍可能有信息申报要求。来源： [Texas Comptroller Franchise Tax](https://comptroller.texas.gov/taxes/franchise/) 和 [Texas PIR/OIR filing requirements](https://comptroller.texas.gov/taxes/franchise/pir-oir-filing-req.php)

**推断：** 你内部材料里提到的 “50 州 x 多税种 x 多实体类型” 不是夸张，而是产品建模的真实难点。

### 3.4 灾害延期会让“今天正确的日历”明天失效

IRS 近几个月持续发布 disaster relief 公告。例如：

- Washington 州税务相关联邦 deadline 延后到 **2026-05-01**。来源： [IRS WA relief](https://www.irs.gov/newsroom/irs-announces-tax-relief-for-taxpayers-impacted-by-severe-storms-straight-line-winds-flooding-landslides-and-mudslides-in-the-state-of-washington-various-deadlines-postponed-to-may-1-2026)
- Louisiana 州部分 deadline 延后到 **2026-03-31**。来源： [IRS LA relief](https://www.irs.gov/newsroom/irs-announces-tax-relief-for-taxpayers-impacted-by-severe-winter-storms-in-the-state-of-louisiana-various-deadlines-postponed-to-march-31-2026)
- Tennessee 的 relief 在 **2026-04-15** 又被扩展到全州 95 个 counties，并将截止日改到 **2026-06-08**。来源： [IRS TN relief](https://www.irs.gov/newsroom/irs-announces-tax-relief-for-taxpayers-impacted-by-winter-storm-fern-in-tennessee-various-deadlines-postponed-to-may-22-2026)

这说明你的第三个用户故事不是锦上添花，而是这个行业的真实动态。

---

## 4. 这个行业当前的软件栈长什么样

### 4.1 税表准备软件很成熟，但不等于截止日协同成熟

Journal of Accountancy 2025 tax software survey 显示，税表准备软件市场高度成熟，常见主力产品包括：

- UltraTax CS
- Drake Tax
- Lacerte
- CCH Axcess Tax
- ProSeries
- CCH ProSystem fx

来源： [Journal of Accountancy 2025 tax software survey](https://www.journalofaccountancy.com/issues/2025/sep/2025-tax-software-survey/)

这说明：

- “报税软件”不是空白市场
- 但 “跨客户、跨州、跨事件的 deadline orchestration” 仍然可能是空白或薄弱层

### 4.2 事务所管理软件存在，但更偏 workflow / portal / billing

主流 practice management / client portal 产品包括：

- Karbon：按 seat 定价，强调 workflow、team collaboration、email triage。来源： [Karbon pricing](https://karbonhq.com/pricing/)
- TaxDome：强调 portal、CRM、workflow、seat 模型和 seasonal seats。来源： [TaxDome pricing FAQ](https://help.taxdome.com/article/187-taxdome-pricing-faq)
- Canopy：强调 client engagement、document management、workflow、time & billing，另有 tax resolution 模块。来源： [Canopy pricing](https://www.getcanopy.com/pricing)

这些工具解决的是“事务所运转”问题，不天然等于“多州税务截止日 intelligence”。

**推断：** DueDateHQ 最合理的位置不是替代税表软件，也不是完整替代事务所管理平台，而是：

- 向上连接 practice management
- 向下连接 tax prep / official tax data
- 自己占住“deadline + compliance intelligence”这个中间层

### 4.3 直接竞品更像“老问题的旧答案”

内部材料把 File In Time 视为最直接竞品，这个判断是合理的。它代表的是“面向 tax professionals 的 due date tracking 产品”这一旧类目。  
如果你的 Demo 要讲差异，最好的叙事不是“我们也能追踪 deadline”，而是：

- 云端优先
- 多州/事件驱动
- 导入更快
- 官方来源可核验
- AI 帮助做 impact analysis，而不是只做提醒

---

## 5. 这个买家为什么会付钱

### 5.1 他们不是为“效率软件”付钱，而是为“风险降低”付钱

CPA 在这个场景里的核心恐惧不是“动作多”，而是：

- 漏掉一个 deadline
- 用错规则
- 没及时通知客户
- 客户因此罚款或错失税务优化机会
- 自己的专业信誉受损

IRS 也强调：

- paid preparer 必须签字并包含 PTIN
- preparer 对回报的实质准确性负主要责任
- 但 taxpayer 最终仍对申报准确性负责

来源： [IRS Topic No. 254](https://www.irs.gov/taxtopics/tc254)

这意味着产品要同时服务两个心理模型：

- CPA 的专业责任
- 客户对 CPA 的信任

### 5.2 这是一个高粘性的工作流锚点

你的内部材料提到一个关键判断：税务软件切换在申报季几乎不可能。  
这是行业常识，且和公开市场结构一致：

- 数据迁移成本高
- 客户档案高度敏感
- 工作流周期强季节性
- 一旦进入 busy season，没人愿意换系统

**推断：** DueDateHQ 一旦嵌入全年 deadline 体系，只要数据可信、导入顺滑，就会天然拥有高留存潜力。

### 5.3 但这个用户也高度价格敏感

独立 CPA 和小型事务所不是大型企业 IT 采购，他们通常：

- 能接受为刚需付费
- 但不愿意为“大而全平台”承担高 seat 成本
- 很看重 first value time

所以你的产品叙事必须在第一天就成立：

- 导入现有客户
- 立刻生成危险截止日
- 立刻展示“哪些事情最值得先做”

也就是你内部用户故事 1 和 2 的组合。

---

## 6. 为什么 AI 在这里不是噱头，而是商业前提

内部材料里这点判断是对的：AI 不是“加个聊天框”，而是降低合规数据维护成本的基础设施。

适合 AI 的工作：

- 从州税局和 IRS 页面监控公告变化
- 解析公告文本中的生效地域、适用税种、适用主体、延后日期
- 基于客户档案自动匹配受影响客户
- 做 CSV 字段映射和实体类型识别
- 做自然语言问答，例如“哪些客户要处理 NY PTET”

不适合完全自动化、仍需人工兜底的工作：

- 规则最终解释权
- 高风险税务判断
- 罕见边界情形
- 对客户可见的最终专业意见

因此产品形态应是：

- `AI as copilot`
- `official source as ground truth`
- `human review as final control`

这也是为什么你内部材料反复强调“官方来源链接”。

---

## 7. 对 DueDateHQ 的产品定义建议

### 7.1 最合理的产品定位

DueDateHQ 应该被定义为：

> A compliance workload cockpit for solo CPAs and small firms serving SMBs across multiple states.

中文可以理解成：

> 面向独立 CPA 的截止日与合规负载控制台

这里有两个关键词：

- **deadline**：什么时候到期
- **workload**：我本周先处理什么、哪些客户风险最高

如果只做 deadline database，会变成低端工具。  
如果直接做全套 practice management，会在两周交付里失焦。

### 7.2 MVP 必须抓住的 4 个原子能力

1. **客户建模**
   - 客户名
   - 州
   - 县/城市（至少预留）
   - 实体类型
   - 税种/义务

2. **截止日生成**
   - 联邦
   - 重点州
   - extension / payment 区分

3. **风险分诊**
   - 本周到期
   - 本月预警
   - 延期中/阻塞中
   - 高风险客户优先

4. **变化响应**
   - 公告卡片
   - 受影响客户列表
   - 一键核验官方来源

### 7.3 两周 Demo 不该过度投入的方向

- 完整报税流程
- 深度账务处理
- 大而全 CRM
- 复杂组织权限体系
- 真的覆盖 50 州所有边角规则

更好的策略是：

- 明确一个有限覆盖面
- 把“可信 + 顺滑 + 看得懂”做扎实

例如：

- 先覆盖联邦 + NY + CA + TX
- 先支持 3 类实体：S Corp / Partnership / LLC
- 先打透三个故事：周一分诊、CSV 导入、公告影响分析

---

## 8. 你做 Demo 时最该讲的业务逻辑

一个强 Demo 最好按下面顺序走：

1. 我是一个服务 30-80 个客户的独立 CPA
2. 我今天不是缺一个“提醒器”，我是缺一个不会漏事的控制台
3. 我把 TaxDome/CSV 导进来
4. 系统自动识别客户、州、实体类型，生成全年截止日
5. 首页直接按本周/本月/长期分组
6. 我一眼看到最危险的客户和任务
7. 突然某州公告延期
8. 系统告诉我：哪些客户受影响、为何受影响、官方链接是什么

这套叙事比“我们做了很多页面”更有力量，因为它贴着真实工作流。

---

## 9. 行业黑话速记

- `CPA`：Certified Public Accountant
- `PTET / PTE tax`：pass-through entity tax，很多州给 pass-through entities 的 SALT cap workaround
- `extension`：延期报税，不一定延期缴税
- `franchise tax`：部分州对实体征收的资格/特许经营类税，不等于联邦所得税
- `nexus`：与某州形成税务联系的连接点，可能触发申报义务
- `busy season`：通常指 1-4 月税务高峰期
- `K-1`：合伙/穿透实体向投资人或合伙人分配收入项目的重要表单信息
- `PTIN`：paid preparer 的税务识别号

---

## 10. 对你这次集训最重要的结论

### 10.1 你不需要先学会“整个美国税法”

你要先学会的是这个行业的产品结构：

- 用户怕什么
- 现有工具缺什么
- 什么时候会出错
- 为什么 deadline 是最硬的工作锚点

### 10.2 这个题目的成败，不在于做多少规则，而在于做出多强的“可控感”

DueDateHQ 真正卖的不是日历，而是三种感受：

- 我知道这周先做什么
- 我知道我没有漏掉什么
- 外部规则变了，我也能及时反应

### 10.3 如果你只能把一件事做得很强，就做“分诊控制台”

因为对这个行业来说，最直接的价值不是“存数据”，而是：

> 在压力最大的时候，用最短时间把正确的优先级给出来。

这就是你内部材料里“45 分钟压缩到 5 分钟”的意义。

---

## 11. 我建议你下一步马上补的 5 个问题

1. 首版到底覆盖哪些州，为什么？
2. 首版到底覆盖哪些实体类型和税种？
3. 导入 CSV 时，哪些字段最关键，哪些字段可以容错？
4. 首页的优先级排序规则是什么？
5. 公告影响分析里，哪些结论必须人工确认？

如果这 5 个问题答清楚，你就已经从“行业不懂”进入“能做出可信产品”了。

---

## 12. 额外注意

我在你提供的 `工程师集训.html` 里看到一个日期冲突：

- 顶部信息写的是 **5 月 6 日**
- 正文“交付日”写的是 **4 月 27 日 24:00**

这两个日期不一致。这个不是小问题，建议你尽快向 POps 或负责人确认最终提交日期。
