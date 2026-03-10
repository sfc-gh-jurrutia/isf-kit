# Typography

Typography carries hierarchy. Maximize weight contrast between headings and body text. Pair a distinctive display font with a refined body/mono font.

## Default Stack

`tokens.css` ships with Inter + JetBrains Mono as system fallbacks. These are **fallbacks**, not the design choice. Every solution should load at least one display font via Google Fonts or local `@font-face`.

## Font Pairings by Design Direction

| Direction | Display (headings, KPIs) | Body | Mono (code, metrics) | Load via |
|-----------|--------------------------|------|----------------------|----------|
| **Data Dashboard** | DM Sans 700 | DM Sans 400 | JetBrains Mono | `fonts.googleapis.com` |
| **Data Dashboard** (alt) | Plus Jakarta Sans 700 | Plus Jakarta Sans 400 | IBM Plex Mono | `fonts.googleapis.com` |
| **Enterprise** | Source Sans 3 700 | Source Sans 3 400 | Source Code Pro | `fonts.googleapis.com` |
| **Modern SaaS** | Outfit 600 | Outfit 400 | Fira Code | `fonts.googleapis.com` |
| **Apple Minimal** | SF Pro Display (system) | SF Pro Text (system) | SF Mono (system) | system font stack |
| **Creative** | Clash Display 600 | Satoshi 400 | JetBrains Mono | `fontsource` or self-host |

## Loading Pattern

Add to `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Override in `tokens.css` or a project-level override:

```css
:root {
  --font-display: 'DM Sans', var(--font-sans);
  --font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
}
```

## Typography Scale

Use a consistent scale across all solutions. Headings use `--font-display`, body uses `--font-sans`, metrics/code use `--font-mono`.

| Element | Size | Weight | Font |
|---------|------|--------|------|
| Page title (h1) | 1.875rem (30px) | 700 | display |
| Section heading (h2) | 1.25rem (20px) | 600 | display |
| Card heading (h3) | 0.875rem (14px) | 600 | display |
| Body text | 0.8125rem (13px) | 400 | sans |
| KPI value | 1.5rem (24px) | 700 | mono |
| KPI label | 0.6875rem (11px) | 500 | sans |
| Table cell | 0.75rem (12px) | 400 | sans |
| Code / SQL | 0.75rem (12px) | 400 | mono |

## Rules

- **Never use more than 2 font families** (display + mono is fine; adding a third creates noise).
- **Weight contrast matters more than size contrast.** A 700-weight heading at 14px reads as more important than a 400-weight heading at 18px.
- **KPI values are always mono.** Numbers in monospace align vertically and feel data-native.
- **Do not vary font choices across pages** within the same solution. Lock the pair once.
