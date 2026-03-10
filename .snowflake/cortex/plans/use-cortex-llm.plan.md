---
name: "use-cortex-llm"
created: "2026-03-10T00:39:08.945Z"
status: pending
---

# Plan: Use Cortex LLM for LangGraph Orchestration

## Overview

Replace `ChatOpenAI` with `ChatSnowflakeCortex` using model `claude-sonnet-4-5` as the orchestration LLM.

## Changes

### 1. Update imports in langgraph\_agent.py

```
# Remove
from langchain_openai import ChatOpenAI

# Add
from langchain_snowflake import ChatSnowflakeCortex
```

### 2. Replace LLM initialization (lines 40-43)

```
# Before
llm = ChatOpenAI(
    model=openai_model,
    api_key=openai_api_key or os.environ.get("OPENAI_API_KEY"),
)

# After
llm = ChatSnowflakeCortex(
    model="claude-sonnet-4-5",
    account=account,
    database=database,
    schema=schema_name,
    warehouse=warehouse,
    role=role,
)
```

### 3. Update function signature (lines 17-26)

Remove `openai_api_key` and `openai_model` parameters, add `role` parameter:

```
def create_langgraph_cortex_agent(
    account: str,
    database: str,
    schema_name: str,
    agent_name: str,
    warehouse: str,
    role: str = "ACCOUNTADMIN",
    oauth_token: str | None = None,
    cortex_model: str = "claude-sonnet-4-5",
) -> StateGraph:
```

### 4. Update requirements.txt

Add:

```
langchain-snowflake>=0.1.0
```

Remove (optional - no longer needed for orchestration):

```
langchain-openai>=0.2.0
```

## Result

The LangGraph agent will use Snowflake Cortex `claude-sonnet-4-5` for orchestration decisions instead of OpenAI, keeping everything within the Snowflake ecosystem.
