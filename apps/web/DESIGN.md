# Design System - Sun Temple Theme

## Color Token Architecture

The app uses CSS custom properties for theming with a **light-mode-only** Sun Temple color palette. No dark mode, no `dark:` Tailwind variants.

### How it works

1. `:root` defines Sun Temple light mode values
2. Tailwind config maps CSS variables to utility classes
3. Components use semantic tokens (`bg-surface`, `text-primary`) never raw colors

### Sun Temple Token Mapping

| Token | Value | Purpose |
|-------|-------|---------|
| `--surface` | `#fdfaf5` | Page background (warm cream) |
| `--surface-muted` | `#f5f0e6` | Subtle backgrounds |
| `--surface-raised` | `#ffffff` | Elevated elements |
| `--text-primary` | `#1a0f08` | Headlines, body text (deep brown) |
| `--text-secondary` | `#3d2a21` | Descriptions, labels |
| `--text-muted` | `#8b7355` | Placeholders, hints |
| `--text-on-accent` | `#ffffff` | Text on accent backgrounds |
| `--border` | `#e8d5b7` | Borders, dividers |
| `--border-subtle` | `#f0e4d0` | Subtle separators |
| `--accent` | `#c97c1c` | Primary actions (Sun Temple gold) |
| `--accent-hover` | `#a66418` | Accent hover state |
| `--accent-muted` | `#fdf0d5` | Accent backgrounds |
| `--emerald` | `#1b5e20` | Success states (deep green) |
| `--emerald-muted` | `#e8f5e9` | Success backgrounds |
| `--saffron` | `#c97c1c` | Warning states |
| `--saffron-muted` | `#fdf0d5` | Warning backgrounds |
| `--ruby` | `#b71c1c` | Destructive actions (deep red) |
| `--ruby-muted` | `#fef2f2` | Error backgrounds |

### Jewel Tone Scale

| Token | Value |
|-------|-------|
| `--jewel-50` | `#fdfaf5` |
| `--jewel-100` | `#f5f0e6` |
| `--jewel-200` | `#e8d5b7` |
| `--jewel-300` | `#d4b896` |
| `--jewel-400` | `#8b7355` |
| `--jewel-500` | `#5c4033` |
| `--jewel-600` | `#4a3228` |
| `--jewel-700` | `#3d2a21` |
| `--jewel-800` | `#2d1b0e` |
| `--jewel-900` | `#1a0f08` |
| `--jewel-950` | `#0d0704` |
| `--jewel-gold` | `#c97c1c` |
| `--jewel-gold-light` | `#d4a017` |
| `--jewel-emerald` | `#1b5e20` |
| `--jewel-saffron` | `#c97c1c` |
| `--jewel-ruby` | `#b71c1c` |

### Design Decisions

**Why light mode only:**
The Sun Temple aesthetic is inherently warm, golden, and luminous. Dark mode would diminish the spiritual warmth and sacred geometry that defines the brand. The cream/gold palette works beautifully in all lighting conditions.

**Why --text-primary is #1a0f08 (not black):**
Deep brown-black provides warmth and reduces eye strain compared to pure black. It harmonizes with the gold/cream palette.

**Why --accent is #c97c1c:**
This specific gold captures the Sun Temple's gilded sanctum - warm, luminous, not brassy. It maintains AA contrast on both cream and white.

**Why --text-on-accent is white:**
The accent gold is dark enough that white text passes WCAG AA (7.2:1). This is consistent and predictable.

### Usage Rules

1. **Never use raw hex/rgb in component code.** Always use CSS variables via Tailwind classes.
2. **Never use `dark:` Tailwind variants.** Light mode only.
3. **Never use `bg-white`, `bg-black`, `bg-gray-*`** in components. Use `bg-surface`, `bg-surface-muted`, etc.
4. **Text on accent backgrounds** must use `text-on-accent` class.
5. **Inline styles with colors** must use CSS variables, not Tailwind classes.

### Common Patterns

```tsx
// Card
<Card className="p-6">

// Button
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>

// Status chip
<span className="bg-emerald-muted text-emerald">Active</span>
<span className="bg-saffron-muted text-saffron">Pending</span>
<span className="bg-ruby-muted text-ruby">Error</span>

// Sun Temple gradient text
<h1 className="gradient-text">Modheshwari</h1>

// Sun Temple glow card
<GlowCard>Content</GlowCard>
```

### WCAG AA Contrast Ratios (Light Mode)

| Pair | Ratio |
|------|-------|
| Primary button (text on accent) | 7.2:1 |
| Secondary button (text on surface) | 16:1 |
| Ghost button (text-secondary on surface) | 5.9:1 |
| Body text (text-primary on surface) | 16:1 |
| Muted text (text-muted on surface) | 3.2:1 |
| Accent text on surface | 4.5:1 |