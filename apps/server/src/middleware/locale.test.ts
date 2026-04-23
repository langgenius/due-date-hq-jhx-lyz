import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { getRequestLocale } from '../i18n/resolve'
import { localeMiddleware } from './locale'

describe('localeMiddleware', () => {
  it('exposes the resolved locale to downstream handlers via AsyncLocalStorage', async () => {
    const app = new Hono()
    app.use('*', localeMiddleware)
    app.get('/echo', (c) => c.text(getRequestLocale()))

    const zh = await app.request('/echo', { headers: { 'x-locale': 'zh-CN' } })
    expect(await zh.text()).toBe('zh-CN')

    const en = await app.request('/echo')
    expect(await en.text()).toBe('en')
  })

  it('isolates locales across concurrent requests', async () => {
    const app = new Hono()
    app.use('*', localeMiddleware)
    app.get('/echo', async (c) => {
      // Yield to the scheduler so a parallel request runs in between; the
      // AsyncLocalStorage binding must stick to this request's frame.
      await new Promise((resolve) => setTimeout(resolve, 0))
      return c.text(getRequestLocale())
    })

    const [a, b] = await Promise.all([
      app.request('/echo', { headers: { 'x-locale': 'zh-CN' } }),
      app.request('/echo', { headers: { 'x-locale': 'en' } }),
    ])

    expect(await a.text()).toBe('zh-CN')
    expect(await b.text()).toBe('en')
  })
})
