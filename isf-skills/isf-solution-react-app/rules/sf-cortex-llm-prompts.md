# Rule: Cortex LLM Prompt Structure

## Impact: MEDIUM - Important for domain-specific generation

> **Scope: data generation and batch processing ONLY.**
> Do NOT use `CORTEX.COMPLETE` for chat endpoints or copilot UIs.
> If a Cortex Agent exists in the solution, all user-facing chat must
> go through `cortex_agent_service.py` (REST API), which invokes the
> agent and its configured tools. Calling `CORTEX.COMPLETE` directly
> bypasses the agent's search, analyst, and other tools -- the raw LLM
> has no data access and will respond with "I don't have access."

## Pattern

Structure LLM prompts with clear sections for reliable output:

```python
def generate_with_cortex(self, context_data: dict) -> str:
    prompt = f"""You are a [ROLE DESCRIPTION].

Context:
- Entity: {context_data['entity_id']}
- Current Value: {context_data['current_value']}
- Target Value: {context_data['target_value']}
- Date: {context_data['date']}

Historical Data Found:
{json.dumps(context_data['historical_items'], indent=2)}

Analysis Summary:
{json.dumps(context_data['analysis'], indent=2)}

Generate a brief (2-3 sentences) summary that highlights:
1. The key risk to watch for
2. The most important insight from historical data
3. Expected outcome

Be concise and actionable. Use [DOMAIN] terminology appropriately."""

    # Escape for SQL string
    escaped = prompt.replace("'", "''")
    
    sql = f"""
    SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large2', '{escaped}') as RESPONSE
    """
    
    result = self.execute_query(sql)
    return result[0].get('RESPONSE', '') if result else ''
```

## Prompt Section Guidelines

| Section | Purpose |
|---------|---------|
| Role | Define expertise and tone |
| Context | Provide structured current state |
| Data (JSON) | Supply retrieved information |
| Output Requirements | Specify format and length |
| Domain Guidance | Ensure appropriate terminology |

## Model Selection

| Model | Use Case |
|-------|----------|
| `mistral-large2` | General purpose, good quality |
| `llama3.1-70b` | Alternative, open source |
| `snowflake-arctic` | Snowflake optimized |

## Why

- Structured prompts produce consistent output
- JSON data is easier for LLM to process
- Clear output requirements reduce hallucination
- Domain terminology guidance ensures appropriate responses
