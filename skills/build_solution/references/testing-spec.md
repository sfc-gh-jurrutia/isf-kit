# Testing and Pre-Publication Specification

> Load this reference during Step 2 (Generate Specification) and before deployment to ensure quality gates are defined.

## Golden Query Verification

Every semantic model must define golden queries — known-good question/SQL/result triples that validate the model works correctly.

### Golden Query Format

```yaml
golden_queries:
  - name: "Total Revenue Last Quarter"
    question: "What was total revenue last quarter?"
    expected_sql: |
      SELECT SUM(REVENUE_USD) AS TOTAL_REVENUE
      FROM DATA_MART.SALES_SUMMARY
      WHERE SALE_DATE >= DATEADD('quarter', -1, DATE_TRUNC('quarter', CURRENT_DATE()))
        AND SALE_DATE < DATE_TRUNC('quarter', CURRENT_DATE())
    expected_result:
      shape: "1 row, 1 column"
      range: "$10M - $15M"
      validation: "Cross-reference with finance report Q4 total"

  - name: "Top 5 Products by Volume"
    question: "What are the top 5 products by sales volume?"
    expected_sql: |
      SELECT PRODUCT_NAME, COUNT(*) AS SALES_COUNT
      FROM DATA_MART.SALES_DETAIL
      GROUP BY PRODUCT_NAME
      ORDER BY SALES_COUNT DESC
      LIMIT 5
    expected_result:
      shape: "5 rows, 2 columns"
      validation: "Product A should be #1 with ~50K units"
```

### Golden Query Requirements

| Requirement | Minimum |
|-------------|---------|
| Per semantic model | 3-5 golden queries |
| Cover query types | At minimum: aggregation, filtering, join, time-based |
| Include edge cases | Empty results, null handling, boundary dates |
| Result validation | Expected shape + approximate values |

## Acceptance Criteria by Component

### Data Architecture

| Criterion | Validation Method |
|-----------|------------------|
| RAW tables load without errors | `COPY INTO` with `ON_ERROR = 'ABORT_STATEMENT'` |
| ATOMIC transformations produce expected row counts | `SELECT COUNT(*)` vs expected |
| SCD2 history maintained | Insert → Update → Verify `IS_CURRENT_FLAG` transitions |
| DATA_MART views resolve without errors | `SELECT * FROM view LIMIT 1` |
| Metadata columns populated | `SELECT COUNT_IF(_LOADED_TIMESTAMP IS NULL) = 0` |

### Cortex Agent

| Criterion | Validation Method |
|-----------|------------------|
| Agent DDL creates without error | `SHOW CORTEX AGENTS` confirms existence |
| All tools resolve | Agent responds to queries using each tool |
| Golden queries return expected SQL | Run each golden query, compare output |
| Streaming responses complete | SSE stream ends with `done` event |
| Error handling works | Send malformed query, verify graceful error |

### Cortex Search

| Criterion | Validation Method |
|-----------|------------------|
| Service creates and refreshes | `SHOW CORTEX SEARCH SERVICES` |
| Relevant results for test queries | Top-3 results contain expected documents |
| Attribute filtering works | Filter by each attribute, verify narrowed results |
| Chunk quality | Random sample of 10 chunks are coherent and complete |

### Frontend (React)

| Criterion | Validation Method |
|-----------|------------------|
| Build succeeds | `npm run build` exits 0 |
| No CSP violations | Browser console clean of CSP errors |
| Components render | Each route/page loads without error |
| SSE streaming works | Agent responses stream incrementally |
| Mobile responsive | Test at 375px, 768px, 1024px widths |

## Pre-Publication Checklist

### SQL Compliance

- [ ] No `CHECK` constraints (Snowflake doesn't enforce them)
- [ ] `PRIMARY KEY` / `FOREIGN KEY` / `UNIQUE` used for metadata only (not enforced)
- [ ] `NOT NULL` used only where Snowflake enforces it
- [ ] All object names uppercase (Snowflake default)
- [ ] No reserved words as identifiers (or properly quoted)
- [ ] Fully qualified references: `DATABASE.SCHEMA.OBJECT`

### Security

- [ ] No hardcoded credentials in any file
- [ ] No `.env` files committed to repo
- [ ] Connection uses `SNOWFLAKE_CONNECTION_NAME` env var
- [ ] Secrets stored in Snowflake secrets objects (not config files)
- [ ] No `ACCOUNTADMIN` role in solution code (use `SYSADMIN` or custom role)

### Project Structure

- [ ] `deploy.sh` in project root — creates all Snowflake objects
- [ ] `run.sh` in project root — starts the application
- [ ] `clean.sh` in project root — drops all objects created by deploy
- [ ] `README.md` with setup instructions
- [ ] `requirements.txt` or `environment.yml` for Python deps
- [ ] `package.json` for JavaScript deps (if React)

### Data Quality

- [ ] Synthetic data uses `seed=42` for reproducibility
- [ ] Data pre-generated and committed (not generated at runtime)
- [ ] Row counts realistic for solution context (not toy-sized)
- [ ] Referential integrity maintained across tables
- [ ] Date ranges make sense for the scenario (recent, not 1970)
- [ ] Hidden discovery insight is reliably present in data

### Notebooks (if included)

- [ ] Cells run top-to-bottom without errors
- [ ] No hardcoded paths or account references
- [ ] Markdown cells explain each step
- [ ] Output cells cleared before commit (re-run to verify)
- [ ] Dependencies listed in first cell

### Documentation

- [ ] DRD (Design Rationale Document) completed
- [ ] Persona journeys follow STAR framework
- [ ] Architecture diagram included
- [ ] Known limitations documented

## Test Execution Order

1. **Deploy** — Run `deploy.sh`, verify all objects created
2. **Data Validation** — Check row counts, referential integrity, metadata columns
3. **Cortex Services** — Verify agent, search, analyst all respond
4. **Golden Queries** — Run all golden queries, compare against expected
5. **Frontend** — Load application, test all interactions
6. **Clean** — Run `clean.sh`, verify all objects removed
7. **Re-deploy** — Run `deploy.sh` again to verify idempotent deployment

---

## 6-Layer Debugging Framework

When tests fail, debug from bottom up:

| Layer | What to Check | Diagnostic Commands |
|-------|--------------|---------------------|
| 1. Connection | Profile resolves, warehouse running | `snow connection test -c demo`, `SHOW WAREHOUSES` |
| 2. SQL Objects | All tables/views/procedures exist | `SHOW TABLES IN SCHEMA RAW`, `SHOW VIEWS IN SCHEMA {DATA_MART}` |
| 3. Data | Row counts correct, referential integrity | `SELECT COUNT(*) FROM`, FK join checks |
| 4. Cortex Services | Agent/Search/Analyst respond | `SHOW CORTEX AGENTS`, `SHOW CORTEX SEARCH SERVICES` |
| 5. Application | Pages load, no console errors | Browser console, network tab, `curl /health` |
| 6. Integration | End-to-end user journey works | Full test cycle: question -> response -> visualization |

**Debug order**: Always start at Layer 1 and work up. A Layer 3 failure caused by a Layer 1 issue wastes time.

## Common Issues and Fixes

| Symptom | Layer | Cause | Fix |
|---------|-------|-------|-----|
| `snow sql` returns auth error | 1 | Connection profile invalid | `snow connection test`, verify config |
| Table not found | 2 | deploy.sh didn't complete | Re-run `./deploy.sh`, check for errors |
| 0 rows in DATA_MART | 3 | ATOMIC transform failed | Check RAW row counts first, then ATOMIC |
| Agent returns 404 | 4 | Wrong endpoint path | Use `/agents/` not `/cortex-agents/` |
| Blank page | 5 | Build failed | Run `npm run build`, check for errors |
| SSE stream hangs | 6 | Missing SSE headers | Add `Cache-Control: no-cache`, `Connection: keep-alive` |
| `verified_at` error | 4 | ISO string instead of Unix int | Use `int(datetime.timestamp())` |
| Analyst generates bad JOINs | 4 | Missing `primary_key` in semantic model | Add PK to every table in semantic model |

## CI/CD Integration

Use `templates/ci_test_cycle.sh` as the CI/CD test script. Customize:
- `MIN_EXPECTED_ROWS` — minimum output rows for your project
- `TIMEOUT_SECONDS` — max time for main workflow
- Output table reference in Step 5

## Block-Release Signals

These are automatic no-ship criteria. If ANY is true, the solution **must not be published**:

| # | Signal | Check Command |
|---|--------|--------------|
| 1 | Any golden query returns wrong result | Run all golden queries, compare |
| 2 | `deploy.sh` not idempotent | `./clean.sh --force && ./deploy.sh && ./deploy.sh` |
| 3 | Hardcoded credentials in any file | `grep -r "password\|secret\|token" --include="*.py" --include="*.ts" --include="*.sql"` |
| 4 | `ACCOUNTADMIN` role used | `grep -r "ACCOUNTADMIN" sql/` |
| 5 | CSP-blocked libraries in bundle | `grep -r "d3\|leaflet\|plotly.geo\|mapbox" frontend/package.json` |
| 6 | Hidden Discovery not reliably present | Run 3x, verify insight appears each time |
| 7 | React build fails | `cd frontend && npm run build` exits non-zero |
| 8 | Secrets in client bundle | `grep -r "token\|secret\|password\|Bearer" dist/` |

## Guideline Review Matrix

Score each category pass/fail:

| # | Category | Key Checks | Pass If |
|---|----------|-----------|---------|
| 1 | SQL Compliance | No CHECK constraints, uppercase names, fully qualified refs | All checks pass |
| 2 | Security | No hardcoded creds, no `.env` committed, no ACCOUNTADMIN | All checks pass |
| 3 | Project Structure | 3 scripts in root, correct directory names | All present |
| 4 | Data Quality | seed=42, pre-generated, referential integrity, realistic dates | All checks pass |
| 5 | Notebooks | Top-to-bottom execution, no hardcoded paths, outputs cleared | All pass (if applicable) |
| 6 | React | Build succeeds, no CSP violations, responsive, SSE works | All pass |
| 8 | Documentation | DRD complete, README with setup, known limitations | All present |
| 9 | Cortex Services | Agent responds, golden queries pass, search returns relevant | All pass |
| 10 | Deployment Scripts | deploy.sh idempotent, clean.sh confirms, run.sh test+main | All pass |

## React Security Audit

| Check | Command | Pass If |
|-------|---------|---------|
| No secrets in build output | `grep -r "token\|secret\|password" dist/` | No matches |
| `node_modules/` in .gitignore | `grep node_modules .gitignore` | Present |
| `logs/` in .gitignore | `grep logs .gitignore` | Present |
| No inline secrets in source | `grep -r "Bearer\|sk-\|pat_" frontend/src/` | No matches |
| Dependency audit clean | `npm audit --production` | No critical/high |

## Release Gate

| Condition | Decision |
|-----------|----------|
| All block-release signals clear + all guideline categories pass | **SHIP** |
| Any block-release signal true | **NO SHIP** (must fix first) |
| Block-release clear but 1+ guideline category fails | **CONDITIONAL** (document exceptions, get approval) |
