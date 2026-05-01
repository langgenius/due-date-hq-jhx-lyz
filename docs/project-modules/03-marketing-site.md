# apps/marketing 模块文档：Astro 营销站

## 功能定位

`apps/marketing` 是 DueDateHQ 的公开营销站，基于 Astro 静态构建，部署为 Cloudflare Workers Static Assets。它负责产品叙事、价格页、规则库说明、州覆盖页面、指南内容、SEO metadata、结构化数据和中英文落地页。

营销站和主产品 SPA 分离部署，避免营销内容影响应用 bundle，也让公开页面可以更容易做静态优化。

## 关键路径

| 路径                                          | 职责                                                            |
| --------------------------------------------- | --------------------------------------------------------------- |
| `apps/marketing/astro.config.mjs`             | Astro 配置、站点 URL、sitemap、i18n、Tailwind                   |
| `apps/marketing/wrangler.toml`                | Cloudflare Worker static assets 部署配置                        |
| `apps/marketing/src/layouts/BaseLayout.astro` | HTML shell、canonical/hreflang、OG/Twitter、theme init、JSON-LD |
| `apps/marketing/src/pages`                    | 首页、价格、规则、州覆盖、指南和中文版本                        |
| `apps/marketing/src/components`               | TopNav、Hero、SLA strip、workflow、security、footer 等          |
| `apps/marketing/src/i18n`                     | typed copy dictionary                                           |
| `apps/marketing/src/lib`                      | CTA URL、SEO helpers、state/guide data                          |

## 主要功能

- 英文和中文首页。
- Pricing 页面。
- Rules 页面，解释规则覆盖和合规来源。
- State coverage 总览和单州页面。
- Guides 内容页。
- SEO：canonical、alternate hreflang、sitemap、OG/Twitter metadata。
- JSON-LD structured data。
- CTA 连接到 app 域名，并通过 query 进行 locale handoff。

## 创新点

- **营销站完全静态化**：更适合 SEO、缓存和低运维成本。
- **typed copy contract**：文案字典不是松散 JSON，而是 TypeScript 类型约束，减少双语页面字段缺失。
- **与 app 解耦但共享品牌资产**：使用 `@duedatehq/ui` 的 theme script 和基础样式，但不引入 React runtime。
- **本地化 CTA handoff**：中文页面进入应用时带 locale 参数，减少首次进入 app 的语言切换成本。

## 技术实现

### 页面结构

```mermaid
flowchart TB
  Pages["src/pages"]
  Layout["BaseLayout.astro"]
  Components["src/components"]
  Copy["src/i18n/en.ts\nsrc/i18n/zh-CN.ts"]
  Lib["src/lib"]
  UI["packages/ui theme"]

  Pages --> Layout
  Pages --> Components
  Components --> Copy
  Components --> Lib
  Layout --> UI
```

### SEO 与多语言

`BaseLayout.astro` 统一处理：

- `<html lang>`。
- canonical URL。
- alternate hreflang。
- Open Graph metadata。
- Twitter card metadata。
- JSON-LD。
- no-flash theme script。

Astro config 中配置 `locales: ['en', 'zh-CN']`，中文页面通过 `/zh-CN` 路径组织。

### 部署

```mermaid
flowchart LR
  Source["Astro source"]
  Build["astro build"]
  Dist["dist static assets"]
  Wrangler["wrangler deploy"]
  CF["Cloudflare Workers Static Assets"]
  User["Public user"]

  Source --> Build
  Build --> Dist
  Dist --> Wrangler
  Wrangler --> CF
  CF --> User
```

## 架构图

```mermaid
flowchart TB
  subgraph Marketing["apps/marketing"]
    Pages["pages"]
    Layout["BaseLayout"]
    Components["content components"]
    I18n["typed copy"]
    Data["state + guide data"]
  end

  subgraph Shared["Shared"]
    UI["packages/ui\npreset + theme script"]
  end

  subgraph App["Product app"]
    Login["/login"]
    Onboarding["/onboarding"]
  end

  Pages --> Layout
  Pages --> Components
  Components --> I18n
  Components --> Data
  Layout --> UI
  Components --> Login
  Components --> Onboarding
```

## 内容模型

| 内容类型       | 实现方式                           | 说明                         |
| -------------- | ---------------------------------- | ---------------------------- |
| Landing copy   | `src/i18n` typed dictionaries      | 英中分别维护                 |
| State coverage | static data + dynamic Astro routes | `/states/[state]` 和中文路径 |
| Guides         | guide data + dynamic pages         | 用于 SEO 和教育转化          |
| CTA            | helper 生成                        | app URL 来自 public env      |

## 后续演进关注点

- 如果引入交互式 pricing calculator，应保持 island 体积可控，避免把整个站点变成 React 应用。
- 州覆盖页面应与 `packages/core/rules` 的 jurisdiction coverage 建立更自动的同步机制。
- 指南内容应加入更新时间和来源链接，增强专业可信度。
- 需要定期核对 `PUBLIC_APP_URL` 与实际 app 域名。
