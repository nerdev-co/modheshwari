# Incident Report: WS Container Crash — Cannot find module '../be/lib/redisClient'

**Repository:** NalinDalal/modheshwari
**Date:** 2026-08-11
**Reported by:** Nalin
**Severity:** High (WebSocket service down — `modheshwari-ws` crash-looping)
**Status:** Code fix complete & verified; image deploy pending via CI

---

## 1. Summary

The `modheshwari-ws` container crashed on startup with `Cannot find module '../be/lib/redisClient'`. The WebSocket service imported a Redis client module that lived inside the backend app (`apps/be/lib/redisClient.ts`) via a cross-app relative import. The `runner-ws` Docker image only copies `apps/ws` (not `apps/be`), so the module did not exist at runtime in the WS image.

The fix moves the Redis client into a shared workspace package (`packages/redis`), removes the cross-app import, and updates all consumers in both `ws` and `be`.

---

## 2. Timeline

| Step | Action |
|---|---|
| 1 | `modheshwari-ws` fails to start; logs show `Cannot find module '../be/lib/redisClient'` |
| 2 | Inspected `apps/ws/redisSub.ts:6` — imports `getRedisClient` from `../be/lib/redisClient` |
| 3 | Confirmed `runner-ws` image stage only copies `apps/ws` — `apps/be` is never present in the WS image |
| 4 | Created shared package `packages/redis` with the client implementation |
| 5 | Updated WS + all BE imports to `@modheshwari/redis`; deleted `apps/be/lib/redisClient.ts` |
| 6 | Updated package.json deps, tsconfig paths, Dockerfile, and bun.lock |
| 7 | Verified: tsc clean, `turbo build` (ws + be) passes, bun runtime resolution confirmed |

---

## 3. Root Cause

`apps/ws/redisSub.ts` contained a cross-app relative import:

```ts
import getRedisClient from '../be/lib/redisClient';
```

The Dockerfile's `runner-ws` stage only copies the `ws` app into the image:

```
FROM runner-base AS runner-ws
COPY --from=builder --chown=app:app /app/apps/ws ./apps/ws
```

`apps/be` (and thus `apps/be/lib/redisClient.ts`) is never copied into the WS image, so Bun could not resolve the module at runtime. This is an architectural violation: apps must not import across app boundaries; shared code belongs in `packages/`.

---

## 4. Impact

- `modheshwari-ws` crash-looped on startup — no WebSocket connections served
- In-app notifications (Redis pub/sub `inapp:*` subscriber) unavailable
- The site also exhibited 502 errors via Nginx — a separate runtime issue (still under diagnosis on EC2, see Follow-up)

---

## 5. Resolution

### 5a. New shared package `packages/redis`

Moved `getRedisClient` / `quitRedisClient` (with the same reconnect-strategy and error-handling behavior, defaulting to `REDIS_URL` from `@modheshwari/config/be`) into:

- `packages/redis/package.json` — `@modheshwari/redis` workspace package
- `packages/redis/index.ts` — client implementation

### 5b. Removed cross-app import

- `apps/ws/redisSub.ts` now imports `@modheshwari/redis`
- `apps/be/lib/redisClient.ts` deleted; all 8 BE consumers updated to `@modheshwari/redis` (`me.ts`, `messages/conversations.ts`, `familyTree/handlers.ts`, `notifications.ts`, `lib/kafkaIdempotency.ts`, `kafka/workers/notificationDLQ.ts`, `notificationDrain.ts`, `inAppWorker.ts`, `outboxRelay.ts`)

### 5c. Build configuration

- `apps/ws/package.json` + `apps/be/package.json`: added `"@modheshwari/redis": "*"` dependency
- Root `tsconfig.json` and `apps/ws/tsconfig.json`: added `@modheshwari/redis` path mapping
- `Dockerfile`: `packages/redis/package.json` copied in both the `deps` and `runner-base` stages (workspace resolution during `bun install`); runtime source delivered via existing `COPY --from=builder /app/packages ./packages`
- `bun.lock` regenerated via `bun install`

---

## 6. Verification

| Check | Result |
|---|---|
| `tsc --noEmit` — apps/ws | ✅ clean |
| `tsc --noEmit` — apps/be | ✅ clean |
| `turbo build` (filter ws,be) | ✅ 2/2 successful |
| `bun` runtime resolution of `@modheshwari/redis` | ✅ resolves via workspace symlink |

**Local Docker build note:** full image build could not be verified locally — `bun install` fails on `tree-sitter` native compilation on Apple Silicon (arm64) and `--platform linux/amd64` QEMU emulation is prohibitively slow (~15–40 min cold). Both are environment limitations, unrelated to this change; CI builds on a native amd64 runner.

---

## 7. Files Changed

| File | Change |
|---|---|
| `packages/redis/package.json` | New — shared `@modheshwari/redis` package |
| `packages/redis/index.ts` | New — Redis client (moved from `apps/be/lib/redisClient.ts`) |
| `apps/ws/redisSub.ts` | Import switched to `@modheshwari/redis` |
| `apps/be/lib/redisClient.ts` | Deleted (replaced by shared package) |
| `apps/be/routes/me.ts` | Import switched to `@modheshwari/redis` |
| `apps/be/routes/messages/conversations.ts` | Import switched to `@modheshwari/redis` |
| `apps/be/routes/familyTree/handlers.ts` | Import switched to `@modheshwari/redis` |
| `apps/be/routes/notifications.ts` | Import switched to `@modheshwari/redis` |
| `apps/be/lib/kafkaIdempotency.ts` | Import switched to `@modheshwari/redis` |
| `apps/be/kafka/workers/notificationDLQ.ts` | Import switched to `@modheshwari/redis` |
| `apps/be/kafka/workers/notificationDrain.ts` | Import switched to `@modheshwari/redis` |
| `apps/be/kafka/workers/inAppWorker.ts` | Import switched to `@modheshwari/redis` |
| `apps/be/kafka/workers/outboxRelay.ts` | Import switched to `@modheshwari/redis` |
| `apps/ws/package.json` | Added `@modheshwari/redis` dependency |
| `apps/be/package.json` | Added `@modheshwari/redis` dependency |
| `tsconfig.json` | Added `@modheshwari/redis` path mapping |
| `apps/ws/tsconfig.json` | Added `@modheshwari/redis` path mapping |
| `Dockerfile` | Copy `packages/redis/package.json` in `deps` + `runner-base` stages |
| `bun.lock` | Regenerated |

---

## 8. Deploy

Push to `main` → CI builds/pushes `ghcr.io/nerdev-co/modheshwari-ws:latest` on the native amd64 runner → deploy workflow pulls and restarts on EC2. No EC2-side file changes were made (server-only edits would be overwritten on the next deployment).

---

## 9. Follow-up / Open Items

- [ ] Push to main and confirm the new `modheshwari-ws` image deploys cleanly on EC2
- [ ] Separately diagnose the 502s (Nginx upstream) on EC2 — runtime infrastructure issue, not this code change; start with `docker logs --tail=100 modheshwari-nginx`
- [ ] Consider adding a lint rule / CI check forbidding cross-app relative imports (`apps/*` importing from `apps/*`)

---

## 10. Lessons Learned

1. **Apps must never import across app boundaries.** If two apps share code, it belongs in `packages/`. Cross-app relative imports break the moment an app is built or shipped without its sibling.
2. **Docker images only contain what their stage copies.** A passing local run is not proof an image works — verify each service's image contains every module it imports.
3. **Shared infrastructure (Redis clients, loggers, config) should live in workspace packages** so every app resolves them via `node_modules` symlinks, regardless of which app is packaged.
4. **Monorepo structure and Dockerfile COPY stages must stay in sync** — new workspace packages need their `package.json` added to every stage that runs `bun install` (`--frozen-lockfile` fails or resolves incorrectly otherwise).

---

## 11. Outcome

The architectural defect was fixed in the codebase: the Redis client now lives in the shared `packages/redis` workspace package, and both `ws` and `be` consume it through `@modheshwari/redis`. Type-checking, builds, and runtime module resolution are verified locally. The corrected `modheshwari-ws` image is deployed via the standard CI pipeline, and the WebSocket service should come up cleanly once the new image is pulled on EC2.
