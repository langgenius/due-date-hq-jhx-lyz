import { Hono } from 'hono'
import { planHasFeature } from '@duedatehq/core/plan-entitlements'
import type { Env, ContextVars } from '../env'
import { signAuditPackageDownload } from './signed-url'

export const auditDownloadRoute = new Hono<{
  Bindings: Env
  Variables: ContextVars
}>().get('/packages/:id/download', async (c) => {
  const packageId = c.req.param('id')
  const expires = Number(c.req.query('expires') ?? '0')
  const signature = c.req.query('signature') ?? ''
  if (!Number.isFinite(expires) || expires < Date.now() || !signature) {
    return c.text('Download link expired.', 403)
  }
  const expected = await signAuditPackageDownload({
    secret: c.env.AUTH_SECRET,
    packageId,
    expiresAtMs: expires,
  })
  if (signature !== expected) return c.text('Invalid download signature.', 403)

  const userId = c.get('userId')
  const firmId = c.get('firmId')
  const tenant = c.get('tenantContext')
  const members = c.get('members')
  const scoped = c.get('scoped')
  if (!userId || !firmId || !tenant || !members || !scoped) return c.text('Unauthorized', 401)
  if (!planHasFeature(tenant.plan, 'auditExport')) return c.text('Forbidden', 403)
  const member = await members.findMembership(firmId, userId)
  if (!member || member.status !== 'active' || member.role !== 'owner') {
    return c.text('Forbidden', 403)
  }

  if (!scoped.audit.getEvidencePackage) {
    return c.text('Audit package repo methods are not available.', 500)
  }

  const pkg = await scoped.audit.getEvidencePackage(packageId)
  if (!pkg || pkg.status !== 'ready' || !pkg.r2Key) return c.text('Not found', 404)
  if (pkg.expiresAt && pkg.expiresAt.getTime() < Date.now()) return c.text('Package expired', 410)

  const object = await c.env.R2_AUDIT.get(pkg.r2Key)
  if (!object?.body) return c.text('Object not found', 404)
  await scoped.audit.write({
    actorId: userId,
    entityType: 'audit_evidence_package',
    entityId: packageId,
    action: 'export.audit_package.downloaded',
    after: { r2Key: pkg.r2Key },
  })
  return c.body(object.body, 200, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="duedatehq-audit-${packageId}.zip"`,
    'Cache-Control': 'private, no-store',
  })
})
