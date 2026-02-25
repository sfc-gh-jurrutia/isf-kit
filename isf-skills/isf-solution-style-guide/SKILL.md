---
name: isf-solution-style-guide
description: >
  Cross-cutting style guide for all ISF skills. Loaded by skills generating
  notebooks, Streamlit apps, React apps, charts, or documentation. Covers:
  color palette, accessibility, no-emoji rule, dark theme, visualization
  conventions. Triggers: colors, chart style, dark theme, snowflake blue,
  accessibility, color palette, style guide.
---

# Snowflake Style Guide

## Documentation Style

All notebooks and documentation should use the **Annotated/Practitioner** style:

- **Structure**: 5-10 lines per markdown section.
- **Tone**: Technical but accessible. Assumes domain background, not deep expertise.
- **Content**: Explain "why" briefly, not "how" in detail.
- **Avoid**: Analogies, ASCII art, step-by-step tutorial breakdowns (unless it's a tutorial).
- **Interpretation**: Include guidance on how to interpret results.

## Code & Output Conventions

### No Emojis
Do **NOT** use emojis in:
- Code comments
- Markdown documentation
- Print statements / Log output
- Notebook cells
- Shell script output

**Use text indicators instead:**
- `[OK]` or `Done:` (not ✅)
- `[ERROR]` or `Failed:` (not ❌)
- `[WARN]` (not ⚠️)

### Shell Scripts
- Use `set -e` and `set -o pipefail`.
- Use clear status outputs: `[OK]`, `[ERROR]`.
- Variables at the top (Configuration section).

## Data Visualization

### Colors
- **Primary**: Snowflake Blue `#29B5E8` (~80% of chart elements).
- **Positive/Success**: Green `#28a745`.
- **Negative/Failure**: Blue `#2563eb` (Avoid Red/Green for accessibility).
- **Background**: Dark Theme (`#121212` typically).

### Accessibility (CRITICAL)

**STOP**: Before creating any comparison visual, verify color choices.

- **Red-Green**: Do NOT use red/green together for distinctions (affects ~8% of males).
- **Before/After comparisons**: Use Orange (`#F59E0B`) and Blue (`#29B5E8`), NOT red and green.
- **Categorical**: Use colorblind-safe palettes (e.g., Plotly `Set2` or `Safe`).

| Comparison Type | Wrong | Correct |
|-----------------|-------|--------|
| Before/After | Red `#EF4444` / Green `#30D158` | Orange `#F59E0B` / Blue `#29B5E8` |
| Good/Bad | Red / Green | Blue / Orange |
| Old/New | Red / Green | Orange / Blue |

### Chart Types
- **Pie Charts**: Avoid. Use Bar, Stacked Bar, or Treemaps.
- **Exceptions**: Binary (Yes/No) or Dominant vs Other.

## Text Effects

### No Glow/Filter Effects on Text
Do **NOT** use SVG filter effects (glow, blur, shadow) on text:
- Reduces readability
- Renders inconsistently across viewers
- Fails accessibility standards

**Use clean text instead** with appropriate font-weight and color contrast.

## Integration

How consuming skills apply this guide:

- **React apps**: Copy `assets/tokens.css` into the project. Reference variables as `var(--snowflake-blue)`.
- **Streamlit apps**: Inject `assets/tokens.css` via `st.markdown("<style>...</style>")`. Use hex values from tokens for Plotly/Altair.
- **Notebooks**: Follow the Annotated/Practitioner style for markdown cells. Use text indicators (`[OK]`, `[ERROR]`) in output.
- **Charts (Plotly/Altair)**: Use `--snowflake-blue` (#29B5E8) as primary. Check the Accessibility table above for any comparison visual.

## Related Resources
- `assets/tokens.css` — Canonical design tokens. Copy into generated apps.

