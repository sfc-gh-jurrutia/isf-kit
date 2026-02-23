---
name: build-generate-llm
description: "Generate synthetic data using Cortex COMPLETE. Use for: creative realistic data, LLM-powered generation, varied solution data. Triggers: llm data, cortex generate, ai data generation"
parent_skill: build-generate
---

# LLM-Powered Data Generation

> Generate realistic, varied solution data using Snowflake Cortex COMPLETE

## When to Load

From `003_generate/SKILL.md` Step 3 when user selects "LLM-Powered" mode.

## Prerequisites

- Domain model validated (from parent skill)
- Snowflake connection with Cortex access
- Model availability: `claude-3-5-sonnet`, `mistral-large2`, or `llama3.1-70b`

## Workflow

### Step 1: Configure Generation Parameters

**Ask** user for LLM settings:

```
LLM Generation Configuration:

Model (recommended: claude-3-5-sonnet):
1. claude-3-5-sonnet - Best quality, higher cost
2. mistral-large2 - Good balance
3. llama3.1-70b - Lower cost

Batch size per call: [10/25/50] (default: 25)
Temperature: [0.3/0.5/0.7/0.9] (default: 0.7)

[Configure] [Use defaults]
```

**⚠️ MANDATORY STOPPING POINT**: Wait for response.

### Step 2: Generate Industry Prompts

**Build** system prompt based on domain model industry:

```sql
-- System prompt template
'You are a synthetic data generator for {industry}.
Generate {batch_size} records as a JSON array.
Each record must have these fields: {field_list}

Requirements:
- Realistic {industry} data patterns
- Varied but plausible values
- Consistent relationships between fields
- No placeholder text like "Lorem ipsum"

Output ONLY valid JSON array, no explanation.'
```

**Industry-specific guidance:**

| Industry | Data Patterns |
|----------|---------------|
| Healthcare | Valid ICD-10 ranges, realistic vitals, proper date sequences |
| Retail | Seasonal buying patterns, realistic price points, SKU formats |
| Financial | Account number formats, transaction patterns, fraud indicators |
| Media | Engagement metrics, content categories, watch time distributions |

### Step 3: Execute Generation

**For each entity** in dependency order:

```sql
-- Generation query pattern
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    '{model}',
    ARRAY_CONSTRUCT(
        OBJECT_CONSTRUCT('role', 'system', 'content', '{system_prompt}'),
        OBJECT_CONSTRUCT('role', 'user', 'content', '{user_prompt}')
    ),
    OBJECT_CONSTRUCT(
        'temperature', {temperature},
        'max_tokens', 4096
    )
) AS generated_data;
```

**Parse and validate** JSON response:

```sql
-- Parse generated JSON
SELECT 
    f.value:field1::STRING AS field1,
    f.value:field2::NUMBER AS field2,
    -- ... map all fields
FROM TABLE(FLATTEN(PARSE_JSON('{response}'))) f;
```

### Step 4: Batch Processing

**For large datasets**, generate in batches:

```
Generating {entity_name}...
├── Batch 1/10: 25 rows ✓
├── Batch 2/10: 25 rows ✓
├── Batch 3/10: 25 rows ✓
...
└── Total: 250 rows generated
```

**Handle failures:**
- Retry failed batches up to 3 times
- Log malformed JSON responses
- Continue with partial success

### Step 5: Load to Snowflake

**Execute** INSERT from generated data:

```sql
INSERT INTO {database}.{schema}.{table}
SELECT * FROM (
    -- parsed generation results
);
```

## Stopping Points

- ✋ After configuration (Step 1)
- ✋ Before executing generation (Step 3) - show estimated Cortex usage

## Output

```
✅ LLM-Powered Generation Complete

Model: claude-3-5-sonnet
Temperature: 0.7
Batches: 10

Results:
- customers: 250 rows (10 batches)
- orders: 1,000 rows (40 batches)

Estimated Cortex usage: ~50 requests

Next: Data loaded to {database}.{schema}
```

## Error Handling

- **Rate limits**: Add delay between batches, reduce batch size
- **Invalid JSON**: Retry with lower temperature (0.3)
- **Model unavailable**: Fall back to alternative model
- **Token limit**: Reduce batch size

## Return

After completion, return to `003_generate/SKILL.md` for output format selection.
