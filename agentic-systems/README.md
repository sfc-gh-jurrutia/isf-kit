# LangGraph + Snowflake Cortex Agent Integration

This project demonstrates how to use **LangGraph** to orchestrate agents while leveraging **Snowflake Cortex Agents** as tools for data access.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph Agent                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   OpenAI    │───▶│   Router    │───▶│    Tools    │     │
│  │     LLM     │◀───│   (Agent)   │◀───│    Node     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                              │              │
└──────────────────────────────────────────────│──────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Snowflake Cortex Agent (REST API)              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Cortex    │    │   Cortex    │    │   Custom    │     │
│  │   Analyst   │    │   Search    │    │    UDFs     │     │
│  │ (Text2SQL)  │    │   (RAG)     │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Files

- `setup_cortex_agent.sql` - Creates sample data and Cortex Agent in Snowflake
- `cortex_agent_tool.py` - LangChain tool wrapper for Cortex Agent REST API
- `langgraph_agent.py` - Main LangGraph agent with Cortex Agent integration
- `requirements.txt` - Python dependencies

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Create Cortex Agent in Snowflake

Run the SQL in `setup_cortex_agent.sql` in your Snowflake account.

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Get OAuth Token

You need a Snowflake OAuth token or PAT. Options:
- Use `snow` CLI: `snow connection test` to verify connection
- Generate PAT in Snowflake UI (User menu → Profile → Authentication)
- Use programmatic OAuth flow

### 5. Run the Agent

```bash
python langgraph_agent.py
```

## Usage

```python
from langgraph_agent import create_langgraph_cortex_agent, run_agent

agent = create_langgraph_cortex_agent(
    account="your-account",
    database="SANDBOX_DB",
    schema_name="SANDBOX_SCHEMA",
    agent_name="sales_agent",
    warehouse="SANDBOX_WH",
    oauth_token="your-token",
)

response = run_agent(agent, "What are total sales by region?")
print(response)
```

## Why This Pattern?

| Component | Role |
|-----------|------|
| **LangGraph** | Orchestration, state management, multi-agent coordination |
| **OpenAI/Claude** | Planning and routing decisions |
| **Cortex Agent** | Governed Snowflake data access, Text-to-SQL, RAG search |

This hybrid approach gives you:
- LangGraph's flexibility for complex workflows
- Cortex Agent's native Snowflake integration and governance
- Separation of concerns between orchestration and data access
