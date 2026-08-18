# Modheshwari — Interview Prep

Canonical interview preparation for this project. **Read this before any interview
practice session.**

## Instructions for AI assistants

- This document is the authoritative source for interview answers. The corrections
  in the "Anti-patterns" section are **final** — do not re-flag or re-teach them.
  They exist so practice sessions don't waste time repeating known corrections.
- Never cite a claim from this doc without verifying it against live code first.
  Code drifts; the file:line references below were accurate on 2026-08-18.
- "Implemented or gap?" questions must be answered from code, not from docs.
  See `../GAP_LOG.md` for known gaps.

## One-liner

Modheshwari is a full-stack community-management platform for organizing families,
events, and member discovery in a role-based environment (community heads,
subheads, gotra heads, family heads, members).

## Q1 — 20-second pitch

> Modheshwari is a full-stack community-management platform for organizing
> families, events, and member discovery. I built it as three TypeScript services —
> a Next.js web app, a Bun/Elysia API on Postgres, and a dedicated WebSocket
> service for chat and in-app notifications. The part I'm most proud of is the
> reliability layer: business writes go through a transactional outbox into Kafka
> and Elasticsearch, so the API publishes an event and moves on — decoupled and
> async, not "fast delivery." Redis does two narrow jobs: cache search results
> (60s TTL) and pub/sub as the last-hop wake-up signal. Postgres is the single
> source of truth; Redis never holds content.

## Q4 — What specific problem does Redis pub/sub solve?

> With multiple WebSocket instances running, a user could be connected to any one
> of them — and that's ephemeral state (userId → live socket) that Kafka has no
> way of knowing. Redis pub/sub is the last-hop router: a worker publishes once to
> `inapp:<userId>`, and whichever ws instance is holding that user's socket picks
> it up and pushes it down the wire.

Why Kafka can't do that last hop: Kafka doesn't know which of N ws processes holds
a live browser connection — that's in-memory, ephemeral state, not something
durable that belongs in a topic. Redis pub/sub is cheap, fast, fire-and-forget —
perfect for "wake up whichever instance has this guy."

## Q5 — Redis subscription drops for a few seconds mid-publish?

> Redis pub/sub is a live broadcast with zero persistence — if nobody's listening
> at that exact moment, the message silently evaporates; no error, no gap signal,
> the user just never gets it. The fix has two parts, and both are what I built:
> Redis is never the source of truth — chat is persisted to Postgres in a
> transaction before fan-out, and notifications go outbox → Kafka → Postgres, with
> Redis carrying only a TTL'd preview. And on reconnect, the server reconciles
> from Postgres, not from waiting on the next pub/sub event: unread notifications
> are re-pushed on connect, and chat has a `sync` endpoint that returns everything
> since `lastSeenAt`, cursor-paginated, capped at 500.

If asked "implemented or gap?" — see GAP-001 in `../GAP_LOG.md`. Say it exactly:
server-side is implemented; the client-side sync call is the known gap.

## Q6 — Full notification pipeline, start to end

1. `POST /api/notifications` validates targets, then inside a **Postgres
   transaction** writes an outbox event and returns **202 Accepted** — the API
   never blocks on delivery.
2. **Outbox relay** polls unpublished events under a Redis single-writer lock,
   publishes to Kafka topic `notification.events`, marks `publishedAt`; failures
   increment attempts, past max attempts the event moves to the **DLQ table** for
   manual replay.
3. **Kafka consumers** pick it up: email/SMS/push workers for outbound channels;
   the in-app worker with **Redis-backed idempotency** (dedupe on message key) so
   restarts don't double-deliver.
4. **For IN_APP, two paths, one purpose:** the API already fired a fire-and-forget
   Redis **preview** to `inapp:<userId>` plus a 60s preview key — the ws instance
   holding the user's socket pushes it instantly. The in-app worker then checks
   that preview key to avoid double-send, publishing the real payload to
   `inapp:<userId>`.
5. **The ws instance** subscribed to pattern `inapp:*` picks it up and pushes down
   the socket. The ws service also consumes the Kafka topic directly as a second,
   reliable path.
6. **Durable record:** the drain worker persists the Notification row to Postgres.
   Even if every realtime signal was lost, the client's reconcile-on-connect
   re-pushes unread from Postgres — the user always sees it, eventually, from the
   source of truth.

Why two realtime paths: Kafka = durable backbone, survives worker restarts.
Redis = ephemeral last-hop fanout to the right instance. Different jobs, both
needed.

## Anti-patterns — already corrected, do not re-teach

The following framings were made during practice and corrected. Never say them,
and if a practice partner flags them, it is redundant:

1. **"Kafka gives fast delivery."** — No. Kafka makes delivery decoupled and
   asynchronous: the handler publishes and moves on immediately. Speed is not the
   win.
2. **"Kafka was introduced for retry-with-exponential-backoff."** — No. Retry/DLQ
   (failed deliveries retry a limited number of times) is a resilience feature
   built on top of Kafka, not the reason it exists.
3. **"Redis caching protects availability / prevents writes from being lost."**
   — No. Caching means not re-querying Postgres for the same read repeatedly
   (cutting read load, reducing latency; 60s TTL on search results). Nothing about
   writes.
4. **"Persistence via Redis."** — Never. Redis is fire-and-forget by design and
   cannot be trusted for persistence. The correct phrase: *persist via Postgres,
   use Redis only as a wake-up signal.*
5. **"Redis does the WebSocket protocol upgrade (HTTP → WebSocket)."** — No. The
   protocol upgrade is the ws service's job. Redis's job is pub/sub fanout to the
   right ws instance.
6. **"Kafka takes care of fanout to the right ws instance."** — No. Kafka gets the
   event reliably to a worker; Redis pub/sub handles the last-hop fanout to
   whichever ws instance holds the user's live socket.

## Verified code map (accurate 2026-08-18)

- Chat persists to Postgres before fan-out: `apps/ws/handlers.ts` — `handleChatMessage`
- Redis in-app preview (TTL'd, fire-and-forget): `apps/be/routes/notifications.ts`
- Outbox → Kafka relay, DLQ: `apps/be/kafka/workers/outboxRelay.ts`
- In-app worker + idempotency: `apps/be/kafka/workers/inAppWorker.ts`
- WS Kafka consumer (second reliable path): `apps/ws/kafka.ts`
- WS Redis subscriber: `apps/ws/redisSub.ts`
- Notifications reconcile-on-connect (Postgres): `apps/ws/handlers.ts` — `reconcileMissedNotifications`
- Chat sync handler (Postgres, cursor-paginated): `apps/ws/handlers.ts` — `handleSync`
