---
name: isf-data-generation
description: >
  Generate realistic synthetic data from entity definitions and generation rules.
  Reads YAML entity references from isf-data-architecture and produces pre-generated
  datasets committed to the project. Use when: (1) creating synthetic data for a
  solution, (2) populating RAW and ATOMIC layers, (3) engineering hidden discovery
  insights into data, or (4) generating industry-specific realistic datasets.
parent_skill: isf-solution-engine
---

# ISF Data Generation

## Quick Start

### What Does This Skill Do?

Takes entity YAML definitions (from `isf-data-architecture/references/entities/`) and produces synthetic datasets that:
- Match the schema exactly (types, constraints, relationships)
- Follow generation rules defined on each column (distributions, weighted choices, faker patterns)
- Maintain referential integrity across entities
- Contain the hidden discovery insight from the spec
- Are pre-generated with `seed=42` and committed to the project repo

### Input

- Entity YAML files from `isf-data-architecture/references/entities/` (loaded by industry)
- `isf-context.md` for: industry, hidden discovery, data scale, row count targets
- Migration files from `src/database/migrations/` (schema must be designed first)

Entity YAML files live in `isf-data-architecture/references/entities/`. The LLM loads them directly during the workflow. If running the generator script manually, pass the path via `--entities-dir`.

### Output

Generated data in `src/data_engine/`:

```
src/data_engine/
├── generators/          # Generation scripts (Python)
│   ├── generate_all.py  # Main entry point
│   └── {entity}.py      # Per-entity generator (if complex)
├── loaders/             # Scripts to load data into Snowflake
│   └── load_seeds.sql   # COPY INTO from staged files
├── specs/               # Data shape specs (from entity YAML)
│   └── {solution}.yaml  # Resolved entity definitions for this solution
└── output/              # Generated files (committed to repo)
    ├── {entity}.parquet # One file per entity (Parquet with Snappy compression)
    └── manifest.json    # Generation metadata (seed, timestamp, row counts)
```

## Core Principles

| Principle | Rule |
|-----------|------|
| Reproducibility | `RANDOM_SEED = 42` always |
| Pre-generate | Generate once during development, commit to repo |
| Never at runtime | Deployment loads pre-existing files, never generates |
| Referential integrity | Child entities reference valid parent IDs |
| Hidden discovery | Generated data must contain the spec's discovery insight |
| Realistic scale | Row counts should be realistic for the domain (not toy-sized) |

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `references/behavior-profiles.yaml` | Segment multipliers, reference data distributions (device types, payment methods, currencies) | Always — applies behavioral realism |
| `references/llm-generation.md` | Cortex COMPLETE patterns, batch processing, cost estimation | LLM-Powered mode |
| `references/rule-based-generation.md` | SQL distribution patterns, correlation techniques | Rule-Based mode |
| `assets/generate_synthetic_data.py` | Working Python generator engine — copy into project scaffold | Standard mode |
| `assets/generate_template.py` | Lightweight generator template — copy when project needs a simpler starting point | Standard mode (simple projects) |
| `assets/templates/*.sql.j2` | Jinja2 DDL templates for activity/transaction/catalog tables | Optional — for 3-table pattern |

## Core Workflow

```
1. LOAD ENTITY DEFINITIONS
   └── Read isf-context.md for industry, scale, hidden discovery
   └── Load _core.yaml + {industry}.yaml from isf-data-architecture
   └── Load references/behavior-profiles.yaml for segment multipliers
   └── Resolve extends pattern (merge core + industry columns)

2. PLAN GENERATION
   └── Determine entity order (parents before children)
   └── Calculate row counts per entity
   └── Identify hidden discovery data requirements
   └── Present generation plan to user

   ⚠️ STOP: Confirm generation plan (entities, row counts, mode) before proceeding.

3. SELECT GENERATION MODE
   └── Standard: Python/Faker for < 1M rows (fast, local)
   └── LLM-Powered: Cortex COMPLETE for creative, varied data (uses credits)
   └── Rule-Based: SQL distributions for large scale with correlations

   ⚠️ STOP: Confirm mode selection.

4. GENERATE DATA
   └── Process entities in dependency order
   └── Apply generation rules from YAML (weighted_choice, lognormal, faker.*)
   └── Maintain FK references between entities
   └── Engineer hidden discovery into the data

5. VALIDATE & OUTPUT
   └── Verify row counts match plan
   └── Verify referential integrity (no orphaned FKs)
   └── Verify hidden discovery is present
   └── Write to src/data_engine/output/
   └── Generate manifest.json with metadata
```

## Generation Modes

### Standard (Python/Faker)

Best for: most solutions, < 1M total rows, local generation.

**Copy** `assets/generate_synthetic_data.py` into the project's `src/data_engine/generators/`. This is a working generator engine that reads entity YAML files and behavior profiles directly.

```bash
python generate_synthetic_data.py --entities-dir path/to/entities --industry retail --output src/data_engine/output
```

Reads the `generation` field from each YAML column definition and maps to Python:

| YAML Generation Rule | Python Implementation |
|---------------------|----------------------|
| `uuid` | `str(uuid.uuid4())` |
| `sequential_id` | `f"{prefix}{i:06d}"` |
| `faker.email` | `fake.email()` |
| `faker.name` | `fake.name()` |
| `faker.first_name` | `fake.first_name()` |
| `faker.city` | `fake.city()` |
| `faker.street_address` | `fake.street_address()` |
| `random_date` | `fake.date_between(start, end)` |
| `customer_ref` | Random selection from generated CUSTOMER IDs |
| `product_ref` | Random selection from generated PRODUCT IDs |
| `type: weighted_choice` | `random.choices(choices, weights=weights)` |
| `type: lognormal` | `np.random.lognormal(mean, sigma)` clipped to min/max |

**Behavior profiles** from `references/behavior-profiles.yaml` apply segment-driven multipliers:
- Premium customers generate 1.8x more transactions
- Budget customers generate 0.6x transactions
- Segment profiles also adjust average transaction amounts and churn probability

The generator engine handles this automatically when behavior profiles are loaded.

### LLM-Powered (Cortex COMPLETE)

Best for: creative, natural-looking data where distributions don't capture the variety needed.

**Load** `references/llm-generation.md` for Cortex COMPLETE patterns, batch processing, and error handling.

Uses the entity YAML as the schema contract but lets the LLM generate realistic values:

```sql
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'claude-3-5-sonnet',
    ARRAY_CONSTRUCT(
        OBJECT_CONSTRUCT('role', 'system', 'content',
            'Generate {batch_size} realistic {industry} {entity} records as JSON array. ' ||
            'Fields: {field_list}. Requirements: {industry_guidance}'),
        OBJECT_CONSTRUCT('role', 'user', 'content', 'Generate the records.')
    ),
    OBJECT_CONSTRUCT('temperature', 0.7, 'max_tokens', 4096)
);
```

Configuration options:

| Setting | Default | Options |
|---------|---------|---------|
| Model | claude-3-5-sonnet | claude-3-5-sonnet, mistral-large2, llama3.1-70b |
| Batch size | 25 | 10, 25, 50 |
| Temperature | 0.7 | 0.3, 0.5, 0.7, 0.9 |

### Rule-Based (SQL Distributions)

Best for: large scale (>1M rows), correlated fields, pure SQL generation in Snowflake.

**Load** `references/rule-based-generation.md` for SQL distribution patterns and correlation techniques.

Generates directly in Snowflake using GENERATOR and statistical functions:

```sql
CREATE TABLE {schema}.{entity} AS
SELECT
    SEQ4() AS id,
    GREATEST(18, LEAST(85, ROUND(NORMAL(42, 15, RANDOM())))) AS age,
    DATEADD('day', UNIFORM(0, 365, RANDOM()), '2024-01-01'::DATE) AS created_at
FROM TABLE(GENERATOR(ROWCOUNT => {row_count}));
```

Supports field correlations (age -> income -> credit_score) via cascading CASE expressions.

## Hidden Discovery Engineering

The generated data must contain the hidden discovery defined in the spec's `hidden_discovery` section. This is the most critical quality gate for generated data.

### Process

1. Read the discovery statement from `isf-context.md`
2. Determine which entities and columns must exhibit the pattern
3. Engineer the statistical anomaly into the generation rules
4. Verify the discovery is present in the output but not obvious in raw data

### Example

If the discovery is: "Supplier X appears minor (11% of orders) but serves 70% of critical manufacturers"

The generator must:
- Create a supplier entity where Supplier X has only 11% of order volume
- But link Supplier X to 70% of manufacturers flagged as `criticality = 'HIGH'`
- This pattern is invisible in a simple order count but emerges when joining supplier → manufacturer criticality

### Verification

After generation, run a validation query that confirms the discovery is present:

```sql
-- Verify hidden discovery: Supplier X serves 70% of critical manufacturers
SELECT
    s.SUPPLIER_NAME,
    COUNT(DISTINCT m.MANUFACTURER_ID) AS CRITICAL_MFRS,
    ROUND(COUNT(DISTINCT m.MANUFACTURER_ID) * 100.0 /
        (SELECT COUNT(DISTINCT MANUFACTURER_ID) FROM ATOMIC.MANUFACTURER
         WHERE CRITICALITY = 'HIGH'), 1) AS PCT_OF_CRITICAL
FROM ATOMIC.SUPPLIER s
JOIN ATOMIC.MANUFACTURER_SUPPLIER ms ON s.SUPPLIER_ID = ms.SUPPLIER_ID
JOIN ATOMIC.MANUFACTURER m ON ms.MANUFACTURER_ID = m.MANUFACTURER_ID
WHERE m.CRITICALITY = 'HIGH'
GROUP BY s.SUPPLIER_NAME
ORDER BY CRITICAL_MFRS DESC
LIMIT 5;
```

## Row Count Guidelines

| Solution Scale | Customers | Transactions | Events | Notes |
|---------------|-----------|-------------|--------|-------|
| Minimal (POC) | 100 | 1,000 | 5,000 | Fast iteration |
| Realistic | 10,000 | 100,000 | 500,000 | Default for ISF solutions |
| Scale test | 100,000 | 1,000,000 | 5,000,000 | Performance validation |

Child entity ratios (typical):
- Orders per customer: 5-15
- Line items per order: 2-5
- Events per customer: 20-100
- Sensor readings per equipment: 1,000-10,000

## Dependencies

The generator requires `pyarrow` for Parquet output. Ensure it is in the project's `requirements.txt`:

```
pyarrow>=14.0
numpy
faker
pyyaml
```

## Pre-Flight Checklist

- [ ] Entity YAML files loaded for the solution's industry
- [ ] `pyarrow` is installed (`uv pip install pyarrow`)
- [ ] Generation plan reviewed (entities, row counts, mode)
- [ ] Hidden discovery requirements identified
- [ ] Entity dependency order determined (parents first)
- [ ] seed=42 set in all generation code
- [ ] Output directory is `src/data_engine/output/`
- [ ] Output files are `.parquet` (not `.csv`)
- [ ] Referential integrity verified (no orphaned FKs)
- [ ] Hidden discovery verified with validation query
- [ ] manifest.json generated with metadata
- [ ] Generated files committed to repo (not gitignored)

## Contract

**Inputs:**
- Entity YAML files from `isf-data-architecture/references/entities/` (built-in)
- `isf-context.md` for industry, hidden discovery, data scale (from `isf-spec-curation`)
- Migration files from `src/database/migrations/` (from `isf-data-architecture`)

**Outputs:**
- `src/data_engine/output/*.parquet` — Seed data files (consumed by `isf-deployment`)
- `src/data_engine/output/manifest.json` — Generation metadata (consumed by `isf-diagnostics`)
- Validation queries for hidden discovery (consumed by `isf-solution-testing`)

## Next Skill

After data is generated and validated:

**Continue to** `../isf-cortex-analyst/SKILL.md` to build the Semantic View spec for Cortex Analyst (if the plan includes text-to-SQL).

If Cortex Analyst is not needed, **continue to** `../isf-cortex-search/SKILL.md` (for RAG), `../isf-cortex-agent/SKILL.md` (for agent), or `../isf-solution-react-app/SKILL.md` (for the application layer) — whichever is next per the task list.

If `isf-data-pipeline` was run in parallel (Step 3c), its transformation and orchestration SQL should be deployed alongside seed data during Phase 6.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 4.

### Downstream Skill Reference

| Output | Consumed By |
|--------|------------|
| Parquet files in `src/data_engine/output/` | `isf-deployment` (loads via COPY INTO) |
| Generation scripts | Developers (regenerate if schema changes) |
| Validation queries | `isf-solution-testing` (hidden discovery verification) |
| manifest.json | `isf-diagnostics` (data health checks) |

## Error Handling

- **Missing entity YAML**: "Entity {name} not found in references. Run isf-data-architecture first or define the entity inline."
- **FK reference failure**: "Cannot generate {child} — parent entity {parent} has no data. Check generation order."
- **Hidden discovery missing**: "Generated data does not exhibit the expected discovery pattern. Adjust generation rules for {entity}.{column}."
- **LLM invalid JSON**: Retry with lower temperature (0.3). Fall back to Standard mode after 3 failures.
- **Scale too large for local**: "Dataset exceeds 1M rows — recommend switching to Rule-Based (SQL) mode for server-side generation."
