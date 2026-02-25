---
name: specify-clarify
description: "Identify and resolve underspecified areas in solution specifications. Use for: ambiguity resolution, spec refinement, requirement clarification. Triggers: /speckit.clarify, clarify spec, resolve ambiguity"
parent_skill: specify_solution
---

# Clarify - Specification Ambiguity Resolution

> Identify and resolve underspecified areas in the solution specification

**Express mode:** Skip this skill entirely — ambiguities are resolved inline during spec generation.

## When to Load

After `specify_solution/SKILL.md` has generated specification files, before planning. Not loaded in Express mode.

## Prerequisites

Files must exist in `specs/{solution-name}/`:
- `spec.md` (required)

If missing, prompt user to run `/speckit.specify` first.

## Workflow

### Step 1: Load and Scan Specification

Read spec and perform structured ambiguity scan using this taxonomy. Mark each: **Clear** / **Partial** / **Missing**.

**Ambiguity Categories:**

| Category | Check For |
|----------|-----------|
| **Functional Scope** | Core goals, success criteria, out-of-scope declarations |
| **Domain & Data** | Entities, relationships, identity rules, state transitions |
| **Interaction & UX** | User journeys, error/empty/loading states |
| **Non-Functional** | Performance, scalability, reliability, security |
| **Integration** | External services, failure modes, data formats |
| **Edge Cases** | Negative scenarios, rate limiting, conflict resolution |
| **Constraints** | Technical constraints, explicit tradeoffs |
| **Terminology** | Canonical terms, consistency across spec |

```
Scanning specification...

✓ spec.md loaded

## Ambiguity Scan Results

| Category | Status | Notes |
|----------|--------|-------|
| Functional Scope | {status} | {notes} |
| Domain & Data | {status} | {notes} |
| Interaction & UX | {status} | {notes} |
| Non-Functional | {status} | {notes} |
| Integration | {status} | {notes} |
| Edge Cases | {status} | {notes} |
| Constraints | {status} | {notes} |
| Terminology | {status} | {notes} |

{n} areas need clarification.
```

**⚠️ MANDATORY STOPPING POINT**: Present scan results before proceeding.

**Log**: Record `approval` — append to `specs/{solution}/decision-log.jsonl`: step "Clarify, Step 1: Ambiguity Scan", value_selected (proceed/cancel), rationale (number of areas needing clarification).

### Step 2: Generate Clarification Questions

Create prioritized queue (max 5 questions total):
- Each answerable with multiple-choice OR short answer (≤5 words)
- Only include questions that materially impact implementation

**Question Types:**
- **Scope refinement**: What's in/out of scope?
- **Risk prioritization**: Which edge cases matter most?
- **Depth calibration**: How detailed should X be?
- **Boundary exclusion**: What explicitly won't be supported?
- **Scenario gap**: What happens when Y occurs?

### Step 3: Sequential Questioning

Present ONE question at a time.

**For multiple-choice:**
1. Analyze options and determine best recommendation
2. Present: `**Recommended:** Option {X} - {reasoning}`
3. Show options table
4. Accept: letter, "yes"/"recommended", or custom answer

**For short-answer:**
1. Provide suggested answer with reasoning
2. Accept: "yes"/"suggested" or custom answer

```
### Question {n} of {total}

{Question text}

**Recommended:** {Option} - {reasoning}

| Option | Description |
|--------|-------------|
| A | {option A} |
| B | {option B} |
| C | {option C} |

[A/B/C] or type your answer

[Skip] [Done] [Cancel]
```

**⚠️ MANDATORY STOPPING POINT**: Wait for response after each question.

**Log**: Record `configuration` — append to `specs/{solution}/decision-log.jsonl`: step "Clarify, Step 3: Question {n}", value_selected (chosen option or answer), alternatives (all options shown), rationale.

**Stop questioning when:**
- All critical ambiguities resolved
- User signals completion ("done", "skip remaining")
- 5 questions reached

### Step 4: Integrate Answers

After EACH accepted answer:

1. Ensure `## Clarifications` section exists in spec
2. Add `### Session {YYYY-MM-DD}` subheading if new session
3. Append: `- **Q**: {question} → **A**: {answer}`
4. Update appropriate spec section:
   - Functional → User Stories or Out of Scope
   - Data → Data Requirements
   - Non-functional → Technical Constraints
   - Edge case → Add to relevant user story
5. Save spec immediately

### Step 5: Validate

After all questions answered:

- [ ] One bullet per accepted answer in Clarifications
- [ ] ≤5 questions asked
- [ ] No lingering vague placeholders (TBD, ???)
- [ ] No contradictory statements remain
- [ ] Terminology consistent throughout

## Stopping Points

- ✋ **Checkpoint** after presenting scan results (Step 1) - auto-proceed in Full Auto mode
- ✋ **Required** after each question (Step 3) - wait for answer

## Output

```
✓ Clarification complete

Questions asked: {n}
Answers integrated: {n}

## Coverage Summary

| Category | Before | After |
|----------|--------|-------|
| Functional Scope | {status} | {status} |
| Domain & Data | {status} | {status} |
| ... | ... | ... |

Sections updated:
- {section 1}
- {section 2}

Next step: Run build_solution to plan, build, and deploy.
```

[Proceed to build_solution] [Ask More Questions] [Cancel]

## Next Skill

After completion → Spec is finalized. Run `build_solution` to plan and implement.
