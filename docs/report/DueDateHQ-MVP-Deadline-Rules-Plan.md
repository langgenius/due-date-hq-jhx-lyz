# DueDateHQ MVP Deadline Rules 资产规划

版本：v0.1  
范围：两周 MVP 内的 deadline rules 来源、验证、维护与更新防漏  
原则：Rules 是独立内容资产；产品依赖 rules，但 rules 不依附于某个产品界面

## 1. MVP 目标

Deadline rules 在 MVP 里不是用户功能，也不是某个页面的附属配置，而是一套可独立维护、验证、版本化的内容资产。DueDateHQ 只是这套规则资产的第一个消费方。

MVP 要做到：

- 形成 `FED + 50 states + DC` 的 source-backed business deadline rule/candidate pack。
- 每条 deadline 都来自官方来源，不使用博客、论坛或 AI 推断作为依据。
- 每条规则能独立说明适用范围、截止时间逻辑、官方依据和验证状态。
- 规则包可以被产品、内部审核、未来 API 或其他应用复用。
- 规则变化不自动静默发布，必须经过内部确认。

## 2. Rules 分层

### 2.1 基础稳定规则

长期有效、低频变化的常规 deadline。

示例：

- Federal 1040 / 1065 / 1120-S / 1120
- Federal estimated tax
- Form 7004 extension
- CA LLC annual tax / franchise tax
- NY business / PTET 相关 deadline
- TX franchise tax
- FL corporate income tax
- WA B&O / excise filing due dates

MVP 处理方式：

- 作为默认规则包人工录入。
- 每条必须绑定官方来源。
- 每条必须人工验证后才能进入 verified rule pack。

### 2.2 年度滚动规则

规则逻辑大多稳定，但官方每年会发布新版 calendar / instructions。

示例：

- IRS Publication 509
- IRS Tax Calendar
- IRS form instructions
- 州税局年度 filing calendar / due date page

MVP 处理方式：

- 只做 2026 tax year 的 verified rule set。
- 标明适用年份。
- Demo / pilot 前完成一次人工复核。

### 2.3 临时例外规则

不规律发生，但业务风险最高。

示例：

- IRS disaster relief
- 州 emergency tax relief
- wildfire / storm / hurricane / flood 导致的延期
- 特定州、县、form、实体类型的临时延期

MVP 处理方式：

- 不直接覆盖基础 deadline。
- 作为 exception / overlay rule candidate 进入内部审核。
- 审核后再发布为可消费的 exception rule。
- 不能由 AI 直接发布为 verified rule。

### 2.4 需人工判断规则

适用性依赖客户事实，产品不能替 CPA 下结论。

示例：

- 客户是否属于 affected taxpayer
- payment 是否同样延期
- fiscal year filer 特殊情况
- 特殊 election 是否适用

MVP 处理方式：

- 规则资产中标记为 requires applicability review。
- 不写成确定性结论。
- 不作为无条件自动生成规则。

## 3. 官方来源范围

MVP 只接受官方来源作为 rule basis。

Federal 优先来源：

- IRS Publication 509
- IRS Tax Calendar
- IRS form instructions，例如 Form 7004 instructions
- IRS Disaster Relief
- IRS Newsroom / Newswire

州级优先来源：

- CA FTB due dates / emergency tax relief / tax news
- NY Department of Taxation filing calendar / filing due dates
- TX Comptroller franchise tax / due dates / disaster guidance
- FL Department of Revenue corporate income tax / tax information publications
- WA Department of Revenue filing frequencies and due dates

不作为最终依据：

- CPA 博客
- 新闻媒体
- Reddit / forum
- AI 直接回答
- 未注明官方出处的第三方 calendar

这些只能作为发现线索，不能作为 rule source。

## 4. MVP 必做事项

1. 人工整理并复核 `FED + 50 states + DC` 核心 rules/candidates。
2. 每条 rule 绑定官方 URL、来源标题、适用年份和验证时间。
3. 每条 rule 至少一次人工验证；高风险 rule 尽量双人复核。
4. 每条 verified rule 都能独立回溯到官方来源。
5. 做一个内部 rules coverage 清单，明确哪些 jurisdiction / entity / tax type 已覆盖，哪些未覆盖。
6. 做一个临时例外样例：例如 IRS / CA disaster relief，验证 exception rule 的采集、审核和发布流程。
7. 所有 AI 抽取结果只作为 candidate，不能直接成为 verified rule。

## 5. MVP 暂不做

- 不做全 50 州。
- 不把 rules 设计成用户自行编辑的配置。
- 不承诺覆盖所有特殊税务场景。
- 不自动监控并自动更新所有规则。
- 不用 AI 自动判断某客户是否符合 relief 条件。
- 不把第三方内容作为 deadline 的最终依据。

## 6. 更新防漏机制

两周 MVP 采用轻量但明确的规则运营流程：

1. 税季前人工复核全部 MVP core rules。
2. 每周检查一次基础 deadline 来源是否变化。
3. IRS / 州 emergency relief 页面在 pilot 期间每日检查。
4. 如果官方来源变化，先标记为需要复核，不直接发布新 rule。
5. 复核确认后，再发布新版本 rule 或 exception rule。
6. 所有变更保留内部记录：谁确认、何时确认、依据哪个官方来源。

低容错页面优先级：

- IRS Disaster Relief
- IRS Newsroom / Newswire
- CA FTB Emergency Tax Relief
- 各州 tax news / emergency relief 页面
- IRS Publication 509 / form instructions
- 州 due dates 页面

## 7. 获取与结构化方式

不存在一个覆盖 Federal + 各州 deadline rules 的统一官方 API。MVP 要用“多源交叉 + 人工确认”的方式降低遗漏风险。

### 7.1 获取渠道优先级

1. **官方结构化文件**
   - IRS instructions / publications XML source files。
   - 优先用于 Federal publication 和 form instructions 的抽取。
   - 优点：比 PDF / HTML 更适合稳定解析。
   - 局限：州级不一定有类似结构化源。

2. **官方 deadline / calendar 页面**
   - IRS Publication 509、IRS Tax Calendar。
   - 各州 due dates 页面。
   - 优先用于基础稳定规则。
   - 需要保存页面快照，防止页面更新后无法回溯。

3. **官方 form instructions / publication PDF 或 HTML**
   - 用于确认 filing due date、extension due date、payment due date 的细节。
   - 尤其注意 extension 是否只延 filing、不延 payment。

4. **官方 news / subscription / bulletin**
   - IRS Newswire / e-News。
   - 州税局 tax news、tax information publications、GovDelivery、email subscription。
   - 主要用于发现临时变更、disaster relief、deadline extension。

5. **FEMA / 州 emergency declaration**
   - 只作为 early warning。
   - 不能直接生成税务 deadline。
   - 必须等 IRS 或州税局发布 tax relief 才能进入规则确认。

### 7.2 结构化流程

MVP 不追求全自动抽取，采用半自动流程：

1. 从官方来源抓取或下载原文。
2. 先由 AI / parser 抽取候选 rule。
3. 人工检查候选 rule 是否完整。
4. 人工确认官方来源是否直接支持该 rule。
5. 标记适用范围：jurisdiction、entity、tax type、filing/payment/extension、tax year。
6. 生成内部 verified rule。
7. 发布为可被产品消费的 rule pack。

AI 在这里的角色是“提取候选”，不是“确认规则”。

### 7.3 防遗漏办法

单靠抓网页不够，MVP 需要三重防漏：

1. **Source registry**
   - 列出每个 jurisdiction 的必看官方来源。
   - 每个来源有 owner 和检查频率。
   - 没有纳入 registry 的来源，不视为已覆盖。

2. **Checklist review**
   - 每条核心 deadline 必须回答：
     - 是 filing 还是 payment？
     - 是否有 extension？
     - extension 是否影响 payment？
     - 适用 calendar year 还是 fiscal year？
     - 周末 / legal holiday 如何顺延？
     - 是否有 disaster / emergency exception？

3. **Cross-source check**
   - Federal rule 至少用 Publication 509 + form instructions 交叉验证。
   - 州级 rule 至少用 due dates 页面 + form instructions / tax bulletin 交叉验证。
   - 如果两个官方来源冲突，标记为 needs review，不进入自动生成。

### 7.4 MVP 采集节奏

两周内建议：

- Federal：优先从 IRS Publication 509、Tax Calendar、核心 form instructions 手工结构化。
- 州/DC：优先从州税局 due dates 页面和相关 form instructions 手工结构化。
- 临时 relief：只重点关注 IRS Disaster Relief、IRS Newswire、CA FTB Emergency Tax Relief。
- 其他州级 news / subscription：先纳入 source registry，不承诺自动覆盖。

### 7.5 不能承诺的事情

MVP 不应该承诺：

- “零遗漏”。
- “全自动实时更新”。
- “覆盖所有特殊适用条件”。
- “AI 已确认税务结论”。

MVP 应该承诺：

- 核心规则来自官方来源。
- 每条规则经过人工验证。
- 高风险官方来源有检查机制。
- 临时变更会先进入复核，不会静默发布为 verified rule。

## 8. 规则表述原则

允许：

- “Source indicates...”
- “This may affect...”
- “Verify eligibility before relying on this deadline.”
- “Human verified on ...”

避免：

- “Your client qualifies.”
- “No penalty will apply.”
- “This deadline is guaranteed.”
- “AI confirmed this rule.”

## 9. 产品消费边界

产品可以消费 rules，但不应该反向污染 rules 的定义。

规则资产只回答：

- 这个规则来自哪里。
- 这个规则适用于什么 jurisdiction、entity、tax type、tax year。
- 这个规则描述的是 filing、payment、extension，还是 exception。
- 这个规则是否已经人工验证。
- 这个规则是否需要适用性判断。

产品可以决定如何展示：

- 自动生成 deadline。
- 显示 source badge。
- 展示 coverage。
- 生成 alert。
- 匹配受影响客户。

但这些展示方式不属于 rule 本身。

## 10. 成功标准

两周 MVP 里，规则资产成功的标准是：

- `FED + 50 states + DC` core rule/candidate pack 可独立审阅。
- 每条 verified rule 都有官方来源。
- 每条 verified rule 都能说明适用范围和限制。
- 临时 exception rule 有独立审核路径。
- AI candidate 和 human-verified rule 被明确区分。
