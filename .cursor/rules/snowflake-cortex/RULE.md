---
description: Cortex AI RAG pattern enforcement for OLAP warehouse integration
globs: ["backend/**/ai_*.py"]
---

# Snowflake Cortex AI Rules (RAG Pattern)

This rule enforces the Retrieval-Augmented Generation (RAG) pattern for all Cortex AI integrations.

## Core Principle: RAG is MANDATORY

Cortex AI MUST retrieve context from the OLAP Warehouse (Zone B) before generating answers.

**NEVER** call `CORTEX.COMPLETE` without first retrieving relevant context.

```
┌─────────────────────────────────────────────────────────────────┐
│                     RAG Pipeline Flow                           │
│                                                                 │
│  User Query → Embed Query → Search OLAP → Retrieve Context →   │
│  Construct Prompt → CORTEX.COMPLETE → Response                  │
└─────────────────────────────────────────────────────────────────┘
```

## Required RAG Pattern

### Step 1: Search for Context (CORTEX.SEARCH_PREVIEW)

```python
# backend/ai_search.py
from fastapi.concurrency import run_in_threadpool
from backend.db.snowpark import get_snowpark_session

def search_context_sync(query: str, limit: int = 5) -> list[dict]:
    """
    Search the OLAP warehouse for relevant context.
    Uses Cortex SEARCH_PREVIEW for semantic search.
    """
    session = get_snowpark_session()
    
    # CORTEX.SEARCH_PREVIEW for semantic search over embeddings
    results = session.sql(f"""
        SELECT 
            content,
            metadata,
            CORTEX.SEARCH_PREVIEW(
                '{query}',
                content_embedding,
                {limit}
            ) as relevance_score
        FROM analytics.knowledge_base
        WHERE relevance_score > 0.7
        ORDER BY relevance_score DESC
        LIMIT {limit}
    """).collect()
    
    return [
        {
            "content": row["CONTENT"],
            "metadata": row["METADATA"],
            "score": row["RELEVANCE_SCORE"]
        }
        for row in results
    ]

async def search_context(query: str, limit: int = 5) -> list[dict]:
    """Async wrapper for context search."""
    return await run_in_threadpool(search_context_sync, query, limit)
```

### Step 2: Generate with Context (CORTEX.COMPLETE)

```python
# backend/ai_generate.py
from fastapi.concurrency import run_in_threadpool
from backend.db.snowpark import get_snowpark_session
from backend.ai_search import search_context

def generate_response_sync(
    query: str,
    context: list[dict],
    model: str = "mistral-large"
) -> str:
    """
    Generate a response using Cortex COMPLETE with retrieved context.
    """
    session = get_snowpark_session()
    
    # Format context for the prompt
    context_text = "\n\n".join([
        f"[Source {i+1}]: {item['content']}"
        for i, item in enumerate(context)
    ])
    
    # Construct RAG prompt
    prompt = f"""You are a helpful assistant. Answer the user's question based ONLY on the provided context.
If the context doesn't contain relevant information, say "I don't have enough information to answer that."

CONTEXT:
{context_text}

USER QUESTION:
{query}

ANSWER:"""
    
    # Call CORTEX.COMPLETE
    result = session.sql(f"""
        SELECT CORTEX.COMPLETE(
            '{model}',
            '{prompt.replace("'", "''")}'
        ) as response
    """).collect()
    
    return result[0]["RESPONSE"]

async def generate_response(query: str, model: str = "mistral-large") -> dict:
    """
    Full RAG pipeline: Search → Generate.
    This is the REQUIRED pattern for all AI responses.
    """
    # Step 1: ALWAYS retrieve context first
    context = await search_context(query)
    
    if not context:
        return {
            "response": "I couldn't find relevant information to answer your question.",
            "context": [],
            "model": model
        }
    
    # Step 2: Generate with context
    response = await run_in_threadpool(
        generate_response_sync,
        query,
        context,
        model
    )
    
    return {
        "response": response,
        "context": context,
        "model": model
    }
```

## Anti-Patterns to AVOID

### ❌ FORBIDDEN: Direct Generation Without Context

```python
# BAD - No context retrieval!
async def bad_generate(query: str):
    session = get_snowpark_session()
    result = session.sql(f"""
        SELECT CORTEX.COMPLETE('mistral-large', '{query}')
    """).collect()
    return result[0][0]
```

### ❌ FORBIDDEN: Hardcoded Context

```python
# BAD - Context must come from OLAP warehouse
async def bad_generate(query: str):
    hardcoded_context = "Some static information..."  # WRONG
    # ...
```

### ❌ FORBIDDEN: Skipping Context for "Simple" Questions

```python
# BAD - ALL questions go through RAG
async def bad_generate(query: str):
    if "simple" in query:
        return direct_generate(query)  # WRONG - skips RAG
    return rag_generate(query)
```

## API Endpoint Pattern

```python
# backend/api/ai.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.ai_generate import generate_response

router = APIRouter(prefix="/api/ai", tags=["ai"])

class AskRequest(BaseModel):
    question: str
    model: str = "mistral-large"

class AskResponse(BaseModel):
    answer: str
    sources: list[dict]
    model: str

@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """
    Ask a question using RAG pattern.
    Context is ALWAYS retrieved from OLAP warehouse before generation.
    """
    result = await generate_response(
        query=request.question,
        model=request.model
    )
    
    return AskResponse(
        answer=result["response"],
        sources=result["context"],
        model=result["model"]
    )
```

## Available Cortex Models

Reference: https://docs.snowflake.com/en/user-guide/snowflake-cortex/llm-functions

| Model | Use Case | Context Window |
|-------|----------|----------------|
| `mistral-large` | General purpose, high quality | 32K tokens |
| `mistral-7b` | Fast, cost-effective | 8K tokens |
| `llama3-70b` | Complex reasoning | 8K tokens |
| `llama3-8b` | Fast inference | 8K tokens |
| `gemma-7b` | Efficient, multilingual | 8K tokens |

## Context Window Management

Always respect model context limits:

```python
# backend/ai_utils.py
import tiktoken

MODEL_CONTEXT_LIMITS = {
    "mistral-large": 32000,
    "mistral-7b": 8000,
    "llama3-70b": 8000,
    "llama3-8b": 8000,
}

def truncate_context(
    context: list[dict],
    query: str,
    model: str,
    reserve_tokens: int = 1000  # Reserve for response
) -> list[dict]:
    """
    Truncate context to fit within model's context window.
    """
    max_tokens = MODEL_CONTEXT_LIMITS.get(model, 8000) - reserve_tokens
    encoder = tiktoken.get_encoding("cl100k_base")
    
    query_tokens = len(encoder.encode(query))
    available_tokens = max_tokens - query_tokens
    
    truncated = []
    total_tokens = 0
    
    for item in context:
        item_tokens = len(encoder.encode(item["content"]))
        if total_tokens + item_tokens <= available_tokens:
            truncated.append(item)
            total_tokens += item_tokens
        else:
            break
    
    return truncated
```

## Prompt Engineering Guidelines

### System Prompt Template

```python
SYSTEM_PROMPT = """You are an AI assistant for {app_name}.
Your knowledge comes ONLY from the provided context.

RULES:
1. Only answer based on the provided context
2. If context is insufficient, say "I don't have enough information"
3. Cite sources when possible using [Source N] format
4. Be concise and direct
5. Never make up information not in the context
"""
```

### User Query Template

```python
def format_query(user_question: str, context: list[dict]) -> str:
    context_block = "\n\n".join([
        f"[Source {i+1}] ({item.get('metadata', {}).get('title', 'Unknown')}):\n{item['content']}"
        for i, item in enumerate(context)
    ])
    
    return f"""CONTEXT:
{context_block}

QUESTION: {user_question}

Provide a helpful answer based on the context above."""
```

## Embedding Generation for Ingestion

When adding new documents to the knowledge base:

```python
# backend/ai_ingest.py
def ingest_document_sync(content: str, metadata: dict):
    """
    Ingest a document into the knowledge base with embeddings.
    """
    session = get_snowpark_session()
    
    # Generate embedding using Cortex
    session.sql(f"""
        INSERT INTO analytics.knowledge_base (content, metadata, content_embedding)
        SELECT 
            '{content.replace("'", "''")}',
            PARSE_JSON('{json.dumps(metadata)}'),
            CORTEX.EMBED('e5-base-v2', '{content.replace("'", "''")}')
    """).collect()
```
