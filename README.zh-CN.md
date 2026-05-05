# DueDateHQ

[English README](./README.md)

DueDateHQ 是面向美国 CPA 事务所的截止日运营工作台。它把客户事实、税务义务、截止日变更、罚金风险、团队负责人和审计证据放进同一个闭环：

1. 导入或创建客户。
2. 基于已验证规则和客户事实生成并复核义务。
3. 按截止日、资料完备度、负责人、证据和预计罚金风险做日常分诊。
4. 在 Pulse 中复核政府来源更新，再决定是否应用到受影响工作。
5. 为关键状态、导入、规则、计费和团队事件保留审计记录。

这个仓库是 alpha 阶段的产品代码库，适合继续开发和研究产品实现。它不是税务建议、不是报税系统，也不能替代专业复核。

## 当前已经可用

- 已登录事务所工作台：登录、首次事务所创建、MFA 设置、邀请、角色相关界面、事务所切换和账户安全。
- 客户管理：filing jurisdictions、负责人、联系方式、导入历史、readiness 信号和事实复核。
- Migration Copilot：支持 CSV、TSV、XLSX、粘贴表格和供应商导出形态的数据；可做字段映射、风险输入拦截、生成预览，并在应用后写入审计证据。
- Obligations 和 Dashboard：支持风险分诊、保存视图、批量状态更新、readiness、证据抽屉、预计罚金风险和本周/本月视图。
- Rules Console：包含来源注册表、coverage、规则库、生成预览、候选规则复核和事务所级验证决策。
- Pulse pipeline：支持官方来源监控、候选抽取、复核、事务所提醒、应用/忽略/稍后处理/撤销和来源健康度运营。
- Audit、通知、readiness portal、日历订阅、计费 checkout handoff 和团队 workload 界面。
- 应用和营销站已有英文与中文文案。

## 当前边界

- DueDateHQ 用于运营分诊和证据复核。报税、付款、延期和客户沟通的最终判断仍需 CPA、EA、律师或其他合格专业人士确认。
- 公开州覆盖当前按 Federal + CA、NY、TX、FL、WA 表达。代码中的规则来源注册表已有更广的州/DC 脚手架和候选规则，但候选规则不等于已验证、可发提醒的覆盖。
- AI 用于字段映射、摘要、抽取和草拟。服务端通过结构化 schema、来源字段、guard 和审计记录约束 AI 输出进入工作流的方式，但仍需要人工复核。
- 计费、邮件、SSO 和 AI 辅助流程属于部署侧启用的集成能力。对外表达时应说明这些能力需要对应服务接入后才可用。
- 当前 workspace package 标记为 `UNLICENSED`。如果要按开源项目发布或接受外部贡献，需要先添加明确的 `LICENSE`。

## 仓库结构

```text
apps/
  app        已登录工作台的 Vite React SPA
  server     Cloudflare Worker API、auth、oRPC、队列、cron、webhook
  marketing  Astro 静态营销站

packages/
  ai          AI Gateway 调用、prompt、guard、trace
  auth        Better Auth 配置、组织角色、计费插件
  contracts   app/server 共享的 Zod 与 oRPC contract
  core        日期、规则、导入、风险、优先级等纯领域逻辑
  db          Drizzle schema、迁移和 D1 repository
  i18n        共享 locale helper
  ingest      Pulse 来源 adapter 和抓取/解析工具
  ports       边界接口
  ui          设计 token 和可复用 UI primitives
```

重要文档：

- [项目模块文档](./docs/project-modules/README.md)：按模块说明产品和实现。
- [用户与模块使用手册](./docs/project-modules/14-user-manual.md)：说明每个产品界面能做什么。
- [技术总览](./docs/dev-file/00-Overview.md)：架构和阶段口径。
- [架构决策](./docs/adr/README.md)：主要技术决策和取舍。
- [开发日志](./docs/dev-log/README.md)：实现历史。
- [设计系统](./DESIGN.md)：当前视觉 token。

## 贡献者入口

DueDateHQ 是 pnpm monorepo。最常用的贡献者命令是：

```bash
pnpm dev       # 运行 workspace 开发任务
pnpm check     # type-aware 检查
pnpm test      # 单元测试
pnpm build     # 生产构建
pnpm ready     # 默认交付前门禁
```

这个代码库采用保守的产品模块工作流：

- 业务 UI 放在 `apps/app/src/features/<vertical>/`。
- app runtime helper 放在 `apps/app/src/lib`。
- 纯领域逻辑放在 `packages/core`。
- 共享 contract/schema 放在 `packages/contracts`。
- 租户化持久化逻辑通过 `packages/db` repository 暴露。
- app/package 代码不要使用 React `useEffect`。
- Commit message 和 PR title 使用 Conventional Commits。

PR 应包含简洁 summary、验证命令、UI 变更截图，并明确说明迁移、依赖方向或安全敏感行为。

## 安全

产品流程会处理客户和事务所数据。除非能够证明不是敏感信息，否则应把示例数据、导出、截图和日志都按敏感材料处理。

## License

当前没有声明开源许可证。workspace packages 标记为 `UNLICENSED`；在添加 license file 前，默认保留全部权利。
