# LLM-Powered Data Generation Reference

## Cortex COMPLETE Pattern

```sql
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

## System Prompt Template

```
You are a synthetic data generator for {industry}.
Generate {batch_size} records as a JSON array.
Each record must have these fields: {field_list}

Requirements:
- Realistic {industry} data patterns
- Varied but plausible values
- Consistent relationships between fields
- No placeholder text like "Lorem ipsum"

Output ONLY valid JSON array, no explanation.
```

## Industry-Specific Guidance

| Industry | Patterns to Follow |
|----------|-------------------|
| Healthcare | Valid ICD-10 ranges, realistic vitals, proper date sequences |
| Retail | Seasonal buying patterns, realistic price points, SKU formats |
| Financial | Account number formats, transaction patterns, fraud indicators |
| Media | Engagement metrics, content categories, watch time distributions |
| Manufacturing | Equipment codes, yield percentages, sensor value ranges |
| Telecom | Phone number formats, data usage patterns, plan types |

## Batch Processing

For datasets larger than a single batch:

```
Generating {entity_name}...
Batch 1/{total}: {batch_size} rows [OK]
Batch 2/{total}: {batch_size} rows [OK]
...
Total: {row_count} rows generated
```

Process in dependency order — generate parent entities first, then pass their IDs to child entity prompts.

## Parsing Response

```sql
SELECT
    f.value:field1::STRING AS field1,
    f.value:field2::NUMBER AS field2,
    f.value:field3::TIMESTAMP_NTZ AS field3
FROM TABLE(FLATTEN(PARSE_JSON('{response}'))) f;
```

## Error Handling

| Error | Fix |
|-------|-----|
| Invalid JSON | Retry with temperature 0.3 |
| Rate limit | Add 2s delay between batches |
| Model unavailable | Fall back: claude -> mistral -> llama |
| Token limit exceeded | Reduce batch_size to 10 |
| Incomplete batch | Retry batch, merge results |

After 3 consecutive failures on the same batch, fall back to Standard (Python/Faker) mode for that entity.

## Cost Estimation

Approximate Cortex credit usage per entity:

| Rows | Batch Size | Batches | Est. Credits |
|------|-----------|---------|-------------|
| 100 | 25 | 4 | ~0.01 |
| 1,000 | 25 | 40 | ~0.10 |
| 10,000 | 50 | 200 | ~0.50 |

Present estimated cost to user before starting generation.
