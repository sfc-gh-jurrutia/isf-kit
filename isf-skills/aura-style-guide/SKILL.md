---
name: aura-style-guide
description: >
  Sovereign Light design system for Aura Marketing Guardian. Covers: 3-layer
  color architecture (base palette, persona accents, industry tints), card/button/badge
  systems, chart palette, animation library, CSS variable theming, typography,
  and accessibility rules. Use when: styling components, creating visualizations,
  adding new personas/industries, checking design compliance, or onboarding to the
  visual system. Triggers: colors, styling, theme, persona theme, sovereign light,
  design tokens, card system, animation, chart colors, accessibility.
---

# Aura Style Guide: Sovereign Light

Enterprise flat light theme. Off-white backgrounds, pure white cards, subtle borders, dark navy text. No glows, no black backgrounds.

## Color Architecture (3 Layers)

### Layer 1: Base Palette (Constant, Persona-Independent)

| Token | Value | Hex | Usage |
|-------|-------|-----|-------|
| `--bg-main` / `--bg-base` | Slate 100 | `#f1f5f9` | Page background |
| `--bg-card` / `--bg-surface` | White | `#ffffff` | Card surfaces |
| `--bg-elevated` | Slate 50 | `#f8fafc` | Hover/elevated states |
| `--bg-overlay` | — | `rgba(15, 23, 42, 0.4)` | Modal overlays |
| `--border-subtle` | Slate 200 | `#e2e8f0` | Primary borders |
| `--border-strong` | Slate 300 | `#cbd5e1` | Emphasized borders |
| `--text-primary` | Slate 900 | `#0f172a` | Headers, body text |
| `--text-secondary` | Slate 700 | `#334155` | Secondary text |
| `--text-muted` | Slate 500 | `#64748b` | Subtext, labels |
| `--text-dim` | Slate 400 | `#94a3b8` | Disabled/placeholder |

### Layer 2: Persona Accents (Dynamic via PersonaProvider)

| Persona | Color | Accent Hex | RGB | CSS Class |
|---------|-------|-----------|-----|-----------|
| Brand (Elena) | Emerald | `#10b981` | `16, 185, 129` | `.persona-brand` |
| Ops (Sentinel) | Amber | `#f59e0b` | `245, 158, 11` | `.persona-ops` |
| CMO | Indigo | `#6366f1` | `99, 102, 241` | `.persona-cmo` |
| AI Ops | Violet | `#8b5cf6` | `139, 92, 246` | (JS-only) |

Each persona sets these CSS variables at runtime:
- `--accent`, `--accent-rgb`, `--accent-hover`, `--accent-muted`
- `--accent-light`, `--accent-dark`, `--accent-glow` (always `transparent`)
- `--border-accent`, `--border-accent-muted`

### Layer 3: Industry Tints (Subtle Overlay)

| Industry | Tint Hex | RGB | CSS Class |
|----------|----------|-----|-----------|
| Retail | `#f97316` Orange | `249, 115, 22` | `.industry-retail` |
| Financial Services | `#0ea5e9` Cyan | `14, 165, 233` | `.industry-financial-services` |
| Healthcare | `#ec4899` Pink | `236, 72, 153` | (JS-only) |
| Media | `#8b5cf6` Violet | `139, 92, 246` | (JS-only) |

Sets `--industry-tint` and `--industry-tint-rgb`.

## Theming Mechanism

`PersonaContext.tsx` applies CSS variables to `:root` via `useEffect` on persona/industry change. It also sets a compound class on `<body>`:

```
document.body.className = `persona-brand industry-retail`
```

Three ways to consume theme tokens in components:

1. **CSS variable in Tailwind**: `bg-[var(--accent)]`, `text-[var(--text-primary)]`
2. **Utility classes from index.css**: `.accent-bg-5`, `.accent-text`, `.accent-border`
3. **`themeClasses` export from PersonaContext**: Pre-built Tailwind strings like `themeClasses.card`, `themeClasses.buttonPrimary`

## Card System

| Variant | Class | Description |
|---------|-------|-------------|
| Surface | `.theme-card` | White bg, 1px Slate 200 border, tiny shadow |
| Elevated | `.theme-card-elevated` | Slightly more shadow depth |
| Accent | `.theme-card-accent` | Left 3px solid `--accent` border strip |
| Persona Glow | `.persona-glow-card` | Top 3px solid `--accent` border strip |
| Dashboard | `.dashboard-card` | Same as surface + `overflow: hidden` |

`ThemedCard` component accepts `variant` prop: `surface | elevated | accent | overlay`.

All cards: `border-radius: 8px`, `padding: var(--space-card)` (24px).

## Button System

| Variant | Class | Description |
|---------|-------|-------------|
| Primary | `.theme-button-primary` | Solid `--accent` bg, white text |
| Secondary | `.theme-button-secondary` | Transparent, accent text, subtle border |
| Ghost | `.theme-button-ghost` | No bg, secondary text, hover elevates |

All buttons: `border-radius: 6px`, `padding: 8px 16px`, `font-weight: 500`, `transition: 0.2s ease`.

## Badge System

| Variant | Class | Colors |
|---------|-------|--------|
| Default | `.theme-badge` | Accent-muted bg, accent-dark text |
| Success | `.badge-success` | Emerald 50 bg / Emerald 600 text |
| Warning | `.badge-warning` | Amber 50 bg / Amber 600 text |
| Danger | `.badge-danger` | Red 50 bg / Red 600 text |
| Info | `.badge-info` | Indigo bg / Indigo text |

All badges: `border-radius: 4px`, `font-size: 11px`, `font-weight: 500`, 1px colored border.

## Chart Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--chart-primary` | `#6366f1` Indigo | Primary data series |
| `--chart-success` | `#10b981` Emerald | Positive metrics |
| `--chart-warning` | `#f59e0b` Amber | Caution metrics |
| `--chart-danger` | `#ef4444` Red | Negative metrics |

Each has `-muted` and `-light` variants for fills/area backgrounds.

Tailwind config also exposes `chart.indigo`, `chart.emerald`, `chart.amber`, `chart.red`.

## Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | Inter, system fallbacks | All text |
| `--font-mono` | JetBrains Mono, Fira Code, SF Mono | Code, data |

- **Headers**: `font-weight: 600`, `letter-spacing: -0.02em`, `color: var(--text-primary)`
- **Table headers**: Uppercase, `font-size: 0.6875rem`, `letter-spacing: 0.05em`
- **Font loaded from**: Google Fonts CDN (400, 500, 600, 700, 800, 900)

## Animation Library

All CSS keyframe-based (no JS animation libraries required):

| Class | Effect | Duration |
|-------|--------|----------|
| `.animate-crisis-glow` | Pulsing rose drop-shadow | 2s infinite |
| `.animate-data-pulse` | Accent box-shadow pulse | 2s one-shot |
| `.animate-pulse-once` | Scale + fade | 1.5s forwards |
| `.animate-warning-border` | Border color oscillation | 2.5s infinite |
| `.animate-syncing` | Scale + opacity pulse | 1s infinite |
| `.animate-data-fade-in` | Fade up from 4px | 0.3s forwards |
| `.animate-persona-glow` | Top box-shadow pulse | 3s infinite |
| `.animate-scroll-x` | Horizontal marquee | 20s infinite |
| `.stagger-children` | Children fade in 50ms apart | 0.3s each |

Transition utilities:
- `.persona-transition` — Smooth opacity/transform/bg/border/shadow changes (0.25-0.3s)
- `.data-revalidating` — Shimmer overlay on stale data (1.5s infinite)
- `.smooth-card` — Hover lift with shadow transition
- `.chart-loading` / `.chart-ready` — Opacity transition for chart rendering

## Accent Utility Classes

| Class | Effect |
|-------|--------|
| `.accent-bg-5` | `rgba(accent, 0.03)` background |
| `.accent-bg-10` | `rgba(accent, 0.06)` background |
| `.accent-bg-15` | `rgba(accent, 0.09)` background |
| `.accent-bg-20` | `rgba(accent, 0.12)` background |
| `.accent-bg-solid` | Solid accent background |
| `.accent-text` | Accent foreground color |
| `.accent-border` | Accent border color |
| `.accent-top-border` | 2px top accent border |
| `.accent-top-border-strong` | 3px top accent border |

## Forbidden Elements

- No black backgrounds (`#000` or `#0f172a` as bg) — Sovereign Light is strictly light
- No glow effects — `--accent-glow` is always `transparent`
- No pie charts — use bar, stacked bar, or treemap
- No emojis in code, comments, or log output (use `[OK]`, `[ERROR]`, `[WARN]`)
- No SVG filter effects (blur, glow) on text

## Accessibility Rules

- Dark text on light backgrounds for maximum readability
- Focus state: `border-color: var(--accent)` + `box-shadow: 0 0 0 2px rgba(accent, 0.2)`
- Scrollbars: 6px width, Slate 300 thumb, Slate 50 track
- Subtle shadows only — maximum `0 4px 6px -1px rgb(0 0 0 / 0.05)`

## Integration

- **New components**: Use `bg-[var(--bg-surface)]` for card backgrounds. Use `text-[var(--text-primary)]` for text. Use `border-[var(--border-subtle)]` for borders.
- **Persona awareness**: Import `usePersona()` hook or use `themeClasses` export for pre-built Tailwind strings.
- **Charts (D3/Recharts)**: Use `--chart-primary` through `--chart-danger` variables. Access via `getComputedStyle(document.documentElement).getPropertyValue('--chart-primary')`.
- **New personas**: Add entry to `PERSONA_THEMES` in `PersonaContext.tsx` and matching `.persona-{name}` class in `index.css`.
- **New industries**: Add entry to `INDUSTRY_OVERLAYS` in `PersonaContext.tsx` and optional `.industry-{name}` class in `index.css`.

## Related Resources

- `assets/tokens.css` — Canonical design token variables. Copy into generated apps.
- `frontend/src/index.css` — Full 775-line design system source.
- `frontend/src/context/PersonaContext.tsx` — Runtime theme injection.
- `frontend/src/components/ThemedCard.tsx` — Card/Badge/Button/SectionHeader components.
