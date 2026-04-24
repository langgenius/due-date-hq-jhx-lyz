# 12 · Marketing Architecture · Astro 公开站

> 目标：为 DueDateHQ 的公开首页与后续 SEO 内容建立独立、可扩展、可部署的架构边界。
> 决策：`apps/marketing` 使用 Astro；`apps/app + apps/server` 继续作为登录后的 SaaS 产品面。
> 官方依据：Astro React integration、Astro i18n routing、Astro Cloudflare deployment docs；版本以 `pnpm-workspace.yaml` catalog 为准。

---

## 1. 产品定位

`apps/marketing` 只服务未登录访客，不承担 SaaS 工作台能力。

| 站点       | 域名                                         | 用户心智                     | 主要任务                                   |
| ---------- | -------------------------------------------- | ---------------------------- | ------------------------------------------ |
| Marketing  | `https://duedatehq.com`                      | 了解产品、建立信任、点击试用 | 首页、SEO meta、OG、后续 pricing / content |
| SaaS App   | `https://app.duedatehq.com`                  | 登录后处理截止日风险         | Login、onboarding、dashboard、workboard    |
| Worker API | `https://app.duedatehq.com/api/*` / `/rpc/*` | 产品后端                     | Better Auth、oRPC、webhook、health         |

用户路径：

```text
duedatehq.com
  -> Landing CTA
  -> app.duedatehq.com/login 或 app.duedatehq.com/
  -> SaaS SPA auth gate
```

不把 landing 放进 `apps/app` 的原因：当前 app 是 Vite SPA，服务端返回同一个 `index.html` 壳；这对登录后工作台正确，但不是公开 SEO 页面的最佳运行模型。Astro 的 HTML-first 输出、零 JS 默认和 islands 模型更适合 marketing。

---

## 2. Landing PRD

### 2.1 ICP

首版面向美国中小 CPA practice 的 owner / operations lead。核心焦虑不是“日历好看”，而是高峰季的罚款敞口、客户资料缺口、州税变更和团队分诊成本。

### 2.2 核心承诺

Homepage 只讲一个 offer：

> DueDateHQ helps CPA teams see deadline risk before it becomes a penalty.

中文工作口径：

> 让 CPA 团队在罚款发生前看清截止日风险。

### 2.3 首屏结构

首屏必须让访客在 5 秒内理解三件事：

1. 我们服务谁：CPA teams / practices。
2. 解决什么：deadline risk, evidence gaps, filing-pressure triage。
3. 下一步是什么：进入 app 或预约 demo。

首屏 H1 使用产品名或直接 offer，不写抽象口号。主 CTA：

- Primary：`Open app` / `Start with Google` -> `https://app.duedatehq.com/login`
- Secondary：`See the workflow` -> 页面内锚点

首屏视觉必须直接展示产品工作台状态：风险金额、截止日队列、证据来源、Pulse 变更。禁止纯装饰渐变、抽象插画、漂浮卡片堆叠。

### 2.4 页面模块

首版 landing 限制为 6 个模块，避免 marketing 站变成散文页：

| 模块      | 目的             | 内容要求                                                          |
| --------- | ---------------- | ----------------------------------------------------------------- |
| Hero      | 说明 offer + CTA | 产品名、风险金额 mock、deadline queue 截图或复刻 UI               |
| Problem   | 触发 ICP 共鸣    | 高峰季错过州税变更、K-1 资料缺口、客户 deadline 分散              |
| Workflow  | 展示产品如何工作 | 7-day queue、evidence gate、Pulse update 三步                     |
| Proof     | 建立可信度       | verified source、audit trail、no black-box AI                     |
| Security  | 降低顾虑         | Google sign-in、organization isolation、email-first notifications |
| Final CTA | 转化             | Open app / request demo；不增加第三个 CTA                         |

后续可以追加 `/pricing`、`/rules`、`/state/[state]`、`/blog`，但首版不为不存在的内容搭复杂 CMS。

### 2.5 转化事件

Marketing 只埋公开站事件，不读取 app session。

| Event                               | 触发               |
| ----------------------------------- | ------------------ |
| `marketing.hero_cta.clicked`        | Hero primary CTA   |
| `marketing.secondary_cta.clicked`   | Hero secondary CTA |
| `marketing.workflow_section.viewed` | Workflow 进入视口  |
| `marketing.final_cta.clicked`       | 页尾 CTA           |

事件命名不进 Lingui catalog。若 PostHog 尚未接入 marketing，先保留 data attribute 和文档契约。

---

## 3. 架构

```text
apps/marketing
  Astro static site
  @astrojs/react for selected React islands
  @duedatehq/ui for shared primitives and tokens
  local marketing copy catalogs
  deploys to duedatehq.com

apps/app
  Vite React SPA
  React Router 7 data mode
  Lingui app catalogs
  deploys as Worker Assets behind apps/server

apps/server
  Hono Worker
  /api/auth/* Better Auth
  /rpc/* oRPC
  /api/webhook/* callbacks
  deploys to app.duedatehq.com
```

`apps/marketing` 不调用 `/rpc` 做首屏渲染。公开 landing 的可信内容必须是静态文案或构建期数据。后续 `/rules` / `/state/*` 若需要规则快照，优先从静态 JSON snapshot 或公开 `/api/v1/*` 读取，不直接复用内部 `/rpc`。

---

## 4. Astro 项目形态

建议目录：

```text
apps/marketing/
├── astro.config.mjs
├── package.json                 # name: @duedatehq/marketing
├── public/
│   ├── favicon.svg
│   └── og/
├── src/
│   ├── pages/
│   │   ├── index.astro          # default locale landing
│   │   └── zh-CN/
│   │       └── index.astro      # localized landing, if enabled
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── Workflow.astro
│   │   ├── Proof.astro
│   │   └── FinalCta.astro
│   ├── islands/
│   │   └── LocaleSwitcher.tsx   # only when interactivity is needed
│   ├── i18n/
│   │   ├── locales.ts
│   │   ├── en.ts
│   │   └── zh-CN.ts
│   └── styles/
│       └── globals.css
└── tsconfig.json
```

Astro 默认不向页面发送 JS。React 组件只有在需要交互时作为 island 加载，并显式使用 `client:*` directive。静态 section 优先写 `.astro`，不要把整个 landing 做成 React SPA。

`astro.config.mjs` 目标配置：

```js
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  integrations: [react()],
  i18n: {
    locales: ['en', 'zh-CN'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: true,
      fallbackType: 'redirect',
    },
  },
})
```

如果首版只发布英文首页，仍要把 locale contract 先接到共享包，页面内容可以只实现 `en`。

---

## 5. UI 与设计

`packages/ui` 是唯一共享 UI 和 token 来源：

- `@duedatehq/ui/components/ui/*`：React primitives，可用于 Astro React islands。
- `@duedatehq/ui/styles/preset.css`：Tailwind 4 token、semantic colors、radius、typography。
- `@duedatehq/ui/lib/utils`：`cn()`。

Marketing 的 `src/styles/globals.css` 必须消费同一 preset：

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import '@duedatehq/ui/styles/preset.css';

@source '../../../packages/ui/src';
@source '../components';
@source '../islands';
```

设计风格继承 `docs/Design/DueDateHQ-DESIGN.md` 的专业、克制、证据优先方向，但 landing 可以使用更大的标题和更宽的叙事节奏。边界如下：

- 可以：真实产品 UI 截图 / 产品状态复刻、navy 文本、indigo CTA、风险色只用于业务信号。
- 不可以：紫色渐变 hero、抽象 SVG 插画、漂浮装饰球、大圆角营销卡片堆、与产品无关的 stock photo。
- Cards 只用于重复 proof/workflow item；页面 section 不做“卡片套卡片”。
- 首屏必须露出下一段内容的一部分，避免一屏只有 hero。

Landing 的产品截图优先来自真实 `apps/app` 状态；若用 mock，必须标明为 illustrative product state，不展示不存在的客户或真实 PII。

---

## 6. i18n 共享策略

共享的是 **locale contract**，不是共享同一个 catalog。

### 6.1 建议新增共享包

后续实现时把 locale 常量从 `apps/app/src/i18n/locales.ts` 下沉到：

```text
packages/i18n/
└── src/
    ├── locales.ts          # SUPPORTED_LOCALES, DEFAULT_LOCALE, INTL_LOCALE
    ├── headers.ts          # LOCALE_HEADER = 'x-locale'
    └── detect.ts           # pure helpers only, no browser globals
```

消费者：

- `apps/app`：继续使用 Lingui catalog，导入共享 locale constants。
- `apps/server`：继续使用类型化薄字典，导入 `SUPPORTED_LOCALES` / `LOCALE_HEADER`。
- `apps/marketing`：使用 Astro i18n routing + 静态 copy dictionary，导入共享 locale constants。

### 6.2 为什么不共享 catalog

App 文案、server 邮件文案、marketing 文案的生命周期不同：

- App 文案来自交互状态和错误处理，需要 Lingui macros 和 PO workflow。
- Server 文案运行在 Worker，保持 Lingui-free，减少冷启动和 bundle 风险。
- Marketing 文案偏编辑和转化，适合 Astro 静态 dictionary 或内容文件。

共享 catalog 会造成 key 漂移、翻译上下文混杂和不必要的 runtime 依赖。共享 locale contract 能保证语言列表、`html lang`、`Intl` locale、`x-locale` header 一致。

### 6.3 URL 策略

首选：

```text
/           -> en
/zh-CN/     -> zh-CN
```

不为默认英文加 `/en` 前缀，减少主域 canonical 分裂。每个 localized page 必须输出：

- `<html lang>`
- canonical URL
- `hreflang="en"`
- `hreflang="zh-CN"`
- `hreflang="x-default"`

CTA 跳转 app 时带上 locale：

```text
https://app.duedatehq.com/login?lng=zh-CN
```

`apps/app` 后续可读取 `lng` 并持久化到现有 locale store；没有实现前，app 仍按浏览器/本地存储检测。

---

## 7. 部署

部署单元从一个变成两个，但根命令仍保持一键：

```text
pnpm deploy
  -> check / test / build
  -> deploy marketing
  -> migrate remote D1
  -> deploy app Worker
```

建议目标：

| Workspace              | 部署产品                          | 域名                | Build                                              | Output                    |
| ---------------------- | --------------------------------- | ------------------- | -------------------------------------------------- | ------------------------- |
| `@duedatehq/marketing` | Cloudflare Pages 或 static Worker | `duedatehq.com`     | `pnpm --filter @duedatehq/marketing build`         | `apps/marketing/dist`     |
| `@duedatehq/server`    | Cloudflare Worker + Assets        | `app.duedatehq.com` | `pnpm --filter @duedatehq/app build` then Wrangler | `apps/app/dist` as Assets |

Cloudflare Pages 对 Astro 的默认构建目录是 `dist`。若采用 static Worker，Wrangler assets directory 也指向 `./dist`。首版 landing 无 SSR，不需要 `@astrojs/cloudflare` adapter。

环境变量：

- Marketing 不读取 Worker secrets。
- Marketing 只允许 `PUBLIC_*` / `ASTRO_*` 类公开变量，例如 `PUBLIC_APP_URL=https://app.duedatehq.com`。
- Auth/OAuth callback 仍属于 `app.duedatehq.com`，不要绑定到 marketing 主域。

---

## 8. SEO 与性能要求

首版上线门槛：

- HTML 中有完整 H1、title、description、canonical、OG title/description/image。
- Lighthouse SEO / Accessibility / Best Practices 目标 95+。
- 无 JS 时仍能阅读完整 landing 和点击 CTA。
- 首屏图片使用明确尺寸或 aspect-ratio，避免 CLS。
- OG 图存在于 `public/og/home.png` 或构建产物等价位置。
- `robots.txt` 和 `sitemap.xml` 在 marketing 站生成；app 子域默认不进入 marketing sitemap。

性能预算：

| 指标                | 目标                  |
| ------------------- | --------------------- |
| Landing LCP         | < 2.0s on 4G mid-tier |
| JS transferred      | < 50 KB gz 首版       |
| CLS                 | < 0.05                |
| Interaction islands | ≤ 2 个                |

---

## 9. 测试与验收

实现 `apps/marketing` 时必须补：

- Build：`pnpm --filter @duedatehq/marketing build`
- Links：CTA 指向 `PUBLIC_APP_URL`，无硬编码 localhost
- HTML smoke：检查 title、meta description、canonical、hreflang、OG
- Accessibility：Playwright + axe 或 Lighthouse smoke
- Visual：desktop 1440、tablet 768、mobile 390 截图检查，无文字重叠
- i18n：每个 locale 页面都有对应 route、`html lang` 和 canonical

---

## 10. 实施顺序

1. 新增 `packages/i18n`，迁移 locale constants，不改变 app 行为。
2. 新增 `apps/marketing` Astro static app，接入 `@astrojs/react` 和 `@duedatehq/ui` preset。
3. 实现英文 landing，CTA 指向 `PUBLIC_APP_URL`。
4. 加入 Astro i18n routing；按需要实现 `zh-CN` 首页。
5. 更新 root Vite Task：`workspace-build` 包含 marketing，`workspace-deploy` 串行部署 marketing 与 app Worker。
6. 配置 Cloudflare Pages / static Worker 域名：`duedatehq.com` 和 `app.duedatehq.com` 分离。

---

## 11. 非目标

- 不把当前 SaaS app 迁到 React Router SSR/framework mode。
- 不让 marketing 直接依赖 Better Auth session。
- 不在首版引入 CMS。
- 不把 `/rpc` 暴露给公开站当作 SEO 数据源。
- 不把 marketing 文案放进 app 的 Lingui catalog。

---

## 12. 官方参考

- Astro React integration：`@astrojs/react` 在 `astro.config.mjs` 的 `integrations` 中注册。
- Astro i18n routing：`i18n.locales` / `defaultLocale` / `routing.prefixDefaultLocale` 控制 locale URL。
- Astro Cloudflare deployment：static output 使用 `dist` 作为部署目录；首版 landing 不需要 SSR adapter。
