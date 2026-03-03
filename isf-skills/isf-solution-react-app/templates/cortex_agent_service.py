"""
Cortex Agent API Proxy - FastAPI backend for React chat widget

This module provides:
- Thread management for multi-turn conversations
- Proxy to Snowflake Cortex Agent REST API
- SSE streaming support
- Error handling and fallback responses

Usage:
    from cortex_agent_service import router
    app.include_router(router, prefix="/api/agent")
"""

import os
import json
import time
import httpx
import logging
from typing import Optional, List, Dict, Any, AsyncGenerator
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# Configuration
# ============================================================================

def _normalize_account_url(url: str) -> str:
    """Snowflake SSL certs use hyphens, not underscores, in account hostnames."""
    from urllib.parse import urlparse, urlunparse
    parsed = urlparse(url)
    if parsed.hostname and "_" in parsed.hostname:
        normalized = parsed._replace(netloc=parsed.hostname.replace("_", "-"))
        return urlunparse(normalized)
    return url


class CortexAgentConfig:
    """Configuration for Cortex Agent connection"""
    
    def __init__(
        self,
        account_url: Optional[str] = None,
        database: str = "MYDB",
        schema: str = "MYSCHEMA", 
        agent_name: str = "MY_AGENT",
        warehouse: str = "COMPUTE_WH",
    ):
        raw_url = account_url or os.getenv("SNOWFLAKE_ACCOUNT_URL")
        if not raw_url:
            raise ValueError("SNOWFLAKE_ACCOUNT_URL environment variable required")
        self.account_url = _normalize_account_url(raw_url)
        self.database = os.getenv("CORTEX_AGENT_DATABASE", database)
        self.schema = os.getenv("CORTEX_AGENT_SCHEMA", schema)
        self.agent_name = os.getenv("CORTEX_AGENT_NAME", agent_name)
        self.warehouse = os.getenv("SNOWFLAKE_WAREHOUSE", warehouse)
    
    @property
    def agent_endpoint(self) -> str:
        return f"{self.account_url}/api/v2/databases/{self.database}/schemas/{self.schema}/agents/{self.agent_name}:run"
    
    @property
    def threads_endpoint(self) -> str:
        return f"{self.account_url}/api/v2/cortex/threads"


# Initialize config (lazy loaded)
_config: Optional[CortexAgentConfig] = None

def get_config() -> CortexAgentConfig:
    global _config
    if _config is None:
        _config = CortexAgentConfig()
    return _config


# ============================================================================
# Persistent HTTP Client
# ============================================================================

_http_client: Optional[httpx.AsyncClient] = None


def _get_http_client() -> httpx.AsyncClient:
    """
    Return a module-level persistent AsyncClient, creating it on first call.
    Reuses TCP connections across requests and supports HTTP/2.
    """
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            verify=True,
            timeout=120.0,
            http2=True,
            limits=httpx.Limits(
                max_keepalive_connections=5,
                keepalive_expiry=120,
            ),
        )
    return _http_client


# ============================================================================
# Models
# ============================================================================

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str
    thread_id: Optional[str] = None
    parent_message_id: Optional[str] = "0"
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Response model for non-streaming chat"""
    response: str
    thread_id: Optional[str] = None
    message_id: Optional[str] = None
    sources: List[Dict[str, Any]] = []
    tool_calls: List[Dict[str, Any]] = []
    sql: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ThreadResponse(BaseModel):
    """Response model for thread creation"""
    thread_id: str


# ============================================================================
# Auth Helper
# ============================================================================

def get_auth_headers() -> Dict[str, str]:
    """
    Get authentication headers for Snowflake API calls.
    
    Supports multiple auth methods:
    1. Personal Access Token (PAT)
    2. OAuth token
    3. JWT token
    
    Returns:
        Dict with Authorization header
    """
    # Try PAT first
    pat = os.getenv("SNOWFLAKE_PAT") or os.getenv("SNOWFLAKE_TOKEN")
    if pat:
        return {"Authorization": f"Bearer {pat}"}
    
    # Try OAuth token
    oauth_token = os.getenv("SNOWFLAKE_OAUTH_TOKEN")
    if oauth_token:
        return {"Authorization": f"Bearer {oauth_token}"}
    
    # For JWT, you'd need to generate it - simplified here
    raise ValueError(
        "No authentication token found. Set SNOWFLAKE_PAT or SNOWFLAKE_OAUTH_TOKEN"
    )


# ============================================================================
# Token + Endpoint Caching (SPCS optimisation)
# ============================================================================

_cached_token: Optional[str] = None
_token_time: float = 0
_TOKEN_TTL = 300  # seconds

_cached_agent_endpoint: Optional[str] = None
_cached_threads_endpoint: Optional[str] = None


def get_auth_headers_cached() -> Dict[str, str]:
    """
    Cached auth headers for SPCS deployments.

    Reads the Snowflake REST token from a pooled connection and caches it
    for _TOKEN_TTL seconds. Falls back to the PAT-based get_auth_headers()
    when the connection pool is unavailable (e.g. local dev).
    """
    global _cached_token, _token_time
    now = time.time()
    if not _cached_token or (now - _token_time) > _TOKEN_TTL:
        try:
            from snowflake_conn import get_connection, return_connection
            conn = get_connection()
            _cached_token = conn.rest.token
            return_connection(conn)
            _token_time = now
        except Exception:
            pass
    if _cached_token:
        return {
            "Authorization": f'Snowflake Token="{_cached_token}"',
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }
    return get_auth_headers()


def _get_agent_endpoint() -> str:
    """Return the agent endpoint, caching after first computation."""
    global _cached_agent_endpoint
    if _cached_agent_endpoint is None:
        _cached_agent_endpoint = get_config().agent_endpoint
    return _cached_agent_endpoint


def _get_threads_endpoint() -> str:
    """Return the threads endpoint, caching after first computation."""
    global _cached_threads_endpoint
    if _cached_threads_endpoint is None:
        _cached_threads_endpoint = get_config().threads_endpoint
    return _cached_threads_endpoint


# ============================================================================
# Thread Management
# ============================================================================

@router.post("/threads", response_model=ThreadResponse)
async def create_thread() -> ThreadResponse:
    """Create a new conversation thread for multi-turn chat"""
    client = _get_http_client()
    try:
        response = await client.post(
            _get_threads_endpoint(),
            headers={
                **get_auth_headers_cached(),
                "Content-Type": "application/json",
            },
            json={"origin_application": "react_chat_widget"},
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()
        return ThreadResponse(thread_id=data.get("thread_id", data.get("id")))
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Thread creation failed: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        logger.error(f"Thread creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Chat Endpoint (Non-Streaming)
# ============================================================================

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Send a message to Cortex Agent and get a response.
    
    Creates a thread automatically if not provided.
    """
    # Create thread if not provided
    thread_id = request.thread_id
    if not thread_id:
        thread_response = await create_thread()
        thread_id = thread_response.thread_id
    
    # Build request payload
    payload = {
        "thread_id": thread_id,
        "parent_message_id": request.parent_message_id or "0",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": request.message,
                    }
                ]
            }
        ]
    }
    
    client = _get_http_client()
    try:
        response = await client.post(
            _get_agent_endpoint(),
            headers={
                **get_auth_headers_cached(),
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=120.0,
        )
        response.raise_for_status()
        data = response.json()
        
        # Parse response
        content = ""
        sources = []
        tool_calls = []
        sql = None
        message_id = None
        
        # Handle different response formats
        if "messages" in data:
            for msg in data["messages"]:
                if msg.get("role") == "assistant":
                    for item in msg.get("content", []):
                        if item.get("type") == "text":
                            content += item.get("text", "")
                        elif item.get("type") == "tool_result":
                            tool_calls.append({
                                "name": item.get("tool_name"),
                                "type": item.get("tool_type"),
                                "output": item.get("result"),
                                "sql": item.get("sql"),
                            })
                            if item.get("sql"):
                                sql = item.get("sql")
                    message_id = msg.get("id")
                    
        elif "response" in data:
            content = data["response"]
            sources = data.get("sources", [])
            tool_calls = data.get("tool_calls", [])
            sql = data.get("sql")
        
        # Extract citations/sources
        if "citations" in data:
            sources = [
                {
                    "title": c.get("source", c.get("title", "Unknown")),
                    "snippet": c.get("text", ""),
                    "score": c.get("score"),
                }
                for c in data["citations"]
            ]
        
        return ChatResponse(
            response=content,
            thread_id=thread_id,
            message_id=message_id,
            sources=sources,
            tool_calls=tool_calls,
            sql=sql,
            context=data.get("context"),
        )
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Agent call failed: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        logger.error(f"Agent error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Streaming Chat Endpoint
# ============================================================================

_SSE_EVENT_TYPE_MAP = {
    "response.output.delta": "text",
    "response.text.delta": "text",
    "response.thinking.delta": "thinking",
}


def map_cortex_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map Cortex Agent events to standardized format for frontend.

    Snowflake SSE streams use a two-line format::

        event: response.output.delta
        data: {"text": "Hello..."}

    The caller injects the SSE event type as ``_sse_event_type`` so this
    function can resolve the correct mapping even when the JSON payload
    has no ``type`` / ``event`` field of its own.

    Output event types for frontend:
    - text_delta: Incremental text with 'text' field
    - tool_start: Tool begins with name/type
    - tool_end: Tool completes with result/sql
    - tool_result: Intermediate tool results
    - reasoning: Agent thinking process
    - message_complete: Final message with citations
    - error: Error event
    """
    sse_type = event.pop("_sse_event_type", "")
    event_type = (
        event.get("type")
        or event.get("event")
        or _SSE_EVENT_TYPE_MAP.get(sse_type)
    )

    if event_type in ("text", "content_block_delta"):
        text = event.get("text") or event.get("delta", {}).get("text", "")
        return {"event_type": "text_delta", "text": text}

    if event_type == "tool_use_start":
        return {
            "event_type": "tool_start",
            "tool_name": event.get("name"),
            "tool_type": event.get("tool_type", "custom"),
            "input": event.get("input"),
        }

    if event_type == "tool_use_end":
        return {
            "event_type": "tool_end",
            "tool_name": event.get("name"),
            "result": event.get("result"),
            "sql": event.get("sql"),
            "error": event.get("error"),
            "duration": event.get("duration"),
        }

    if event_type == "tool_result":
        return {
            "event_type": "tool_result",
            "tool_name": event.get("tool_name") or event.get("name"),
            "result": event.get("result") or event.get("data"),
            "sql": event.get("sql"),
        }

    if event_type == "thinking":
        return {
            "event_type": "reasoning",
            "text": event.get("text"),
        }

    if event_type in ("message_stop", "done"):
        return {
            "event_type": "message_complete",
            "message_id": event.get("message_id"),
            "thread_id": event.get("thread_id"),
            "citations": event.get("citations", []),
        }

    if event_type == "error":
        return {
            "event_type": "error",
            "error": event.get("error") or event.get("message"),
            "code": event.get("code"),
        }

    return event


async def stream_agent_response(
    thread_id: str,
    message: str,
    parent_message_id: str = "0",
) -> AsyncGenerator[str, None]:
    """
    Stream responses from Cortex Agent using SSE.
    
    Yields SSE-formatted events for:
    - tool_start: When a tool begins execution
    - tool_end: When a tool completes
    - tool_result: Tool output data
    - text_delta: Incremental text content
    - reasoning: Agent thought process
    - message_complete: Final message with metadata
    - error: Error events
    """
    payload = {
        "thread_id": thread_id,
        "parent_message_id": parent_message_id,
        "stream": True,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": message}]
            }
        ]
    }
    
    client = _get_http_client()

    # SSE deduplication state — Cortex Agent may send cumulative text
    accumulated_text = ""
    last_text_len = 0

    try:
        async with client.stream(
            "POST",
            _get_agent_endpoint(),
            headers={
                **get_auth_headers_cached(),
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
            },
            json=payload,
            timeout=120.0,
        ) as response:
            response.raise_for_status()

            # Snowflake SSE uses two-line format:
            #   event: response.output.delta
            #   data: {"text": "..."}
            # We track the current event type so map_cortex_event can resolve it.
            current_sse_event = ""

            async for line in response.aiter_lines():
                if line.startswith("event:"):
                    current_sse_event = line[6:].strip()
                    continue

                if line.startswith("data:"):
                    event_data = line[5:].strip()
                    if event_data == "[DONE]":
                        yield f"data: [DONE]\n\n"
                        break
                    
                    try:
                        event = json.loads(event_data)
                        event["_sse_event_type"] = current_sse_event
                        mapped = map_cortex_event(event)
                        current_sse_event = ""

                        # Deduplicate cumulative text_delta events
                        if mapped.get("event_type") == "text_delta":
                            new_text = mapped.get("text", "")
                            if not new_text or accumulated_text.endswith(new_text):
                                continue
                            if new_text.startswith(accumulated_text) and len(new_text) > last_text_len:
                                delta = new_text[last_text_len:]
                                accumulated_text = new_text
                                last_text_len = len(new_text)
                                mapped["text"] = delta
                            else:
                                accumulated_text += new_text
                                last_text_len = len(accumulated_text)

                        yield f"data: {json.dumps(mapped)}\n\n"
                    except json.JSONDecodeError:
                        yield f"data: {event_data}\n\n"
                
                elif line.strip():
                    yield f"{line}\n"
                    
    except httpx.HTTPStatusError as e:
        error_msg = json.dumps({
            "event_type": "error",
            "error": str(e),
            "status_code": e.response.status_code,
        })
        yield f"data: {error_msg}\n\n"
    except Exception as e:
        error_msg = json.dumps({
            "event_type": "error", 
            "error": str(e),
        })
        yield f"data: {error_msg}\n\n"


@router.post("/run")
async def run_agent_streaming(request: ChatRequest):
    """
    Send a message to Cortex Agent with SSE streaming response.
    
    Returns a streaming response with SSE events.
    """
    # Create thread if not provided
    thread_id = request.thread_id
    if not thread_id:
        thread_response = await create_thread()
        thread_id = thread_response.thread_id
    
    return StreamingResponse(
        stream_agent_response(
            thread_id=thread_id,
            message=request.message,
            parent_message_id=request.parent_message_id or "0",
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Thread-Id": thread_id,
        },
    )


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health")
async def health_check():
    """Check agent service health"""
    try:
        config = get_config()
        return {
            "status": "healthy",
            "agent": f"{config.database}.{config.schema}.{config.agent_name}",
            "endpoint": config.agent_endpoint,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }


# ============================================================================
# Warmup
# ============================================================================

@router.get("/warmup")
async def warmup():
    """
    Readiness probe for Cortex Agent subsystem.

    Exercises the Snowflake connection pool (SELECT 1) and ensures the
    persistent HTTP client is initialized so the first real request is fast.
    """
    errors = []
    try:
        from snowflake_conn import get_connection, return_connection
        conn = get_connection()
        try:
            conn.cursor().execute("SELECT 1")
        finally:
            return_connection(conn)
    except Exception as e:
        errors.append(f"pool: {e}")

    try:
        _get_http_client()
    except Exception as e:
        errors.append(f"http_client: {e}")

    if errors:
        return {"status": "cold", "errors": errors}
    return {"status": "warm"}


# ============================================================================
# Example Usage
# ============================================================================

"""
To use this in your FastAPI app:

1. Set environment variables:
   - SNOWFLAKE_ACCOUNT_URL=https://your-account.snowflakecomputing.com
   - SNOWFLAKE_PAT=your-personal-access-token
   - CORTEX_AGENT_DATABASE=MYDB
   - CORTEX_AGENT_SCHEMA=MYSCHEMA
   - CORTEX_AGENT_NAME=MY_AGENT

2. Include the router in your app:
   
   from fastapi import FastAPI
   from cortex_agent_service import router as agent_router
   
   app = FastAPI()
   app.include_router(agent_router, prefix="/api/agent")

3. Connect from React:
   
   <CortexAgentChat 
     agentEndpoint="/api/agent/run"  // For streaming
     // or
     agentEndpoint="/api/agent/chat"  // For non-streaming
   />

4. For local development without Cortex Agent, implement a mock:
   
   @router.post("/mock")
   async def mock_chat(request: ChatRequest):
       return ChatResponse(
           response=f"Mock response to: {request.message}",
           sources=[{"title": "Mock Source"}],
       )
"""
