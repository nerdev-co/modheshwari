# Design System

## Color Token Architecture

The app uses CSS custom properties for theming. Dark mode is 100% CSS-variable driven, no `dark:` Tailwind variants in component code.

### How it works

1. `:root` defines light mode values
2. `.dark` class on `<html>` overrides with dark values
3. Tailwind config maps CSS variables to utility classes
4. Components use semantic tokens (`bg-surface`, `text-primary`) never raw colors

### Token mapping

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--surface` | `#ffffff` | `#1c1917` | Page background |
| `--surface-muted` | `#f5f5f4` | `#292524` | Subtle backgrounds |
| `--surface-raised` | `#fafaf9` | `#0c0a09` | Elevated elements |
| `--text-primary` | `#1c1917` | `#e7e5e4` | Headlines, body text |
| `--text-secondary` | `#57534e` | `#a8a29e` | Descriptions, labels |
| `--text-muted` | `#a8a29e` | `#78716c` | Placeholders, hints |
| `--text-on-accent` | `#1c1917` | `#1c1917` | Text on accent bg (always dark) |
| `--border` | `#e7e5e4` | `#44403c` | Borders, dividers |
| `--border-subtle` | `#f5f5f4` | `#292524` | Subtle separators |
| `--accent` | `#eab308` | `#d4a806` | Primary actions |
| `--accent-hover` | `#ca8a04` | `#eab308` | Accent hover state |
| `--accent-muted` | `#fef9c3` | `#422006` | Accent backgrounds |
| `--ruby` | `#ef4444` | `#f87171` | Destructive actions |
| `--emerald` | `#10b981` | `#34d399` | Success states |
| `--saffron` | `#f97316` | `#fb923c` | Warning states |

### Design decisions

**Why --text-primary is #e7e5e4 in dark mode, not #fafaf9:**
Pure white (#ffffff) or near-white (#fafaf9) on dark backgrounds causes eye strain and halation. Off-white (#e7e5e4) reads clearly without glare.

**Why --accent is desaturated in dark mode:**
Bright saturated colors on dark backgrounds vibrate and cause fatigue. Desaturating 20% (#eab308 -> #d4a806) maintains warmth while staying comfortable.

**Why --text-on-accent exists:**
The accent background (gold/yellow) needs dark text in both themes. `text-jewel-900` flips to light in dark mode, making it unreadable on gold. `--text-on-accent` stays dark (#1c1917) in both themes.

**Why shadows are not overridden for dark mode:**
Black shadows on near-black surfaces are invisible, but adding light shadows creates a glowing effect that conflicts with the calm aesthetic. Cards use border contrast instead of shadows for elevation in dark mode.

### Usage rules

1. **Never use raw hex/rgb in component code.** Always use CSS variables via Tailwind classes.
2. **Never use `dark:` Tailwind variants.** The CSS variable system handles theme switching.
3. **Never use `bg-white`, `bg-black`, `bg-gray-*`** in components. Use `bg-surface`, `bg-surface-muted`, etc.
4. **Text on accent backgrounds** must use `text-on-accent` class, not `text-jewel-900`.
5. **Inline styles with colors** must use `ROLE_COLORS_CSS` (CSS variables), not `ROLE_COLORS` (Tailwind classes).

### Common patterns

```tsx
// Card
<Card className="p-6">

// Button
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>

// Status chip
<span className="bg-jewel-emerald/10 text-jewel-emerald">Active</span>

// Role badge (inline style)
<span style={{ background: ROLE_COLORS_CSS[role] }}>Role</span>

// Role badge (className)
<span className={ROLE_COLORS[role]}>Role</span>
```

### WCAG AA contrast ratios

| Pair | Light | Dark |
|------|-------|------|
| Primary button (text on accent) | 8.5:1 | 7.2:1 |
| Secondary button (text on surface) | 16:1 | 14:1 |
| Ghost button (text-secondary on surface) | 5.9:1 | 4.8:1 |
| Body text (text-primary on surface) | 16:1 | 14:1 |
| Muted text (text-muted on surface) | 2.3:1 | 3.2:1 |
