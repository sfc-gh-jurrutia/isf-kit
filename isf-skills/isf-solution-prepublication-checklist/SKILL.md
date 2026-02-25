---
name: isf-solution-prepublication-checklist
description: >
  Validate ISF solutions against pre-publication rules before release.
  Covers project structure, security, DDL compliance, React app validation,
  data quality, documentation, and block-release signals. Use when:
  (1) preparing a solution for publication, (2) auditing compliance,
  or (3) running final validation before handoff.
---

# ISF Pre-Publication Checklist

## Quick Start

Run this skill after `isf-solution-testing` passes all layers. This is the final gate before a solution is published or handed off.

## Validation Order

1. Project structure
2. Security scan
3. DDL compliance
4. Data quality
5. React app validation
6. Documentation
7. Block-release signals

## Project Structure

| Check | Pass If |
|-------|---------|
| `deploy/setup.sql` exists | Infrastructure provisioning script present |
| `src/database/migrations/` has V*.sql files | schemachange migrations present |
| `src/data_engine/output/` has CSVs + manifest.json | Seed data pre-generated and committed |
| `src/ui/package.json` exists | React app present |
| `api/app/main.py` exists | FastAPI backend present |
| `deploy/spcs/Dockerfile` exists | SPCS deployment ready |
| `deploy/spcs/service-spec.yaml` exists | Service spec present |
| `Makefile` exists | Build orchestration configured |
| `.env.example` exists | Configuration documented |
| `.gitignore` present and correct | See gitignore checks below |

## Security Scan

| Check | Command | Pass If |
|-------|---------|---------|
| No hardcoded credentials | `grep -riE "password\|secret\|api_key\|token\|private_key" api/ src/ --include="*.py" --include="*.ts" --include="*.sql"` | No matches (except `allow_credentials=True` CORS config) |
| No `.env` files committed | `git ls-files \| grep '\.env$'` | No matches |
| No secrets in React build | `grep -r "token\|secret\|password\|Bearer" src/ui/dist/` | No matches (after `npm run build`) |
| Connection uses env var | Check `api/` for `SNOWFLAKE_CONNECTION_NAME` pattern | Pattern found, no hardcoded values |
| No ACCOUNTADMIN role | `grep -r "ACCOUNTADMIN" src/database/ deploy/` | No matches |

## DDL Compliance

| Check | Pass If |
|-------|---------|
| No CHECK constraints | `grep -i "CHECK" src/database/migrations/*.sql` returns no constraint definitions |
| PK/FK/UNIQUE documented as metadata-only | Comments note "not enforced" |
| All object names uppercase | No lowercase identifiers in DDL |
| Fully qualified references | `DATABASE.SCHEMA.OBJECT` pattern used |
| `CREATE OR REPLACE` for idempotency | All DDL uses `CREATE OR REPLACE` or `IF NOT EXISTS` |

## Data Quality

| Check | Pass If |
|-------|---------|
| Seed data uses seed=42 | manifest.json shows `"seed": 42` |
| Data committed to repo | `src/data_engine/output/` not in `.gitignore` |
| Realistic row counts | Not toy-sized (>100 rows per entity minimum) |
| Referential integrity | No orphaned FK references |
| Hidden discovery present | Validation query confirms the discovery pattern |
| Date ranges realistic | Recent dates, not 1970 or far future |

## React App Validation

| Check | Pass If |
|-------|---------|
| `npm run build` exits 0 | Build succeeds with no errors |
| No CSP violations | Browser console clean (no external CDN) |
| Responsive | Test at 375px, 768px, 1024px |
| `/health` endpoint | FastAPI returns 200 |
| SSE streaming works | Agent responses stream incrementally |
| `node_modules/` in .gitignore | Not committed to repo |
| `dist/` in .gitignore | Build output not committed |
| `logs/` in .gitignore | Runtime logs not committed |
| Style guide tokens applied | `isf-solution-style-guide` colors, no red/green comparisons |

## Documentation

| Check | Pass If |
|-------|---------|
| README.md present | Includes setup instructions, prerequisites, architecture |
| Architecture diagram | Mermaid diagram in docs/ or README |
| `docs/SOLUTION_ARCH.md` present | Architecture specification |
| `docs/DATA_MODEL.md` present | Schema design and data flow |

## Block-Release Signals

If ANY of these are true, the solution **must not be published**:

| # | Signal | How to Check |
|---|--------|-------------|
| 1 | Hardcoded credentials detected | Security scan above |
| 2 | `deploy` not idempotent | `make clean && make deploy && make deploy` — second run must succeed |
| 3 | React build fails | `cd src/ui && npm run build` |
| 4 | Hidden discovery not reliably present | Run validation query 3x, confirm pattern each time |
| 5 | ACCOUNTADMIN role used | `grep -r "ACCOUNTADMIN" src/ deploy/` |
| 6 | Secrets in client bundle | `grep -r "token\|secret\|password" src/ui/dist/` |
| 7 | Non-deterministic data | Different output on re-generation (check seed) |

## Release Decision

| Condition | Decision |
|-----------|----------|
| All block-release signals clear + all checks pass | Ship |
| Any block-release signal true | No ship — fix first |
| Block-release clear but minor checks fail | Conditional — document exceptions |

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-solution-testing` | Run before this skill — validates functional correctness |
| `isf-diagnostics` | Use when checks fail — troubleshoot root cause |
| `isf-solution-package` | Run after this skill — create presentation materials |
