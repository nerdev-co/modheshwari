# Gap Log

Known architectural gaps, tracked against live code. **Rule: never mark a gap
fixed from a doc or log alone — verify in code first.** Interview answers about
"implemented or gap?" must cite code, not this file.

## GAP-001 — Chat client never calls the WS `sync` endpoint on reconnect

- **Status:** OPEN
- **Opened:** 2026-08-18
- **Area:** Realtime / chat durability
- **Symptom:** the ws service implements `handleSync` — messages since
  `lastSeenAt`, cursor-paginated, capped at 500 (`apps/ws/handlers.ts`) — but no
  client sends `{ type: "sync", ... }`. The chat client (`apps/web/app/chat/page.tsx`)
  only re-sends `auth` on reconnect; missed chat is recovered by REST-fetching the
  latest 50 messages when a conversation is opened.
- **Impact:** no data loss (REST covers it), but the "give me everything since my
  last ID/timestamp" flow is server-side only. Messages for conversations the
  user does not reopen are not pulled automatically, and a reconnect while a
  conversation is open does not fill in the gap until the user reopens it.
- **Fix plan:** client tracks `lastSeenAt` (persisted in localStorage), sends
  `sync` on every connect/reconnect, pages through `hasMore`/`nextCursor`,
  merges results into the open conversation and caches per-conversation for
  others.
