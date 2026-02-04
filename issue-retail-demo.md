# Issues Encountered - Retail Demo Setup

This document captures issues encountered while getting the retail-demo working, intended to improve the specify process for future iterations.

**All issues resolved and integrated into `.specify/` workflow.**

---

## 1. Python SDK Incompatibility (snowflake-ml-python) ✅ RESOLVED

- **Problem**: `snowflake-ml-python` package (required for `from snowflake.cortex import Analyst`) depends on `llvmlite` which only supports Python <3.10. User has Python 3.13.
- **Error**: `RuntimeError: Cannot install on Python version 3.13.11; only versions >=3.6,<3.10 are supported`
- **Solution**: Rewrote connector to use Cortex Analyst REST API directly instead of Python SDK
- **Spec improvement**: Specify Python version constraints or default to REST API approach for broader compatibility

**✅ Resolution:** `.specify/templates/pyproject-template.toml` with `requires-python = ">=3.10,<3.12"` and REST API pattern in `.specify/skills/implement.md`

---

## 2. Semantic Model - verified_at Field Format ✅ RESOLVED

- **Problem**: `verified_at` in verified_queries section was a date string (`"2026-02-04"`) but Cortex Analyst expects Unix timestamp (int64)
- **Error**: `Invalid semantic model yaml: Not an int64 value: "2026-02-04"`
- **Solution**: Changed to Unix timestamp: `verified_at: 1738627200`
- **Spec improvement**: Semantic model generator should output Unix timestamps, not ISO date strings

**✅ Resolution:** `.specify/generators/semantic.py` now outputs Unix timestamps

---

## 3. Semantic Model - Unsupported Top-Level Fields ✅ RESOLVED

- **Problem**: Top-level `filters` and `metrics` sections are not supported in semantic model YAML (they must be inside table definitions)
- **Error**: `unknown field "filters"`
- **Solution**: Removed top-level `filters` and `metrics` sections
- **Spec improvement**: Validate semantic model schema against Cortex Analyst spec before generating

**✅ Resolution:** Documented in `.specify/memory/constitution.md` Principle 10

---

## 4. Semantic Model - Missing Primary Keys ✅ RESOLVED

- **Problem**: Tables used in relationships require `primary_key` definitions
- **Error**: `Table orders used in join relationship order_items_to_orders has no primary key`
- **Solution**: Added `primary_key.columns` to each table definition
- **Spec improvement**: Always generate primary_key for tables that participate in relationships

**✅ Resolution:** Documented in `.specify/memory/constitution.md` Principle 10

---

## 5. SSE Event Name Mismatch (Frontend/Backend) ✅ RESOLVED

- **Problem**: Backend sent `results` event but frontend expected `data` event
- **Symptom**: Frontend showed "Analyzing your question..." indefinitely, never displayed results
- **Solution**: Changed backend to emit `event: data` instead of `event: results`
- **Spec improvement**: Define event contract explicitly in API spec; ensure frontend/backend use same event names

**✅ Resolution:** SSE Event Contract table in `.specify/skills/plan.md` and `.specify/skills/implement.md`

---

## 6. Streaming Implementation Complexity ✅ RESOLVED

- **Problem**: Initial streaming implementation tried to parse Snowflake's SSE format which was complex and error-prone
- **Symptom**: Empty events, no SQL/results yielded
- **Solution**: Simplified to use non-streaming query internally, then yield results as simulated stream events
- **Spec improvement**: Start with simple polling/non-streaming approach; add true streaming as enhancement

**✅ Resolution:** "Simulated streaming" pattern in `.specify/skills/implement.md` B5 section

---

## 7. PAT Token Location in Config ✅ RESOLVED

- **Problem**: Code looked for `token` field in config.toml but user stored PAT in `password` field
- **Solution**: Check both `token` and `password` fields in config
- **Spec improvement**: Document expected config field names or support multiple field names

**✅ Resolution:** PAT configuration guidance in `.specify/skills/implement.md` F2 section

---

## Specify Workflow Updates

All learnings integrated into `.specify/` folder:

| File | Updates |
|------|---------|
| `.specify/generators/semantic.py` | `verified_at` as Unix timestamp |
| `.specify/memory/constitution.md` | Principle 10: Standards-Compliant |
| `.specify/skills/implement.md` | REST API, SSE contract, simulated streaming, PAT config |
| `.specify/skills/plan.md` | SSE Event Contract table |
| `.specify/templates/pyproject-template.toml` | Python 3.10-3.11, httpx |
