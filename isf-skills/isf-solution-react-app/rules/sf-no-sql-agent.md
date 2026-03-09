---
title: No Cortex Agent Bypass
impact: HIGH
impactDescription: Bypassing the agent with raw CORTEX.COMPLETE gives the LLM no tool or data access
tags: cortex, agent, rest-api, snowflake, complete
---

## No Cortex Agent Bypass

All user-facing chat in a copilot app MUST go through the Cortex Agent REST API (via `cortex_agent_service.py`). There are two ways this goes wrong:

1. Calling a nonexistent `SNOWFLAKE.CORTEX.AGENT()` SQL function
2. Bypassing the agent entirely by calling `CORTEX.COMPLETE` directly in a chat endpoint

**Why it matters**: The Cortex Agent created by `isf-cortex-agent` has tools (Search, Analyst, SQL) that give it access to real data. Calling `CORTEX.COMPLETE` directly gives the LLM zero tool access — it will correctly respond "I don't have access to your data" because it literally doesn't.

**Incorrect (SQL function — does not exist):**

```python
cursor.execute("""
    SELECT SNOWFLAKE.CORTEX.AGENT(
        'MY_AGENT',
        'What is the current status?'
    )
""")
```

**Also incorrect (SQL CALL — not supported):**

```python
cursor.execute("""
    CALL SNOWFLAKE.CORTEX.AGENT(
        'MY_DB.MY_SCHEMA.MY_AGENT',
        'What is the current status?'
    )
""")
```

**Also incorrect (bypassing the agent with CORTEX.COMPLETE in a chat endpoint):**

```python
@router.post("/chat")
async def chat(request: ChatRequest):
    # BAD: This calls a raw LLM with no tools, no search, no data access.
    # The agent built by isf-cortex-agent is never invoked.
    products = cursor.execute("SELECT ... WHERE LIKE '%keyword%'")
    prompt = f"You are a shopping assistant... {products}"
    cursor.execute(f"SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large2', '{prompt}')")
```

This pattern hand-rolls search (often with broken LIKE queries) and feeds results into a raw `CORTEX.COMPLETE` call. The LLM has no tool access and cannot query data on its own. The Cortex Agent, which was built with search and analyst tools, sits unused.

**Correct (REST API via `cortex_agent_service.py` template):**

```python
from app.cortex_agent_service import router as agent_router

app.include_router(agent_router, prefix="/api/agent")
```

The `cortex_agent_service.py` template provides:

- Persistent `httpx.AsyncClient` with HTTP/2 and connection reuse
- Cached auth headers (`get_auth_headers_cached()`) for SPCS token refresh
- SSE streaming with cumulative text deduplication
- Thread management for multi-turn conversations
- Normalized event mapping for the React frontend

**How to verify**: Both checks must pass — zero matches outside of documentation or comments.

```bash
# Check 1: No SQL agent calls (function does not exist)
rg -i "SNOWFLAKE\.CORTEX\.AGENT" --glob "*.py" --glob "*.sql"

# Check 2: No CORTEX.COMPLETE in API endpoints (bypasses the agent)
rg -i "CORTEX\.COMPLETE" --glob "*.py" api/app/
```

`CORTEX.COMPLETE` is valid in data generation scripts (`isf-data-generation`), but must not appear in API endpoint handlers.
