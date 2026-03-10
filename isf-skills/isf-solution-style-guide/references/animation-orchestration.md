# Animation Orchestration

One well-orchestrated page load creates more delight than scattered micro-interactions. This reference provides recipes for combining the 18 animations in `design-system.css` into cohesive sequences.

## Principle

Animations should tell a story: the page "assembles" in a logical order that mirrors how a user reads it. Top-to-bottom, important-to-supporting, container-then-content.

## Page Load Recipe (Data Dashboard)

```
Time 0ms    ─ Header fades in (animate-fade-in, 200ms)
Time 100ms  ─ KPI strip staggers in (stagger-children on KPIStrip, 50ms per card)
Time 400ms  ─ Main chart area fades up (animate-slide-up, 300ms)
Time 500ms  ─ Data table rows stagger (stagger-children, 30ms per row, max 10)
Time 700ms  ─ Sidebar slides in from right (animate-slide-in-right, 300ms)
```

Implementation:

```tsx
<header className="animate-fade-in">...</header>
<KPIStrip className="stagger-children" />
<main className="animate-slide-up" style={{ animationDelay: '400ms' }}>...</main>
<EntityDataTable className="stagger-children" style={{ animationDelay: '500ms' }} />
<AgentSidebarPanel className="animate-slide-in-right" style={{ animationDelay: '700ms' }} />
```

## Page Load Recipe (Apple Minimal)

Slower, more deliberate. Fewer elements, longer pauses.

```
Time 0ms    ─ Page title fades in (animate-fade-in, 400ms ease-out)
Time 300ms  ─ Subtitle/description fades in (animate-fade-in, 400ms)
Time 600ms  ─ Primary content block slides up (animate-slide-up, 500ms)
Time 1000ms ─ Supporting content fades in (animate-fade-in, 300ms)
```

## Hover and Interaction States

| Element | Hover | Active | Transition |
|---------|-------|--------|------------|
| KPI card | `bg-card-hover` + subtle scale(1.01) | `setPendingPrompt()` fires | 150ms ease-out |
| Table row | `bg-card-hover` + border-left accent | row selected state | 100ms ease-out |
| Sidebar toggle | icon rotation 180deg | panel slides | 200ms ease-out |
| Chart element | tooltip appears + element brightens | drill-down triggers | 150ms ease-out |

## Status Animations (When to Use Which)

| Animation | Trigger | Duration |
|-----------|---------|----------|
| `animate-crisis-glow` | KPI crosses critical threshold | Persistent until resolved |
| `animate-warning-border` | KPI in warning range | Persistent until resolved |
| `animate-syncing` | Data refresh in progress | Until refresh completes |
| `data-revalidating` (shimmer) | Any SWR revalidation | Until data arrives |
| `ai-thinking-border` | Agent streaming active | Until stream completes |
| `animate-data-pulse` | Value just changed | 1s, single play |
| `status-online` (ring pulse) | Live connection indicator | Persistent |

## Reduced Motion

All orchestration must respect `prefers-reduced-motion`. When active:
- Replace slide/scale animations with simple opacity fades
- Remove stagger delays (all elements appear at once)
- Keep status indicators (crisis-glow, warning-border) but use static color instead of animation

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Anti-Patterns

- **Everything animates at once** -- defeats the purpose of orchestration. Stagger or sequence.
- **Bounce/elastic easing on data elements** -- feels playful, undermines data credibility. Use `ease-out`.
- **Animation on every re-render** -- only animate on mount or explicit state transitions, not on data updates (except `data-revalidating` shimmer).
- **Delay > 1s on any element** -- users lose patience. Total page assembly should complete in under 1s.
