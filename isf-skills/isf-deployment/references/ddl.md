# Snowflake DDL Guidelines

## Unsupported Features

### CHECK Constraints - NOT SUPPORTED

```
Error: 000002 (0A000): Unsupported feature 'CHECK'.
```

**Instead:**
1. Document valid values in column comments
2. Enforce at application layer
3. Use views with WHERE clauses
4. Use stored procedures for validation

```sql
-- CORRECT - Document, don't constrain
CREATE TABLE example (
    status VARCHAR(20),  -- Valid: ACTIVE, INACTIVE
    score FLOAT  -- Range 0-1, validated at app level
);
```

## Constraint Support

| Constraint | Supported | Enforced |
|------------|-----------|----------|
| PRIMARY KEY | ✅ | ❌ Metadata only |
| FOREIGN KEY | ✅ | ❌ Metadata only |
| UNIQUE | ✅ | ✅ With RELY |
| NOT NULL | ✅ | ✅ Enforced |
| DEFAULT | ✅ | ✅ Applied |
| CHECK | ❌ | N/A |

## Best Practices

1. Validate data at application layer
2. Document constraints in comments
3. Use NOT NULL where appropriate (enforced)
4. Consider MASKING POLICIES for governance
5. Use STREAMS + TASKS for async validation

