# 05 · Frontend Architecture · Next.js · UI System · PWA

> 对齐 PRD §5 / §7.8 / §10 / §11。
> 视觉单一事实源：[`docs/Design/DueDateHQ-DESIGN.md`](../Design/DueDateHQ-DESIGN.md)（方向：**Ramp × Linear · Light Workbench**）
> 核心：**RSC + Server Actions 原生玩法 · 不在前端做业务计算 · Glass-Box 视觉语言统一**。

---

## 1. App Router 布局

```
app/
├── (marketing)/                   # 公开页（无 session）
│   ├── layout.tsx                 # 营销 Nav + Footer
│   ├── page.tsx                   # 产品首页
│   ├── pricing/page.tsx
│   ├── evidence/page.tsx
│   ├── security/page.tsx          # WISP + Verification Rhythm
│   ├── get/page.tsx               # 交付形态（PWA / Menu Bar）
│   ├── rules/
│   │   ├── page.tsx               # Rule Library index
│   │   ├── [jurisdiction]/page.tsx
│   │   └── [jurisdiction]/[tax]/page.tsx
│   ├── watch/page.tsx             # Source Registry 公开页
│   ├── pulse/page.tsx             # 实时 Pulse feed
│   └── privacy/page.tsx
│
├── (auth)/                        # 登录 / 注册 / 魔法链验证
│   ├── login/page.tsx
│   ├── verify/page.tsx
│   ├── invite/[token]/page.tsx
│   └── choose-firm/page.tsx       # 多 Firm Picker
│
├── (app)/                         # 登录后主 App
│   ├── layout.tsx                 # 侧栏 + 顶栏 + Cmd-K Provider
│   ├── [firmSlug]/                # 强制 Firm scope 在 URL
│   │   ├── layout.tsx             # 注入 firmContext + RBAC guard
│   │   ├── dashboard/page.tsx     # Story S1 主屏
│   │   ├── workboard/page.tsx     # 高密度表格
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   ├── import/page.tsx    # Migration 4 步向导
│   │   │   └── [clientId]/
│   │   ├── alerts/page.tsx        # Pulse 历史
│   │   ├── rules/page.tsx         # 登录用户版 Rules
│   │   ├── team/                  # Manager Workload + Members
│   │   ├── audit/page.tsx         # Firm-wide Audit Log
│   │   ├── reports/page.tsx
│   │   └── settings/
│   │       ├── profile/page.tsx
│   │       ├── notifications/page.tsx
│   │       ├── imports/page.tsx
│   │       ├── ask-history/page.tsx
│   │       ├── calendar/page.tsx  # ICS token
│   │       ├── team/page.tsx      # 邀请 / 席位 / 转让
│   │       ├── priority-weights/page.tsx   # Pro only
│   │       └── export-package/page.tsx     # §6C
│   └── onboarding/page.tsx        # 空态首页（Agent 或 Wizard）
│
├── (embed)/                       # 第三方 embed（免登录，token 鉴权）
│   └── readiness/[token]/page.tsx # Client Readiness Portal
│
├── api/                           # Route Handlers（非 Server Action 场景）
│   ├── auth/[...nextauth]/route.ts
│   ├── inngest/route.ts           # Inngest webhook
│   ├── stripe/webhook/route.ts    # Phase 1
│   ├── ics/[token]/route.ts       # ICS feed output
│   ├── push/subscribe/route.ts
│   ├── push/send/route.ts
│   ├── v1/me/radar-summary/route.ts   # Menu Bar widget
│   ├── v1/me/top-urgent/route.ts
│   └── health/route.ts
│
├── layout.tsx                     # Root layout · Theme · PWA manifest link
├── global-error.tsx
├── not-found.tsx
└── manifest.ts                    # PWA manifest generator
```

**Route Groups 的作用：**

- `(marketing)` · 不共享登录态，静态生成（SEO）
- `(app)` · 共享 `layout.tsx` 的 Firm context + 主 Nav
- `(embed)` · 完全裸页面，不带主 App chrome，适合客户端门户

---

## 2. Server 与 Client 组件边界

| 默认 | 何时切换 Client |
|---|---|
| RSC（默认）| 交互（`onClick` / state）/ 浏览器 API（localStorage / navigator.clipboard） |
| Server Action | 表单提交、状态变更、重定向 |
| Route Handler | webhook、streaming endpoint、第三方 API |

**RSC 纪律：**

- 所有数据获取在 RSC（`async function Page()`）
- 业务计算（如 Penalty）永远在服务端，不在 useEffect 里 fetch
- Client Components 只做"拿数据渲染 + 处理用户输入"

---

## 3. 状态管理

### 3.1 三层划分

| 状态类型 | 管理方式 | 例子 |
|---|---|---|
| **URL state** | `nuqs` / `useSearchParams` | Triage tab / filters / sort / scope |
| **服务端缓存** | TanStack Query | Obligation list / Pulse feed / AI Brief |
| **UI 状态** | Zustand + local component state | Cmd-K 开关 / drawer stack / Toast queue |

### 3.2 URL state 样板

```typescript
// lib/filters.ts
export const workboardFiltersSchema = z.object({
  state: z.array(z.string()).optional(),
  county: z.array(z.string()).optional(),
  tax: z.array(z.string()).optional(),
  status: z.array(statusEnum).optional(),
  assignee: z.array(z.string()).optional(),
  page: z.coerce.number().default(1),
  sort: z.enum(["smart", "due", "exposure", "status"]).default("smart"),
  scope: z.enum(["firm", "me"]).default("firm"),
});

export function useWorkboardFilters() {
  return useQueryStates(workboardFiltersParsers);
}
```

### 3.3 Zustand slice 样板

```typescript
// stores/ui.ts
import { create } from "zustand";

type UiState = {
  cmdkOpen: boolean;
  drawerStack: string[];
  evidenceTarget: EvidenceTarget | null;
  setCmdkOpen: (v: boolean) => void;
  pushDrawer: (id: string) => void;
  popDrawer: () => void;
};

export const useUi = create<UiState>((set) => ({
  cmdkOpen: false,
  drawerStack: [],
  evidenceTarget: null,
  setCmdkOpen: (v) => set({ cmdkOpen: v }),
  pushDrawer: (id) => set((s) => ({ drawerStack: [...s.drawerStack, id] })),
  popDrawer: () => set((s) => ({ drawerStack: s.drawerStack.slice(0, -1) })),
}));
```

> **禁止反模式：** 把"obligation 列表"放 Zustand；那是服务端数据，由 TanStack Query 托管。

---

## 4. 组件分层

```
components/
├── ui/                         # shadcn 原子组件（button / dialog / table / ...）
├── primitives/                 # 公司原语（TriageCard / PenaltyPill / EvidenceChip / SourceBadge / AIHighlight）
├── patterns/                   # 复合模式（Workboard / PulseBanner / CmdK / EvidenceDrawer）
└── features/                   # 绑定具体业务（DashboardPenaltyRadar / MigrationWizard / PulseDetailDrawer）
```

### 4.1 关键设计组件规格

对齐 PRD §10.2：

```tsx
// components/primitives/triage-card.tsx
// DESIGN.md §4.1 Risk Row — severity tokens driven by CSS variables
export function TriageCard({ obligation }: { obligation: Obligation }) {
  const severity = getDaysSeverity(obligation.daysUntil);
  return (
    <article
      data-severity={severity}
      className={cn(
        "border-l-[2px] rounded-r p-4 bg-elevated",
        "data-[severity=critical]:border-severity-critical data-[severity=critical]:bg-[var(--severity-critical-tint)]",
        "data-[severity=high]:border-severity-high     data-[severity=high]:bg-[var(--severity-high-tint)]",
        "data-[severity=medium]:border-severity-medium data-[severity=medium]:bg-[var(--severity-medium-tint)]",
        "data-[severity=neutral]:border-severity-neutral",
      )}>
      <header className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <DaysBadge days={obligation.daysUntil} severity={severity} />
          <PenaltyPill amount={obligation.exposureUsd} />
        </div>
        <StatusDropdown value={obligation.status} onSelect={(next) => /* Server Action */} />
      </header>
      <h3 className="text-md font-semibold mt-2 text-text-primary">
        {obligation.client.name} · {obligation.formName}
      </h3>
      <p className="text-sm text-text-secondary">
        {obligation.client.state} · {obligation.client.county} · {obligation.client.entityType}
      </p>
      <SmartPriorityBadge score={obligation.priorityScore} factors={obligation.factors} />
      <SourceBadge rule={obligation.rule} />
    </article>
  );
}
```

### 4.2 Penalty Scoreboard（PRD §7.5.6）

```tsx
// components/features/penalty-radar.tsx
"use client";
import Odometer from "react-odometerjs";
import { motion } from "framer-motion";

export function PenaltyRadarHero({ summary }: { summary: WeeklySummary }) {
  const color = getExposureColor(summary.totalCents);
  return (
    <div aria-live="polite" className="flex items-baseline gap-4">
      {/* DESIGN.md §3.2 text-hero = 56px, tracking-tighter applied via token */}
      <span className={cn("text-hero font-mono font-bold tabular-nums text-text-primary", color)}>
        <Odometer value={summary.totalDollars} format="(,ddd)" />
      </span>
      <span className="text-xs uppercase tracking-wide text-text-muted">AT RISK · NEXT 7 DAYS</span>
      <TrendArrow delta={summary.weekOverWeekDelta} />
      <Sparkline data={summary.last8Weeks} />
    </div>
  );
}
```

**动画纪律：**

- 尊重 `prefers-reduced-motion` → 退化为瞬时切换
- Confetti 每周最多 1 次（§7.5.6.4），Zustand 记录"本周已庆祝"
- Live Genesis 粒子动画：CSS keyframes + 5 个 div 粒子；不依赖 JS 物理引擎

---

## 5. UI System（设计 token + 主题）

> **视觉单一事实源 = [`docs/Design/DueDateHQ-DESIGN.md`](../Design/DueDateHQ-DESIGN.md)**
> 本节仅定义 token 如何**落到 Tailwind / CSS 变量**。颜色含义、组件规格、Do's & Don'ts 请查阅 DESIGN.md。
> 风格方向：**Ramp × Linear · Light Workbench**（浅色主导，暗色为等价镜像）。

### 5.1 Semantic Token（CSS 变量 · 亮暗双主题）

所有颜色走 **semantic role**，组件禁止直接引用 hex。两套主题通过 `:root` 与 `.dark` 切换。

```css
/* app/globals.css */
@layer base {
  :root {
    /* Surface */
    --bg-canvas:        #FFFFFF;
    --bg-panel:         #FAFAFA;
    --bg-elevated:      #FFFFFF;
    --bg-subtle:        #F4F4F5;
    /* Border */
    --border-default:   #E5E7EB;
    --border-strong:    #D4D4D8;
    --border-subtle:    #F1F5F9;
    /* Text */
    --text-primary:     #0A2540;   /* Stripe deep navy */
    --text-secondary:   #475569;
    --text-muted:       #94A3B8;
    --text-disabled:    #CBD5E1;
    /* Accent · Indigo (CTA / focus / selected) */
    --accent-default:   #5B5BD6;   /* Linear indigo-600 */
    --accent-hover:     #4F46E5;
    --accent-active:    #4338CA;
    --accent-tint:      rgba(91, 91, 214, 0.08);
    --accent-text:      #4338CA;
    /* Severity (4 levels, NO green for OK) */
    --severity-critical:        #DC2626;
    --severity-critical-tint:   rgba(220, 38, 38, 0.06);
    --severity-critical-border: #FCA5A5;
    --severity-high:            #EA580C;
    --severity-high-tint:       rgba(234, 88, 12, 0.06);
    --severity-high-border:     #FDBA74;
    --severity-medium:          #CA8A04;
    --severity-medium-tint:     rgba(202, 138, 4, 0.06);
    --severity-medium-border:   #FDE68A;
    --severity-neutral:         #475569;
    --severity-neutral-tint:    rgba(71, 85, 105, 0.04);
    /* Status (Filed / Waiting / Review) */
    --status-done:     #059669;
    --status-draft:    #64748B;
    --status-waiting:  #0284C7;
    --status-review:   #7C3AED;
    /* Radius */
    --radius-sm:  2px;
    --radius-md:  4px;
    --radius-lg:  6px;
    /* Row height (driven by density) */
    --row-height: 36px;
  }

  .dark {
    --bg-canvas:        #0D0E11;   /* warm near-black, NEVER #000 */
    --bg-panel:         #101217;
    --bg-elevated:      #15171C;
    --bg-subtle:        #1A1D23;
    --border-default:   rgba(255, 255, 255, 0.08);
    --border-strong:    rgba(255, 255, 255, 0.14);
    --border-subtle:    rgba(255, 255, 255, 0.04);
    --text-primary:     rgba(255, 255, 255, 0.95);
    --text-secondary:   rgba(255, 255, 255, 0.65);
    --text-muted:       rgba(255, 255, 255, 0.45);
    --text-disabled:    rgba(255, 255, 255, 0.25);
    --accent-default:   #7C7BF5;
    --accent-hover:     #9391F8;
    --accent-active:    #A5A4FA;
    --accent-tint:      rgba(124, 123, 245, 0.14);
    --accent-text:      #A5A4FA;
    --severity-critical:        #EF4444;
    --severity-critical-tint:   rgba(239, 68, 68, 0.12);
    --severity-critical-border: rgba(239, 68, 68, 0.4);
    --severity-high:            #F97316;
    --severity-high-tint:       rgba(249, 115, 22, 0.12);
    --severity-high-border:     rgba(249, 115, 22, 0.4);
    --severity-medium:          #EAB308;
    --severity-medium-tint:     rgba(234, 179, 8, 0.12);
    --severity-medium-border:   rgba(234, 179, 8, 0.4);
    --severity-neutral:         #64748B;
    --severity-neutral-tint:    rgba(100, 116, 139, 0.08);
    --status-done:     #10B981;
    --status-draft:    #94A3B8;
    --status-waiting:  #38BDF8;
    --status-review:   #A78BFA;
  }
}
```

### 5.2 Tailwind 配置

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",     // toggle via <html class="dark">
  theme: {
    extend: {
      colors: {
        canvas:   "var(--bg-canvas)",
        panel:    "var(--bg-panel)",
        elevated: "var(--bg-elevated)",
        subtle:   "var(--bg-subtle)",
        border: {
          DEFAULT: "var(--border-default)",
          strong:  "var(--border-strong)",
          subtle:  "var(--border-subtle)",
        },
        text: {
          primary:   "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted:     "var(--text-muted)",
          disabled:  "var(--text-disabled)",
        },
        accent: {
          DEFAULT: "var(--accent-default)",
          hover:   "var(--accent-hover)",
          active:  "var(--accent-active)",
          tint:    "var(--accent-tint)",
          text:    "var(--accent-text)",
        },
        severity: {
          critical: "var(--severity-critical)",
          high:     "var(--severity-high)",
          medium:   "var(--severity-medium)",
          neutral:  "var(--severity-neutral)",
        },
        status: {
          done:    "var(--status-done)",
          draft:   "var(--status-draft)",
          waiting: "var(--status-waiting)",
          review:  "var(--status-review)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // DESIGN.md §3.2 scale
        "2xs":  ["10px", { lineHeight: "1.3" }],
        xs:     ["11px", { lineHeight: "1.4" }],
        sm:     ["12px", { lineHeight: "1.5" }],
        base:   ["13px", { lineHeight: "1.5" }],    // body default
        md:     ["14px", { lineHeight: "1.5" }],
        lg:     ["16px", { lineHeight: "1.4" }],
        xl:     ["20px", { lineHeight: "1.3" }],
        "2xl":  ["24px", { lineHeight: "1.2" }],
        hero:   ["56px", { lineHeight: "1.0", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        // zero by default; only drawer/modal use these
        drawer: "0 2px 8px rgba(0,0,0,0.04)",
        modal:  "0 8px 24px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
```

### 5.3 数字铁律（tabular-nums）

所有金额、天数、EIN、日期、规则 ID 必须用 `font-mono` + `tabular-nums`：

```tsx
// utils/num.ts
export const moneyClass = "font-mono tabular-nums";

// usage
<span className={cn(moneyClass, "text-hero font-bold text-text-primary")}>
  ${summary.totalDollars.toLocaleString()}
</span>
```

### 5.4 密度切换

三档：`compact` 32px / `comfortable` 36px（默认） / `spacious` 40px。

```tsx
// providers/density.tsx
<DensityProvider initial={user.preferences.density}>
  <html data-density={density} className={themeMode === "dark" ? "dark" : ""}>...
```

Tailwind variant（在 `tailwind.config.ts` 的 `plugins` 里注册）：

```css
/* globals.css */
html[data-density="compact"]    { --row-height: 32px; }
html[data-density="comfortable"]{ --row-height: 36px; }
html[data-density="spacious"]   { --row-height: 40px; }
```

组件用 `h-[var(--row-height)]` 读取。

### 5.5 暗色模式

- `next-themes` 管理 `class="dark"` 切换
- 默认 `system`（跟随 OS），Settings 可强制切换
- 快捷键 `⇧⌘D`（全局注册在 `KeyboardRegistry`）
- 两套主题共用组件，仅 CSS 变量不同；**零 duplicate 组件代码**

---

## 6. 关键交互模式

| 模式 | 实现 |
|---|---|
| **状态切换零 modal** | `DropdownMenu` + optimistic update + 500ms Undo toast |
| **快捷键全覆盖** | `react-hotkeys-hook` + 中心化 `KeyboardRegistry` + `?` 面板 |
| **Cmd-K 三合一** | 单一 `CommandPalette` 组件，三 tab（Search / Ask / Navigate） |
| **Evidence Mode** | 全局 Zustand `evidenceTarget`，Drawer 组件监听 `E` 键 |
| **Skeleton > Spinner** | `<Suspense fallback={<TriageSkeleton />}>` 替代 spinner |
| **Toast + Undo** | `sonner` + Server Action `undoHandler` |
| **Copy as citation block** | `navigator.clipboard.writeText(formatCitation(...))` + audit log |

---

## 7. 表格（Workboard）

```tsx
"use client";
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";

export function WorkboardTable({ initialData }: { initialData: Obligation[] }) {
  const [filters] = useWorkboardFilters();
  const { data, isLoading } = useQuery({
    queryKey: ["workboard", filters],
    queryFn: () => fetchWorkboard(filters),
    initialData: filters.page === 1 ? initialData : undefined,
    placeholderData: keepPreviousData,
  });

  const table = useReactTable({
    data: data?.rows ?? [],
    columns: workboardColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <VirtualizedTable table={table} estimatedRowHeight={44} />
  );
}
```

- 虚拟化：`@tanstack/react-virtual`
- 服务端分页 + 排序（URL state 驱动）
- 行内 status dropdown 用 `<DropdownMenu>` + Server Action
- 批量操作：顶部 `BulkActionBar`，checkbox column 由 TanStack Table 原生支持

---

## 8. 表单 + Server Actions

```typescript
// app/(app)/[firmSlug]/clients/new/page.tsx
"use client";
import { useFormState } from "react-dom";
import { createClient } from "./actions";

export default function NewClientPage() {
  const [state, formAction] = useFormState(createClient, initial);
  const form = useForm<ClientInput>({ resolver: zodResolver(ClientSchema) });
  return (
    <form action={formAction}>...</form>
  );
}
```

```typescript
// app/(app)/[firmSlug]/clients/new/actions.ts
"use server";
export async function createClient(prev: any, formData: FormData) {
  const session = await requireSession();
  return withRbac(["owner","manager","preparer"], session, async () => {
    const input = ClientSchema.parse(Object.fromEntries(formData));
    const client = await clientsService.create(session.firmId, session.userId, input);
    revalidatePath(`/${session.firmSlug}/clients`);
    return { ok: true, clientId: client.id };
  });
}
```

**共享 Zod schema 前后端：**

```typescript
// lib/schemas/client.ts
export const ClientSchema = z.object({
  name: z.string().min(1),
  ein: z.string().regex(/^\d{2}-\d{7}$/).optional(),
  entityType: entityTypeEnum,
  state: z.string().length(2),
  county: z.string().optional(),
  ...
});
```

前端 `useForm({ resolver: zodResolver(ClientSchema) })`；后端 `ClientSchema.parse(...)`。

---

## 9. PWA 实现

### 9.1 Manifest

```typescript
// app/manifest.ts
import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DueDateHQ",
    short_name: "DueDateHQ",
    description: "Glass-box deadline intelligence for US CPAs",
    start_url: "/",
    display: "standalone",
    // DESIGN.md §2.2 · light mode primary surfaces
    background_color: "#FFFFFF",
    theme_color: "#0A2540",    // Stripe deep navy
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

### 9.2 Service Worker（Workbox）

```javascript
// public/sw.js（构建时由 Workbox CLI 生成）
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, NetworkFirst } from "workbox-strategies";

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/dashboard"),
  new NetworkFirst({ cacheName: "dashboard-cache", networkTimeoutSeconds: 3 })
);

self.addEventListener("push", async (event) => {
  const payload = event.data.json();
  const options = {
    body: payload.body,
    icon: "/icons/192.png",
    badge: "/icons/badge.png",
    tag: payload.tag,
    data: { url: payload.clickUrl },
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

### 9.3 Web Push 流程

```typescript
// modules/push/client.ts
export async function subscribeToPush() {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
  });
  await fetch("/api/push/subscribe", { method: "POST", body: JSON.stringify(sub) });
}
```

服务端：

```typescript
// app/api/push/subscribe/route.ts
export async function POST(req: NextRequest) {
  const session = await requireSession();
  const sub = await req.json();
  await db.insert(pushSubscriptions).values({
    userId: session.userId,
    firmId: session.firmId,
    endpoint: sub.endpoint,
    keysP256dh: sub.keys.p256dh,
    keysAuth: sub.keys.auth,
    platform: detectPlatform(req.headers.get("user-agent")),
    userAgentHash: hash(req.headers.get("user-agent")),
  }).onConflictDoUpdate({
    target: pushSubscriptions.endpoint,
    set: { lastUsedAt: new Date() },
  });
  return Response.json({ ok: true });
}
```

Push 触发：

```typescript
// modules/push/send.ts
import webpush from "web-push";
webpush.setVapidDetails(process.env.VAPID_SUBJECT!, PUB, PRIV);

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await db.select().from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), isNull(pushSubscriptions.revokedAt)));
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.keysP256dh, auth: s.keysAuth } }, JSON.stringify(payload));
      await markSuccess(s.id);
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) await revokeSubscription(s.id);
      else await markFailure(s.id);
    }
  }
}
```

**订阅许可的时机（UX）：** 不在首次登录弹权限；在 "首次查看 Pulse Banner" 或 Settings 里主动触发 → 转化率更高。

---

## 10. 无障碍（WCAG 2.2 AA）

- Radix UI 原语自带 ARIA
- `focus-visible` 样式全局统一
- 关键数字变更触发 `aria-live="polite"`
- 所有图标按钮必须 `aria-label`
- 颜色编码都配图标（色盲友好）

---

## 11. i18n / l10n

P0 仅 en-US；但 **所有用户可见字符串经 `t()` 函数**，避免将来硬改。

```typescript
// lib/i18n.ts
import { createIntl } from "@formatjs/intl";
const intl = createIntl({ locale: "en-US", messages: require("./messages/en-US.json") });
export const t = intl.formatMessage.bind(intl);
```

---

## 12. 性能优化清单

| 优化 | 手段 |
|---|---|
| 首屏 | RSC streaming + 关键数据并行 + `loading.tsx` skeleton |
| Bundle | `next/dynamic` 懒加载重模块（PDF / Migration wizard / Chart） |
| 图片 | `next/image` + 静态 rules 页预渲染 |
| 字体 | `next/font/google` + `display: swap` |
| API | ISR 对 `/rules` `/watch` `/pulse` 页（60s revalidate） |
| Data | TanStack Query `staleTime` 30s；Dashboard `revalidate: 15s` |
| Third-party | Sentry 延迟加载；PostHog `loaded: (cb) => defer` |

---

## 13. Storybook

每个 `components/primitives/*` 和 `components/patterns/*` 至少一个 story，用于：
- 视觉回归（Chromatic 或本地截图 diff）
- 暗黑 / 三档密度 的并排对比
- AI 内容占位符的 mock 数据

---

继续阅读：[06-Security-Compliance.md](./06-Security-Compliance.md)
