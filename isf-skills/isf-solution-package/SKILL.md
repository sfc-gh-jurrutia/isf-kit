---
name: isf-solution-package
description: >
  Create solution packages: presentation pages, SVG diagrams, blogs, slides,
  LinkedIn blurbs, and video scripts. Use when: preparing solution deliverables,
  creating executive presentations, generating architecture diagrams, or
  packaging a solution for distribution.
parent_skill: isf-solution-engine
---

# ISF Solution Package

## Overview

A Solution Package is the complete set of presentation materials to communicate a Snowflake solution across all channels. Sequential workflow ensures narrative consistency.

## Core Narrative

```
PROBLEM → SOLUTION → OUTCOME
   ↓          ↓          ↓
What hurts   How we     What gets
(and why)    fix it     better
```

## File Naming Convention

**CRITICAL**: All assets must use descriptive, solution-prefixed names.

```
solution_presentation/
├── {solution_name}_overview.md           # Foundation presentation page
├── {solution_name}_about.md              # Dual-audience About section
├── {solution_name}_blog.md               # External-source blog post
├── {solution_name}_linkedin_blurb.md     # LinkedIn post text (optional, can be in blog)
├── {solution_name}_slides.md             # Executive slide deck
├── {solution_name}_video_script.md       # Video script and specs
└── images/
    ├── {solution_name}_problem_impact.svg
    ├── {solution_name}_before_after.svg
    ├── {solution_name}_roi_value.svg
    ├── {solution_name}_architecture.svg
    └── {solution_name}_data_erd.svg
```

**Example**: For "Multi-Echelon Inventory Optimization":
- `multi_echelon_inventory_optimization_overview.md`
- `multi_echelon_inventory_optimization_architecture.svg`

## SVG Generation Guidelines

**CRITICAL**: Generate high-quality SVG images in management consulting executive presentation style.

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Dark theme** | Background: `#0f172a` (slate-900) |
| **Snowflake colors** | Primary: `#29B5E8`, Success: `#30D158`, Warning: `#F39C12`, Error: `#FF6B6B` |
| **Typography** | Font: Inter or Arial, weights 400/600/700 |
| **Shadows** | Subtle drop shadows with `flood-opacity="0.15"` |
| **Cards** | Rounded corners (`rx="12"`), `#1e293b` fill |

### Required SVG Assets

| Asset | Purpose | Key Elements |
|-------|---------|--------------|
| `problem_impact.svg` | Cost of inaction | 3 metric cards, visualization of core problem |
| `before_after.svg` | Transformation | Side-by-side comparison, improvement indicators |
| `roi_value.svg` | Business value | Total value circle, 4 value drivers, timeline |
| `architecture.svg` | System design | Left-to-right flow, Snowflake platform center |
| `data_erd.svg` | Data model | Tables with PK/FK indicators, relationships |

### SVG Template Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="700" viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="blueGrad">...</linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.15"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="700" fill="#0f172a"/>
  
  <!-- Title -->
  <text x="600" y="45" text-anchor="middle" font-family="Inter, Arial, sans-serif" 
        font-size="28" font-weight="700" fill="#f1f5f9">Title Here</text>
  
  <!-- Content cards with shadow filter -->
  <g transform="translate(x, y)" filter="url(#shadow)">
    <rect width="300" height="180" rx="12" fill="#1e293b"/>
    <!-- Card content -->
  </g>
</svg>
```

## Persona-Driven Content Optimization

**Integrate with `isf-solution-reflection-persona` skill** for tone and content alignment.

### Audience-Specific Language

| Persona | Content Rules | Visual Strategy |
|---------|---------------|-----------------|
| **Executive** | No jargon, outcome-focused, ROI first | KPI cards, before/after, geographic overview |
| **Operational** | Workflow clarity, action-oriented | Tables, filters, prioritized lists |
| **Technical** | Full depth, architecture details | ERD, system diagrams, algorithm notes |

### Tone: Pragmatic Orchestrator

| Do | Avoid |
|----|-------|
| Lead with the conclusion | Long background setup |
| Use quantified impact ($X, Y%) | Vague claims ("significant improvement") |
| Use active verbs | Passive voice |
| Keep structure tight | Overly narrative explanations |

## Sequential Workflow

| Step | Deliverable | Purpose |
|------|-------------|---------|
| 1 | Presentation Page | Foundation: narrative, visuals, content |
| 2 | Architecture Diagram | Technical visualization |
| 3 | About Section | Dual-audience explanation |
| 4 | Blog Post | SEO, external credibility |
| 5 | Presentation Slides | Executive meeting deck |
| 6 | Viral Video | Social distribution (60-120s) |

⚠️ STOP: Confirm which deliverables to generate and review the core narrative before proceeding.

## Step 1: Presentation Page (Foundation)

Establishes the 6-section narrative arc:

1. **Cost of Inaction** - Real-world event anchor with statistics
2. **Problem in Context** - 3-5 pain points with business impact
3. **The Transformation** - Before/after visualization
4. **What We'll Achieve** - Measurable outcomes tied to KPIs
5. **Why Snowflake** - Four pillars with solution-specific language
6. **How It Comes Together** - Step-by-step walkthrough

## Step 2: Architecture Diagram

Choose pattern based on solution type:

| Pattern | Use When |
|---------|----------|
| Left-to-Right | Most solutions (data journey) |
| Hub-and-Spoke | Data mesh/multi-BU |
| App-Centric | App-focused solutions |

## Step 3: About Section

Serves **dual audiences**:

| Audience | Content Rules |
|----------|--------------|
| Executive | No jargon, outcome-focused, analogies |
| Technical | Full depth, architecture, algorithms |

## Step 4: Blog Post + LinkedIn Blurb

**Critical Rule**: External sources only!

- ❌ No demo-specific metrics
- ✅ Industry analyst reports (Gartner, McKinsey, Deloitte)
- ✅ Trade associations, academic research
- ✅ Government/regulatory statistics

### LinkedIn Blurb (Post Text)

The blurb accompanies your article link and determines reach. Follow the **Golden Formula**:

1. **Hook (Lines 1-2)**: Metric-driven or pain-point opening. Must grab attention in 3 seconds.
2. **Context (Lines 3-5)**: Why this matters NOW. Connect to universal professional challenge.
3. **Value Snippets (Bullets)**: 3-5 scannable takeaways with → arrows. Include external metrics.
4. **Intent-Based CTA**: Thought-provoking question (not "read more").

**Critical**: Never put links in the blurb—add "Link in first comment" and post URL as first comment.

## Step 5: Presentation Slides

**Story Arc**: Situation → Complication → Resolution

| Slides | Content |
|--------|---------|
| 1-2 | Industry context, customer position |
| 3 | Pain, gap in current state |
| 4-9 | Vision, solution, proof, path forward |
| 10 | Clear next step (CTA) |

**Design Principles:**
- Full-sentence titles (state the insight, not the topic)
- One dominant visual per slide
- Answer-first (Pyramid style)
- 8-9 slides maximum

## Step 6: Viral Video

**Structure (60-120s):**
- Hook (10s): One shocking statistic
- Stakes (20s): Cost of inaction
- Solution (40s): How it works + Snowflake value
- CTA (20s): Single clear action

## Quality Checklist

Before delivering:

- [ ] All files use `{solution_name}_` prefix
- [ ] SVGs follow dark theme with Snowflake colors
- [ ] Content tone matches target persona
- [ ] Blog uses only external sources (no demo metrics)
- [ ] Slides have full-sentence insight titles
- [ ] ROI numbers are specific and defensible

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `references/presentation-page.md` | Full presentation page template and guidelines | Step 1 |
| `references/architecture-diagram.md` | Architecture diagram patterns and SVG templates | Step 2 |
| `references/blog.md` | Blog post structure and external source rules | Step 4 |
| `references/linkedin-blurb.md` | LinkedIn blurb golden formula | Step 4 |
| `references/slides.md` | Slide deck structure and design principles | Step 5 |
| `references/video.md` | Video script structure and specs | Step 6 |
| `assets/directory_structure.md` | File naming convention and directory layout | Always |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Presentation template not found | Check `assets/` directory for template files; download Snowflake branded templates if missing |
| Screenshots fail to capture | Ensure the deployed app is running and accessible; try manual screenshots if automated capture fails |
| Architecture diagram rendering issues | Use Mermaid syntax; verify diagram renders in a Mermaid preview tool before including |
| Blog post lacks technical depth | Re-read the `plan.md` architecture section and `isf-context.md` for technical details to include |
| Demo video recording issues | Use screen recording software; ensure the app is in a clean state with sample data loaded |

## Pipeline Complete

This is the **final skill** in the ISF Solution Engine pipeline. After packaging is complete, present the full deliverable summary to the user.

If running the full ISF pipeline via `isf-solution-engine`, the pipeline is complete.

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-solution-reflection-persona` | Provides persona tone and content alignment |
| `isf-solution-style-guide` | Design tokens, colors, accessibility rules for SVGs |
| `isf-spec-curation` | Source of KPIs, pain points, hidden discovery for narratives |
| `isf-solution-prepublication-checklist` | Run before this — solution must pass quality gates first |
