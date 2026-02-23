* Good — 20 CSV dictionaries. Now let me compile the comprehensive specification document.

Proposed plan:
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Comprehensive Developer-Ready Specification: Specify Workflow Gap Closure

 This is the full specification for closing all 9 gaps identified between the snowflake-demo-* skills and the specify workflow. All files live under
 /Users/jurrutia/projects/isf-kit/skills/specify/.

 ────────────────────────────────────────

 New Files to Create (10 files + 20 CSVs)

 1. templates/backend/cortex_agent_service.py

 • Full FastAPI router for Cortex Agent proxy
 • Config: CortexAgentConfig class with env vars (SNOWFLAKE_ACCOUNT_URL, CORTEX_AGENT_DATABASE, CORTEX_AGENT_SCHEMA, CORTEX_AGENT_NAME, SNOWFLAKE_WAREHOUSE)
 • Auth: get_auth_headers() supporting PAT, OAuth, JWT
 • Thread management: POST /threads → creates conversation thread via /api/v2/cortex/threads
 • Non-streaming chat: POST /chat → sends message, parses response (handles messages[] and response formats, extracts citations)
 • Streaming chat: POST /run → SSE streaming with map_cortex_event() mapping Cortex events (text, content_block_delta, tool_use_start, tool_use_end, tool_result,
 thinking, message_stop) to frontend events (text_delta, tool_start, tool_end, tool_result, reasoning, message_complete, error)
 • Health: GET /health
 • SSE headers: Cache-Control: no-cache, Connection: keep-alive, X-Thread-Id header
 • Error handling: HTTPStatusError → HTTPException, generic → 500
 • Adapted from snowflake-demo-react-app/templates/cortex_agent_service.py

 2. templates/backend/snowflake_service.py

 • SnowflakeService class with connection pool pattern
 • Uses connection_name=os.getenv("SNOWFLAKE_CONNECTION_NAME", "demo")
 • Query execution with error handling
 • Session management
 • Sourced from snowflake-demo-react-app/references/workflow.md

 3. templates/frontend/hooks/useCortexAgent.ts

 • React hook managing: messages state, streaming status, thread ID, reasoning stages
 • SSE parsing: fetch with Accept: text/event-stream, ReadableStream reader, buffer management (split on \n, keep incomplete line)
 • Event handling: text_delta → append text, tool_start → add tool part with running status, tool_end → update to complete/error, tool_result → update output/sql,
 reasoning → add reasoning part, message_complete → extract citations + thread_id, error → set error status
 • Race prevention: AbortController ref, abort previous on new send
 • Exports: { messages, status, sendMessage, threadId, reasoningStage, clearMessages }
 • Adapted from snowflake-demo-react-app/templates/hooks/useCortexAgent.ts

 4. templates/sql/schema_template.sql

 • CREATE DATABASE IF NOT EXISTS <PROJECT_DATABASE>
 • CREATE SCHEMA IF NOT EXISTS RAW with comment
 • CREATE SCHEMA IF NOT EXISTS ATOMIC with comment
 • CREATE SCHEMA IF NOT EXISTS <DATA_MART_NAME> with comment
 • Commented-out optional schemas: DATA_ENGINEERING, DATA_SCIENCE, ML_PROCESSING
 • Commented-out permission grants
 • Adapted from snowflake-demo-data-architecture/assets/schema_template.sql

 5. references/react-production-patterns.md

 Sections:

 • Race Condition Prevention: processingPromptRef pattern for pending prompts, AbortController for SSE
 • SSE Buffer Management: buffer += decode; lines = split('\n'); buffer = lines.pop()
 • Context Injection: Prepend page/selection context to user prompts
 • Zustand Chat State: Minimal store interface (messages, addMessage, updateMessage, clearMessages, pendingPrompt)
 • FastAPI SSE Headers: Cache-Control, Connection, X-Accel-Buffering
 • Multi-Agent Orchestration: Intent classification → agent routing (analytical, search/history, recommend, status, comparison, general). AgentOrchestrator → BaseAgent
 subclasses
 • Cortex Service Integration: SEARCH_PREVIEW SQL, ANALYST SQL, COMPLETE SQL patterns
 • Fallback Query Pattern: Cortex Analyst → pattern-matched SQL → error explanation
 • Domain-Specific LLM Prompting: Role + context JSON + output requirements + terminology
 • Chart Color Consistency: Global ENTITY_COLORS record, use in both selection UI and Recharts
 • Recharts Patterns: Inverted Y-axis, area gradients
 • Agent Status Indicators: Visual pattern for multi-agent status display
 • WebSocket Real-Time: ConnectionManager pattern for live data
 • Context Panel Pattern: Three-panel layout with context propagation
 • Markdown Rendering: Tailwind prose classes
 • Sourced from copilot-learnings.md + cortex-chat.md

 6. references/transformation-approaches.md

 • Decision tree (ASCII): Real-time? → Streams+Tasks. Complex multi-step? → Declarative? → Dynamic Tables / Stored Procedures. Materialization needed? → MVs. Else →
 Views.
 • Approach comparison table: Views, MVs, Dynamic Tables, Stored Procedures, Streams+Tasks with pros/cons
 • Full SQL examples for each:
   • Standard Views (simple current-record filter)
   • Materialized Views (daily summary aggregation)
   • Dynamic Tables (2-step pipeline: clean RAW → aggregate to DATA_MART, with TARGET_LAG options)
   • Stored Procedures (CDC batch processing with multi-step logic + archive)
   • Streams+Tasks (stream on CDC table, task with WHEN SYSTEM$STREAM_HAS_DATA, MERGE)
 • Quick decision guide table
 • Sourced from snowflake-demo-data-architecture/references/transformation-approaches.md

 7. reflect/SKILL.md

 New sub-skill: Persona Reflection QA

 • When to load: After analyze passes, before generate
 • Prerequisites: spec.md with personas, application pages/sections defined
 • Workflow:
   1. Load spec.md, extract personas and STAR journeys
   2. Persona Coverage Review: For each persona — verify entry point, pain point coverage, terminology fit
   3. STAR Navigation Assessment: Map each persona path (Situation → Task → Action → Result), flag missing elements
   4. Role-Based Visual Strategy: Verify each persona gets appropriate viz (Executive=KPIs/before-after, Operational=tables/filters, Technical=ROC/feature-importance)
   5. Tone Alignment: Lead with conclusion, quantified impact, active verbs, tight structure
   6. Common Issues: No persona-specific entry → add role tab; Action doesn't change outcome → make reactive; Vague metrics → use KPI deltas; Language mismatch →
 rewrite with role vocabulary
   7. Produce Persona Reflection Worksheet per persona (Entry Point, Situation, Task, Action, Result, Gaps)
 • Output: Markdown report with coverage matrix, STAR completeness, gap list
 • Stopping point: After presenting reflection report
 • Sourced from snowflake-demo-reflection-persona/SKILL.md

 8. templates/ci_test_cycle.sh

 • Bash script with set -e, set -o pipefail
 • Config: CONNECTION_NAME, MIN_EXPECTED_ROWS, TIMEOUT_SECONDS
 • Step 1: ./clean.sh -c $CONNECTION_NAME --force
 • Step 2: ./deploy.sh -c $CONNECTION_NAME
 • Step 3: ./run.sh -c $CONNECTION_NAME test (query validation)
 • Step 4: timeout $TIMEOUT_SECONDS ./run.sh -c $CONNECTION_NAME main
 • Step 5: Verify outputs (SELECT COUNT from output table, compare to MIN_EXPECTED_ROWS)
 • Exit 0 on pass, exit 1 on fail
 • Adapted from snowflake-demo-testing/assets/ci_test_cycle.sh

 9. templates/generate_synthetic_data.py

 • Python template with argparse (--output-dir, --num-rows)
 • RANDOM_SEED = 42 — fixed seed
 • generate_sample_data() function (customize per project)
 • CSV output to data/synthetic/
 • Print reminder: "Commit this data to version control!"
 • Adapted from snowflake-demo-data-generation/assets/generate_synthetic_data.py

 10. references/dictionaries/*.csv (20 files)

 Copy from snowflake-demo-data-architecture/assets/dictionary/:

 • core.data_dictionary.csv, data_dictionary_ATOMIC.csv, data_dictionary_GENERAL_REFERENCE.csv
 • Industry: AEROSPACE, AGRICULTURE, AUTOMOTIVE, CLM, CONNECTED_PRODUCTS, CONSTRUCTION, DIGITAL_TWIN, ENERGY_TRADING, FACILITY_SITE_MANAGEMENT, MINING, OG,
 PROCESS_MANUFACTURING, REGULATORY, SHIPMENT_FULFILLMENT, SUSTAINABILITY_ESG, TECHNOLOGY_MANUFACTURING, UTILITIES

 ────────────────────────────────────────

 Files to Modify (8 files)

 1. implement/SKILL.md

 Add after "Step 2: Work Through Tasks":

 New section: "Step 2.5: Project Initialization (React+FastAPI)"

 • 7-step scaffold workflow:
   1. Init Vite+React+TS (npm create vite@latest frontend -- --template react-ts)
   2. Configure Tailwind (install, config, global styles with Snowflake design tokens)
   3. Create Layout component (DashboardShell from templates)
   4. Create FastAPI main.py (uvicorn, CORS, include routers)
   5. Create SnowflakeService (from templates/backend/snowflake_service.py)
   6. Add Cortex Agent proxy (from templates/backend/cortex_agent_service.py)
   7. Configure Vite proxy + SWR data fetching

 Add to "Step 3: Generate Real Code":

 New subsection: "Backend Templates"

 • Reference templates/backend/cortex_agent_service.py — copy and customize config values
 • Reference templates/backend/snowflake_service.py — copy and set connection name
 • Reference templates/sql/schema_template.sql — copy and replace placeholders

 New subsection: "Frontend Templates"

 • Reference templates/frontend/hooks/useCortexAgent.ts — copy into frontend/src/hooks/
 • Reference references/react-production-patterns.md — apply race condition prevention, SSE buffer mgmt, fallback patterns

 2. references/react-components.md

 Add at end, before checklist:

   ## Production Patterns

   For implementation-time patterns (race conditions, SSE buffer management,
   multi-agent orchestration, fallback strategies), load
   `references/react-production-patterns.md`.

 3. references/data-architecture.md

 Replace the "Transformation Decision Matrix" table (lines 179-187) with:

   ## Transformation Approaches

   See `references/transformation-approaches.md` for the full decision framework
   with SQL examples for each approach (Views, Materialized Views, Dynamic Tables,
   Stored Procedures, Streams+Tasks).

   ### Quick Reference

   | Use When | Approach |
   |----------|----------|
   | Simple transforms, real-time accuracy | **Views** |
   | Expensive aggregations, predictable queries | **Materialized Views** |
   | Multi-step pipelines, declarative preferred | **Dynamic Tables** |
   | Complex logic, conditional processing | **Stored Procedures** |
   | CDC processing, near-real-time | **Streams + Tasks** |

 Replace the "Data Dictionary Reference" section (lines 198-223) to point to references/dictionaries/ directory with note that CSVs are available for entity lookup
 during spec generation.

 4. SKILL.md

 Add reflect step between analyze (Step 5) and generate (Step 6):

   Step 5.5: Persona Reflection → Load reflect/SKILL.md

 Add to sub-skills table:

   | Reflect | `reflect/SKILL.md` | After analyze passes, before generate |

 Add stopping point:

   - ✋ After persona reflection report (Step 5.5)

 5. references/testing-spec.md

 Add after "Test Execution Order" section:

 New section: "6-Layer Debugging Framework"

 ┌────────────────────┬─────────────────────────────────────┬─────────────────────────────────────────────────┐
 │ Layer              │ What to Check                       │ Diagnostic Commands                             │
 ├────────────────────┼─────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ 1. Connection      │ Profile resolves, warehouse running │ snow connection test, SHOW WAREHOUSES           │
 ├────────────────────┼─────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ 2. SQL Objects     │ All objects exist                   │ SHOW TABLES/VIEWS/PROCEDURES IN SCHEMA          │
 ├────────────────────┼─────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ 3. Data            │ Row counts, referential integrity   │ SELECT COUNT(*), FK join checks                 │
 ├────────────────────┼─────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ 4. Cortex Services │ Agent/Search/Analyst respond        │ SHOW CORTEX AGENTS, SHOW CORTEX SEARCH SERVICES │
 ├────────────────────┼─────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ 5. Application     │ Pages load, no console errors       │ Browser console, network tab                    │
 ├────────────────────┼─────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ 6. Integration     │ End-to-end flow works               │ Full user journey test                          │
 └────────────────────┴─────────────────────────────────────┴─────────────────────────────────────────────────┘

 New section: "Common Issues & Fixes"
 Table of frequent failures with resolution steps (from snowflake-demo-testing/SKILL.md)

 New section: "CI/CD Integration"
 Reference templates/ci_test_cycle.sh — CI/CD bash script template.

 New section: "Block-Release Signals"
 Automatic no-ship criteria:

 • Any golden query returns wrong result
 • deploy.sh is not idempotent (fails on re-run)
 • Hardcoded credentials found in any file
 • ACCOUNTADMIN role used
 • CSP-blocked libraries in bundle
 • Hidden Discovery not reliably present in data
 • React build fails (npm run build exits non-zero)
 • Secrets in client bundle (grep for tokens/keys)

 New section: "Guideline Review Matrix"
 10 categories with pass/fail scoring:

 1. SQL Compliance
 2. Security
 3. Project Structure
 4. Data Quality
 5. Notebooks
 6. Streamlit
 7. React (if applicable)
 8. Documentation
 9. Cortex Services
 10. Deployment Scripts

 New section: "React Security Audit"

 • No secrets in build output (grep -r "token\|secret\|password" dist/)
 • node_modules/ in .gitignore
 • logs/ in .gitignore
 • No inline secrets in source
 • Dependency audit (npm audit)

 New section: "Release Gate"

 • All block-release signals clear → SHIP
 • Any block-release signal → NO SHIP (must fix first)
 • All guideline categories pass → READY
 • 1+ guideline category fails → CONDITIONAL (document exceptions)

 6. generate/SKILL.md

 Add after "Step 2: Validate Domain Model":

 New section: "Data Generation Principles"

 • RANDOM_SEED = 42 — always
 • Generate once, commit to data/synthetic/ — never generate at deploy time
 • Use templates/generate_synthetic_data.py as starter template
 • Directory convention: data/synthetic/{entity_name}.csv

 Add after output section:

 New section: "Regeneration Guidance"

 • When to regenerate: schema changes, new entities, row count changes
 • How: re-run generator script, re-commit CSVs
 • Verify: referential integrity across files, hidden discovery still present

 7. references/drd-template.md

 Add after "Quality Checklist":

 New section: "DRD Generation Workflow"
 4-step process:

 1. Gather Context: Load research brief + intake answers + industry defaults
 2. Draft Sections: Generate all 6 DRD sections using templates
 3. Review: Validate against quality checklist (already exists)
 4. Finalize: Resolve any gaps, confirm hidden discovery, confirm STAR completeness

 Add after component mapping:

 New section: "DRD Quality Gate"

 • All 7 intake categories addressed (industry, audience, persona, pain points, hidden discovery, self-guided, data context)
 • Component mapping complete (every feature → Snowflake capability)
 • Hidden discovery engineered into data design
 • Each persona has complete STAR journey

 8. references/constraints.md

 No structural changes needed — already comprehensive. But add one entry to "Red Flags" table:

   | Generate data at deploy time | Pre-generate with seed=42, commit to data/synthetic/ |

 ────────────────────────────────────────

 Summary

 ┌───────────────────┬──────────────────────┐
 │ Category          │ Count                │
 ├───────────────────┼──────────────────────┤
 │ New files         │ 10                   │
 ├───────────────────┼──────────────────────┤
 │ New CSVs (copied) │ 20                   │
 ├───────────────────┼──────────────────────┤
 │ Modified files    │ 8                    │
 ├───────────────────┼──────────────────────┤
 │ New sub-skill     │ 1 (reflect/SKILL.md) │
 ├───────────────────┼──────────────────────┤
 │ Total changes     │ 39 files             │
 └───────────────────┴──────────────────────┘

 Implementation Order

 1. Gap 1: templates/backend/, templates/frontend/, templates/sql/, modify implement/SKILL.md
 2. Gap 3: references/transformation-approaches.md, modify references/data-architecture.md
 3. Gap 2: references/react-production-patterns.md, modify references/react-components.md
 4. Gap 4: reflect/SKILL.md, modify SKILL.md
 5. Gap 5: templates/ci_test_cycle.sh, modify references/testing-spec.md
 6. Gap 6: Modify references/testing-spec.md (block-release, review matrix, security audit, release gate)
 7. Gap 7: templates/generate_synthetic_data.py, modify generate/SKILL.md
 8. Gap 8: Modify references/drd-template.md
 9. Gap 9: Copy 20 CSVs to references/dictionaries/, modify references/data-architecture.md