---
name: "consolidated-demo-skill"
created: "2026-02-20T21:09:37.651Z"
status: pending
---

# Plan: Consolidated Demo Skill (Best Practices Compliant)

## Objective

Merge `snowflake-demo-drd-generation`, `snowflake-demo-planning`, and enhance `isf-kit/skills/specify` into a fully-guided demo generator that produces:

1. `spec.md` with DRD sections
2. `specs/{demo}/prompt_plan.md` capturing reasoning
3. SPCS-deployed React app

**Compliance Target**: SKILL\_BEST\_PRACTICES.md

---

## Best Practices Compliance Checklist

| Principle                 | How We Comply                                            |
| ------------------------- | -------------------------------------------------------- |
| SKILL.md under 500 lines  | Move DRD template, constraints to `references/`          |
| Conciseness               | Keep main skill lean, load references on-demand          |
| Mandatory stopping points | Use `⚠️ MANDATORY STOPPING POINT` markers                |
| Sub-skills for branches   | Existing pattern (clarify/, plan/, implement/) preserved |
| Directive language        | Use **Load**, **Execute**, **Continue to**               |
| No extraneous docs        | prompt\_plan.md is generated artifact, not documentation |
| Scripts use uv            | Add pyproject.toml for any new scripts                   |
| Single intent table       | Router in main SKILL.md with clear routing               |

---

## Final Directory Structure

```
skills/specify/
├── SKILL.md                          # ~300 lines (router + intake workflow)
├── pyproject.toml                    # Dependencies for generators
│
├── references/                       # Loaded on-demand (not in context by default)
│   ├── drd-template.md               # NEW: Full DRD template from gnn repo
│   ├── constraints.md                # NEW: Red flags + CSP + pre-flight
│   ├── intake-questions.md           # NEW: Standard DRD intake questions
│   └── star-narrative.md             # NEW: STAR method + Hidden Discovery
│
├── templates/                        # Output templates (not loaded into context)
│   ├── spec-template.md              # UPDATE: Add DRD sections
│   ├── prompt-plan-template.md       # NEW: Reasoning capture
│   ├── domain-model-template.yaml
│   ├── sample-questions-template.yaml
│   └── react/                        # NEW: React scaffolding assets
│       ├── frontend/
│       └── backend/
│
├── clarify/SKILL.md                  # Unchanged (~170 lines)
├── plan/SKILL.md                     # UPDATE: Add prompt_plan.md generation
├── tasks/SKILL.md                    # UPDATE: Add SPCS deploy tasks
├── analyze/SKILL.md                  # Unchanged (~200 lines)
├── generate/SKILL.md                 # Unchanged
│   ├── llm-powered/SKILL.md
│   └── rule-based/SKILL.md
├── implement/SKILL.md                # UPDATE: Add React scaffolding
├── deploy/SKILL.md                   # NEW: SPCS deployment (~150 lines)
│
├── generators/                       # Python code (existing)
│   └── ...
│
└── memory/
    └── constitution.md               # UPDATE: Add 3 new principles
```

---

## Detailed Changes

### 1. Main SKILL.md (\~300 lines)

**Structure following best practices:**

```
---
name: specify
description: "Generate Snowflake demo specifications and deploy to SPCS. Use for: creating demos, gathering requirements, deploying React apps. Triggers: new demo, create spec, demo specification, /speckit.specify"
---

# Specify - Demo Specification Generator

> Generate a demo specification through guided conversation and deploy to SPCS

## When to Use

- User wants to create a new Snowflake demo
- User needs to define requirements for a solution
- User mentions: Healthcare, Financial, Retail, Manufacturing, Energy, Media, SaaS

## Workflow Decision Tree
```

Start ↓ Step 1: Intake (2 rounds) ↓ Step 2: Generate spec.md ↓ ├─→ \[Ambiguities found] → Load clarify/SKILL.md │ ↓ └─→ \[Spec complete] ─────────→↓ ↓ Step 3: Architecture → Load plan/SKILL.md ↓ Step 4: Tasks → Load tasks/SKILL.md ↓ Step 5: Quality Gate → Load analyze/SKILL.md ↓ Step 6: Generate Data → Load generate/SKILL.md ↓ Step 7: Implement → Load implement/SKILL.md ↓ Step 8: Deploy → Load deploy/SKILL.md

```

## Workflow

### Step 1: Intake

**Load** `references/intake-questions.md` for standard questions.

**Round 1: Context** (batch these together)

| Question | Purpose |
|----------|---------|
| Industry + sub-segment | Determines default entities, pain points |
| Audience (Customer/Internal/Partner) | Shapes narrative tone |
| Primary persona | Guides visualization strategy |

**⚠️ MANDATORY STOPPING POINT**: Wait for Round 1 answers.

**Round 2: Discovery** (batch these together)

| Question | Purpose |
|----------|---------|
| Pain points | The "why" of the demo |
| Hidden Discovery | The "reveal" moment |
| Self-guided? | Affects tooltip/callout requirements |

**⚠️ MANDATORY STOPPING POINT**: Wait for Round 2 answers.

**Next:** Continue to Step 2.

### Step 2: Generate Specification

**Load** `references/drd-template.md` for DRD sections.
**Load** `references/star-narrative.md` for persona journeys.

**Generate files:**
1. `specs/{NNN}-{slug}/spec.md` using `templates/spec-template.md`
2. `specs/{NNN}-{slug}/domain-model.yaml`
3. `specs/{NNN}-{slug}/sample-questions.yaml`
4. `specs/{NNN}-{slug}/prompt_plan.md` using `templates/prompt-plan-template.md`

**Include in spec.md:**
- Strategic Overview with Hidden Discovery
- Persona STAR journeys (Strategic, Operational, Technical)
- Data Architecture
- Cortex Specs

**Record in prompt_plan.md:**
- All intake answers with reasoning
- Industry defaults applied
- Decisions made

**Next:** Continue to Step 3.

### Step 3: Route to Sub-Skills

**Load** `clarify/SKILL.md` → then **Load** `plan/SKILL.md`

...

## Sub-Skills

| Phase | Sub-Skill | When to Load |
|-------|-----------|--------------|
| Clarify | `clarify/SKILL.md` | After Step 2 if ambiguities exist |
| Plan | `plan/SKILL.md` | After spec complete |
| Tasks | `tasks/SKILL.md` | After plan complete |
| Analyze | `analyze/SKILL.md` | After tasks complete |
| Generate | `generate/SKILL.md` | After analyze passes |
| Implement | `implement/SKILL.md` | After data loaded |
| Deploy | `deploy/SKILL.md` | After implementation |

## Stopping Points

- ✋ After Intake Round 1
- ✋ After Intake Round 2
- ✋ After plan presentation (in plan/SKILL.md)
- ✋ Before SPCS deployment (in deploy/SKILL.md)

## Output
```

✓ Specification files created in specs/{NNN}-{slug}/ ✓ Demo deployed to SPCS

Files generated:

- spec.md (with DRD sections)
- domain-model.yaml
- sample-questions.yaml
- prompt\_plan.md (reasoning capture)

SPCS Service: {service\_url}

```
```

### 2. New Reference: references/constraints.md

Consolidates red flags, CSP rules, pre-flight checklist from `snowflake-demo-planning`:

```
# Demo Constraints Reference

> Load this reference when planning or implementing demos

## Red Flags - NEVER Do These

| Never | Instead |
|-------|--------|
| Run Streamlit locally | Deploy to Snowflake only |
| Put scripts in `scripts/` subdir | Scripts go in PROJECT ROOT |
| Name Streamlit dir `app/` | Always use `streamlit/` |
| Use D3.js, Leaflet, Plotly Geo | Use PyDeck for maps (CSP blocked) |
| Use CHECK constraints in DDL | Snowflake doesn't support |
| Hardcode credentials | Use `connection_name=` pattern |

## CSP Blocked Libraries

These are blocked by Snowflake's Content Security Policy:
- D3.js (any version)
- Leaflet
- Plotly geographic maps
- Any external CDN JavaScript

**Alternative for maps:** PyDeck with `map_style=None`

## Pre-Flight Checklist

Before implementation begins, verify:

- [ ] Three scripts in PROJECT ROOT: ./deploy.sh, ./run.sh, ./clean.sh
- [ ] Streamlit directory named `streamlit/`
- [ ] React directory named `react/` with frontend/ + backend/
- [ ] Synthetic data pre-generated with fixed seed (42)
- [ ] No CHECK constraints in DDL
- [ ] SPCS deployment config ready (if React app)

## Quick Decisions

### Cortex Feature Selection

| Need | Feature |
|------|---------|
| Natural language → SQL | Cortex Analyst |
| Document search / RAG | Cortex Search |
| Multi-tool orchestration | Cortex Agent |

### Visualization Library Priority

1. **Plotly** - Networks, Sankey, Treemaps, most charts
2. **Altair** - Statistical, faceted, interactive
3. **PyDeck** - Maps only (with `map_style=None`)

### App Type Selection

| Use Case | Choice |
|----------|--------|
| Interactive dashboard | Streamlit |
| Copilot / chat-first UI | React |
| ML training / exploration | Notebook |
```

### 3. New Reference: references/star-narrative.md

```
# STAR Narrative Framework

> Load when generating persona journeys in spec.md

## STAR Method (Design Philosophy)

Structure each persona's demo journey using Situation → Task → Action → Result.
(Do NOT reference "STAR" in demo UI—use as internal design philosophy.)

| Element | Purpose | Demo Implementation |
|---------|---------|---------------------|
| **Situation** | Show current state/problem | KPI cards showing gap, "before" metrics |
| **Task** | Define what needs solving | Clear header stating the challenge |
| **Action** | Enable user interaction | Sliders, filters, buttons, parameters |
| **Result** | Visualize the outcome | Updated charts, "after" metrics |

## Hidden Discovery Pattern

The most compelling demos reveal non-obvious insights.

**Design Process:**

1. **Define the Discovery** - What hidden insight should emerge?
2. **Engineer the Data** - Structure synthetic data to guarantee this discovery
3. **Validate the Reveal** - Test that discovery actually appears

**Example Patterns:**

| Pattern | Example |
|---------|---------|
| Hidden dependency | "Supplier X appears minor (11%) but serves 70% of critical manufacturers" |
| Emerging trend | "Defect rate looks stable but accelerating in newest product line" |
| Counterintuitive | "Highest-cost region has best ROI when considering lifetime value" |

## Persona-Specific Visualizations

### Strategic (Executive)

| Goal | Recommended Visuals |
|------|---------------------|
| Understand ROI | Aggregated KPI cards with financial impact |
| Compare scenarios | "Before vs. After" comparison charts |
| Regional overview | Geospatial maps (PyDeck) |

### Operational (Manager)

| Goal | Recommended Visuals |
|------|---------------------|
| Identify issues | Interactive tables with conditional formatting |
| Detect outliers | Histograms, scatter plots |
| Prioritize work | "Top 10" actionable lists |

### Technical (Engineer/Analyst)

| Goal | Recommended Visuals |
|------|---------------------|
| Trust the model | ROC curves, confusion matrices |
| Understand drivers | Feature importance plots |
| Verify data | Raw data explorers, JSON tabs |
```

### 4. New Sub-Skill: deploy/SKILL.md (\~150 lines)

````
---
name: specify-deploy
description: "Deploy React+FastAPI demo to Snowpark Container Services. Use after implementation complete."
parent_skill: specify
---

# Deploy - SPCS Deployment

> Deploy React+FastAPI demo to Snowpark Container Services

## When to Load

After `implement/SKILL.md` has generated working React+FastAPI app.

## Prerequisites

- `react/` directory with frontend/ and backend/
- Working local build (npm run build passes)
- Snowflake connection configured

## Workflow

### Step 1: Validate Local Build

**Execute** validation:

```bash
cd react/frontend && npm run build
cd react/backend && python -m pytest
````

**If validation fails:**

- Return to implement/SKILL.md
- Fix issues before continuing

**Next:** Continue to Step 2.

### Step 2: Generate SPCS Artifacts

**Load** `references/constraints.md` for SPCS requirements.

**Generate files:**

1. `react/Dockerfile` (multi-stage build)
2. `react/spec.yaml` (SPCS service specification)
3. `sql/99_spcs_deploy.sql` (image repository, compute pool, service)

**⚠️ MANDATORY STOPPING POINT**: Present deployment plan to user.

```
SPCS Deployment Plan:

1. Create image repository: {repo_name}
2. Build and push Docker image
3. Create compute pool: {pool_name}
4. Deploy service: {service_name}

Estimated credits: {estimate}

Proceed with deployment? [Yes/No]
```

### Step 3: Deploy to SPCS

**Execute** deployment:

```
# Build and push image
snow spcs image-repository create {repo_name} --if-not-exists
docker build -t {image_url} react/
docker push {image_url}

# Create service
snow spcs compute-pool create {pool_name} --if-not-exists
snow spcs service create {service_name} --spec-path react/spec.yaml
```

**Monitor** until READY:

```
snow spcs service status {service_name}
```

### Step 4: Validate Deployment

**Execute** health checks:

1. Service endpoint responds
2. Cortex Agent connectivity works
3. Data access verified

**Output:**

```
✅ Demo deployed to SPCS

Service: {service_name}
URL: {endpoint_url}

Access commands:
  snow spcs service status {service_name}
  snow spcs service logs {service_name}
```

## Stopping Points

- ✋ After Step 2 (deployment plan approval)

## Troubleshooting

**Service stuck in PENDING:**

- Check compute pool has capacity
- Verify image repository permissions

**Container fails to start:**

- Check logs: `snow spcs service logs {service_name}`
- Verify environment variables set correctly

````

### 5. Update plan/SKILL.md

Add prompt_plan.md generation after architecture confirmation:

```markdown
### Step 6: Generate Plan Files

Upon confirmation, create:

1. `specs/{demo-name}/plan.md` with architecture decisions
2. **`specs/{demo-name}/prompt_plan.md`** with reasoning capture

**prompt_plan.md includes:**
- All intake answers with interpretation
- Architecture decision rationale
- Feature inclusion/exclusion reasoning
- Prompts used for generation

**Load** `templates/prompt-plan-template.md` for structure.
````

### 6. Update constitution.md

Add three new principles:

```
### 11. SPCS-Ready

React apps must be deployable to Snowpark Container Services. Container-first design. No assumptions about local runtime.

### 12. Reasoning-Documented

Every significant decision is captured in prompt_plan.md. Future maintainers can understand why choices were made.

### 13. Hidden-Discovery-Driven

Every demo has a "reveal" moment where non-obvious insight emerges from data analysis. Design data to guarantee this discovery.
```

---

## Migration Checklist

### From snowflake-demo-drd-generation

| Source                 | Destination                      |
| ---------------------- | -------------------------------- |
| DRD template sections  | `references/drd-template.md`     |
| STAR narrative         | `references/star-narrative.md`   |
| Hidden Discovery       | `references/star-narrative.md`   |
| Intake questions       | `references/intake-questions.md` |
| Persona visualizations | `references/star-narrative.md`   |

### From snowflake-demo-planning

| Source               | Destination                 |
| -------------------- | --------------------------- |
| Red flags            | `references/constraints.md` |
| CSP constraints      | `references/constraints.md` |
| Pre-flight checklist | `references/constraints.md` |
| Quick decisions      | `references/constraints.md` |
| Project structure    | `references/constraints.md` |

---

## Line Count Estimates

| File                         | Estimated Lines | Best Practice Target |
| ---------------------------- | --------------- | -------------------- |
| SKILL.md (main)              | \~300           | Under 500 ✅          |
| clarify/SKILL.md             | \~170           | Under 500 ✅          |
| plan/SKILL.md                | \~250           | Under 500 ✅          |
| tasks/SKILL.md               | \~140           | Under 500 ✅          |
| analyze/SKILL.md             | \~200           | Under 500 ✅          |
| implement/SKILL.md           | \~225           | Under 500 ✅          |
| deploy/SKILL.md (new)        | \~150           | Under 500 ✅          |
| references/constraints.md    | \~100           | Reference file ✅     |
| references/star-narrative.md | \~120           | Reference file ✅     |

---

## Success Criteria

1. All SKILL.md files under 500 lines
2. References loaded on-demand (not in default context)
3. 4 mandatory stopping points clearly marked with ⚠️
4. Directive language throughout ("Load", "Execute", "Continue to")
5. prompt\_plan.md captures all reasoning
6. SPCS deployment works end-to-end
