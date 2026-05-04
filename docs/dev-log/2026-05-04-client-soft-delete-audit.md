# 2026-05-04 — Client soft delete audit

Added an audited client deletion path:

- Exposed `clients.delete` in contracts and server router.
- Server handler enforces `client.write`, soft-deletes the tenant-scoped client row, and writes
  `client.deleted` with a before snapshot plus deletion timestamp.
- Clients UI now shows a destructive confirmation in the fact profile drawer and invalidates
  Clients, Dashboard, and Obligations reads after deletion.
- Dashboard and Obligations read models now exclude soft-deleted clients so related obligation rows do
  not remain visible in active operational views.
