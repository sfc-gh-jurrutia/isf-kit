# Solution Constraints Reference

> Load this reference when planning or implementing solutions

## Red Flags - NEVER Do These

| Never | Instead |
|-------|--------|
| Put scripts in `scripts/` subdirectory | Scripts go in PROJECT ROOT |
| Require arguments for deploy.sh | `./deploy.sh` runs ALL steps by default |
| Use `deploy.sh all` pattern | Default (no args) = full deployment |
| Use D3.js, Leaflet, Plotly Geo | Use PyDeck for maps (CSP blocked) |
| Use CHECK constraints in DDL | Snowflake doesn't support |
| Run notebooks locally | Deploy to Snowflake |
| Hardcode credentials | Use `connection_name=` pattern |
| Generate data at deploy time | Pre-generate with seed=42, commit to `data/synthetic/` |

## CSP Blocked Libraries

These are blocked by Snowflake's Content Security Policy:

- D3.js (any version)
- Leaflet
- Plotly geographic maps
- Any external CDN JavaScript

**Alternative for maps:** PyDeck with `map_style=None`

## DDL Constraints

| Constraint Type | Snowflake Support |
|-----------------|-------------------|
| CHECK | ❌ Unsupported |
| PRIMARY KEY | ✅ Metadata-only (not enforced) |
| FOREIGN KEY | ✅ Metadata-only (not enforced) |
| UNIQUE | ✅ Metadata-only (not enforced) |
| NOT NULL | ✅ Enforced |

## Pre-Flight Checklist

Before implementation begins, verify:

- [ ] Three scripts in PROJECT ROOT: ./deploy.sh, ./run.sh, ./clean.sh
- [ ] `./deploy.sh` (no args) runs full deployment
- [ ] React directory named `react/` with frontend/ + backend/
- [ ] Synthetic data pre-generated with fixed seed (42)
- [ ] No CHECK constraints in DDL
- [ ] No external CDN JavaScript
- [ ] All notebook cells have unique names
- [ ] SPCS deployment config ready (if React app)
- [ ] Connection profile configured (SNOWFLAKE_CONNECTION_NAME)
- [ ] React `node_modules/` and `logs/` in `.gitignore`

## Quick Decisions

### Cortex Feature Selection

| Need | Feature |
|------|---------|
| Natural language → SQL | Cortex Analyst |
| Document search / RAG | Cortex Search |
| Multi-tool orchestration | Cortex Agent |

### Visualization Library Priority

| Priority | Library | Notes |
|----------|---------|-------|
| 1st | Plotly | Networks, Sankey, Treemaps, most charts |
| 2nd | Altair | Statistical, faceted, interactive |
| 3rd | PyDeck | Maps (with `map_style=None`) |
| ❌ | D3/Leaflet/Plotly-Geo | Blocked by CSP |

### App Type

All solutions use **React + FastAPI** deployed to SPCS. Notebooks are used for ML training/exploration only.

## Standard Project Structure

```
project/
├── deploy.sh              # IN ROOT - runs all steps by default
├── run.sh                 # IN ROOT - ./run.sh main for runtime
├── clean.sh               # IN ROOT - complete teardown
├── sql/
├── data/
├── react/                 # React+FastAPI application
│   ├── frontend/          # Vite + React + TypeScript
│   ├── backend/           # FastAPI with Snowflake connector
│   │   └── api/database.py  # Uses connection_name= pattern
│   ├── start.sh           # Start both services
│   ├── stop.sh            # Stop services
│   └── logs/              # Runtime logs (gitignored)
└── notebooks/
```

## Snowflake Connection Pattern (CRITICAL)

ALWAYS use CLI connection profile pattern. NEVER hardcode credentials:

```python
import os
import snowflake.connector

connection_name = os.getenv("SNOWFLAKE_CONNECTION_NAME", "demo")
conn = snowflake.connector.connect(connection_name=connection_name)
```

## Data Architecture Constraints

| Constraint | Why | What To Do |
|-----------|-----|------------|
| RAW layer must exist | Source realism + audit trail | Always create RAW even for simple solutions |
| RAW types must be loose | Strict types cause load failures | Use VARCHAR in RAW, cast in ATOMIC |
| No transforms in RAW | Loses original data fidelity | Transform in ATOMIC or later |
| No views in RAW | RAW is for persistence only | Views belong in ATOMIC or DATA_MART |
| Audit columns required | Track who changed what | `CREATED_*`, `UPDATED_*` on all ATOMIC tables |
| Metadata columns required | Track data provenance | `_LOADED_TIMESTAMP` on all RAW tables |
| DATA_MART must be named | Generic names confuse consumers | Use project-specific schema names |
| Seed data pre-generated | Runtime generation is fragile | Use `seed=42`, commit to `data/seed/` |

## Cortex Constraints

| Constraint | Why | What To Do |
|-----------|-----|------------|
| `verified_at` must be Unix int64 | ISO strings silently fail | Use `int(datetime.timestamp())` |
| `primary_key` required per table | Analyst generates bad JOINs without it | Always specify in semantic model |
| Metrics/filters inside table | Top-level placement causes parse error | Nest under `tables[].metrics[]` |
| Agent endpoint is `/agents/` | `/cortex-agents/` returns 404 | Use `/api/v2/.../agents/{NAME}:run` |
| `execution_environment` mandatory | Required if any tool is `custom` type | Include in `TOOL_RESOURCES` |
| HTTP client must be `httpx` | `requests` lacks async streaming | Never use `requests` for agent calls |
| Search `id_column` in SELECT | Omission causes service creation failure | Always include in source query |
| Model availability varies | Not all models in all regions | Run `SHOW CORTEX MODELS` first |

## Testing Constraints

| Constraint | Why | What To Do |
|-----------|-----|------------|
| Golden queries required | Validates semantic model works | Minimum 3-5 per model |
| deploy.sh must be idempotent | Re-runs should not fail | Use `CREATE OR REPLACE` |
| clean.sh needs confirmation | Prevents accidental deletion | Prompt before destructive action |
| Test clean + re-deploy cycle | Proves reproducibility | Run clean.sh → deploy.sh → verify |

## Python Environment Constraints

| Constraint | Why | What To Do |
|-----------|-----|------------|
| Python `>=3.10,<3.12` | Snowflake package compatibility | Set in `pyproject.toml` or `requirements.txt` |
| Use `httpx` not `requests` | SSE streaming support | `httpx>=0.24.0` |
| No `ACCOUNTADMIN` role | Security best practice | Use `SYSADMIN` or custom role |
| Account URL hyphens | Snowflake URL format | `ORGNAME_ACCOUNT` → `orgname-account` |
