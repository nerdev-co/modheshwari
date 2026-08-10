# Modheshwari — Architecture Mindmap

```
modheshwari/
│
├── MONOREPO (Turborepo + Bun workspaces)
│   ├── package.json (root)
│   ├── turbo.json
│   ├── tsconfig.json
│   └── bun.lock
│
├── APPS
│   │
│   ├── apps/be (Backend API — Elysia + Bun, port 3001)
│   │   │
│   │   ├── index.ts (entry point)
│   │   │   ├── Loads .env, registers Prisma hooks
│   │   │   ├── Starts Bun HTTP server with router
│   │   │   ├── Starts notification drain worker
│   │   │   └── Starts DLQ retry worker
│   │   │
│   │   ├── server/
│   │   │   ├── router.ts (main request router)
│   │   │   │   ├── CORS handling (handleCors, withCorsHeaders)
│   │   │   │   ├── Rate limiting (100 req/min per IP)
│   │   │   │   ├── Auth routes (signup/login)
│   │   │   │   ├── Static routes (fixed-path API)
│   │   │   │   ├── Parameterized routes (dynamic :id)
│   │   │   │   └── 404 fallback
│   │   │   ├── handlers.ts (re-exports all route handlers)
│   │   │   ├── authRoutes.ts (signup/login endpoints)
│   │   │   ├── staticRoutes.ts (fixed-path API routes)
│   │   │   ├── parameterizedRoutes.ts (dynamic routes with match)
│   │   │   └── types.ts (Route interface)
│   │   │
│   │   ├── routes/ (all API route handlers)
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── fh.ts (Family Head login/signup)
│   │   │   │   ├── fm.ts (Family Member login/signup)
│   │   │   │   └── admin.ts (Community Head/Subhead/Gotra Head login/signup)
│   │   │   │
│   │   │   ├── authMiddleware.ts
│   │   │   │   ├── authMiddleware() — validates JWT, attaches user to store
│   │   │   │   ├── getAuthPayload() — extracts & verifies JWT
│   │   │   │   └── requireAuth(req, allowedRoles?) — role-based auth gate
│   │   │   │
│   │   │   ├── me.ts (profile get/update)
│   │   │   ├── nearby.ts (PostGIS ST_DWithin spatial query)
│   │   │   ├── search.ts (structured query parser + ES fallback)
│   │   │   ├── chat.ts (chat history)
│   │   │   ├── families.ts (CRUD, invites, join)
│   │   │   ├── familyMembers.ts (list members)
│   │   │   ├── familyTransfer.ts (transfer membership)
│   │   │   ├── familyTree/ (hierarchical tree module)
│   │   │   │   ├── index.ts (re-exports)
│   │   │   │   ├── handlers.ts (get/create/delete relationships)
│   │   │   │   ├── builders.ts (ancestor/descendant/full tree)
│   │   │   │   ├── graph.ts (graph data conversion)
│   │   │   │   ├── types.ts (TreeNode, TreeView, etc.)
│   │   │   │   └── utils.ts (reciprocal types)
│   │   │   │
│   │   │   ├── events.ts (event CRUD + approval + registration)
│   │   │   │   ├── handleCreateEvent — multi-level approval (all admins)
│   │   │   │   ├── handleListEvents — list with pagination
│   │   │   │   ├── handleGetEvent — single event
│   │   │   │   ├── handleRegisterForEvent — register user
│   │   │   │   ├── handleUnregisterFromEvent — cancel registration
│   │   │   │   ├── handleGetEventRegistrations — list registrants
│   │   │   │   └── handleApproveEvent — approve/reject (collective decision)
│   │   │   │
│   │   │   ├── resourceReq.ts (resource request CRUD + approval)
│   │   │   │   ├── handleCreateResourceRequest
│   │   │   │   ├── handleListResourceRequests
│   │   │   │   ├── handleGetResourceRequest
│   │   │   │   └── handleReviewResourceRequest (multi-level approval)
│   │   │   │
│   │   │   ├── statusUpdate.ts (status update requests + approval)
│   │   │   │   ├── handleCreateStatusUpdateRequest
│   │   │   │   ├── handleListStatusUpdateRequests
│   │   │   │   └── handleReviewStatusUpdateRequest
│   │   │   │
│   │   │   ├── notifications.ts (create/list)
│   │   │   ├── notificationRead.ts (mark read, batch read, delivery status)
│   │   │   ├── notificationsFanout.ts (broadcast notifications)
│   │   │   ├── medical.ts (update medical, search by blood group)
│   │   │   ├── medicalRecords.ts (CRUD with role-based permissions)
│   │   │   ├── messages/ (messaging module)
│   │   │   │   ├── index.ts (re-exports)
│   │   │   │   ├── auth.ts (getUserIdFromRequest)
│   │   │   │   ├── conversations.ts (list/create)
│   │   │   │   ├── handlers.ts (get messages, send, mark read)
│   │   │   │   └── search.ts (search users for chat)
│   │   │   │
│   │   │   ├── admin.ts (list all requests, update event status)
│   │   │   └── adminRoleChange/ (role management module)
│   │   │       ├── index.ts (re-exports)
│   │   │       ├── constants.ts (ADMIN_ROLES, VALID_ROLES)
│   │   │       ├── permissions.ts (checkRoleChangePermission)
│   │   │       │   ├── COMMUNITY_HEAD: edit SUBHEAD, GOTRA_HEAD, FAMILY_HEAD, MEMBER
│   │   │       │   ├── COMMUNITY_SUBHEAD: edit any with 3+ approvals
│   │   │       │   ├── GOTRA_HEAD: cannot change admin roles
│   │   │       │   └── Others: no permission
│   │   │       ├── roleChange.ts (handleChangeUserRole)
│   │   │       ├── rolePermissions.ts (handleGetRoleChangePermissions)
│   │   │       └── userManagement.ts (handleListUsers, handleGetUserDetails)
│   │   │
│   │   ├── kafka/ (Kafka producers, consumers, workers)
│   │   │   ├── config.ts (Kafka client, producer, consumer factory, TOPICS)
│   │   │   │   └── TOPICS: notification.events, notification.email, notification.push, notification.sms
│   │   │   ├── producer.ts (basic producer example)
│   │   │   ├── consumer.ts (basic consumer example)
│   │   │   ├── fanoutProducer.ts (publishFanout for bulk notifications)
│   │   │   ├── notificationProducer.ts (broadcastNotification, publishToChannel)
│   │   │   ├── index.ts (demo producer/consumer)
│   │   │   └── workers/
│   │   │       ├── router.ts (notification router consumer)
│   │   │       │   ├── Routes to IN_APP, EMAIL, PUSH, SMS channels
│   │   │       │   ├── BROADCAST strategy: all channels immediately
│   │   │       │   └── ESCALATION strategy: in-app first, then SMS/email after delay
│   │   │       ├── email.ts (SMTP email consumer with retry)
│   │   │       ├── push.ts (FCM push notification consumer)
│   │   │       ├── sms.ts (Twilio SMS consumer)
│   │   │       ├── inAppWorker.ts (publishes to Redis for WS delivery)
│   │   │       ├── fanoutWorker.ts (processes fanout messages → DB + Redis)
│   │   │       ├── fanoutConsumer.ts (consumes fanout events)
│   │   │       ├── escalation.ts (scheduled escalation: in-app → SMS → email)
│   │   │       ├── notificationDrain.ts (Redis → DB persistence drain)
│   │   │       └── notificationDLQ.ts (dead-letter queue retry with exponential backoff)
│   │   │
│   │   ├── lib/ (infrastructure libraries)
│   │   │   ├── elastic.ts (Elasticsearch client)
│   │   │   ├── elasticIndexer.ts (indexUser, deleteUser, indexEvent, deleteEvent)
│   │   │   ├── prismaIndexHooks.ts (Prisma $use middleware for ES indexing)
│   │   │   ├── redisClient.ts (Redis client singleton)
│   │   │   ├── logger.ts (structured logger)
│   │   │   └── metrics.ts (Prometheus: httpRequestDuration, httpRequestCounter, errorCounter, notificationDlqSize)
│   │   │
│   │   ├── utils/ (shared utilities)
│   │   │   ├── auth.ts (extractAndVerifyToken)
│   │   │   ├── cors.ts (handleCors, withCorsHeaders)
│   │   │   ├── recipientResolver.ts (resolveRecipients for fanout)
│   │   │   └── searchParser.ts (parseQuery, buildWhereClause, buildSelectClause)
│   │   │
│   │   └── worker.ts (background worker entry)
│   │
│   ├── apps/web (Frontend — Next.js 15 + React 19 + Tailwind, port 3000)
│   │   ├── app/ (App Router pages)
│   │   │   ├── layout.tsx (root layout)
│   │   │   ├── page.tsx (home)
│   │   │   ├── signin/page.tsx
│   │   │   ├── signup/fm/page.tsx (member signup)
│   │   │   ├── signup/fh/page.tsx (family head signup)
│   │   │   ├── authorized.tsx
│   │   │   ├── notAuthenticated/page.tsx
│   │   │   ├── me/page.tsx + edit/page.tsx
│   │   │   ├── family/page.tsx + tree/page.tsx
│   │   │   │   ├── FamilyPageContent.tsx
│   │   │   │   └── FamilyTreeView.tsx
│   │   │   ├── events/page.tsx + [id]/page.tsx + create/page.tsx + calendar/page.tsx
│   │   │   │   └── EventsListClient.tsx
│   │   │   ├── medical/page.tsx + records/page.tsx
│   │   │   ├── resources/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── admin/notifications/page.tsx
│   │   │   ├── nearby/page.tsx
│   │   │   ├── search/page.tsx + SearchInput.tsx
│   │   │   ├── chat/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── spec/page.tsx
│   │   │   └── themeInitializer.tsx
│   │   ├── components/ (shared UI)
│   │   │   ├── NavBar.tsx
│   │   │   └── Tooltip.tsx
│   │   ├── hooks/
│   │   │   ├── useDebouncedValue.tsx
│   │   │   └── useNotifications.ts
│   │   ├── lib/
│   │   │   ├── api.ts (API client)
│   │   │   └── config.ts
│   │   └── providers.tsx (React context providers)
│   │
│   └── apps/ws (WebSocket Server — Bun + ws, port 3002)
│       ├── index.ts (entry point)
│       ├── server.ts (Bun serve with WebSocket upgrade)
│       │   ├── Auth via Authorization header on upgrade
│       │   ├── /health endpoint
│       │   └── WebSocket handlers: open, message, close
│       ├── handlers.ts (WS event handlers)
│       │   ├── handleOpen (add socket, heartbeat)
│       │   ├── handleMessage (chat, typing, read receipts)
│       │   └── handleClose (remove socket)
│       ├── kafka.ts (Kafka consumer for notification events)
│       ├── redisSub.ts (Redis subscriber for in-app notifications)
│       ├── utils.ts (socket management, rate limiting, auth)
│       │   ├── userSockets: WSMap (userId → Set<WebSocket>)
│       │   ├── pushToUser(userId, payload)
│       │   ├── addSocket/removeSocket
│       │   ├── checkRateLimit
│       │   └── authenticate (JWT from Authorization header)
│       ├── types.ts (WSData, NotificationEvent, ChatMessage, IncomingMessage)
│       ├── config.ts (ports, limits, timeouts)
│       └── logger.ts
│
├── PACKAGES (shared monorepo packages)
│   │
│   ├── packages/db (Prisma ORM + PostgreSQL)
│   │   ├── schema.prisma (486 lines, 20+ models)
│   │   ├── index.ts (PrismaClient singleton)
│   │   └── seed.ts
│   │
│   ├── packages/utils (shared utilities)
│   │   ├── jwt.ts (signJWT 15min, signRefreshJWT 7d, verifyJWT, verifyRefreshJWT)
│   │   ├── hash.ts (bcrypt hash/compare, salt rounds 10)
│   │   ├── response.ts (createResponse, success(), failure())
│   │   ├── rateLimit.ts (in-memory sliding window)
│   │   ├── pagination.ts (parsePagination, buildPaginationResponse)
│   │   ├── constants.ts (UserRole, RequestStatus, ProfileStatus enums)
│   │   ├── match.ts (route pattern matching)
│   │   ├── phone.ts (phone number utilities)
│   │   └── index.ts (re-exports)
│   │
│   ├── packages/ui (shared UI components)
│   │   ├── src/colors.ts
│   │   └── src/utils.ts
│   │
│   ├── packages/lib (shared lib utilities)
│   │   └── utils.ts
│   │
│   ├── packages/scripts (code generation)
│   │   ├── generateDocs.ts
│   │   ├── generateOpenapi.ts
│   │   └── generate-asyncapi.ts
│   │
│   ├── packages/eslint-config (shared ESLint config)
│   ├── packages/typescript-config (shared TS config)
│   └── packages/scripts (build/CI scripts)
│
├── INFRASTRUCTURE
│   │
│   ├── docker-compose.yml
│   │   ├── db (PostgreSQL 15, port 5432)
│   │   ├── redis (Redis 7, port 6379)
│   │   ├── zookeeper (Confluent, port 2181)
│   │   ├── kafka (Confluent, port 9092)
│   │   ├── be (Backend, port 3001)
│   │   ├── web (Frontend, port 3000)
│   │   ├── ws (WebSocket, port 3002)
│   │   ├── nginx (Reverse proxy, port 80)
│   │   └── kafka-ui (Kafka UI, port 8080)
│   │
│   ├── nginx.conf (reverse proxy)
│   │   ├── /api/ → be:3001
│   │   ├── / (WebSocket upgrade) → ws:3002
│   │   └── / (everything else) → web:3000
│   │
│   ├── infra/terraform/ (IaC for cloud infra)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── monitoring.tf
│   │
│   └── monitoring/ (Observability stack)
│       ├── prometheus.yml
│       ├── alertmanager.yml
│       ├── promtail-config.yml
│       ├── alert.rules.yml
│       ├── grafana/
│       │   ├── provisioning/ (datasources, dashboards)
│       │   └── dashboards/ (request-duration, backend-overview, errors-and-rps, latency-percentiles, logs-overview)
│       └── README.md
│
├── CONFIG & DOCS
│   ├── .env.example (all env vars)
│   ├── .env (local env)
│   ├── .gitignore
│   ├── .dockerignore
│   ├── eslint.config.js
│   ├── tsconfig.json
│   ├── design.md (full system design doc)
│   ├── deploy.md (AWS EC2 deployment guide)
│   ├── ARCHITECTURE_EVOLUTION.md
│   ├── IMPLEMENTATION_STATUS.md
│   ├── MESSAGING.md
│   ├── openapi.yaml (API spec)
│   ├── asyncapi.yaml (event bus spec)
│   ├── srs.md (Software Requirements Spec)
│   ├── case-study.md
│   ├── stress-testing.md
│   └── left-over.md
│
└── NOTES
    │
    ├── Auth Flow
    │   ├── Login → verify password → signJWT (15min) + signRefreshJWT (7d)
    │   ├── Access token in response body
    │   ├── Refresh token in HttpOnly, Secure, SameSite=Strict cookie
    │   └── /api/refresh validates refresh token → issues new access + refresh
    │
    ├── Role Hierarchy (5 levels)
    │   ├── COMMUNITY_HEAD (top)
    │   ├── COMMUNITY_SUBHEAD
    │   ├── GOTRA_HEAD
    │   ├── FAMILY_HEAD
    │   └── MEMBER (bottom)
    │
    ├── Notification Delivery Strategies
    │   ├── BROADCAST: all channels immediately
    │   └── ESCALATION: in-app first → SMS (10min) → email (40min)
    │
    ├── Approval Workflows (multi-level)
    │   ├── Events: all admins (COMMUNITY_HEAD, SUBHEAD, GOTRA_HEAD) must approve
    │   ├── Resource Requests: hierarchical approval
    │   └── Status Updates: community-level approval
    │
    ├── Search Architecture
    │   ├── Structured query parser (blood:, gotra:, role:, family:, profession:, location:)
    │   ├── Elasticsearch derived index (users, events)
    │   ├── Postgres remains authoritative
    │   ├── Prisma fallback for DB queries
    │   └── In-memory cache (60s TTL, mode-aware keys)
    │
    ├── Real-time Architecture
    │   ├── WebSocket server (port 3002) authenticates via JWT
    │   ├── Messages persisted to Postgres before Redis fan-out
    │   ├── Redis pub/sub → in-app notification fanout across WS instances
    │   ├── Sync reconciliation on reconnect (lastSeenAt / missed messages)
    │   └── Heartbeat (30s interval, 60s timeout)
    │
    ├── Reliability Architecture
    │   ├── Transactional outbox: DB write + outbox event in same transaction
    │   ├── Outbox relay: polls pending events, publishes to Kafka/Elasticsearch
    │   ├── Redis lock: single relay instance processes events safely
    │   ├── Kafka consumer idempotency: Redis-backed duplicate detection
    │   ├── ES indexing via outbox: Postgres remains system of record
    │   └── Role-change audit log: immutable history + anomaly counters
    │
    └── Key Infrastructure Decisions
        ├── PostgreSQL with PostGIS (spatial queries for nearby users)
        ├── Redis for caching + pub/sub + DLQ + notification drain + idempotency locks
        ├── Kafka for async notification delivery (4 topics)
        ├── Elasticsearch for full-text + structured search (derived, not authoritative)
        ├── Bun runtime (not Node.js) for all services
        ├── Elysia framework for backend API
        ├── Prisma ORM with connection pooling
        └── In-memory rate limiting (sliding window per IP)
```

## Key Architectural Patterns

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
