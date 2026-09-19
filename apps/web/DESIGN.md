# Design System: Modheshwari

**Visual Direction**: Refined Indian Editorial / Community Archive
**Not**: Generic SaaS, "Indian-themed SaaS", purple gradients, glowing buttons, oversized rounded cards
**Is**: Modern digital institution + editorial typography + subtle Indian visual cues + dense useful information

---

## Token Budget (Constraint)

| Constraint | Value |
|------------|-------|
| Accent color | 1 (Saffron `#c97c1c`) |
| Gray family | 1 (Jewel warm brown scale) |
| Radius scale | 3 levels (sm, md, lg) + pill |
| Icon family | 1 (Lucide React) |
| Stroke weight | 1px borders |
| Motion curve | 1 (Spring `cubic-bezier(0.16, 1, 0.3, 1)`) |
| Shadow | Soft only, no elevation stacking |

---

## Typography Scale

| Token | Size | Line Height | Font | Weight | Use |
|-------|------|-------------|------|--------|-----|
| `caption` | 12px | 16px | DM Sans | 500 | Labels, metadata, timestamps |
| `body` | 14px | 20px | DM Sans | 400 | Base body text |
| `body-lg` | 16px | 24px | DM Sans | 400 | Large body, form labels |
| `heading-sm` | 18px | 24px | Fraunces | 600 | Small section headings |
| `heading` | 20px | 28px | Fraunces | 600 | Section headings |
| `heading-md` | 24px | 32px | Fraunces | 600 | Page headings |
| `heading-lg` | 30px | 36px | Fraunces | 600 | Large headings |
| `display` | 36px | 44px | Fraunces | 600/700 | Hero, landing |

**Type Pairing**: Fraunces (display) + DM Sans (body) + IBM Plex Mono (numbers/mono)

**Utilities**:
```css
.text-display        { font-family: var(--font-display); font-weight: 600; }
.text-display-bold   { font-family: var(--font-display); font-weight: 700; }
.text-body           { font-family: var(--font-body); }
.text-numbers        { font-family: var(--font-display); font-variant-numeric: tabular-nums; }
.text-balance        { text-wrap: balance; }
```

---

## Color Palette (Light Mode Only)

| Token | Value | Use |
|-------|-------|-----|
| `--canvas` | `#fdfaf5` | Page background |
| `--surface` | `#faf7f0` | Card surface |
| `--surface-raised` | `#ffffff` | Elevated surfaces (modals, dropdowns) |
| `--surface-muted` | `#f3efe5` | Subtle backgrounds, hover states |
| `--ink` | `#1a0f08` | Primary text |
| `--ink-secondary` | `#3d2a21` | Secondary text |
| `--ink-muted` | `#8b7355` | Muted text, placeholders |
| `--ink-on-accent` | `#ffffff` | Text on accent |
| `--border` | `#e8d5b7` | Default borders |
| `--border-subtle` | `#f0e4d0` | Subtle separators |
| `--border-strong` | `#d4b896` | Strong borders, focus |
| `--accent` | `#c97c1c` | Primary actions, links, focus |
| `--accent-hover` | `#a66418` | Hover state |
| `--accent-muted` | `#fdf0d5` | Accent backgrounds, badges |
| `--accent-soft` | `#fef7eb` | Softer accent backgrounds |
| `--emerald` | `#1b5e20` | Success |
| `--emerald-muted` | `#e8f5e9` | Success backgrounds |
| `--emerald-soft` | `#f1f8e9` | Soft success |
| `--saffron` | `#c97c1c` | Warning (same as accent) |
| `--saffron-muted` | `#fdf0d5` | Warning backgrounds |
| `--saffron-soft` | `#fef7eb` | Soft warning |
| `--ruby` | `#b71c1c` | Destructive, errors |
| `--ruby-muted` | `#fef2f2` | Error backgrounds |
| `--ruby-soft` | `#fefafa` | Soft error |
| `--focus-ring` | `#c97c1c` | Focus rings (saffron) |

---

## Radius Scale

| Token | Value | Use |
|-------|-------|-----|
| `--radius-pill` | `9999px` | Pills, badges, avatar |
| `--radius-sm` | `0.5rem` (8px) | Inputs, small controls, chips |
| `--radius-md` | `0.75rem` (12px) | Cards, panels, buttons |
| `--radius-lg` | `1rem` (16px) | Modals, large panels, sheets |

**CSS Classes**:
```css
.radius-pill { border-radius: 9999px; }
.radius-sm   { border-radius: 0.5rem; }
.radius-md   { border-radius: 0.75rem; }
.radius-lg   { border-radius: 1rem; }
```

---

## Shadow

**Soft only** (no elevation stacking):
```css
--shadow-soft: 0 1px 2px 0 rgb(0 0 0 / 0.05), 0 4px 6px -1px rgb(0 0 0 / 0.04);
```

---

## Motion

| Token | Value |
|-------|-------|
| Curve | `cubic-bezier(0.16, 1, 0.3, 1)` (Spring) |
| Fast | 150ms |
| Normal | 200ms |
| Slow | 300ms |
| Page Enter | 400ms |

**Reduced Motion**: Instant state changes (`0.01ms`)

---

## Status Chips

```tsx
// Active / Approved
<span className="status-active">Active</span>

// Pending
<span className="status-pending">Pending</span>

// Rejected / Destructive
<span className="status-rejected">Rejected</span>

// Neutral / Inactive
<span className="status-neutral">Inactive</span>
```

---

## Component Patterns

### Buttons
Use `@repo/ui/button` exclusively. No raw `className` for buttons.

```tsx
<Button variant="primary" size="md">Primary</Button>
<Button variant="secondary" size="md">Secondary</Button>
<Button variant="ghost" size="sm">Ghost</Button>
<Button variant="danger" size="md">Danger</Button>
```

### Cards
Use sparingly. Prefer editorial layouts (dividers, spacing, typography) over card grids.

```tsx
// Elevated - for modals, dropdowns, important surfaces
<Card elevated padded>

// Flat - for content sections (default)
<Card padded>

// Unpadded - for tables, dense content
<Card padded={false}>
```

### Inputs
Use `@repo/ui/input` or the `.input` CSS class from globals.css.

### Focus Rings
**Always saffron** (`--focus-ring`). Never blue.

```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

### Empty States
**Actionable, not generic**. Always include a primary action.

```tsx
// Bad
<p>No activity</p>

// Good
<div className="text-center py-8">
  <p className="text-sm text-ink-secondary mb-1">No events yet</p>
  <p className="text-sm text-ink-muted mb-4 max-w-md mx-auto">
    Create your first community event to bring people together.
  </p>
  <Button onClick={() => navigate("/events/create")}>
    <Plus className="h-3.5 w-3.5" />
    Create event
  </Button>
</div>
```

### Avatars
Role-based color with initials fallback. No "Unknown" literals.

```tsx
const roleColors: Record<string, string> = {
  COMMUNITY_HEAD: "bg-saffron",
  COMMUNITY_SUBHEAD: "bg-jewel-600",
  GOTRA_HEAD: "bg-emerald",
  FAMILY_HEAD: "bg-jewel-500",
  MEMBER: "bg-ink-muted",
};
```

---

## Layout Patterns

### Page Structure
```tsx
<div className="min-h-screen">
  <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
    {/* Header */}
    <motion.div className="mb-14">...</motion.div>
    <hr className="editorial-divider" />
    
    {/* Sections */}
    <motion.section className="py-10">...</motion.section>
    <hr className="editorial-divider" />
    <motion.section className="py-10">...</motion.section>
  </div>
</div>
```

### Section Header Pattern
```tsx
<div className="flex items-start justify-between mb-8">
  <div>
    <h2 className="heading text-ink">Section Title</h2>
    <p className="body text-ink-secondary mt-1">Descriptive subtitle</p>
  </div>
  <Button variant="ghost" size="sm">
    View all <ChevronRight className="h-3 w-3" />
  </Button>
</div>
```

### Dense Table Pattern
```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
        <th className="px-4 py-3 text-left">Column</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border-subtle">
      <tr className="hover:bg-surface-muted transition-colors">
        <td className="px-4 py-3">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Sidebar & Navigation

### Collapsed Sidebar
- Width: 64px
- Icon-only with **tooltips on hover**
- Active indicator visible as dot on right edge
- Section headers hidden

### Expanded Sidebar
- Width: 256px
- Labels visible
- Active state: saffron text + font-semibold
- Section headers: uppercase, tracking-wider, 10px

### Mobile Drawer
- Full height, 280px wide
- Slide-in from left
- Backdrop overlay

---

## Header / AppShell

### Desktop (≥1024px)
```
[Menu] [Sidebar Toggle] | [Global Search] [Locale] [Notifications] [Profile Avatar]
```

### Mobile (<1024px)
```
[Menu] | [Page Title] [Notifications] [Profile Avatar]
```

### Profile Menu
- Avatar with initials (role color)
- Name + email
- Profile link
- Settings link
- Divider
- Logout (destructive)

---

## Page-Specific Patterns

### Dashboard (`/dashboard`) - Operational
- Welcome + stats with trends
- Quick actions
- Activity feed
- Upcoming events
- **No marketing hero**

### Landing (`/`) - Public
- Marketing hero
- Feature highlights
- Community stats
- CTA to sign in

### Profile (`/me`) - Editorial
- Large avatar + name + role + member since
- Personal/Contact fields in two-column layout
- Family connections as list (not cards)
- Activity feed (actionable empty state)

### Families (`/families`) - List
- Create family inline form
- Families as dense list with role badges
- Join family info section

### Members (`/members`) - Dense Table
- Sortable, filterable, paginated
- Avatar + name + role + gotra + family
- Inline actions

### Events (`/events`) - Calendar + List Hybrid
- Filter tabs (All / Approved / Pending)
- Card grid for approved, list for pending
- Admin moderation inline

### Resources (`/resources`) - Dense Table
- Create request inline
- Requests table with approval chain
- Admin actions inline

### Medical (`/medical`) - Search + Results Table
- My info panel
- Blood group search with quick chips
- Results as dense table

### Notifications (`/notifications`) - Editorial List
- Admin broadcast panel (if admin)
- Filter/sort controls
- List with read/unread states
- Mark read/unread actions

### Chat (`/chat`) - Split View
- Sidebar: conversations list with unread badges
- Main: message thread with optimistic updates
- Input at bottom

### Search (`/search`) - Command Palette Style
- Global search input (⌘K)
- Recent searches
- Filter facets

---

## Anti-Patterns (Do Not Do)

| ❌ Don't | ✅ Do |
|----------|-------|
| Card grids for everything | Editorial layout with dividers |
| Blue focus rings | Saffron focus rings |
| "Unknown" as fallback | Initials or role-appropriate default |
| Generic "No data" empty states | Actionable empty states with primary CTA |
| Marketing hero on authenticated routes | Operational dashboard |
| 5+ font sizes | 8-token typography scale |
| Mixed spacing tokens | Consistent spacing scale |
| Inconsistent icon sizes (w-4, w-5, w-6, w-7) | w-4 (inline), w-5 (header), w-6 (hero) |
| Shadow stacking | Single soft shadow |
| DreamySunsetBackground on authenticated pages | Plain canvas background |
| Leaked i18n keys (`nav.sections.main`) | Translated strings |

---

## Implementation Checklist

### Phase 1: AppShell & /me (Current Sprint)
- [ ] Fix AppShell header: add breadcrumbs, global search, fix profile button
- [ ] Fix collapsed sidebar: tooltips, active state visible
- [ ] Redesign /me page: editorial layout, no card overuse
- [ ] Fix leaked i18n keys in sidebar
- [ ] Fix focus rings: all saffron
- [ ] Fix profile avatar: better fallback, role color mapping

### Phase 2: Dashboard & Landing
- [ ] Move landing page to public `/`
- [ ] Create `/dashboard` operational page
- [ ] Redirect authenticated users from `/` to `/dashboard`

### Phase 3: Propagate System
- [ ] Families page: editorial list
- [ ] Members page: dense table
- [ ] Events page: calendar + list hybrid
- [ ] Resources page: dense table
- [ ] Medical page: clean data table
- [ ] Notifications page: editorial list
- [ ] Chat page: editorial split view
- [ ] Search page: command palette style
- [ ] Settings page: editorial forms

### Phase 4: Verification
- [ ] Run `impeccable` audit
- [ ] Run `verification-loop`
- [ ] Test 7 viewports (320, 375, 414, 768, 1024, 1280, 1440)
- [ ] Lint + typecheck pass
- [ ] Evidence capture (screenshots, DOM, code)