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
  └── Retry with backoff on failure
```

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
