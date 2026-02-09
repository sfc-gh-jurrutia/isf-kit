---
name: specify-generate
description: "Generate realistic demo data from domain model. Use for: data generation, industry-specific data, loading to Snowflake. Triggers: /speckit.generate, generate data, load demo data"
parent_skill: specify
---

# Generate - Data Generation Command

> Generate realistic demo data from a domain model specification

## When to Load

After `analyze/SKILL.md` passes quality checks, before or during implementation.

## Prerequisites

- `specs/{demo-name}/domain-model.yaml` must exist
- Snowflake connection configured (for direct execution)

## Workflow

### Step 1: Locate Domain Model

```
Looking for domain model at specs/{demo-name}/domain-model.yaml...
```

If not found, prompt user to run `/speckit.specify` first.

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

### Step 3: Confirm Generation Strategy

**⚠️ MANDATORY STOPPING POINT**: Present plan before generating.

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

### Step 4: Generate Data

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

- ✋ After presenting data generation plan (Step 3) - confirm before generating

## Output

```
✅ Data loaded to Snowflake (DEMO_DB.PUBLIC):
- customers: 10,000 rows
- orders: 50,000 rows
- order_items: 150,000 rows

Total: 210,000 rows loaded in 12.3 seconds
```

## Error Handling

- **Missing domain model**: Prompt to run `/speckit.specify`
- **Validation errors**: List specific issues to fix
- **Connection issues**: Suggest alternative output format
