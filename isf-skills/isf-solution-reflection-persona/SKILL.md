---
name: isf-solution-reflection-persona
description: >
  Review ISF solutions against defined personas and narrative flow. Use when:
  (1) auditing persona coverage from isf-context, (2) mapping STAR journeys,
  (3) identifying content gaps, (4) verifying tone matches persona level,
  or (5) reviewing UI against persona needs before publication.
parent_skill: isf-solution-engine
---

# ISF Persona Reflection

## Quick Start

### Core Concept

Evaluate an ISF solution against its defined personas. Ensure each persona's journey follows a clear Situation, Task, Action, Result arc. The STAR framework is a design philosophy — it should not be named in the end-user UI.

### Input

| Input | Source | Notes |
|-------|--------|-------|
| Personas | `isf-context.md` stakeholders section (PER-xxx) | Roles, priorities, success metrics |
| Solution pages | `src/ui/` React app routes | List pages or sections |
| Metrics | `isf-context.md` business_requirements.kpis | Quantifiable results required |
| UI Strategy | `plan.md` from `isf-solution-planning` | Page template, chart assignments |

## Workflow

```
1. LOAD PERSONAS
   └── Read isf-context.md stakeholders (primary_buyer, technical_champion, end_users)
   └── Map each to Strategic / Operational / Technical level

2. REVIEW EACH PERSONA
   └── Fill out the Persona Reflection Worksheet
   └── Verify STAR arc is complete
   └── Check tone and terminology match persona level

3. IDENTIFY GAPS
   └── Missing entry points for a persona
   └── Actions that don't change outcomes
   └── Vague metrics without quantification
   └── Language mismatched to role

4. RECOMMEND FIXES
   └── Specific page/component changes
   └── Missing visualizations or data points
   └── Terminology adjustments

   ⚠️ STOP: Present reflection report for review.
```

## Persona Reflection Worksheet

Fill one per persona:

```markdown
Persona: [Name / Role]
ISF ID: PER-xxx
Level: [Strategic / Operational / Technical]
Entry Point: [Page or section they land on]
Situation: [What they see first — the current problem]
Task: [Objective stated clearly]
Action: [Interactive elements available to them]
Result: [Quantified outcome shown after action]
Gaps: [Missing content, visuals, or interactions]
```

## Persona Levels

| Level | Typical Roles | Focus | Expected Visuals |
|-------|---------------|-------|-----------------|
| **Strategic** | VP, Director, C-Suite | ROI and business impact | KPI cards, before/after charts, trend lines |
| **Operational** | Manager, Supervisor | Workflow and issues | Interactive tables, filters, prioritized lists |
| **Technical** | Engineer, Analyst, Data Scientist | Model trust and root cause | Feature importance, confusion matrices, raw data |

## STAR Assessment

For each persona, verify:

- [ ] Entry point immediately presents the **Situation** (current problem)
- [ ] **Task** is clearly stated (what are we solving?)
- [ ] **Action** elements are interactive and intuitive
- [ ] **Result** is quantifiable and prominent
- [ ] Result updates in response to the action (not static)

## Tone Alignment

| Do | Avoid |
|----|-------|
| Lead with the conclusion | Long background setup |
| Use quantified impact ($X, Y%) | Vague claims ("significant improvement") |
| Use active verbs | Passive voice |
| Keep structure tight | Overly narrative explanations |
| Match vocabulary to persona level | Technical jargon for executives, oversimplification for engineers |

## Common Issues

| Issue | Fix |
|-------|-----|
| No persona-specific entry point | Add a role-based landing or navigation |
| Action does not change outcome | Make results reactive and quantified |
| Metrics are vague | Use explicit KPI deltas or percentages |
| Language mismatched to persona | Rewrite labels using role vocabulary |
| All personas see same view | Use tabs, conditional sections, or role-based routing |
| Hidden discovery not visible to any persona | Ensure at least one persona's journey reveals it |

## When to Split vs. Share Views

| Signal | Choice |
|--------|--------|
| Personas need different data depth | Use tabs or sidebar sections |
| Same story across roles | Shared page with role-tailored callouts |
| Executive needs summary, analyst needs detail | Dashboard with drill-down capability |

## Pre-Flight Checklist

- [ ] `isf-context.md` has defined personas with roles and pain points
- [ ] Each persona has a completed reflection worksheet
- [ ] STAR arc verified for each persona
- [ ] At least one quantifiable KPI per persona
- [ ] Actions update results within the same view
- [ ] Tone matches persona level
- [ ] Hidden discovery is accessible through at least one persona's journey

## Next Skill

After the persona reflection is complete:

**Continue to** `../isf-solution-prepublication-checklist/SKILL.md` for the final Ship / No Ship gate.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 7c.

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-spec-curation` | Defines the personas this skill reviews against |
| `isf-solution-react-app` | The app being evaluated |
| `isf-solution-testing` | Run before this — validates functional correctness |
| `isf-solution-prepublication-checklist` | Run after this — final gate before publication |
