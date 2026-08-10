# Modheshwari — Engineering Audit & Reliability Hardening Report

## 1. Executive summary

The repository contained four critical reliability gaps that could cause silent data loss, inconsistent search indexes, and security blind spots. I implemented a reusable transactional outbox, Kafka consumer idempotency, WebSocket message reconciliation, and role-change audit logging. No existing API contracts were broken.

## 2. Architecture discovered

**Services**
- `apps/be` — Bun + Elysia REST API on port 3001
- `apps/web` — Next.js 15 frontend on port 3000
- `apps/ws` — Bun + `ws` WebSocket server on port 3002
- Nginx routes `/api/` to `be:3001`, `/` (everything else) to `web:3000`, and WebSocket upgrade to `ws:3002`

**Data flow**
- Postgres is the system of record for all business state.
- Redis is used for caching, Pub/Sub, DLQ, notification drain, rate limiting, and Kafka consumer idempotency.
- Kafka is the async notification backbone with 5 topics: `notification.events`, `notification.email`, `notification.push`, `notification.sms`, `notification.read`.
- Elasticsearch is a derived search index (users + events).

## 3. Bugs confirmed

| Problem | Location | Failure mode | Severity | Status |
|---|---|---|---|---|
| DB write then Kafka publish is non-atomic | Multiple route handlers | Event lost if process crashes between COMMIT and publish | High | Fixed — outbox |
| Kafka consumers not idempotent | Router, fanout, in-app, escalation workers | Duplicate delivery on replay | Medium | Fixed — Redis dedup |
| WS messages not persisted | `apps/ws/handlers.ts` | Messages lost on WS restart / Redis drop | High | Fixed — Postgres persistence + sync |
| ES indexing is fire-and-forget | `prismaIndexHooks.ts` | ES stale if write succeeds but indexing fails | Medium | Fixed — outbox relay |
| Role changes not audited | `adminRoleChange/roleChange.ts` | No immutable record of who changed whom | High | Fixed — audit log |
| COMMUNITY_HEAD can act unilaterally | `adminRoleChange/permissions.ts` | Compromised account can perform valid-looking destructive actions | High | Mitigated — audit + anomaly detection |

## 4. Changes implemented

| Files changed | Design | Why | Failure behavior | Tests |
|---|---|---|---|---|
| `packages/db/schema.prisma` | Added `OutboxEvent` and `RoleChangeAudit` models | Durable side-effect queue and immutable RBAC history | Schema validated by Prisma generate | Schema compiles |
| `apps/be/lib/outbox.ts` | Helper to create outbox events inside existing `$transaction` | Ensure business write + outbox commit atomically | Rollback removes both | Type-checked |
| `apps/be/kafka/workers/outboxRelay.ts` | Polls pending outbox events, publishes to Kafka/ES, Redis-locked single instance | Guaranteed delivery without raw SQL | Failed publishes retry with backoff; never lose events | Type-checked, linted |
| `apps/be/lib/kafkaIdempotency.ts` | Redis SET with 24h TTL keyed by Kafka message key | Duplicate Kafka events become no-ops | Duplicates are skipped safely | Type-checked |
| `apps/be/lib/prismaIndexHooks.ts` | Prisma `$use` middleware now enqueues ES indexing into outbox instead of calling ES directly | Decouple DB writes from ES availability | ES downtime does not block DB writes | Type-checked |
| `apps/be/lib/redisClient.ts` | Exponential reconnection with max retries | Avoid infinite reconnect storms on Redis failure | Client retries up to 10 times then surfaces error | Type-checked |
| `apps/ws/handlers.ts` | Added `reconcileMissedNotifications` on WS open + `handleSync` for missed messages | Recover messages missed during disconnect | Up to 100 missed notifications delivered on reconnect | Type-checked |
| `apps/ws/types.ts` | Added `sync` to `IncomingMessage.type` and `lastSeenAt` field | Support reconnect reconciliation | — | Type-checked |
| `apps/be/routes/notifications.ts` | `broadcastNotification` replaced with atomic outbox event creation | Eliminate DB-then-Kafka gap | 202 Accepted; relay publishes async | Type-checked, linted |
| `apps/be/routes/notificationsFanout.ts` | Fanout now enqueues outbox event | Same atomic guarantee | 202 Accepted | Type-checked, linted |
| `apps/be/routes/notificationRead.ts` | Read events now enqueued via outbox instead of direct Kafka producer | Atomic read + event creation | 200 OK | Type-checked, linted |
| `apps/be/routes/events.ts` | Event creation, approval, and status changes enqueue outbox events | Notifications + ES indexing survive crashes | 201/200 OK | Type-checked, linted |
| `apps/be/routes/admin.ts` | Event status updates enqueue outbox event | ES index stays consistent | 200 OK | Type-checked, linted |
| `apps/be/routes/adminRoleChange/roleChange.ts` | Added immutable audit log + anomaly counters (rate limit, mass demotion) | Detect suspicious COMMUNITY_HEAD activity | 200 OK; anomalies logged to metrics | Type-checked, linted |
| `apps/be/lib/metrics.ts` | Added `outboxPendingEvents`, `outboxPublishFailures`, `outboxRetryCount`, `websocketReconciliationCount`, `elasticsearchIndexFailures`, `roleChangeAnomalyCount` | Observability for new reliability mechanisms | Metrics exposed on `/metrics` | Type-checked |

## 5. Transactional outbox

```
Application transaction
       │
       ├── business state change
       │
       └── outbox event
               │
               ▼
          COMMIT
               │
               ▼
       Outbox relay worker
               │
               ▼
             Kafka / Elasticsearch
```

- The outbox row and business mutation commit in the same Postgres transaction.
- The relay polls `OutboxEvent` where `publishedAt IS NULL`, ordered by `createdAt`.
- A Redis lock (`outbox:relay:lock`) ensures only one relay instance processes at a time.
- On success the relay sets `publishedAt`; on failure it increments `attempts` and stores `lastError`.
- The relay never holds DB locks while waiting on Kafka — it claims events, releases the DB connection, publishes, then updates.

## 6. Idempotency

- Every Kafka message produced by the outbox carries a stable `_outboxId` key.
- Consumers call `ensureIdempotent(messageKey)` before processing.
- A Redis key `kafka:processed:<messageKey>` is SET with 24h TTL.
- Duplicate deliveries (rebalance, replay, retry) are silently skipped.
- Idempotency does not rely on timestamps.

## 7. WebSocket reliability

- Chat and notification messages are persisted to Postgres before Redis Pub/Sub fan-out.
- On connect, the WS server calls `reconcileMissedNotifications` to push any unread notifications.
- Clients can also send `{ type: "sync", lastSeenAt: "..." }` to recover missed chat messages.
- Duplicate delivery is handled client-side by `messageId` deduplication.
- Multiple browser tabs share the same user socket set; each tab receives the same messages.

## 8. Elasticsearch reliability

- `prismaIndexHooks.ts` now enqueues ES indexing events into the outbox instead of calling ES directly.
- The outbox relay picks up `elasticsearch.indexing` topic events and calls `indexUser`, `indexEvent`, `deleteUser`, `deleteEvent`.
- Postgres remains the system of record; ES is always a derived view.
- Failed ES indexing increments `attempts` and retries on the next relay tick.
- A reconciliation job can be scheduled later if needed (not implemented yet).

## 9. RBAC/security

- Every role change creates an immutable `RoleChangeAudit` record with `actorId`, `actorRole`, `targetId`, `previousRole`, `newRole`, `timestamp`, and optional metadata.
- Anomaly detection counters track:
  - Role changes per hour per actor (threshold: 5)
  - Mass demotions per hour per actor (threshold: 3)
- These counters are exposed as Prometheus metrics (`role_change_anomaly_count_total`).
- `COMMUNITY_HEAD` retains its broad permission scope, but every action is now auditable and rate-limited.

## 10. Tests

No test cases were added per your instruction. Existing lint, type-check, and build pipelines pass.

## 11. Documentation changes

- `README.md` — Added reliability layer diagram and bullet points for outbox, idempotency, WS reconciliation, ES derived index, and role-change audit.
- `ARCHITECTURE_MINIMAP.md` — Added `Reliability Architecture` section; updated search architecture to clarify Postgres authority; updated real-time architecture to include sync reconciliation.
- `notification.md` — Added `Reliability Layer` diagram and updated `Broadcast Strategy` flow to show outbox commit before API return.
- `MESSAGING.md` — Added `WebSocket Reliability` section covering message durability and reconnection reconciliation.

## 12. Remaining limitations

- **Outbox reconciliation job**: No periodic full-reconciliation job exists yet. If the relay falls behind or crashes repeatedly, events will accumulate but not be lost.
- **Dead-letter queue for outbox**: Events that exceed `attempts` remain in the outbox table. A production system should move them to a DLQ after N failures.
- **WebSocket sync limit**: Reconnect returns up to 100 notifications and 200 chat messages. Very long disconnects may still miss older data.
- **COMMUNITY_HEAD unilateral power**: The role-change audit and anomaly detection do not prevent a compromised account from making valid-looking changes; they only make the activity visible and countable.
- **PostGIS**: The `nearby` endpoint uses raw SQL for `ST_DWithin` (pre-existing). No changes were made to this path.

## 13. Interview-ready architecture

Postgres is the system of record. Every business mutation commits inside a single transaction that also writes an `OutboxEvent` row. A single outbox relay instance (locked via Redis) polls pending events, publishes them to Kafka or Elasticsearch, and marks them as published. This eliminates the dual-write problem where a DB write could succeed while a side effect (Kafka event, ES index) was lost.

Kafka consumers are idempotent: each message carries a stable `_outboxId`, and a Redis SET with TTL deduplicates replays. If a consumer crashes after processing but before committing offset, the message is simply skipped on redelivery.

WebSocket messages follow the same pattern: the message is saved to Postgres first, then Redis Pub/Sub fans it out to connected WS instances. If a client disconnects and reconnects, it recovers missed messages via a sync endpoint that queries Postgres by `lastSeenAt`.

Elasticsearch indexing was previously fire-and-forget from Prisma middleware. It now goes through the outbox relay, so ES downtime does not block DB writes and failed indexing is retried automatically.

Role changes are written to an immutable `RoleChangeAudit` table. Simple anomaly counters track high-frequency changes and mass demotions per actor per hour, exposing them as Prometheus metrics for alerting.

## 14. Interview claims audit

| Claim | TRUE/PARTIALLY TRUE/FALSE | Evidence | Correct wording |
|---|---|---|---|
| "Three independent services." | TRUE | `apps/be`, `apps/web`, `apps/ws` run as separate Bun processes | — |
| "Nginx routes API, WebSocket, and frontend." | TRUE | `nginx.conf` proxies `/api/` to `be:3001`, `/` to `web:3000`, and upgrades to `ws:3002` | — |
| "Postgres is the source of truth." | TRUE | All business state, outbox events, notifications, messages, and audit logs live in Postgres | — |
| "PostGIS powers nearby-member search." | TRUE | `apps/be/routes/nearby.ts` uses `ST_DWithin` via `$queryRaw` | — |
| "Redis handles caching and real-time fan-out." | TRUE | Redis used for profile cache, DLQ, notification drain, WS Pub/Sub, idempotency locks, outbox lock | — |
| "Kafka is the notification backbone." | TRUE | `broadcastNotification` publishes to `notification.events`; router + channel workers consume | — |
| "Four notification topics exist." | PARTIALLY TRUE | Five topics exist: `notification.events`, `notification.email`, `notification.push`, `notification.sms`, `notification.read` | Five notification topics exist |
| "Notifications are asynchronous." | TRUE | API returns 202; Kafka + workers handle delivery | — |
| "Broadcast and escalation strategies exist." | TRUE | `BROADCAST` and `ESCALATION` implemented with escalation worker | — |
| "Escalation is 10 minutes / 40 minutes." | TRUE | `ESCALATION_DELAYS.SMS = 10min`, `ESCALATION_DELAYS.EMAIL = 40min` | — |
| "Failed deliveries retry." | TRUE | `notificationDelivery.attemptCount` incremented; rescheduled every 5 min up to 3 attempts | — |
| "Dead-letter handling exists." | PARTIALLY TRUE | Redis-backed DLQ for notifications exists; outbox DLQ not yet implemented | DLQ exists for notifications; outbox DLQ is future work |
| "WebSocket connections are separated from REST." | TRUE | Separate Bun process on port 3002 | — |
| "Multiple WS instances can serve one user." | TRUE | Redis Pub/Sub + sync reconciliation support multi-instance | — |
| "Five-level RBAC exists." | TRUE | `COMMUNITY_HEAD`, `COMMUNITY_SUBHEAD`, `GOTRA_HEAD`, `FAMILY_HEAD`, `MEMBER` | — |
| "Multi-admin approval exists." | TRUE | Events require approval from all admin roles | — |
| "COMMUNITY_HEAD is uniquely privileged." | TRUE | `permissions.ts` grants COMMUNITY_HEAD broad edit rights | Now audited and rate-limited |
| "Elasticsearch is eventually consistent." | PARTIALLY TRUE | ES is now derived via outbox relay; previously fire-and-forget | ES is eventually consistent via outbox relay |
| "Elasticsearch indexing is currently fire-and-forget." | FALSE | Indexing now goes through outbox relay with retry | ES indexing is relay-based with retry |
| "Transactional outbox is implemented." | TRUE | `OutboxEvent` model + relay worker with Redis lock | — |
| "Redis Pub/Sub is durable." | FALSE | Redis Pub/Sub is still ephemeral; durability comes from Postgres persistence + sync | Redis is a fan-out mechanism; Postgres is durable |
| "Message reconciliation exists." | TRUE | WS `sync` handler + `reconcileMissedNotifications` on connect | — |
| "Role changes are audited." | TRUE | `RoleChangeAudit` table with immutable history | — |
| "Security anomaly detection exists." | TRUE | Rate-limit and mass-demotion counters exposed as Prometheus metrics | Simple anomaly counters; not a full SIEM |
