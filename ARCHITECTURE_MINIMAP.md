# Modheshwari — Architecture Mindmap

### 1. Three-Service Architecture

- **be** (Elysia + Bun): REST API, all business logic, Prisma ORM
- **web** (Next.js 15): SSR/CSR React frontend, API routes for OpenAPI/AsyncAPI docs
- **ws** (Bun + ws): Real-time WebSocket server for chat + notifications

### 2. Event-Driven Notification Pipeline

```
API Handler → Outbox Event (atomic with DB write)
  → Outbox Relay → Kafka (notification.events) → Router Worker
    → Per-channel topics (email, push, SMS) → Channel Workers
```

### 3. Outbox-Based Side Effects

```
Postgres Transaction
  ├── business state change
  └── outbox event
       ↓
  COMMIT
       ↓
Outbox Relay (single instance, Redis-locked)
  ├── Kafka (notifications, escalations)
  ├── Elasticsearch (derived index updates)
  ├── Retry with backoff on failure
  └── Dead-letter queue after max attempts (OutboxEventDeadLetter)
```

### 3a. WebSocket Message Durability and Sync

- Messages are persisted to Postgres before Redis Pub/Sub fan-out
- On connect, server pushes unread notifications (up to 500)
- Client can send `sync` with `lastSeenAt`, `limit` (default 200, max 500), and `cursor` for paginated missed message recovery
- Response includes `hasMore` and `nextCursor` for client-side pagination
- Duplicate delivery handled by client-side `messageId` deduplication

### 3b. Elasticsearch Reconciliation

- A periodic worker (`esReconciliation`) runs every `ES_RECONCILIATION_INTERVAL_MS` (default 1 hour)
- Re-indexes users and events updated since the last run
- Repairs ES drift caused by downtime or missed relay events
- Does not replace the relay; complements it with periodic full-reconciliation

### 4. Multi-Level Approval Workflow

```
Creator submits → All admins get notification → Each admin approves/rejects
  → If all approve → status = APPROVED
  → If any reject → status = REJECTED
  → If changes requested → status = CHANGES_REQUESTED
```

### 4. Role-Based Access Control

- `requireAuth(req, allowedRoles?)` gate on every protected route
- `checkRoleChangePermission()` for admin role transfers
- Permission matrix: COMMUNITY_HEAD > COMMUNITY_SUBHEAD > GOTRA_HEAD > FAMILY_HEAD > MEMBER

### 5. Notification Delivery with Escalation

- **BROADCAST**: All enabled channels fire immediately
- **ESCALATION**: In-app first; if unread after 10min → SMS; if unread after 40min → email
- **DLQ**: Failed deliveries retry with exponential backoff (max 5 attempts)
- **Read cancellation**: When user reads notification, pending escalations are cancelled via Kafka `notification.read` topic
