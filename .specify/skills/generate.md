# /speckit.generate - Data Generation Command

Generate realistic demo data from a domain model specification.

## Overview

This command generates data for your demo based on the domain model created during `/speckit.specify`. It supports:
- **Automatic scale detection**: Python/Faker for < 1M rows, Snowflake SQL for >= 1M rows
- **Industry-specific data**: Healthcare, Retail, Financial (with realistic codes, categories, distributions)
- **Multiple outputs**: SQL files, Parquet staging, CSV for inspection
- **Direct execution**: Load data directly into Snowflake

## Usage

When the user invokes `/speckit.generate`, follow this workflow:

### Step 1: Locate Domain Model

Look for the domain model file in the spec directory:
```
.specify/specs/{demo-name}/domain-model.yaml
```

If not found, ask the user to either:
1. Run `/speckit.specify` first to create the spec
2. Provide a path to an existing domain model

### Step 2: Validate Domain Model

Before generating, validate the domain model:

```python
from generators import validate_domain_model

result = validate_domain_model("path/to/domain-model.yaml")

if not result["valid"]:
    # Report errors and stop
    for error in result["errors"]:
        print(f"❌ {error}")
    return

# Report warnings but continue
for warning in result["warnings"]:
    print(f"⚠️ {warning}")

print(f"✅ Valid domain model")
print(f"   Entities: {', '.join(result['entities'])}")
print(f"   Estimated rows: {result['estimated_rows']:,}")
```

### Step 3: Confirm Generation Strategy

Present the generation plan to the user:

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
| order_items | 150,000 | 5 | orders, products |

### Generation Strategy

{Based on total rows}:
- **< 1M rows**: Python/Faker (fast, in-memory)
- **>= 1M rows**: Snowflake SQL (scalable, server-side)

**Recommended**: {Python or SQL} generation

### Output Options

1. **SQL File** - INSERT statements for loading
2. **Parquet Files** - Optimized for Snowflake staging
3. **CSV Files** - Human-readable inspection
4. **Direct Load** - Execute immediately in Snowflake
```

### Step 4: Generate Data

Based on user selection, run the appropriate generation:

```python
from generators import generate_data

# Generate data with automatic strategy selection
data, handler = generate_data(
    domain_model_path="path/to/domain-model.yaml",
    database="DEMO_DB",
    schema="PUBLIC",
    seed=42,  # For reproducibility
)

# Output based on user choice
if output_format == "sql":
    path = handler.to_sql("output/load_data.sql")
    print(f"✅ SQL written to {path}")
    
elif output_format == "parquet":
    paths = handler.to_parquet("output/staging/")
    print(f"✅ Parquet files written:")
    for p in paths:
        print(f"   - {p}")
        
elif output_format == "csv":
    paths = handler.to_csv("output/csv/")
    print(f"✅ CSV files written for inspection")
    
elif output_format == "execute":
    results = handler.execute(connection="Snowhouse")
    print(f"✅ Data loaded to Snowflake:")
    for entity, count in results.items():
        print(f"   - {entity}: {count:,} rows")
```

### Step 5: Multi-Tenant Generation (Optional)

If the demo requires multi-tenancy:

```python
from generators import generate_for_tenant

# Generate data for each tenant
tenants = ["acme", "globex", "initech"]

for tenant_id in tenants:
    data, handler = generate_for_tenant(
        domain_model_path="path/to/domain-model.yaml",
        tenant_id=tenant_id,
        database="DEMO_DB",
        seed=hash(tenant_id),  # Consistent per-tenant
    )
    
    handler.to_sql(f"output/tenant_{tenant_id}.sql")
    print(f"✅ Generated data for tenant: {tenant_id}")
```

## Output File Structure

After generation, the output directory contains:

```
output/
├── load_data.sql          # Combined SQL load script
├── staging/               # Parquet files for staging
│   ├── customers.parquet
│   ├── orders.parquet
│   ├── order_items.parquet
│   └── _metadata.json
├── csv/                   # CSV files for inspection
│   ├── customers.csv
│   ├── orders.csv
│   └── order_items.csv
└── copy_into.sql          # COPY INTO script for staged data
```

## Industry-Specific Features

### Healthcare
- ICD-10 diagnosis codes
- CPT procedure codes  
- NPI provider numbers
- Insurance types with realistic distributions
- Claim statuses and adjustment codes

### Retail
- Product categories and SKUs
- Customer segments (new, returning, VIP)
- Order statuses with weighted distributions
- Seasonal patterns in order dates

### Financial
- Account types (checking, savings, investment)
- Transaction categories (purchases, transfers, fees)
- Credit scores and risk ratings
- Fraud flags with realistic percentages

## Example Conversation

**User**: `/speckit.generate`

**Assistant**: I'll generate demo data from your domain model.

Found domain model at `.specify/specs/healthcare-demo/domain-model.yaml`

**Validation Results**:
✅ Valid domain model
- Entities: patients, encounters, claims, providers
- Estimated rows: 275,000
- Industry: Healthcare (specialized generator available)

**Generation Plan**:
| Entity | Rows | Strategy |
|--------|------|----------|
| patients | 10,000 | Python/Faker |
| providers | 500 | Python/Faker |
| encounters | 50,000 | Python/Faker |
| claims | 75,000 | Python/Faker |

Recommended: **Python generation** (total < 1M rows)

How would you like the output?
1. SQL file (for manual loading)
2. Parquet files (for staging)
3. Execute directly (load now)

**User**: 3

**Assistant**: Generating and loading data...

✅ Data loaded to Snowflake (DEMO_DB.PUBLIC):
- patients: 10,000 rows
- providers: 500 rows  
- encounters: 50,000 rows
- claims: 75,000 rows

Total: 135,500 rows loaded in 12.3 seconds

SQL files saved to `output/` for reference.

## Error Handling

### Missing Domain Model
```
❌ No domain model found at .specify/specs/*/domain-model.yaml

Please run `/speckit.specify` first to create your demo specification,
or provide the path to an existing domain model.
```

### Validation Errors
```
❌ Domain model validation failed:

- Circular dependency: orders -> order_items -> orders
- Missing required field: customers.email

Please fix these issues in domain-model.yaml and try again.
```

### Snowflake Connection Issues
```
❌ Could not connect to Snowflake

Ensure your connection is configured:
1. Check ~/.snowflake/connections.toml
2. Verify connection name: "Snowhouse"
3. Test with: snow connection test

Or use SQL/Parquet output instead of direct execution.
```

## Related Commands

- `/speckit.specify` - Create the domain model
- `/speckit.plan` - Plan implementation tasks  
- `/speckit.tasks` - Generate implementation checklist
- `/speckit.implement` - Build the demo
