---
name: build-quality-gate
description: "Pre-implementation quality gate: technical consistency, persona coverage, STAR completeness, and visual strategy alignment. Use for: pre-implementation review, coverage gaps, persona QA, requirement validation. Triggers: /speckit.quality-gate, analyze spec, quality check, persona review"
parent_skill: build_solution
---

# Quality Gate - Pre-Implementation Review

> Technical consistency analysis and persona/UX reflection before generating data and implementing.

## When to Load

After `001_plan/SKILL.md` has generated the plan and task checklist.

## Prerequisites

Files must exist in `specs/{solution-name}/`:
- `spec.md` (required) — with Section 2 (Personas & Stories) and Section 5 (Application UX)
- `plan.md` (required)
- `tasks.md` (required)
- `domain-model.yaml` (required)
- `semantic-model.yaml` (optional)

If any required file missing, indicate which step to run first.

## Constraints

- **STRICTLY READ-ONLY**: Do not modify any files
- **Report only**: Present findings, let user decide actions
- Never hallucinate missing sections

## Workflow

This quality gate runs two phases sequentially: Phase A checks technical consistency across all artifacts, Phase B checks persona coverage and UX alignment. Both phases contribute findings to a single combined report.

**Express mode:** Run Phase A only. Skip Phase B (persona reflection) when a single persona is defined — persona coverage is straightforward and does not require a separate review pass.

## Phase A: Technical Consistency

### Step 1: Load Artifacts

```
Loading artifacts from specs/{solution}/...

✓ spec.md loaded
✓ plan.md loaded
✓ tasks.md loaded
✓ domain-model.yaml loaded
{✓/✗} semantic-model.yaml {loaded/not found}

Running Phase A: Technical consistency...
```

**Extract from each:**

| Artifact | Extract |
|----------|---------|
| `spec.md` | User stories, key questions, success criteria, out-of-scope |
| `plan.md` | Architecture decisions, components, data flow |
| `tasks.md` | Task IDs, phases, dependencies |
| `domain-model.yaml` | Entities, attributes, relationships |
| `semantic-model.yaml` | Metrics, dimensions, time grains |

### Step 2: Build Inventories

- **Requirements inventory**: Each user story with stable key (US1, US2...)
- **Question inventory**: Key questions with expected result types
- **Task coverage mapping**: Each task → requirements/questions it addresses
- **Entity inventory**: All entities across spec, domain model, semantic model

### Step 3: Detection Passes

Limit to **50 findings total** across both phases.

**A. Duplication Detection**
- Near-duplicate requirements or user stories
- Redundant key questions
- Mark lower-quality for consolidation

**B. Ambiguity Detection**
- Vague adjectives: *fast, scalable, secure, intuitive, robust, seamless*
- Unresolved placeholders: *TODO, TBD, TKTK, ???, [placeholder]*
- Unmeasurable criteria: *"good performance"*, *"user-friendly"*

**C. Underspecification**
- User stories missing acceptance criteria
- Key questions without expected result type
- Tasks referencing undefined components
- Entities missing in domain model

**D. Coverage Gaps**
- User stories with zero tasks
- Key questions not covered by any task
- Entities in spec not in domain-model.yaml
- Metrics in semantic model not derivable from domain model

**E. Inconsistency**
- Terminology drift (same concept named differently)
- Entity mismatches between spec and domain model
- Conflicting requirements or constraints

**F. Semantic Model Alignment** (if semantic-model.yaml exists)
- Metrics reference valid entities
- Dimensions map to domain model attributes
- Time grains align with date fields

### Step 4: Severity Assignment

| Severity | Criteria |
|----------|----------|
| **CRITICAL** | Missing core artifact, user story with zero coverage, entity mismatch blocking implementation |
| **HIGH** | Duplicate/conflicting requirement, ambiguous security/performance claim, key question uncovered |
| **MEDIUM** | Terminology drift, missing edge case coverage, semantic model mismatch |
| **LOW** | Style/wording improvements, minor redundancy, optional enhancements |

## Phase B: Persona & UX Reflection

### Step 5: Extract Personas

From `spec.md`, extract:
- All personas (Strategic, Operational, Technical) with role titles
- STAR journeys for each persona
- Application pages and layouts
- Component-to-persona mapping

```
Running Phase B: Persona & UX reflection...

Found:
- {n} personas: {persona_list}
- {n} STAR journeys
- {n} application pages
```

### Step 6: Persona Coverage Review

For each persona, verify:

| Check | Criteria | Pass If |
|-------|----------|---------|
| Entry point exists | Persona has a dedicated page, tab, or landing view | At least one page targets this persona |
| Pain points addressed | At least 1 persona pain point maps to a defined feature | Feature list covers stated pain points |
| Terminology fit | Labels, metrics, and descriptions match role level | Executive sees business terms, not raw column names |
| Quantifiable KPI | At least 1 measurable metric tied to the persona | KPI has a number, percentage, or delta |

### Step 7: STAR Navigation Assessment

For each persona, verify all 4 STAR elements are present and concrete:

| STAR Element | What to Verify | Flag If |
|--------------|---------------|---------|
| **Situation** | KPI card or metric showing current gap/problem | Missing or shows generic "overview" |
| **Task** | Clear statement of what needs to be decided | Vague ("explore data") instead of specific |
| **Action** | Interactive element (filter, toggle, parameter, chat input) | No interactivity, view-only |
| **Result** | Visualization showing impact (before/after, projected savings) | No measurable outcome shown |

### Step 8: Role-Based Visual Strategy

Verify each persona type gets appropriate visualizations:

| Persona Type | Expected Visuals | Anti-Patterns |
|-------------|-----------------|---------------|
| Executive / Strategic | KPI cards, before/after charts, trend lines, projected savings | Raw data tables, technical jargon, too many charts |
| Operational / Analyst | Interactive tables, histograms, filters, drill-down, alerts | Only high-level aggregations, no filtering |
| Technical / Data | ROC curves, feature importance, raw data explorer, model diagnostics | No drill-down, no access to underlying data |

### Step 9: Tone Alignment Check

| Do | Avoid |
|----|-------|
| Lead with conclusion ("Yield improved 12%") | Lead with method ("We ran a regression...") |
| Quantified impact ("saves $2.3M/year") | Vague benefit ("improves efficiency") |
| Active verbs ("Reduce", "Detect", "Predict") | Passive voice ("Data is analyzed...") |
| Tight structure (KPI → insight → action) | Walls of text with buried findings |

## Combined Report

### Step 10: Produce Quality Gate Report

**⚠️ MANDATORY CHECKPOINT**: Present the combined report. Auto-proceed in Full Auto mode, pause otherwise.

**Log**: Record `approval` — append to `specs/{solution}/decision-log.jsonl`: step "Quality Gate, Step 10: Gate Report", value_selected (Proceed/Fix Issues/Cancel), alternatives, rationale (include pass/fail summary and issue counts).

```markdown
# Quality Gate Report: {solution-name}

## Summary

| Metric | Value |
|--------|-------|
| User Stories | {n} |
| Key Questions | {n} |
| Tasks | {n} |
| Entities | {n} |
| Personas | {n} |
| **Technical Coverage** | {%} |
| **Persona Coverage** | {n}/{total} fully covered |
| **STAR Completeness** | {n}/{total} complete |
| **Critical Issues** | {n} |
| **High Issues** | {n} |

## Phase A: Technical Findings

| ID | Category | Severity | Location | Summary | Recommendation |
|----|----------|----------|----------|---------|----------------|
| F001 | {cat} | {sev} | {file:section} | {summary} | {fix} |

### Coverage Matrix

| Requirement | Has Task? | Task IDs | Status |
|-------------|-----------|----------|--------|
| US1 | ✓ | D1, B2 | Covered |
| US2 | ✗ | - | **Gap** |

### Key Question Coverage

| Question | Covered By | Status |
|----------|------------|--------|
| Q1: "What were total sales?" | D4, B4 | Covered |
| Q2: "Which store performed best?" | - | **Gap** |

## Phase B: Persona & UX Findings

### Persona Coverage

| Persona | Entry Point | Pain Points | Terminology | KPI | Overall |
|---------|-------------|-------------|-------------|-----|---------|
| {persona} | {status} | {status} | {status} | {status} | {PASS/WARN/FAIL} |

### STAR Completeness

| Persona | Situation | Task | Action | Result | Complete? |
|---------|-----------|------|--------|--------|-----------|
| {persona} | {✅/❌} | {✅/❌} | {✅/❌} | {✅/❌} | {Yes/No} |

### Visual Strategy Alignment

| Persona | Current Visuals | Appropriate? | Recommendation |
|---------|----------------|-------------|----------------|
| {persona} | {visuals} | {✅/❌} | {recommendation} |

## Gaps Found

1. **{Source}**: {issue} → {recommendation}
2. ...

## Persona Worksheets

### {Persona Name} — {Role Title}

- **Entry point**: {page/tab}
- **Pain points addressed**: {list}
- **STAR journey**: S:{status} T:{status} A:{status} R:{status}
- **Visual strategy**: {appropriate/needs adjustment}
- **Tone**: {aligned/needs revision}
- **Recommended fixes**: {list}
```

### Step 11: Determine Readiness

**If CRITICAL issues exist:**
```
⚠️ CRITICAL issues found - resolve before implementation

Blocking issues:
1. {issue 1}
2. {issue 2}

Recommended actions:
- {action 1}
- {action 2}

[Fix Issues] [Proceed Anyway] [Cancel]
```

**If only LOW/MEDIUM issues:**
```
✓ Ready for implementation

{n} minor issues found (non-blocking)

Recommendations:
- {improvement 1}
- {improvement 2}

[Proceed to Generate Data] [Review Issues First] [Cancel]
```

## Common Persona Issues and Fixes

| Issue | Fix |
|-------|-----|
| No persona-specific entry point | Add role-based landing page or tab |
| Action doesn't change outcome | Make results reactive and quantified (filter → updated KPI) |
| Metrics are vague | Use explicit KPI deltas or percentages (e.g., "12% reduction") |
| Language mismatched to role | Rewrite labels using role vocabulary (exec: business terms, tech: technical terms) |

## Stopping Points

- ✋ **Checkpoint** after combined report (Step 10) — auto-proceed in Full Auto mode

## Output

Markdown quality gate report (displayed, not written to file) with:
- Technical consistency findings (max 50)
- Coverage matrices (requirements + questions)
- Persona coverage, STAR completeness, visual alignment
- Combined readiness determination
- Recommended next actions

## Next Skill

If ready → Load `003_generate/SKILL.md`
If issues → Return to manual spec edits or re-run `specify_solution`
