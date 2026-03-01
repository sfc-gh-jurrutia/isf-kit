  
**SNOWFLAKE INDUSTRY COPILOT**

Skill-Driven Build System

Master Task List & Build Plan

Version 1.0  |  March 2026

JP  |  Data Engineering & Solutions Architecture

# **Vision**

A user describes a business problem in natural language. A Cortex deployment agent parses the request, maps it to an industry vertical and solution archetype, and generates a validated spec. An orchestrator decomposes that spec into a DAG of atomic build tasks, executes them in parallel where possible and sequentially where required, and deploys a complete Snowflake-native industry copilot to SPCS. The user watches real-time progress, then opens a live URL to their new application.

One input. One confirmation. One deployed system. No code touched by the user.

# **System Architecture**

## **Three-Layer Model**

* Layer 1: Spec Builder (Interactive) — Cortex Agent gathers business context, maps to archetype, produces locked JSON spec

* Layer 2: Orchestrator (Deterministic) — Reads spec, builds DAG, executes skills in dependency order, streams progress to UI

* Layer 3: Builder Skills (Atomic) — Each skill does one thing: receives structured input, produces structured output, no awareness of broader system

## **Two Agents**

* Deployment Agent — The meta-agent living in the orchestrator. Understands the skill inventory, generates specs, executes DAGs, handles errors.

* Industry Copilot Agent — The output. Lives in the deployed app. Has tools for Cortex Search, Cortex Analyst, and ML model inference. Knows its domain, not the build process.

## **Cross-Industry Strategy**

* Universal layer (\~65% of code) — Auth, RBAC, deployment, monitoring, base UI, API scaffolding, warehouse structure

* Pattern layer (\~25%) — Reusable analytical patterns: anomaly detection, forecasting, segmentation, entity resolution. Same Cortex function, different column names.

* Domain layer (\~10%) — Terminology, KPI definitions, persona labels, compliance requirements, sample data shapes. Metadata, not code.

# **Execution Dependency Chain**

The orchestrator resolves this DAG at runtime. Parallel branches execute concurrently; sequential dependencies block until upstream completes.

1. Cleanup \+ timestamped release schema creation (sequential, first)

2. Synthetic data generation → raw parquet landing

3. Medallion architecture: bronze → silver → gold

4. PARALLEL: semantic model provisioning, ML model training \+ registry, DDR chunking for RAG

5. Cortex Search indexing (depends on chunks from step 4\)

6. Agent configuration (depends on semantic model \+ search index \+ ML endpoints)

7. React app build \+ SPCS containerization \+ deployment

8. Live URL served → prepublication validation

9. PPTX generation from spec \+ build manifest (parallel with step 8\)

# **Master Task List**

**Phase 0: Foundation & Spec Schema**

*Define the contracts everything else depends on. No skills can be built until the spec schema is locked.*

| Phase | ID | Task | Description | Depends On | Priority | Estimate |
| ----- | ----- | ----- | ----- | ----- | :---: | :---: |
| **0** | 0.1 | **Define spec JSON schema** | Enumerate every field the spec must contain: industry enum, archetype enum, personas array, pain points, KPI definitions, entity naming, data source descriptors, compliance labels, Cortex feature flags, ML pattern selections. Define required vs optional. Define valid value sets. This is the keystone — every skill reads from this contract. | — | **P0** | 2–3 days |
| **0** | 0.2 | **Define domain config registry** | Create the industry metadata catalog: per-industry entity names, metric definitions, time grains, compliance labels, sample data shapes. Start with oil & gas (reference impl), healthcare, retail, financial services. Structure as YAML files the spec builder loads at runtime. | 0.1 | **P0** | 2 days |
| **0** | 0.3 | **Define skill I/O contracts** | For each of the 15 skills, define: input schema (what slice of the spec it reads), output schema (what files/artifacts it produces), success criteria (how the orchestrator validates completion). Document as a skill contract registry. | 0.1 | **P0** | 2 days |
| **0** | 0.4 | **Define solution archetypes** | Enumerate the 5–7 solution patterns: operational dashboard, predictive analytics app, data quality monitor, self-service analytics, AI copilot, real-time monitor. Map each archetype to which skills it activates and which Cortex features it requires. | 0.1 | **P1** | 1–2 days |
| **0** | 0.5 | **Parameterize reference impl** | Walk through existing oil & gas codebase. Mark every hardcoded industry reference: table names, column names, metric labels, document content, model targets, agent tool descriptions. Produce a parameterization map showing what becomes a spec variable. | 0.1 | **P0** | 2–3 days |

**Phase 1: Data Layer Skills**

*Build the skills that create the Snowflake environment and populate it with data. These run first in every deployment.*

| Phase | ID | Task | Description | Depends On | Priority | Estimate |
| ----- | ----- | ----- | ----- | ----- | :---: | :---: |
| **1** | 1.1 | **demo-warehouse skill** | Generates DDL chain: database creation, timestamped release schema, raw/staging/marts layer tables, RBAC grants. Reads entity definitions and table structures from spec. Template: your existing 001–003 SQL files parameterized with Jinja or string substitution. | 0.1, 0.5 | **P0** | 2–3 days |
| **1** | 1.2 | **demo-data-generation skill** | Generates synthetic parquet files matching domain shape. Uses spec’s entity definitions, cardinality hints, time ranges, and distribution profiles. Produces loading scripts (COPY INTO or Snowpark). Must generate train/test splits for ML pipeline. Reference: your prepare\_parquet.py \+ load\_validated\_data.py. | 0.2, 1.1 | **P0** | 3–4 days |
| **1** | 1.3 | **demo-medallion skill** | Generates the bronze → silver → gold transformation layer. Bronze: raw ingestion views/tables. Silver: cleaned, typed, deduplicated. Gold: business-level aggregations and mart tables. Can be dbt models or pure SQL depending on spec flag. Reads table schemas from 1.1 output. | 1.1, 1.2 | **P0** | 3–4 days |
| **1** | 1.4 | **demo-industry-context skill** | Generates domain knowledge documents (the RAG corpus). Oil & gas: drilling protocols, stuck pipe procedures. Healthcare: clinical guidelines, formulary docs. Produces markdown files that feed Cortex Search. Also generates the domain config that other skills reference for terminology. | 0.2 | **P1** | 2–3 days |

**Phase 2: Intelligence Layer Skills**

*Build the Cortex and ML skills. These depend on data layer outputs and can partially parallelize.*

| Phase | ID | Task | Description | Depends On | Priority | Estimate |
| ----- | ----- | ----- | ----- | ----- | :---: | :---: |
| **2** | 2.1 | **demo-ml-models skill** | Generates Snowflake Notebooks for each ML pattern selected in spec: classification, regression, anomaly detection, optimization. Templates per pattern with parameterized target variables, feature sets, and evaluation metrics. Deploys to Snowflake Model Registry. Reference: your 01–03 notebooks. | 1.3 | **P0** | 4–5 days |
| **2** | 2.2 | **demo-python-udf skill** | Generates Python UDFs for custom logic: inference wrappers around registered models, data transformation functions, feature engineering. Reads ML model endpoints from 2.1 output and mart schemas from 1.3. | 1.3, 2.1 | **P1** | 2–3 days |
| **2** | 2.3 | **demo-cortex-search skill** | Takes DDR documents from 1.4, chunks them (configurable chunk size/overlap from spec), creates Cortex Search service. Generates deploy\_search.sql. Handles Arctic embedding setup. Reference: your deploy\_search.sql \+ docs/ directory. | 1.4 | **P0** | 2–3 days |
| **2** | 2.4 | **demo-cortex-analyst skill** | Generates semantic model YAML from gold-layer table schemas and spec’s KPI definitions. Creates semantic views for natural language query layer. Handles metric calculations, dimension mappings, and join paths. Reference: your industry\_semantic\_model.yaml \+ semantic\_views/. | 1.3 | **P0** | 3–4 days |
| **2** | 2.5 | **demo-cortex-agent skill** | Wires together: Cortex Search service (from 2.3), semantic model (from 2.4), ML endpoints (from 2.1), Python UDFs (from 2.2). Generates agent JSON config and deploy\_agent.sql. Defines tool descriptions, context windows, and guardrails per industry. This is the last AI skill to execute. | 2.1–2.4 | **P0** | 3–4 days |

**Phase 3: Application Layer Skills**

*Build the user-facing application. Depends on the intelligence layer for API endpoints and agent configuration.*

| Phase | ID | Task | Description | Depends On | Priority | Estimate |
| ----- | ----- | ----- | ----- | ----- | :---: | :---: |
| **3** | 3.1 | **demo-style-guide skill** | Defines the visual language for all generated apps: color palette, typography, spacing, component variants. Produces a Tailwind config and CSS variables file. Ensures every copilot looks polished without per-industry design work. | 0.4 | **P1** | 1–2 days |
| **3** | 3.2 | **demo-react-frontend skill** | Generates the copilot React \+ Vite \+ TypeScript app. Component templates for: agent chat interface, KPI dashboard, data explorer, ML insights panel, real-time monitor. Reads spec for which views to include, style guide for theming, agent config for chat endpoint. Reference: your copilot/frontend/src/. | 2.5, 3.1 | **P0** | 5–7 days |
| **3** | 3.3 | **demo-fastapi-backend skill** | Generates the FastAPI backend: Snowpark session management, API routes for dashboard data, agent proxy endpoints, ML inference endpoints, auth middleware. Reads spec for which endpoints to expose. Reference: your copilot/backend/. | 2.5 | **P0** | 3–4 days |

**Phase 4: Deployment & Output Skills**

*Package everything and ship it. Also produces the presentation artifact.*

| Phase | ID | Task | Description | Depends On | Priority | Estimate |
| ----- | ----- | ----- | ----- | ----- | :---: | :---: |
| **4** | 4.1 | **demo-spcs-deployment skill** | Generates: Dockerfile (multi-stage: npm build \+ Python deps), nginx.conf, supervisord.conf, service\_spec.yaml, compute pool config, grant\_access.sql, deploy.sh. Handles both copilot app and orchestrator containers. Reference: your copilot/deploy/ \+ orchestrator/deploy/. | 3.2, 3.3 | **P0** | 3–4 days |
| **4** | 4.2 | **demo-testing skill** | Generates integration tests: API contract validation (frontend expects what backend serves), data contract validation (marts match semantic model), agent tool validation (agent can call all configured tools), smoke tests for the deployed URL. Runs as the prepublication gate. | 3.2, 3.3, 2.5 | **P1** | 2–3 days |
| **4** | 4.3 | **demo-pptx skill** | Generates a sales/demo deck from spec \+ build manifest. Slides: title (industry \+ use case), problem statement (from pain points), architecture diagram, feature walkthrough (mapped to actual built views), Cortex capabilities summary, ROI/value prop. Runs in parallel with deployment. | 0.1, all skills | **P1** | 2–3 days |
| **4** | 4.4 | **demo-prepublication skill** | Final validation gate: smoke tests against deployed URL, screenshot capture of key views, agent test conversation, data completeness check, schema validation. Produces a readiness report. Blocks the “deployment complete” signal. | 4.1, 4.2 | **P1** | 1–2 days |

**Phase 5: Orchestration & Planning**

*Build the orchestrator that calls all the above skills. This is infrastructure, not per-demo work.*

| Phase | ID | Task | Description | Depends On | Priority | Estimate |
| ----- | ----- | ----- | ----- | ----- | :---: | :---: |
| **5** | 5.1 | **demo-planning skill** | Reads the validated spec and produces the execution DAG: which skills to run, in what order, with what parallelism. Resolves dependencies, estimates duration per node, identifies the critical path. Outputs a DAG JSON the orchestrator engine consumes. | 0.3, 0.4 | **P0** | 3–4 days |
| **5** | 5.2 | **Orchestrator DAG engine** | The runtime that executes the plan: task queue, parallel execution, state management (queued/running/complete/failed), retry logic, error propagation. Streams events to the frontend via WebSocket. Reference: your orchestrator/backend/engine/. | 5.1 | **P0** | 5–7 days |
| **5** | 5.3 | **Orchestrator frontend** | Real-time DAG visualization: nodes light up as tasks execute, terminal log streaming, progress percentage, estimated time remaining. The user watches the build happen. Reference: your orchestrator/frontend/src/. | 5.2 | **P0** | 4–5 days |
| **5** | 5.4 | **Spec builder / Discovery agent** | The conversational Cortex Agent that gathers business context. Intent recognition maps to industry \+ archetype. Proposes a complete spec with smart defaults. User confirms or modifies. Produces the locked JSON spec that enters the orchestrator. Build this last — it needs to know what the spec schema looks like. | 0.1–0.4, all skills | **P0** | 4–5 days |

**Phase 6: Integration & Hardening**

*Connect everything end-to-end. Validate the full pipeline with multiple industries.*

| Phase | ID | Task | Description | Depends On | Priority | Estimate |
| ----- | ----- | ----- | ----- | ----- | :---: | :---: |
| **6** | 6.1 | **End-to-end integration test** | Run the full pipeline for oil & gas (reference impl). Spec builder → orchestrator → all skills → deployed copilot. Validate every link in the chain. Fix contract mismatches. | All prior | **P0** | 3–4 days |
| **6** | 6.2 | **Second vertical: Healthcare** | Run the full pipeline for healthcare. This validates that the cross-industry abstraction works. Domain config: patient entities, claims data, readmission metrics, HIPAA compliance. Fix any oil & gas assumptions that leaked into universal code. | 6.1 | **P0** | 3–5 days |
| **6** | 6.3 | **Third vertical: Financial Services** | Third industry validates the pattern at scale. Domain config: account entities, transaction data, fraud metrics, SOX compliance. By this point, adding a new industry should be mostly config. | 6.2 | **P1** | 2–3 days |
| **6** | 6.4 | **Error recovery & resilience** | Test failure modes: what happens when ML training fails? When Cortex Search indexing times out? When SPCS deployment hits resource limits? Implement retry logic, fallback strategies, and clear error reporting in the orchestrator. | 6.1 | **P1** | 3–4 days |
| **6** | 6.5 | **Performance & cleanup** | Schema TTL and auto-expiry for demo environments. Parallel execution tuning. Cold-start optimization. Resource cleanup scripts. | 6.1 | **P2** | 2–3 days |

# **Critical Path**

The longest sequential chain determines your minimum timeline. Everything else can be parallelized around it.

**Spec schema (0.1)** → **Warehouse skill (1.1)** → **Data gen (1.2)** → **Medallion (1.3)** → **Cortex Analyst (2.4)** → **Cortex Agent (2.5)** → **React frontend (3.2)** → **SPCS deploy (4.1)** → **Integration test (6.1)**

**Estimated critical path duration: 28–40 days of focused build time.**

# **Open Design Decisions**

Decisions that should be resolved before or during Phase 0\.

1. Synthetic data: SQL INSERTs, staged CSVs/parquet, or Snowpark in-place generation?

2. Medallion layer: dbt models or pure SQL transformations? (Spec flag or universal choice?)

3. Agent error recovery: auto-retry with different params, skip and annotate, or halt and ask user?

4. Schema TTL: auto-expire demo environments after N hours/days? Manual cleanup?

5. Orchestrator persistence: Snowflake tasks, external task queue, or in-process Python?

6. How many solution archetypes at launch? (Recommend: start with 2–3, expand after validation)

7. Streamlit path: maintain the existing Streamlit app as an alternative frontend, or consolidate on React?

# **Quick Wins — Start Tomorrow**

If you want to start building before the full spec schema is locked, these tasks can begin immediately:

8. Parameterize the reference implementation (0.5) — this is pure discovery work and directly informs the spec schema

9. Draft the spec schema (0.1) — start with what you know from the oil & gas impl, iterate as you parameterize

10. Build demo-warehouse skill (1.1) — the DDL templates are straightforward and low-risk to prototype

11. Build demo-style-guide skill (3.1) — independent of everything else, can be done in parallel

# **Estimated Total Effort**

| Phase | Tasks | Estimate |
| :---- | :---: | :---: |
| **Phase 0: Foundation & Spec Schema** | 5 | 9–13 days |
| **Phase 1: Data Layer Skills** | 4 | 10–14 days |
| **Phase 2: Intelligence Layer Skills** | 5 | 14–19 days |
| **Phase 3: Application Layer Skills** | 3 | 9–13 days |
| **Phase 4: Deployment & Output Skills** | 4 | 8–12 days |
| **Phase 5: Orchestration & Planning** | 4 | 16–21 days |
| **Phase 6: Integration & Hardening** | 5 | 13–19 days |
| **TOTAL (with parallelism)** | **30** | **\~35–50 days** |

*Note: phases 1–4 have significant parallelism. With focused effort, the critical path is 28–40 days. Total effort across all tasks is higher but much of it runs concurrently.*

*The phase estimates assume serial execution within each phase. Many tasks within a phase can also be parallelized, especially during phases 2 and 3 where skills are independent of each other.*