
  Gap Analysis: snowflake-demo-* Skills vs. Specify Workflow

  Summary

  The specify workflow captures ~60% of the knowledge in the snowflake-demo-* skills. Phase 1 did a strong job pulling in architecture patterns, constraints, and Cortex
   specs. But several critical areas are either missing entirely or reduced to summaries where the source has actionable, copy-paste-ready content.

  ────────────────────────────────────────

  GAP 1: Implementation Scaffolding (CRITICAL)

  Source: snowflake-demo-react-app/references/workflow.md — 7-step scaffold with complete code templates (Vite+React+TS setup, Tailwind config, Layout component,
  FastAPI main.py, SnowflakeService with connection pool, Vite proxy config)

  Source: snowflake-demo-react-app/templates/cortex_agent_service.py — 460 lines of production-ready FastAPI code for Cortex Agent proxy (thread management, streaming
  SSE, event mapping, auth helpers, health check)

  Source: snowflake-demo-react-app/templates/hooks/useCortexAgent.ts — 270 lines of production React hook (SSE parsing, abort controller, tool status tracking,
  reasoning stages)

  Specify has: implement/SKILL.md references UI templates and gives a checklist, but has no backend scaffolding. No FastAPI service template. No React hook template. No
   project initialization workflow. The implement phase tells you what to build but gives you no starter code for the backend + Cortex integration.

  Missing:

  • FastAPI Cortex Agent proxy template (thread management, SSE streaming, event mapping)
  • React useCortexAgent hook template
  • 7-step project initialization sequence (init Vite, configure Tailwind, create Layout, create FastAPI, create SnowflakeService, configure proxy, wire SWR)
  • Schema creation SQL template (snowflake-demo-data-architecture/assets/schema_template.sql)

  ────────────────────────────────────────

  GAP 2: Production React Patterns (HIGH)

  Source: snowflake-demo-react-app/references/copilot-learnings.md — Production-hardened patterns: race condition prevention (abort controllers), SSE buffer management,
   context injection, Zustand chat state management, multi-agent orchestration with intent classification, fallback query patterns (Analyst → pattern-matched SQL →
  error), domain-specific LLM prompting, chart color consistency with Recharts

  Source: snowflake-demo-react-app/references/cortex-chat.md — CortexAgentChat widget documentation: full props reference, backend endpoint requirements, thinking stage
   customization, message formatting, theming/styling, accessibility, performance considerations, error handling patterns

  Specify has: references/react-components.md (147 lines) — covers component library and rules at a summary level. No production patterns. No fallback strategies. No
  multi-agent orchestration. No race condition prevention.

  Missing:

  • Multi-agent orchestration pattern (intent classification → agent routing)
  • Fallback query pattern (Analyst → pattern-matched SQL → error message)
  • Race condition prevention patterns (AbortController, request deduplication)
  • SSE buffer management (partial line handling, reconnection)
  • Zustand store pattern for chat state
  • CortexAgentChat widget detailed configuration
  • Chart color consistency rules (Recharts palette)
  • Domain-specific LLM prompt engineering patterns

  ────────────────────────────────────────

  GAP 3: Transformation Approaches Reference (HIGH)

  Source: snowflake-demo-data-architecture/references/transformation-approaches.md — Full decision framework with complete SQL examples for each approach: Views (simple
   transforms), Materialized Views (expensive aggregations), Dynamic Tables (multi-step pipelines with TARGET_LAG), Stored Procedures (conditional logic), Streams+Tasks
   (CDC processing)

  Specify has: references/data-architecture.md has a 5-row summary table ("Transformation Decision Matrix") — no SQL examples, no decision tree logic, no guidance on
  when to combine approaches.

  Missing:

  • Full SQL examples for each transformation approach
  • Decision tree with conditional logic (not just a flat table)
  • Guidance on combining approaches (e.g., Streams+Tasks feeding Dynamic Tables)
  • Dynamic Table TARGET_LAG patterns and best practices

  ────────────────────────────────────────

  GAP 4: Persona Reflection QA Step (HIGH)

  Source: snowflake-demo-reflection-persona/SKILL.md — A dedicated QA phase that reviews: persona coverage (are all personas represented?), STAR navigation assessment
  (does each journey have clear S→T→A→R?), visual strategy alignment (does each persona get appropriate viz?), tone alignment rules. Includes a persona reflection
  worksheet template.

  Specify has: No equivalent. The analyze phase (analyze/SKILL.md) checks cross-artifact consistency (duplicates, ambiguity, coverage gaps) but never evaluates persona
  quality, STAR completeness, or visual strategy alignment. Persona reflection is completely absent from the workflow.

  Missing:

  • Persona coverage review step
  • STAR navigation assessment (per persona)
  • Role-based visual strategy validation
  • Tone alignment check
  • Persona reflection worksheet template

  ────────────────────────────────────────

  GAP 5: Full Test Cycle with Layered Debugging (MEDIUM)

  Source: snowflake-demo-testing/SKILL.md + references/full-test-cycle.md — 6-layer debugging framework (Connection → SQL Objects → Data → Cortex Services → Application
   → Integration), full CI/CD test script template, diagnostic commands for each layer, common issues/fixes table

  Source: snowflake-demo-testing/assets/ci_test_cycle.sh — Concrete CI/CD bash script (clean → deploy → test → run main → verify outputs)

  Specify has: references/testing-spec.md covers golden queries, acceptance criteria by component, and test execution order. But no layered debugging framework, no
  diagnostic commands, no CI/CD script template.

  Missing:

  • 6-layer debugging framework (Connection → SQL → Data → Cortex → App → Integration)
  • Diagnostic commands per layer
  • Common issues/fixes reference table
  • CI/CD test script template (ci_test_cycle.sh)

  ────────────────────────────────────────

  GAP 6: Pre-Publication Checklist Depth (MEDIUM)

  Source: snowflake-demo-prepublication-checklist/SKILL.md — 10 guideline categories with detailed review matrix, release-readiness checklist, block-release signals
  (things that should prevent shipping), React-specific security checks (no secrets in bundle, gitignore verification, dependency audit)

  Specify has: references/testing-spec.md includes a pre-publication checklist (lines 98-157) covering SQL compliance, security, project structure, data quality,
  notebooks, Streamlit, and documentation. It's good but lacks: block-release signals, guideline review matrix scoring, React security audit depth.

  Missing:

  • Block-release signals (automatic no-ship criteria)
  • Guideline review matrix with scoring per category
  • React security audit (bundle inspection, secret scanning, dependency audit)
  • Release-readiness gate (pass/fail determination)

  ────────────────────────────────────────

  GAP 7: Synthetic Data Generation Patterns (MEDIUM)

  Source: snowflake-demo-data-generation/SKILL.md — Core principles (seed=42, pre-generate, commit), directory structure, implementation steps (generator script
  template, deploy pattern, clean pattern), regeneration guidance

  Source: snowflake-demo-data-generation/assets/generate_synthetic_data.py — Concrete Python template with argparse, fixed seed, CSV output, directory creation

  Specify has: generate/SKILL.md handles data generation with 3 modes (Standard/LLM/Rule-based) but lacks the concrete generator script template and the principle that
  data should be pre-generated and committed (not generated at deploy time). The deployment-spec mentions seed data, but the generate phase doesn't enforce the
  "generate once, commit" pattern.

  Missing:

  • Python generator script template (generate_synthetic_data.py)
  • Explicit "generate once, commit to repo" enforcement in generate phase
  • Directory structure convention (data/synthetic/)
  • Regeneration guidance (when and how to re-run)

  ────────────────────────────────────────

  GAP 8: DRD Template (LOW)

  Source: snowflake-demo-drd-generation/assets/drd_template.md — Full 6-section DRD template: Strategic Overview (with Hidden Discovery subsection), User Personas (with
   STAR mapping), Data Architecture, Cortex Specs, Streamlit UX, Success Criteria. Also: 4-step DRD generation workflow, 7 intake categories, component mapping.

  Specify has: references/drd-template.md exists (not read yet but referenced in SKILL.md). The spec-template.md already includes DRD sections. However, the DRD
  generation workflow (4 steps) and the quality checklist are in the source but likely not in specify.

  Impact: Low — the spec template already covers this content.

  ────────────────────────────────────────

  GAP 9: Industry Data Dictionary CSVs (LOW)

  Source: snowflake-demo-data-architecture/assets/dictionary/ — 20+ CSV files with standard entity definitions per industry

  Specify has: references/data-architecture.md lists the 17 industry dictionaries in a table but they exist as text references only, not as actual CSV files.

  Impact: Low for the specify workflow itself (it can reference the source repo), but worth noting that the dictionaries aren't portable.

  ────────────────────────────────────────

  Severity Summary

  ┌─────┬──────────┬──────────────────────────────────────────────────────────────────────────────┐
  │ Gap │ Severity │ Description                                                                  │
  ├─────┼──────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ 1   │ CRITICAL │ Implementation scaffolding (no backend templates, no project init)           │
  ├─────┼──────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ 2   │ HIGH     │ Production React patterns (no fallbacks, no multi-agent, no race prevention) │
  ├─────┼──────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ 3   │ HIGH     │ Transformation approaches (summary table vs. full decision tree + SQL)       │
  ├─────┼──────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ 4   │ HIGH     │ Persona reflection QA step (completely absent)                               │
  ├─────┼──────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ 5   │ MEDIUM   │ Full test cycle with layered debugging                                       │
  ├─────┼──────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ 6   │ MEDIUM   │ Pre-publication depth (no block-release signals)                             │
  ├─────┼──────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ 7   │ MEDIUM   │ Synthetic data generator template                                            │
  ├─────┼──────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ 8   │ LOW      │ DRD template workflow (mostly covered)                                       │
  ├─────┼──────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ 9   │ LOW      │ Industry CSV dictionaries (reference-only, not portable)                     │
  └─────┴──────────┴──────────────────────────────────────────────────────────────────────────────┘

  ────────────────────────────────────────

  Recommended Implementation Order

  1. Gap 1 — Add implementation templates (FastAPI proxy, useCortexAgent hook, schema SQL, project init workflow)
  2. Gap 3 — Add full transformation approaches reference with SQL examples
  3. Gap 2 — Add production React patterns reference (copilot learnings, fallbacks, multi-agent)
  4. Gap 4 — Add persona reflection as a QA step between analyze and generate
  5. Gap 5 — Strengthen testing with layered debugging and CI/CD script
  6. Gap 6 — Add block-release signals and release gate to pre-publication
  7. Gap 7 — Add generator template and enforce commit pattern