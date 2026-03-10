# Visual Atmosphere

Create depth and atmosphere rather than defaulting to flat solid backgrounds. Each design direction has characteristic textures that reinforce its mood.

## Atmosphere Patterns by Direction

### Data Dashboard (default)

**Mood**: Dense, precise, mission-critical. Think air traffic control, not a marketing site.

- **Background**: Near-black (`--bg-main: #060a12`) with subtle radial gradient from center creating a vignette effect
- **Texture**: Optional subtle dot-grid at 5% opacity on `--bg-surface` panels
- **Depth**: Cards use `backdrop-filter: blur(12px)` with semi-transparent backgrounds (`--bg-card: rgba(15, 23, 42, 0.6)`)
- **Borders**: Hairline borders at `--border-subtle` (8% white) -- visible but not distracting
- **Light source**: Implied top-left. Cards slightly lighter at top edge.

```css
.bg-atmosphere-dashboard {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(41, 181, 232, 0.03) 0%, transparent 70%),
    var(--bg-main);
}

.bg-dot-grid {
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

### Enterprise

**Mood**: Clean, trustworthy, no-nonsense. Think Notion or Linear.

- **Background**: Cool white (`--bg-main`) with no texture
- **Depth**: Cards use box-shadow instead of backdrop-filter: `0 1px 3px rgba(0,0,0,0.08)`
- **Borders**: Solid `--border-subtle` on all card edges (no gaps, no ambiguity)
- **Accents**: Single blue accent for interactive elements, everything else is gray-scale

```css
.card-enterprise {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}
```

### Modern SaaS

**Mood**: Approachable, confident, well-lit. Think Stripe or Vercel.

- **Background**: Warm white or cool gray with a single large gradient accent
- **Texture**: None -- relies entirely on spacing and typography for hierarchy
- **Depth**: Generous padding, large border-radius (12-16px), subtle shadows
- **Accent**: One bold gradient moment (hero section or primary CTA)

```css
.bg-atmosphere-saas {
  background:
    radial-gradient(ellipse at 70% -20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
    var(--bg-main);
}
```

### Apple Minimal

**Mood**: Restrained, premium, lots of breathing room. Think Apple.com product pages.

- **Background**: Pure white or near-white with no texture, no patterns
- **Depth**: Almost invisible. Very faint shadows: `0 0 0 1px rgba(0,0,0,0.04)`
- **Borders**: Often none -- elements separated purely by spacing
- **Typography**: Does all the work. Large, bold headings with generous margin-bottom

```css
.card-minimal {
  background: var(--bg-surface);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  padding: 32px;
}
```

### Creative

**Mood**: Expressive, art-directed, portfolio-grade. Think Awwwards winners.

- **Background**: Dark with gradient mesh or noise overlay
- **Texture**: Grain overlay at 3-5% opacity for analog warmth
- **Depth**: Dramatic shadows, layered z-indexes, overlapping elements
- **Layout**: Asymmetric. Grid-breaking. Diagonal flow.

```css
.bg-atmosphere-creative {
  background:
    radial-gradient(at 20% 80%, rgba(212, 91, 144, 0.12) 0%, transparent 50%),
    radial-gradient(at 80% 20%, rgba(41, 181, 232, 0.08) 0%, transparent 50%),
    var(--bg-main);
}

.grain-overlay::after {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
}
```

## Rules

- **One atmosphere per solution.** Do not mix dot-grid on some pages and grain on others.
- **Atmosphere is optional.** If the design direction is Enterprise or Apple Minimal, flat solid backgrounds are correct -- do not force texture.
- **Performance**: `backdrop-filter` is GPU-accelerated but expensive on large surfaces. Limit to cards and overlays, not full-page.
- **Contrast check**: Any texture or gradient must not reduce text contrast below WCAG AA (4.5:1). Test with the overlay active.
- **Dark theme textures at low opacity** (3-5%). Light theme textures even lower (1-3%) or none.
