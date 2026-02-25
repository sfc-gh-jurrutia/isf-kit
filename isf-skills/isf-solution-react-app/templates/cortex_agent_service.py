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
        self.account_url = account_url or os.getenv("SNOWFLAKE_ACCOUNT_URL")
        self.database = os.getenv("CORTEX_AGENT_DATABASE", database)
        self.schema = os.getenv("CORTEX_AGENT_SCHEMA", schema)
        self.agent_name = os.getenv("CORTEX_AGENT_NAME", agent_name)
        self.warehouse = os.getenv("SNOWFLAKE_WAREHOUSE", warehouse)
        
        if not self.account_url:
            raise ValueError("SNOWFLAKE_ACCOUNT_URL environment variable required")
    
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
# Thread Management
# ============================================================================

@router.post("/threads", response_model=ThreadResponse)
async def create_thread() -> ThreadResponse:
    """Create a new conversation thread for multi-turn chat"""
    config = get_config()
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                config.threads_endpoint,
                headers={
                    **get_auth_headers(),
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
    config = get_config()
    
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
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                config.agent_endpoint,
                headers={
                    **get_auth_headers(),
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

def map_cortex_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map Cortex Agent events to standardized format for frontend.
    
    Cortex Agent SSE events are transformed into a consistent format
    that the React components expect:
    
    Input event types from Cortex Agent:
    - text / content_block_delta: Streaming text content
    - tool_use_start: Tool execution begins
    - tool_use_end: Tool execution completes
    - tool_result: Tool results with SQL/data
    - thinking: Agent reasoning process
    - message_stop / done: End of message
    
    Output event types for frontend:
    - text_delta: Incremental text with 'text' field
    - tool_start: Tool begins with name/type
    - tool_end: Tool completes with result/sql
    - tool_result: Intermediate tool results
    - reasoning: Agent thinking process
    - message_complete: Final message with citations
    - error: Error event
    """
    event_type = event.get("type") or event.get("event")
    
    if event_type in ["text", "content_block_delta"]:
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
    
    if event_type in ["message_stop", "done"]:
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
    config = get_config()
    
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
    
    async with httpx.AsyncClient() as client:
        try:
            async with client.stream(
                "POST",
                config.agent_endpoint,
                headers={
                    **get_auth_headers(),
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream",
                },
                json=payload,
                timeout=120.0,
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        event_data = line[6:]
                        if event_data == "[DONE]":
                            yield f"data: [DONE]\n\n"
                            break
                        
                        try:
                            event = json.loads(event_data)
                            mapped_event = map_cortex_event(event)
                            yield f"data: {json.dumps(mapped_event)}\n\n"
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
