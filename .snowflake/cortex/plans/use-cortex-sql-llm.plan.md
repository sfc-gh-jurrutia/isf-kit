# Plan: Use Cortex COMPLETE via SQL for LangGraph Orchestration

## Problem
The `langchain_snowflake` library has a bug when using `bind_tools()` - it lowercases account names with underscores, breaking SSL certificate validation. OpenAI requires external API credits.

## Solution
Use **`SNOWFLAKE.CORTEX.COMPLETE` via SQL** directly (from `snowflake-agentic-platform` pattern) instead of `langchain_snowflake.ChatSnowflake`.

## Key Pattern from snowflake-agentic-platform

The repo at `~/projects/snowflake-agentic-platform` uses this approach:

```python
def _execute(session, sql: str) -> Any:
    if hasattr(session, "sql"):
        result = session.sql(sql).collect()
        return result[0][0] if result else ""
    else:
        cursor = session.cursor()
        cursor.execute(sql)
        row = cursor.fetchone()
        return row[0] if row else ""

def call_cortex_llm(session, prompt: str, model: str = "mistral-large2") -> str:
    escaped_prompt = prompt.replace("'", "''").replace("\\", "\\\\")
    sql = f"""
        SELECT SNOWFLAKE.CORTEX.COMPLETE('{model}', '{escaped_prompt}') as RESPONSE
    """
    return _execute(session, sql)
```

## Changes to langgraph_agent.py

### 1. Create a custom LangChain chat model using SQL

```python
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
import snowflake.connector

class CortexSQLChatModel(BaseChatModel):
    """Chat model that uses SNOWFLAKE.CORTEX.COMPLETE via SQL."""
    
    connection_name: str = "default"
    model: str = "claude-sonnet-4-5"
    
    def _generate(self, messages, stop=None, **kwargs):
        # Convert messages to prompt
        # Call SNOWFLAKE.CORTEX.COMPLETE via SQL
        # Parse response for tool calls
        ...
```

### 2. Alternative: Manual tool orchestration without bind_tools

Since the issue is with `bind_tools()`, we can manually implement tool calling:

```python
def call_model(state: AgentState) -> dict:
    # Build prompt with tool descriptions
    prompt = build_prompt_with_tools(state["messages"], tools)
    
    # Call Cortex via SQL
    response = call_cortex_complete(session, prompt, "claude-sonnet-4-5")
    
    # Parse response for tool calls
    if "TOOL_CALL:" in response:
        tool_call = parse_tool_call(response)
        return {"messages": [AIMessage(content="", tool_calls=[tool_call])]}
    
    return {"messages": [AIMessage(content=response)]}
```

## Recommended Approach

Use **Option 2** (manual tool orchestration) - simpler and matches the snowflake-agentic-platform pattern exactly.

## Files to Modify

1. [langgraph_agent.py](/Users/jurrutia/projects/isf-kit/agentic-systems/langgraph_agent.py) - Replace ChatOpenAI with SQL-based Cortex calls

## Benefits

- No external LLM API credits required
- Uses Snowflake compute credits only
- Bypasses the `langchain_snowflake` SSL bug
- Proven pattern from snowflake-agentic-platform
