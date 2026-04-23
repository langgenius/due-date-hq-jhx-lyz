// Minimal ambient declaration for `node:async_hooks` under Cloudflare Workers
// nodejs_compat (see wrangler.toml). The Worker runtime exposes
// AsyncLocalStorage but @cloudflare/workers-types does not declare it.
declare module 'node:async_hooks' {
  export class AsyncLocalStorage<T> {
    getStore(): T | undefined
    run<R>(store: T, callback: () => R): R
    run<R, TArgs extends unknown[]>(store: T, callback: (...args: TArgs) => R, ...args: TArgs): R
    enterWith(store: T): void
    disable(): void
  }
}
