# Script Suggestions for ISF Spec Curation

## Workflow Automation

### 1. Generate ISF Spec from User Input

**Trigger:** User provides unstructured requirements, customer notes, or sales engagement summary

**Workflow:**
```
1. Ingest user input (text, document, or repo URL)
2. Identify industry vertical and map to ISF pain points (PAIN-xxx)
3. Infer data architecture and Snowflake features (FT-xxx)
4. Map to ISF solutions (SOL-xxx) and use cases (UC-xxx)
5. Define personas with STAR journeys (PER-xxx)
6. Populate isf-context.md with all gathered information
7. Generate 9 spec sections
8. Validate against quality checklist
```

**Prompt Pattern:**
```
Use @isf-skills/isf-spec-curation to transform this input into an ISF Solution Spec:

[USER INPUT BLOCK]
```

### 2. Generate ISF Spec from Existing Repo

**Trigger:** User has an existing demo or solution repository to analyze

**Workflow:**
```
1. Clone repo (if URL) or scan local path
2. Run npx repomix to generate codebase representation
3. Analyze: frameworks, schemas, Cortex features, personas, deployment
4. Map findings to ISF components (SOL-xxx, UC-xxx, FT-xxx)
5. Identify compliance gaps with ISF standards
6. Populate isf-context.md from analysis
7. Generate 9 spec sections with gap annotations
8. Validate against quality checklist
```

**Prompt Pattern:**
```
Use @isf-skills/isf-spec-curation to scan this repo and generate an ISF Solution Spec:

https://github.com/org/repo
```

### 3. Validate Spec Completeness

**Trigger:** After spec generation or when reviewing an existing spec

**Checklist Verification:**
```
Executive Summary
- [ ] Industry vertical and sub-segment specified
- [ ] Primary pain point mapped to PAIN-xxx
- [ ] KPIs defined with target improvements
- [ ] Snowflake differentiation articulated

Industry Context
- [ ] Market trends identified
- [ ] Regulatory/compliance drivers noted
- [ ] ISF Pain Point IDs assigned

Solution Architecture
- [ ] ISF Solution IDs assigned (SOL-xxx)
- [ ] Use Cases mapped (UC-xxx)
- [ ] Snowflake Features listed with layer and status (FT-xxx)
- [ ] Data architecture defined
- [ ] Partner integrations identified (PTR-xxx)

Persona Journeys
- [ ] Three personas (Strategic, Operational, Technical)
- [ ] STAR journeys mapped for each
- [ ] ISF Persona IDs assigned (PER-xxx)

Hidden Discovery
- [ ] Discovery statement defined
- [ ] Surface vs. revealed reality documented
- [ ] Cortex/ML enablement described

Implementation Roadmap
- [ ] Three phases with durations
- [ ] ISF Accelerators identified (ACC-xxx)

Success Metrics
- [ ] Business, technical, and adoption KPIs defined

Supporting Evidence
- [ ] Customer stories referenced (STY-xxx)
- [ ] Assets identified (AST-xxx)

JSON References
- [ ] All ISF component IDs collected
```

### 4. Link Spec to Downstream Implementation

**Trigger:** After spec is finalized and approved

**Implementation Sequence:**
```
1. PLAN
   └── Use isf-solution-planning to generate architecture plan and task list

2. DATA LAYER
   └── Use isf-data-generation for synthetic data from Solution Architecture

3. AI LAYER
   └── Use isf-cortex-analyst for semantic model from Solution Architecture
   └── Use isf-cortex-search for RAG service from Solution Architecture
   └── Use isf-cortex-agent to combine tools

4. ML LAYER
   └── Use isf-notebook for ML notebooks from Solution Architecture

5. APP LAYER
   └── Use isf-solution-react-app for React + FastAPI implementation

6. DEPLOY
   └── Use isf-deployment for SPCS deployment

7. VALIDATE
   └── Use isf-solution-testing against Success Metrics

8. PACKAGE
   └── Use isf-solution-package for presentations and collateral
```

### 5. Spec Review and Iteration

**Trigger:** Stakeholder feedback or requirement changes

**Update Pattern:**
```
1. Identify which spec section needs update
2. Regenerate only affected sections
3. Update ISF component IDs if mappings changed
4. Verify downstream dependencies still align
5. Re-run quality checklist
6. Update JSON References block
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Generate spec before any implementation | Ensures alignment on requirements and ISF mappings |
| Review with stakeholders before building | Catches misunderstandings early |
| Keep isf-context.md in project repo | Single source of truth for the solution |
| Update spec when requirements change | Maintains documentation and ISF ID accuracy |
| Link spec sections to implementation files | Enables traceability from requirement to code |
| Validate ISF IDs against catalog | Ensures references are current and valid |
| Generate JSON References last | Captures all IDs after spec is stable |
