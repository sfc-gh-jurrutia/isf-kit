---
name: isf-spec-curation
description: >
  Generate ISF Solution Specifications from unstructured business requirements,
  customer conversations, or existing projects. Maps industry pain points to ISF
  solutions, use cases, features, and personas. Use when: (1) architecting
  industry-specific Snowflake solutions, (2) curating ISF content from demos or
  customer engagements, (3) connecting customer needs to existing ISF assets,
  (4) designing multi-persona industry solutions with measurable outcomes.

input_types:
  - GitHub Repository (via repo-scanner skill using repomix)
  - Unstructured customer requirements or notes
  - Existing Demo Requirements Documents (DRDs)
  - Industry vertical + pain point descriptions
  - Sales engagement summaries or discovery calls
  - Competitive displacement scenarios

output_type: ISF Solution Specification (Markdown + JSON references)

industry_scope:
  - FSI (Financial Services)
  - HLS (Healthcare & Life Sciences)
  - RET (Retail)
  - MFG (Manufacturing)
  - MED (Media & Entertainment)
  - PUB (Public Sector)
  - TEL (Telecom)
  - AME (Advertising/Marketing/Entertainment)
  - GOV (Government)

isf_components_mapped:
  solutions: Industry-specific business solutions with KPIs and outcomes
  use_cases: Specific technical/functional use cases with defined deliverables
  personas: Strategic/Operational/Technical buyer roles with JTBD (Jobs To Be Done)
  pain_points: Customer challenges with discovery signals and business impact
  features: Snowflake platform capabilities (layer + GA/Preview/Private Preview status)
  partners: Required ecosystem integrations (data sources, tech stack, SIs)
  stories: Relevant customer success stories for social proof
  accelerators: Implementation templates and quickstarts to accelerate delivery
  assets: Supporting collateral (whitepapers, ROI calculators, pitch decks)
  demos: Reference demonstrations and POCs
---

# ISF Solution Spec Curation

## Quick Start

### What is an ISF Solution Spec?

An ISF Solution Specification transforms unstructured ideas — customer conversations, sales notes, existing repos, or raw requirements — into a structured specification that maps customer needs to ISF solutions, Snowflake platform capabilities, and measurable business outcomes.

The output is a populated `isf-context.md` file (see `references/isf-context.md` for the schema) containing everything needed to plan, build, and deploy the solution.

### Core Workflow

```
1. INGEST
   └── Receive input (conversation, document, repo scan, sales notes)
   └── Detect input type and extract structured information
   ⚠️ STOP: Confirm parsed input and intent with user before research.

2. RESEARCH & EXPAND
   └── Infer industry pain points and map to ISF Pain Point IDs (PAIN-xxx)
   └── Identify typical data schemas and Snowflake features (FT-xxx)
   └── Propose use cases and map to ISF Use Case IDs (UC-xxx)
   └── Find relevant ISF stories, accelerators, and assets

3. ARCHITECT
   └── Map needs to ISF Solutions (SOL-xxx)
   └── Define personas with STAR journeys (PER-xxx)
   └── Design data architecture (source → landing → transform → curated)
   └── Select Snowflake platform components by layer

4. CURATE
   └── Populate isf-context.md with all gathered information
   └── Generate the 9 spec sections with ISF references
   └── Produce JSON References for API consumption
   ⚠️ STOP: Present draft spec for user review before validation.

5. VALIDATE
   └── Run quality checklist against all 9 sections
   └── Verify ISF component IDs are valid
   └── Confirm hidden discovery is engineered into data design
```

### Intake Questions

**Walk through these areas to populate the spec. Not all are required upfront — the LLM fills gaps from ISF knowledge.**

| Area | Questions | Maps To |
|------|-----------|---------|
| **Industry & Context** | What vertical? Sub-segment? What market trends are driving this? | Executive Summary, Industry Context |
| **Customer** | Who is the customer? Size? Region? Maturity level? Current tech stack? | `isf-context.md` customer section |
| **Pain Points** | What's broken today? Cost of status quo? Regulatory drivers? | Industry Context (PAIN-xxx) |
| **Stakeholders** | Who is the buyer? Technical champion? End users? What are their priorities? | Persona Journeys (PER-xxx) |
| **Requirements** | What business objectives? KPIs? Timeline for POC → production? | Success Metrics |
| **Data** | What data exists? Volume? Sources? Structured vs. unstructured? | Solution Architecture |
| **Discovery** | What non-obvious insight should emerge? What's the "hidden risk"? | Hidden Discovery |
| **Capabilities** | Which Snowflake features matter? Cortex? ML? Governance? | Solution Architecture (FT-xxx) |
| **Evidence** | Any existing customer stories? Competitive context? | Supporting Evidence (STY-xxx) |

If the user cannot answer these, help them by:
1. Suggesting industry-standard pain points for their vertical from ISF catalogs
2. Proposing typical personas based on the use case and ISF persona templates
3. Identifying potential "hidden discoveries" that would demonstrate value
4. Recommending ISF accelerators and assets for their industry

## Solution Archetype

Before populating the spec sections, identify the solution archetype. This determines which skills activate during planning and which Cortex features are required.

| Archetype | Best For | Cortex Features |
|-----------|----------|----------------|
| **AI Copilot** | Chat-first multi-tool agent with analytics + RAG | Agent, Analyst, Search |
| **Operational Dashboard** | Real-time monitoring, KPIs, alerts | Analyst (optional) |
| **Predictive Analytics** | ML models, explainability, what-if | Analyst, Agent (optional) |
| **Data Quality Monitor** | Validation, anomaly detection, lineage | LLM functions (optional) |
| **Self-Service Analytics** | Natural-language SQL, no custom UI | Analyst |
| **Knowledge Assistant** | Document search, domain knowledge RAG | Search, Agent |

**Ask the user** (or infer from requirements):

```
Based on your requirements, this maps to the {ARCHETYPE} pattern.
This means the solution will use: {activated skills list}.
Confirm or adjust?
```

Record the archetype in the spec. `isf-solution-planning` uses it to determine the skill activation path and task parallelism.

## Spec Sections

The ISF Solution Spec has 9 sections. Each section has an alias used as a machine-readable identifier.

| # | Section | Alias | Purpose |
|---|---------|-------|---------|
| 1 | **Executive Summary** | `executive_summary` | One-paragraph solution overview with industry, pain point, and value |
| 2 | **Industry Context** | `industry_context` | Market trends, regulatory drivers, competitive landscape, ISF pain points |
| 3 | **Solution Architecture** | `solution_architecture` | Technical architecture mapping ISF solutions, use cases, features, partners |
| 4 | **Persona Journeys** | `persona_journeys` | User experiences using STAR narrative framework with ISF persona IDs |
| 5 | **Hidden Discovery** | `hidden_discovery` | Non-obvious insight that creates the "aha moment" |
| 6 | **Implementation Roadmap** | `implementation_roadmap` | Path from concept to production with ISF accelerators |
| 7 | **Success Metrics** | `success_metrics` | Quantifiable validation criteria — business, technical, and adoption |
| 8 | **Supporting Evidence** | `supporting_evidence` | Customer stories, assets, analyst reports for social proof |
| 9 | **JSON References** | `json_references` | Machine-readable ISF component links for API consumption |

### Executive Summary

| Required Element | Description |
|------------------|-------------|
| Industry vertical and sub-segment | ISF industry code (FSI, HLS, RET, etc.) + specific segment |
| Primary pain point | The core problem being solved, mapped to PAIN-xxx |
| Measurable business outcomes | KPIs with % improvement targets |
| Snowflake differentiation | Why Snowflake vs. alternatives |

### Industry Context

| Required Element | Description |
|------------------|-------------|
| Market trends | What's driving this need now |
| Regulatory / compliance drivers | If applicable to the vertical |
| Competitive landscape | How competitors approach this problem |
| ISF Pain Points | Mapped to PAIN-xxx IDs from ISF catalog |

### Solution Architecture

| Required Element | Description |
|------------------|-------------|
| ISF Solutions | Referenced by SOL-xxx |
| Use Cases | Referenced by UC-xxx with defined deliverables |
| Snowflake Features | Referenced by FT-xxx with layer and GA/Preview status |
| Partner integrations | Referenced by PTR-xxx with integration type |
| Data architecture | Sources, schemas, volumes, transformation layers |

### Persona Journeys

Define using the STAR narrative framework (do not reference "STAR" in end-user UI — use as design philosophy):

| Element | Purpose | Implementation |
|---------|---------|----------------|
| **Situation** | Show current state/problem | KPI cards showing the gap, "before" metrics |
| **Task** | Define what needs solving | Clear statement of the challenge |
| **Action** | Enable user interaction | Interactive elements, parameter inputs |
| **Result** | Visualize the outcome | Updated metrics showing impact, "after" state |

Every spec should include three persona levels:

| Level | Typical Roles | Focus | ISF ID |
|-------|---------------|-------|--------|
| **Strategic** | VP, Director, C-Suite | Aggregate metrics, investment decisions | PER-xxx |
| **Operational** | Manager, Supervisor | Alerts, resource deployment, daily ops | PER-xxx |
| **Technical** | Engineer, Analyst, Data Scientist | Root cause analysis, ML correlation | PER-xxx |

**User Story Template:**

```
"As a [Role], I want to [Action] so that I can [Outcome]."
```

**STAR Checklist** — for each persona, verify:
- [ ] Entry point immediately presents the Situation (current problem)
- [ ] Task is clearly stated (what are we solving?)
- [ ] Action elements are interactive and intuitive
- [ ] Result is quantifiable and prominent

### Hidden Discovery

The most compelling solutions reveal insights that are NOT obvious from raw data. Work backwards from the discovery:

```
1. DEFINE THE DISCOVERY
   └── What non-obvious insight should emerge?
   └── What "hidden risk" or opportunity exists?

2. ENGINEER THE DATA
   └── Structure synthetic data to guarantee this discovery
   └── Ensure insight is invisible in raw data but emerges from analysis

3. VALIDATE THE REVEAL
   └── Test that discovery actually appears in output
   └── Confirm it creates genuine "aha moment"
```

**Example Patterns:**

| Pattern | Example |
|---------|---------|
| Hidden dependency | "Supplier X appears minor (11% of orders) but serves 70% of critical manufacturers" |
| Emerging trend | "Defect rate looks stable overall but accelerating in newest product line" |
| Counterintuitive finding | "Highest-cost region actually has best ROI when considering lifetime value" |
| Network effect | "Small customer cluster drives 40% of referral revenue" |

**Include in every spec:**
- **Discovery Statement**: One sentence describing the hidden insight
- **Surface Appearance**: What the data looks like before analysis
- **Revealed Reality**: What emerges after applying the solution
- **Business Impact**: Why this discovery matters
- **How Cortex/ML enables this discovery**: Which Snowflake capabilities surface the insight

### Implementation Roadmap

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| **Proof of Concept** | 2-4 weeks | Core use case validated, data pipeline working |
| **Pilot** | 4-8 weeks | Multi-persona experience, Cortex integration, initial users |
| **Production** | 8-12 weeks | Full deployment, monitoring, training, handoff |

Include:
- ISF Accelerators to leverage (ACC-xxx)
- ISF Demos for validation (DEM-xxx)
- Partner integrations required (PTR-xxx)

### Success Metrics

| Category | Examples |
|----------|---------|
| **Business KPIs** | Revenue impact, cost reduction, efficiency gains |
| **Technical KPIs** | Query response time, data freshness, pipeline reliability |
| **User Adoption** | Time-to-insight, self-service %, concurrent users |
| **ROI Model** | Investment vs. value, payback period |

### Supporting Evidence

| Element | ISF ID | Purpose |
|---------|--------|---------|
| Customer Stories | STY-xxx | Social proof from similar engagements |
| Assets | AST-xxx | Whitepapers, ROI calculators, pitch decks |
| Analyst Reports | — | External validation (Gartner, Forrester, etc.) |
| Industry Benchmarks | — | Baseline metrics for the vertical |

### JSON References

Machine-readable output of all ISF component mappings for API consumption. Generated automatically from the curated spec.

```json
{
  "solution_ids": ["SOL-xxx"],
  "use_case_ids": ["UC-xxx"],
  "pain_point_ids": ["PAIN-xxx"],
  "feature_ids": ["FT-xxx"],
  "persona_ids": ["PER-xxx"],
  "partner_ids": ["PTR-xxx"],
  "story_ids": ["STY-xxx"],
  "accelerator_ids": ["ACC-xxx"],
  "asset_ids": ["AST-xxx"],
  "demo_ids": ["DEM-xxx"]
}
```

## Snowflake Component Vocabulary

### AI & ML

| Component | Purpose |
|-----------|---------|
| Cortex Analyst | Natural language to SQL via semantic models |
| Cortex Search | Document search, RAG pipelines, high-cardinality resolution |
| Cortex Agents | Multi-tool AI orchestration (Analyst + Search + custom) |
| Cortex LLM Functions | Complete, Summarize, Translate, Sentiment |
| Snowpark ML | Feature Store, Model Registry, ML Jobs |
| Snowflake Notebooks | Interactive ML development with GPU support |
| Document AI | AI_EXTRACT, PDF/image processing |

### Data Platform

| Component | Purpose |
|-----------|---------|
| Dynamic Tables | Incremental pipelines, declarative transformations |
| Streams & Tasks | CDC and orchestration |
| Iceberg Tables | Open lakehouse interoperability |
| Hybrid Tables | Low-latency OLTP (Unistore) |
| Time Travel & Fail-safe | Point-in-time recovery |

### Governance & Security

| Component | Purpose |
|-----------|---------|
| Horizon Catalog | Universal search and lineage |
| Data Classification & Tagging | Automated sensitive data detection |
| Row Access Policies & Column Masking | Fine-grained access control |
| Data Clean Rooms | Secure multi-party computation |
| Private Connectivity | PrivateLink, VPN |

### Sharing & Collaboration

| Component | Purpose |
|-----------|---------|
| Snowflake Marketplace | Data products and Native Apps |
| Data Sharing | Listings, Direct Shares |
| Cross-cloud Collaboration | Snowsight, replication |

### Application Development

| Component | Purpose |
|-----------|---------|
| React + FastAPI | Production applications deployed to SPCS (default) |
| Streamlit in Snowflake | Interactive analytics apps (SiS) |
| Snowpark | Python, Java, Scala processing |
| Native Apps | Monetizable packaged solutions |
| APIs & Connectors | REST API, drivers, partner integrations |

## Quality Checklist

Before finalizing a spec, verify each section:

**Executive Summary**
- [ ] Industry vertical and sub-segment specified
- [ ] Primary pain point mapped to PAIN-xxx
- [ ] At least 2 KPIs defined with target improvements
- [ ] Snowflake differentiation articulated

**Industry Context**
- [ ] Market trends identified
- [ ] Regulatory/compliance drivers noted (if applicable)
- [ ] ISF Pain Point IDs assigned

**Solution Architecture**
- [ ] ISF Solution IDs assigned (SOL-xxx)
- [ ] Use Cases mapped (UC-xxx)
- [ ] Snowflake Features listed with layer and status (FT-xxx)
- [ ] Data architecture defined (sources, schemas, volumes)
- [ ] Partner integrations identified (PTR-xxx)

**Persona Journeys**
- [ ] Three distinct personas (Strategic, Operational, Technical)
- [ ] Each has STAR journey mapped
- [ ] ISF Persona IDs assigned (PER-xxx)
- [ ] User stories follow template format

**Hidden Discovery**
- [ ] Discovery statement defined
- [ ] Surface appearance vs. revealed reality documented
- [ ] Business impact quantified
- [ ] Cortex/ML enablement described

**Implementation Roadmap**
- [ ] Three phases with realistic durations
- [ ] ISF Accelerators identified (ACC-xxx)
- [ ] ISF Demos for validation (DEM-xxx)

**Success Metrics**
- [ ] Business, technical, and adoption KPIs defined
- [ ] ROI model outlined

**Supporting Evidence**
- [ ] At least one ISF Customer Story (STY-xxx)
- [ ] Relevant assets identified (AST-xxx)

**JSON References**
- [ ] All ISF component IDs collected into JSON block
- [ ] IDs are valid and reference existing ISF catalog entries

## Common Issues

| Issue | Fix |
|-------|-----|
| Input too vague | Ask clarifying questions, suggest industry defaults |
| Missing industry context | Research standard pain points from ISF catalog |
| No clear "Wow Moment" | Design a Hidden Discovery using the patterns above |
| Personas all similar | Ensure Strategic/Operational/Technical distinction |
| Data architecture unclear | Specify table grain, column types, and transformation layers |
| No ISF IDs assigned | Map findings to ISF catalog — solutions, use cases, pain points |
| Missing partner context | Check ISF partner catalog for the industry vertical |

## Output

- A populated `isf-context.md` following the schema in `references/isf-context.md`
- All 9 spec sections filled with ISF component IDs and narrative content
- JSON References block with machine-readable ISF mappings

## Contract

**Inputs:**
- Unstructured requirements — User-provided text, documents, or repo scan

**Outputs:**
- `specs/{solution}/isf-context.md` — Structured YAML spec with 9 sections + ISF component IDs (consumed by `isf-solution-planning`)

## Next Skill

After the spec is curated and approved:

**Continue to** `../isf-solution-planning/SKILL.md` to plan the architecture, break down tasks, and scaffold the project directory.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 2.

### Downstream Skill Reference

| Spec Section | Implementation Skill |
|-------------|---------------------|
| Solution Architecture | `isf-solution-planning` |
| Data Architecture | `isf-data-architecture` → `isf-data-generation` |
| Cortex Agent | `isf-cortex-agent` |
| Cortex Analyst | `isf-cortex-analyst` |
| Cortex Search | `isf-cortex-search` |
| React Application | `isf-solution-react-app` |
| Notebook / ML | `isf-notebook` |
| Deployment | `isf-deployment` |
| Testing | `isf-solution-testing` |
| Solution Packaging | `isf-solution-package` |

## References

- [isf-context.md](references/isf-context.md) — ISF Solution Specification schema (YAML template)
