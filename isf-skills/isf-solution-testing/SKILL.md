---
name: isf-solution-testing
description: >
  Validate ISF solutions end-to-end. Covers data quality, API endpoints,
  React UI, Cortex services, SPCS health, and hidden discovery verification.
  Use when: (1) running full test cycles, (2) validating deployments,
  (3) troubleshooting failures, or (4) preparing for pre-publication review.
parent_skill: isf-solution-engine
---

# ISF Solution Testing

## Quick Start

### Full Test Cycle

```bash
make clean && make deploy && make test
```

Or using shell scripts:

```bash
./clean.sh --force && ./deploy.sh && ./run.sh test
```

## Core Philosophy

1. **Clean Slate** — always start fresh for reproducibility
2. **Idempotency** — deploy scripts work on first run and re-runs
3. **Fail Fast** — exit immediately with clear error messages
4. **Layer by Layer** — debug from infrastructure up, not top down

## Test Layers

Debug from bottom up. A Layer 5 issue caused by Layer 2 wastes time if you skip the foundation.

```
Layer 1: Connection
  └── snow CLI installed? Connection works?

Layer 2: Infrastructure
  └── Database, schemas, roles, warehouse created?

Layer 3: Data
  └── Migrations applied? Seed data loaded? Row counts correct?

Layer 4: Cortex Services
  └── Agent responds? Search returns results? Semantic model valid?

Layer 5: Application
  └── React builds? FastAPI health endpoint responds?

Layer 6: SPCS
  └── Service READY? Container healthy? Endpoint accessible?

Layer 7: Integration
  └── End-to-end: question → agent → response → visualization

Layer 8: Hidden Discovery
  └── Generated data exhibits the expected discovery pattern?
```

## Test Commands

### Layer 1: Connection

```bash
snow connection test -c ${CONNECTION}
snow sql -q "SELECT CURRENT_USER(), CURRENT_ROLE(), CURRENT_WAREHOUSE();" -c ${CONNECTION}
```

### Layer 2: Infrastructure

```bash
snow sql -q "SHOW SCHEMAS IN DATABASE ${DATABASE};" -c ${CONNECTION}
snow sql -q "SHOW WAREHOUSES LIKE '${WAREHOUSE}';" -c ${CONNECTION}
```

### Layer 3: Data

```bash
# Row counts per table
snow sql -q "
SELECT TABLE_SCHEMA, TABLE_NAME, ROW_COUNT
FROM ${DATABASE}.INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA NOT IN ('INFORMATION_SCHEMA', 'PUBLIC')
ORDER BY TABLE_SCHEMA, TABLE_NAME;" -c ${CONNECTION}

# Referential integrity
snow sql -q "
SELECT COUNT(*) AS orphaned
FROM ${DATABASE}.ATOMIC.{CHILD}
WHERE {FK_COLUMN} NOT IN (SELECT {PK_COLUMN} FROM ${DATABASE}.ATOMIC.{PARENT});" -c ${CONNECTION}
```

### Layer 4: Cortex Services

```bash
# Agent exists
snow sql -q "SHOW CORTEX AGENTS;" -c ${CONNECTION}

# Search service exists and refreshing
snow sql -q "SHOW CORTEX SEARCH SERVICES;" -c ${CONNECTION}

# Semantic view exists
snow sql -q "SHOW SEMANTIC VIEWS IN SCHEMA ${DATABASE}.${SCHEMA};" -c ${CONNECTION}

# Golden query test
snow sql -q "
SELECT * FROM TABLE(
  SNOWFLAKE.CORTEX.ANALYST('${DATABASE}.${SCHEMA}.${MODEL}', 'Total revenue by region?')
);" -c ${CONNECTION}
```

### Layer 5: Application

```bash
# React build
cd src/ui && npm run build

# FastAPI tests
cd api && python -m pytest
```

### Layer 6: SPCS

```bash
snow spcs service status ${SERVICE} -c ${CONNECTION}
curl -sf ${ENDPOINT}/health
```

### Layer 7: Integration

```bash
# End-to-end agent query via API
curl -X POST ${ENDPOINT}/api/agent/run \
  -H "Content-Type: application/json" \
  -d '{"message": "What were total sales last quarter?"}'
```

### Layer 8: Hidden Discovery

Run the validation query from `isf-data-generation` to confirm the discovery is present in the data.

## Common Issues

| Issue | Layer | Fix |
|-------|-------|-----|
| `snow` CLI not found | 1 | Install: `pip install snowflake-cli` |
| Connection failed | 1 | Check `.env`, verify network |
| Schema not found | 2 | Re-run `deploy/setup.sql` |
| 0 rows in tables | 3 | Check seed data loaded, verify COPY INTO |
| Agent 404 | 4 | Check endpoint path: `/agents/` not `/cortex-agents/` |
| React build fails | 5 | Check `npm run build` errors, fix TypeScript issues |
| Service PENDING | 6 | Check compute pool status, image pushed correctly |
| SSE not streaming | 7 | Add `X-Accel-Buffering: no` header |
| Discovery missing | 8 | Re-check data generation rules for the insight pattern |

## Pre-Test Checklist

- [ ] `.env` configured with connection details
- [ ] `deploy/setup.sql` has been run
- [ ] Migrations applied (check SCHEMACHANGE.CHANGE_HISTORY)
- [ ] Seed data loaded (verify row counts)
- [ ] Cortex objects deployed (agent, search, semantic model)
- [ ] React app builds locally (`npm run build`)
- [ ] FastAPI tests pass (`pytest`)
- [ ] SPCS service is READY (if deployed)

## Next Skill

After all test layers pass:

**Continue to** `../isf-solution-reflection-persona/SKILL.md` to audit STAR journeys against the personas defined in `isf-context.md`.

If tests fail, **Load** `../isf-diagnostics/SKILL.md` for troubleshooting. After fixing, re-run tests.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 7b.

## References

| File | Purpose |
|------|---------|
| `references/full-test-cycle.md` | Detailed test cycle with expected outputs |
| `references/prepublication.md` | Pre-publication validation criteria |
| `assets/ci_test_cycle.sh` | CI/CD test script template |
