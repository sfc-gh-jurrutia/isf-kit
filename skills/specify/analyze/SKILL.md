---
name: specify-analyze
description: "Cross-artifact consistency and quality analysis before implementation. Use for: pre-implementation review, coverage gaps, requirement validation. Triggers: /speckit.analyze, analyze spec, quality check, pre-implementation review"
parent_skill: specify
---

# Analyze - Pre-Implementation Quality Gate

> Cross-artifact consistency and quality analysis (read-only)

## When to Load

After `tasks/SKILL.md` has generated task list, before implementation.

## Prerequisites

Files must exist in `specs/{demo-name}/`:
- `spec.md` (required)
- `plan.md` (required)
- `tasks.md` (required)
- `domain-model.yaml` (required)
- `semantic-model.yaml` (optional)

If any required file missing, indicate which step to run first.

## Workflow

### Step 1: Load Artifacts

```
Loading artifacts from specs/{demo}/...

✓ spec.md loaded
✓ plan.md loaded
✓ tasks.md loaded
✓ domain-model.yaml loaded
{✓/✗} semantic-model.yaml {loaded/not found}

Analyzing consistency...
```

**Extract from each:**

| Artifact | Extract |
|----------|---------|
| `spec.md` | User stories, key questions, success criteria, out-of-scope |
| `plan.md` | Architecture decisions, components, data flow |
| `tasks.md` | Task IDs, phases, dependencies |
| `domain-model.yaml` | Entities, attributes, relationships |
| `semantic-model.yaml` | Metrics, dimensions, time grains |

### Step 2: Build Semantic Models

- **Requirements inventory**: Each user story with stable key (US1, US2...)
- **Question inventory**: Key questions with expected result types
- **Task coverage mapping**: Each task → requirements/questions it addresses
- **Entity inventory**: All entities across spec, domain model, semantic model

### Step 3: Detection Passes

Limit to **50 findings total**.

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

### Step 5: Produce Report

**⚠️ MANDATORY STOPPING POINT**: Present analysis report.

```
## Analysis Report: {demo-name}

### Summary

| Metric | Value |
|--------|-------|
| User Stories | {n} |
| Key Questions | {n} |
| Tasks | {n} |
| Entities | {n} |
| **Coverage** | {%} |
| **Critical Issues** | {n} |
| **High Issues** | {n} |

### Findings

| ID | Category | Severity | Location | Summary | Recommendation |
|----|----------|----------|----------|---------|----------------|
| F001 | {cat} | {sev} | {file:section} | {summary} | {fix} |
| ... | ... | ... | ... | ... | ... |

### Coverage Matrix

| Requirement | Has Task? | Task IDs | Status |
|-------------|-----------|----------|--------|
| US1 | ✓ | D1, B2 | Covered |
| US2 | ✗ | - | **Gap** |
| ... | ... | ... | ... |

### Key Question Coverage

| Question | Covered By | Status |
|----------|------------|--------|
| Q1: "What were total sales?" | D4, B4 | Covered |
| Q2: "Which store performed best?" | - | **Gap** |
| ... | ... | ... |
```

### Step 6: Determine Readiness

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

[Proceed to Implement] [Review Issues First] [Cancel]
```

## Constraints

- **STRICTLY READ-ONLY**: Do not modify any files
- **Report only**: Present findings, let user decide actions
- Never hallucinate missing sections

## Stopping Points

- ✋ After presenting analysis report (Step 5)
- ✋ After readiness determination (Step 6)

## Output

Markdown analysis report (displayed, not written to file) with:
- Summary metrics
- Findings table (max 50)
- Coverage matrix
- Readiness determination
- Recommended next actions

## Next Skill

If ready → Load `implement/SKILL.md`
If issues → Return to `clarify/SKILL.md` or manual spec edits
