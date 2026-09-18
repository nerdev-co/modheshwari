# Modheshwari — Community Operating System

## What it is

Modheshwari is a community operating system for the Modheshwari community — an Indian family/community network with explicit hierarchy (Community Head → Subhead → Gotra Head → Family Head → Member). It manages family trees, events with approval workflows, resource requests, medical records, real-time chat/notifications, and member discovery.

## Who it's for

Primary: Community members (family heads, gotra heads, community leadership)
Secondary: Community administrators managing approvals, events, resources

## Core value

"Your community, at a glance." — Making the invisible hierarchy visible and actionable.

## Key capabilities

- **Family hierarchy**: Community → Gotra → Family → Member with role-based access
- **Events with approvals**: Created by members, approved by leadership (role-gated)
- **Resource requests**: Members request, leadership approves/distributes
- **Medical records**: Private per-family, shared with authorized roles
- **Real-time chat/notifications**: WebSocket-backed
- **Search/discovery**: Find members, families, gotras
- **Role-based dashboards**: Different views per role (community head vs member)

## Roles (from backend)

- `COMMUNITY_HEAD` — Full oversight, all approvals, all data
- `COMMUNITY_SUBHEAD` — Delegated oversight, event/resource approvals
- `GOTRA_HEAD` — Gotra-scoped: families, members, events in their gotra
- `FAMILY_HEAD` — Family-scoped: members, events, resources, medical
- `MEMBER` — Personal: own profile, family view, events, resources, chat

## Vibe word

**Reverent** — Respectful of tradition, clear for modern use, warm without ornament.

## Constraints

- React 19 + Tailwind + Framer Motion (already in stack)
- Bun/Elysia/Postgres/Redis/Kafka backend
- Hindi/English i18n
- Light mode only (Sun Temple palette: cream, dark brown, saffron gold)
- Fonts: Fraunces (display) + Mukta (body) + IBM Plex Mono (data)
- Must feel like an Indian community archive, not a generic SaaS dashboard