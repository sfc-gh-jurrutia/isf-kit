---
name: isf-solution-style-guide
description: >
  Cross-cutting design system for all ISF solutions. Provides dual-theme tokens
  (dark default, light available), component class library, animation system,
  chart palette, accessibility rules, and integration instructions. Use when:
  styling React apps, creating visualizations, applying theme tokens, checking
  design compliance, or onboarding to the visual system. Triggers: colors, theme,
  dark theme, light theme, style guide, design tokens, card system, animation,
  chart colors, accessibility, snowflake blue.
---

# ISF Solution Style Guide

## When to Use

Load this skill when generating any visual output: React apps, notebooks, charts, or documentation. Provides the canonical design tokens and component classes that all ISF solutions share.

## Design Philosophy

Every generated interface should feel **modern, minimal, and production-ready** -- not like a template. These six principles govern all visual decisions.

1. **Restraint over decoration.** Fewer elements, highly refined. White space is a feature, not wasted space.
2. **Typography carries hierarchy.** Maximize weight contrast between headings and body text. Consistent sizing across heading levels (h1 -> h2 -> h3).
3. **One strong color moment.** Dark neutral backgrounds first. Introduce one confident accent (`--snowflake-blue` or persona accent). If a color could appear on a poster, it's probably timeless.
4. **Spacing is structure.** Use an 8 px grid via design tokens. Tighter gaps group related elements; generous gaps let hero content breathe.
5. **Accessibility is non-negotiable.** WCAG AA contrast minimums. Focus indicators. Semantic HTML. Keyboard navigation. See the Accessibility section below.
6. **No generic AI aesthetics.** Actively reject: purple-on-white gradients, cliched card grids with uniform spacing, predictable layouts, and cookie-cutter component patterns. Every interface should feel designed for its specific domain. If it could be any dashboard for any company, it's wrong. Bold maximalism and refined minimalism both work -- the key is intentionality, not intensity.

## Theme Selection

Read the solution archetype from `plan.md` and apply the appropriate theme:

| Archetype | Theme | Rationale |
|-----------|-------|-----------|
| AI Copilot | Dark (default) | Command center feel, reduces eye strain for monitoring |
| Operational Dashboard | Dark | Real-time data monitoring, dark backgrounds make data pop |
| Predictive Analytics | Dark | ML visualizations benefit from dark canvas |
| Self-Service Analytics | Light | Enterprise users expect light, professional feel |
| Knowledge Assistant | Light | Document-centric, reading-heavy interface |
| Data Quality Monitor | Dark | Alert-focused, status indicators need dark background contrast |

Set theme on `<html>`: `<html data-theme="dark">` or `<html data-theme="light">`.

If the user or plan specifies a theme preference, that overrides the archetype default.

## Design Direction

Beyond dark/light theme, each archetype has an aesthetic direction that guides spacing, density, and visual personality. Select the direction that best matches the user's intent, or ask if unclear.

| Direction | When to use | Key traits |
|-----------|------------|------------|
| **Data Dashboard** (default) | AI copilot, operational dashboard, predictive analytics | Data-dense, optimized for scannability, consistent vertical alignment, clear metric hierarchy: KPI -> trend -> detail |
| **Enterprise** | Self-service analytics, knowledge assistant, internal tools | Information-dense, well-defined regions, compact spacing scale (4/8/12/16/24 px), robust form handling, fully keyboard-navigable |
| **Modern SaaS** | Customer-facing portals, onboarding flows | Neutral palette, one strong accent, 8 px grid, generous white space, clean and professional |
| **Apple Minimal** | Executive dashboards, presentation-oriented views | Near-monochrome, warm grays, large type hierarchy, abundant white space, micro-interactions (150-250 ms ease-out) |
| **Creative** | Marketing demos, portfolio showcases | Bold, expressive, strong visual personality, asymmetric layouts, dramatic scale contrast, editorial typography |

Most ISF solutions use **Data Dashboard** direction. Map from archetypes:

| Archetype | Theme | Direction |
|-----------|-------|-----------|
| AI Copilot | Dark | Data Dashboard |
| Operational Dashboard | Dark | Data Dashboard |
| Predictive Analytics | Dark | Data Dashboard |
| Self-Service Analytics | Light | Enterprise |
| Knowledge Assistant | Light | Modern SaaS |
| Data Quality Monitor | Dark | Data Dashboard |

## Design Thinking (Pre-Flight)

Before writing any code, commit to a clear aesthetic direction. Run once per solution.

**Derive from `plan.md` or ask the user:**

1. **Purpose**: What problem does this interface solve? Who uses it daily?
2. **Tone**: Pick a specific flavor within the design direction -- not just "Data Dashboard" but "dense Bloomberg terminal feel" or "calm observatory with breathing data."
3. **Memorable moment**: The ONE visual element someone will remember. A bold KPI strip with crisis glow? A glass-morphism sidebar? An animated data lineage?

**Then lock these decisions:**

| Decision | Lock before scaffold |
|----------|---------------------|
| Font pair | Display + body/mono. See `references/typography.md` |
| Color moment | Which accent dominates? Where does it appear most? |
| Spatial signature | Asymmetric sidebar, overlapping cards, generous negative space, or controlled density? |
| Atmosphere | Subtle dot-grid, noise texture, gradient mesh, or clean solid? See `references/visual-atmosphere.md` |
| Animation recipe | Page-load sequence, hover states, transition style. See `references/animation-orchestration.md` |

**⚠️ STOPPING POINT**: Present aesthetic direction to user before proceeding to scaffold.

## Design Tokens (`assets/tokens.css`)

Copy `assets/tokens.css` into the project. It provides:

| Layer | Contents | Override |
|-------|----------|---------|
| `:root` (shared) | Brand colors, status colors, chart palette, typography, spacing | Never -- these are constant |
| `[data-theme="dark"]` | Backgrounds, text, borders, scrollbar for dark theme | Default |
| `[data-theme="light"]` | Backgrounds, text, borders, scrollbar for light theme | Set via `data-theme` attr |
| Persona accents | `--accent`, `--accent-rgb`, etc. | Set via JS at runtime |

Key brand tokens: `--snowflake-blue: #29B5E8`, `--firstlight: #D45B90`, `--valencia-orange: #FF9F36`.

## Component Classes (`assets/design-system.css`)

Copy `assets/design-system.css` into the project. It provides:

| System | Variants | Key Classes |
|--------|----------|------------|
| Cards | 5 | `.dashboard-card`, `.theme-card`, `.theme-card-elevated`, `.theme-card-accent`, `.persona-glow-card` |
| Buttons | 3 | `.theme-button-primary`, `.theme-button-secondary`, `.theme-button-ghost` |
| Badges | 5 | `.theme-badge` + `.badge-success/warning/danger/info` |
| Status dots | 4 | `.status-dot` + `.status-dot-success/warning/danger/idle` |
| Tables | 3 | `.table-header`, `.table-row-interactive`, `.table-row-selected` |
| Prose | 1 | `.prose` with sub-selectors for markdown rendering |
| Trace steps | 5 | `.trace-step` + `.trace-step-thinking/tool/search/result` |
| Layout | 2 | `.drawer-overlay`, `.intelligence-drawer` |

## Animation Library (18 animations in `design-system.css`)

| Category | Classes | Use Case |
|----------|---------|----------|
| Entry | `.animate-data-fade-in`, `.animate-slide-up`, `.animate-fade-in` | Components appearing |
| Slide | `.animate-slide-in-right`, `.animate-slide-out-right` | Sidebar/drawer enter/exit |
| Status | `.animate-crisis-glow`, `.animate-warning-border`, `.animate-syncing` | Critical thresholds, warnings |
| Loading | `.data-revalidating` (shimmer), `.ai-thinking-border` | Data fetching, AI processing |
| Data | `.animate-data-pulse`, `.data-updated`, `.metric-glow` | Value changes, critical metrics |
| Orchestration | `.stagger-children` (10 steps, 50ms apart) | List/grid rendering |
| Live | `.status-online` (ring pulse) | Live data indicators |

## Chart Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--chart-primary` | `#6366f1` | Primary data series |
| `--chart-success` | `#10b981` | Positive metrics |
| `--chart-warning` | `#f59e0b` | Caution metrics |
| `--chart-danger` | `#ef4444` | Negative metrics |

Each has `-muted` and `-light` variants for area fills. Access in JS: `getComputedStyle(document.documentElement).getPropertyValue('--chart-primary')`.

## Accessibility (CRITICAL)

**⚠️ STOP**: Before creating any comparison visual, verify color choices.

- **Red-Green**: Do NOT use red/green together (affects ~8% of males)
- **Before/After**: Use Orange `#F59E0B` and Blue `#29B5E8`, NOT red and green
- **Categorical**: Use colorblind-safe palettes (Plotly `Set2` or `Safe`)
- **Focus state**: `border-color: var(--accent)` + `box-shadow: 0 0 0 2px rgba(accent, 0.2)`
- **Text contrast**: minimum 4.5:1 ratio against background

| Comparison Type | Wrong | Correct |
|-----------------|-------|---------|
| Before/After | Red / Green | Orange `#F59E0B` / Blue `#29B5E8` |
| Good/Bad | Red / Green | Blue / Orange |

## Documentation Style

All notebooks and documentation use the **Annotated/Practitioner** style:
- 5-10 lines per markdown section
- Technical but accessible; assumes domain background
- Explain "why" briefly, not "how" in detail
- Include guidance on interpreting results

## Forbidden Elements

- No emojis in code, comments, logs, or documentation (use `[OK]`, `[ERROR]`, `[WARN]`)
- No pie charts (use bar, stacked bar, or treemap)
- No SVG filter effects (glow, blur, shadow) on text
- No hardcoded hex colors in components -- always use `var()` tokens
- Shell scripts: use `set -e` and `set -o pipefail`

## Integration

- **React apps**: Copy `assets/tokens.css` + `assets/design-system.css` into project. Set `data-theme` on `<html>`. Reference variables as `var(--snowflake-blue)`.
- **Notebooks**: Follow Annotated/Practitioner style. Use hex values from tokens for Plotly/Altair charts.
- **Charts (Plotly/Altair/Recharts)**: Use `--chart-primary` through `--chart-danger`. Check Accessibility table for comparisons.

## Stopping Points

- ⚠️ After theme selection: confirm with user before applying
- ⚠️ Before creating comparison visuals: verify colorblind-safe choices

## Output

- `tokens.css` copied into project `src/ui/src/` 
- `design-system.css` copied into project `src/ui/src/`
- `data-theme` attribute set on `<html>` element

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Theme not applying | Verify `data-theme` attribute on `<html>`, not `<body>` |
| Animations janky | Check for CSS `transform` conflicts with parent elements |
| Contrast too low | Switch to opposite theme, or adjust card backgrounds |
| Persona accent not showing | Ensure JS sets `--accent` and `--accent-rgb` on `:root` |

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `references/typography.md` | Font pairings per design direction, loading patterns | During Design Thinking pre-flight |
| `references/animation-orchestration.md` | Recipes for combining the 18 animations into cohesive sequences | During implementation |
| `references/visual-atmosphere.md` | Texture, background, and depth patterns per direction | During Design Thinking pre-flight |
| `references/snowflake_color_scheme.md` | Snowflake brand color reference | When selecting palette |
| `assets/tokens.css` | Canonical design tokens | Always -- copied into project |
| `assets/design-system.css` | Component class library | Always -- copied into project |
