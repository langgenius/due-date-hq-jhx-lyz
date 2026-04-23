# Auth gate 下沉到 React Router loader，顺带干掉 sign-out 闪烁

日期：2026-04-23 · 相关 commit：`0c813b3`

## 背景

用户反馈点击 Sign out 时页面会闪一下。定位后发现 `apps/web/src/routes/_layout.tsx` 里有两个问题叠加：

1. **认证 gate 写在组件渲染里**：`RootLayout` 通过 `useSession()` + `<Navigate>` 做保护。
2. **Sign-out 时双重导航**：`handleSignOut` 在 `await signOut()` 之后又 `startTransition(() => navigate('/login', { replace: true }))`。

闪烁时序：

1. `signOut()` resolve → better-auth 的 session store 清空 → `useSession()` 返回 `data: null`。
2. `RootLayout` re-render，命中 `if (!data)` 分支，渲染出 `<Navigate to="/login?redirectTo=<当前路径>" replace />`。URL 切到带 `redirectTo` 的登录页，`LoginRoute` 渲染一帧。
3. `startTransition` 里的 `navigate('/login', { replace: true })` 随后执行，URL 再换成不带 `redirectTo` 的 `/login`，`LoginRoute` 重新渲染。

两次连续的 commit、中间还夹着一次受保护 layout 卸载，视觉上就是"登录页闪一下又变了一下"。

另外，`docs/Dev File/05-Frontend-Architecture.md §14` 本来就有一条 TODO：

> 接入 auth 时：登录态检查必须放在 app layout route 的 `loader` 或统一组件 gate 中，不要散落在各页面组件里。

当前实现走的是"组件 gate"，此次顺便迁到 loader gate 把它闭环。

## 做了什么

改动文件：

- `apps/web/src/router.tsx`
- `apps/web/src/routes/_layout.tsx`
- `apps/web/src/routes/login.tsx`
- `docs/Dev File/05-Frontend-Architecture.md`（标记 §14 TODO 完成）

关键设计：

1. **两个顶级路由组 + 两个 loader**：
   - `/login` 挂 `guestLoader`：session 命中则 `throw redirect(redirectTo || '/')`；`redirectTo` 只接受以 `/` 开头的 in-app 路径（防 open redirect）。
   - `/` 挂 `protectedLoader`（路由 id = `protected`）：session 未命中则 `throw redirect('/login?redirectTo=<当前 pathname+search>')`；命中返回 `{ user }`。
2. **`shouldRevalidate`**：同 pathname 内的子路由切换跳过 session 重取；form 提交走默认。避免在 `/` ↔ `/workboard` ↔ `/settings` 之间来回点时每次打 `/api/auth/get-session`。
3. **`HydrateFallback: ShellSkeleton`**：初次 loader 期间 RR 自动渲染骨架屏，取代原来组件里的 `if (isPending) return <ShellSkeleton />`。
4. **受保护组件不再订阅 `useSession`**：`RootLayout` 用 `useLoaderData<{ user }>()` 直接拿 user。这样 sign-out 清 better-auth store 时没有任何组件会因此 re-render。
5. **Sign-out 改用 `useTransition` async action**：

   ```tsx
   const [isSigningOut, startSignOut] = useTransition()

   function handleSignOut() {
     if (isSigningOut) return
     startSignOut(async () => {
       try {
         await signOut()
         await navigate('/login', { replace: true })
       } catch (err) {
         toast.error('Sign out failed', { description: ... })
       }
     })
   }
   ```

   `isPending` 由 React 管，catch 漏写也不会卡死按钮。

6. **登录页去掉 `useSession` + `<Navigate>`**：已登录回跳由 `guestLoader` 负责，组件只管未登录状态。

## 为什么这样做

参考：

- `.claude/skills/react-router-data-mode/references/data-loading.md`：loader `throw redirect` 是官方推荐的权限跳转模式。
- `.claude/skills/vercel-react-best-practices`：
  - `rendering-usetransition-loading` → 用 `useTransition` 替掉手写的 `useState(isSigningOut)` + manual reset。
  - `rerender-transitions` → navigate 这类非紧急更新进 transition，避免与其它状态抢 commit。
  - `rerender-defer-reads` / `rerender-derived-state` → 登录页之前用 `useSession` 只是为了 early-return，标准做法是不订阅它。

放弃的备选：

- **硬刷新 `window.location.assign('/login')`**：简单但会丢掉 React/RR 的所有内存状态（TanStack Query 缓存、Zustand、未来可能加的 app shell 持久态），Phase 1 之后多半会后悔。
- **`/logout` action route + `useFetcher.Form`**：形式上最"RR 味"，但 DropdownMenuItem 嵌 form 有点绕。我们只是想"清状态 + 跳页"，不需要 revalidation 机制，直接 `await signOut()` + `await navigate()` 已经够用。Loader gate 把闪烁根因（useSession 订阅触发 re-render）拆掉后，action 模式就不是必需的了。
- **保留组件 gate，仅修闪烁**：能做到，但 `docs/Dev File/05-Frontend-Architecture.md §14` 的 TODO 还是留着，而且组件 gate 跟"RR7 data mode"的路由分层心智不一致。

## 验证

```
pnpm check:fix             # format + lint + type-check all green
pnpm --filter @duedatehq/web exec vp test --run   # 既有单测全绿
```

手工验证路径（需本地跑 `apps/server` + `apps/web`）：

- 未登录访问 `/`、`/workboard`、`/settings` → 自动跳 `/login?redirectTo=<路径>`
- 未登录访问 `/` → 跳 `/login`（不带 `redirectTo`）
- `/login` 输错 `?redirectTo=https://evil.com` → 被 fallback 为 `/`
- 已登录访问 `/login` → 直接跳回 `redirectTo` 或 `/`
- 从任意受保护页面点 Sign out → 按钮变 "Signing out…"，单次跳转到 `/login`，无闪烁
- 初次加载 `/`（冷启动）→ 显示 `ShellSkeleton`，而不是白屏

## 后续 / 未闭环

- `apps/web/src/lib/auth.ts` 仍然 export 了 `useSession`。当前没人用，但保留供未来"session 过期 toast""实时登录状态"之类的功能。如果后续一直没用到，可以收紧 export 面。
- `docs/Dev File/05-Frontend-Architecture.md §1` 的目录树仍保留了 `_app.*` 前缀的目标形态；Phase 0 实际代码是扁平的，已在该章节加了备注。等 Phase 0 → Phase 1 路由扩张时再决定是否实际采用 `_app.*` 约定，还是沿用扁平风格。
- `RootLayout` 里还有 `PendingBar` 组件通过 `useNavigation()` 渲染顶部进度条。路由切换时会短暂显示，这是好事（配合 `HydrateFallback` 覆盖了全部加载态），先保留。
- `apps/web/src/main.tsx` 里的 `QueryClient` 目前没跟 router loader 联动。未来如果 loader 需要读 TanStack Query 缓存，参考官方 `dehydrate` / `queryClient.ensureQueryData` 模式，再建议从一个共享 `queryClient` 导出。
