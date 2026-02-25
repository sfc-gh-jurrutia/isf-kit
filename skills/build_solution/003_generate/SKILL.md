---
name: build-generate
description: "Generate realistic solution data from domain model. Use for: data generation, industry-specific data, loading to Snowflake. Triggers: /speckit.generate, generate data, load solution data"
parent_skill: build_solution
---

# Generate - Data Generation Command

> Generate realistic solution data from a domain model specification

## When to Load

After `002_quality_gate/SKILL.md` passes quality checks, before implementation.

## Prerequisites

- `specs/{solution-name}/domain-model.yaml` must exist
- Snowflake connection configured (for direct execution)

## Workflow

### Step 1: Locate Domain Model

```
Looking for domain model at specs/{solution-name}/domain-model.yaml...
```

If not found, prompt user to run `specify_solution` first.

### Step 2: Validate Domain Model

**Validate the domain model file:**
- Check all required fields present
- Verify entity relationships are valid
- Calculate estimated row counts

```
✅ Valid domain model
   Entities: {entity_list}
   Estimated rows: {estimated_rows}
```

If validation fails, list specific errors and prompt user to fix.

### Data Generation Principles

| Principle | Rule |
|-----------|------|
| Reproducibility | `RANDOM_SEED = 42` always |
| Commit pattern | Generate once, commit to `data/synthetic/` |
| Deploy-time generation | **Never** generate data during deployment |
| Template | Use `templates/generate_synthetic_data.py` as starter |
| Directory convention | `data/synthetic/{entity_name}.csv` |

### Step 3: Select Generation Mode

**⚠️ MANDATORY STOPPING POINT**: Ask user for generation approach.

**Log**: Record `tool_selection` — append to `specs/{solution}/decision-log.jsonl`: step "Generate, Step 3: Generation Mode", value_selected (Standard/LLM-Powered/Rule-Based), alternatives, rationale.

```
Select data generation mode:

1. **Standard** - Python/Faker for simple data, SQL for large scale
2. **LLM-Powered** - Cortex COMPLETE for creative, realistic data
3. **Rule-Based** - Statistical distributions with field correlations

Recommendations:
- Standard: Fast, simple datasets
- LLM-Powered: Varied, natural-looking data (uses Cortex credits)
- Rule-Based: Deterministic, correlated fields (age→income→credit)

[1/2/3] [Cancel]
```

**Route based on selection:**

| Selection | Action |
|-----------|--------|
| 1. Standard | Continue to Step 4 below |
| 2. LLM-Powered | **Load** `llm-powered/SKILL.md` |
| 3. Rule-Based | **Load** `rule-based/SKILL.md` |

---

## Standard Generation (Mode 1)

### Step 4: Confirm Generation Strategy

**⚠️ MANDATORY STOPPING POINT**: Present plan before generating.

**Log**: Record `approval` — append to `specs/{solution}/decision-log.jsonl`: step "Generate, Step 4: Confirm Strategy", value_selected (proceed/modify), alternatives, rationale.

```
## Data Generation Plan

**Domain Model**: {model.name}
**Industry**: {model.industry}
**Scale**: {model.scale}

### Entities to Generate

| Entity | Rows | Fields | Dependencies |
|--------|------|--------|--------------|
| customers | 10,000 | 8 | - |
| orders | 50,000 | 6 | customers |

### Generation Strategy

- **< 1M rows**: Python/Faker (fast, in-memory)
- **>= 1M rows**: Snowflake SQL (scalable, server-side)

**Recommended**: {Python or SQL} generation

### Output Options

1. **SQL File** - INSERT statements for loading
2. **Parquet Files** - Optimized for Snowflake staging
3. **CSV Files** - Human-readable inspection
4. **Direct Load** - Execute immediately in Snowflake

[1/2/3/4] [Cancel]
```

### Step 5: Generate Data

Based on user selection, generate data using the appropriate method:

- **SQL File**: Generate INSERT statements to `output/load_data.sql`
- **Parquet Files**: Create staged files in `output/staging/` for COPY INTO
- **CSV Files**: Generate human-readable files in `output/csv/`
- **Direct Load**: Execute INSERT/COPY directly to Snowflake

## Industry-Specific Features

| Industry | Features |
|----------|----------|
| Healthcare | ICD-10 codes, CPT codes, NPI numbers, claim statuses |
| Retail | Product SKUs, customer segments, seasonal patterns |
| Financial | Account types, transaction categories, fraud flags |

## Output Structure

```
output/
├── load_data.sql          # Combined SQL load script
├── staging/               # Parquet files
├── csv/                   # CSV files for inspection
└── copy_into.sql          # COPY INTO script
```

## Stopping Points

- ✋ **Required** after selecting generation mode (Step 3)
- ✋ **Checkpoint** after presenting data generation plan (Step 4) - auto-proceed in Full Auto mode

## Next Skill

After completion → Load `004_implement/SKILL.md`

## Sub-Skills

| Mode | Sub-Skill | Description |
|------|-----------|-------------|
| LLM-Powered | `llm-powered/SKILL.md` | Cortex COMPLETE with industry prompts |
| Rule-Based | `rule-based/SKILL.md` | Statistical distributions + correlations |

## Output

```
✅ Data loaded to Snowflake (DEMO_DB.PUBLIC):
- customers: 10,000 rows
- orders: 50,000 rows
- order_items: 150,000 rows

Total: 210,000 rows loaded in 12.3 seconds
```

## Regeneration Guidance

| When | How | Verify |
|------|-----|--------|
| Schema changes | Re-run generator, re-commit CSVs | Column names match new schema |
| New entities added | Add generator function, produce CSV | Referential integrity across files |
| Row count changes | Update `--num-rows`, re-run | Hidden discovery still present |
| Bug in generated data | Fix generator, re-run with same seed | Diff against previous to confirm fix |

## Error Handling

- **Missing domain model**: Prompt to run `specify_solution`
- **Validation errors**: List specific issues to fix
- **Connection issues**: Suggest alternative output format
