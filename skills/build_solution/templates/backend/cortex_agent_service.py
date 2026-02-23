"""Cortex Agent proxy service template (FastAPI + httpx).

Copy into your project's backend/api/ directory. Customize CortexAgentConfig
defaults for your project's database, schema, and agent name.

Mount the router in your FastAPI app:
    from api.cortex_agent_service import router as agent_router
    app.include_router(agent_router)
"""

from __future__ import annotations

import json
import os
from typing import Any, Optional

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

class CortexAgentConfig:
    """Reads Cortex Agent settings from env vars with constructor fallbacks."""

    def __init__(
        self,
        account_url: str | None = None,
        database: str | None = None,
        schema: str | None = None,
        agent_name: str | None = None,
        warehouse: str | None = None,
    ) -> None:
        self.account_url = account_url or os.getenv("SNOWFLAKE_ACCOUNT_URL", "")
        self.database = database or os.getenv("CORTEX_AGENT_DATABASE", "")
        self.schema = schema or os.getenv("CORTEX_AGENT_SCHEMA", "")
        self.agent_name = agent_name or os.getenv("CORTEX_AGENT_NAME", "")
        self.warehouse = warehouse or os.getenv("SNOWFLAKE_WAREHOUSE", "")

    @property
    def agent_endpoint(self) -> str:
        base = self.account_url.rstrip("/")
        return (
            f"{base}/api/v2/databases/{self.database}"
            f"/schemas/{self.schema}/agents/{self.agent_name}:run"
        )

    @property
    def threads_endpoint(self) -> str:
        base = self.account_url.rstrip("/")
        return f"{base}/api/v2/cortex/threads"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def get_auth_headers() -> dict[str, str]:
    """Return Bearer auth header. Priority: PAT > OAuth token."""
    token = (
        os.getenv("SNOWFLAKE_PAT")
        or os.getenv("SNOWFLAKE_TOKEN")
        or os.getenv("SNOWFLAKE_OAUTH_TOKEN")
    )
    if not token:
        raise ValueError(
            "No auth token found. Set SNOWFLAKE_PAT, SNOWFLAKE_TOKEN, "
            "or SNOWFLAKE_OAUTH_TOKEN."
        )
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None
    parent_message_id: Optional[str] = "0"
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str
    thread_id: str
    message_id: str
    sources: list = []
    tool_calls: list = []
    sql: Optional[str] = None
    context: Optional[dict] = None


# ---------------------------------------------------------------------------
# SSE Event Mapping
# ---------------------------------------------------------------------------

def map_cortex_event(event: dict) -> dict[str, Any]:
    """Map Cortex SSE events to frontend-friendly events.

    Mapping table:
        Cortex event             → Frontend event_type
        ─────────────────────────────────────────────
        text / content_block_delta → text_delta
        tool_use_start             → tool_start
        tool_use_end               → tool_end
        tool_result                → tool_result
        thinking                   → reasoning
        message_stop / done        → message_complete
        error                      → error
    """
    etype = event.get("event_type", event.get("type", ""))

    if etype in ("text", "content_block_delta"):
        return {"event_type": "text_delta", "text": event.get("text", "")}

    if etype == "tool_use_start":
        return {
            "event_type": "tool_start",
            "tool_name": event.get("tool_name", ""),
            "tool_type": event.get("tool_type", ""),
        }

    if etype == "tool_use_end":
        return {
            "event_type": "tool_end",
            "tool_name": event.get("tool_name", ""),
            "result": event.get("result"),
        }

    if etype == "tool_result":
        return {
            "event_type": "tool_result",
            "tool_name": event.get("tool_name", ""),
            "result": event.get("result"),
            "sql": event.get("sql"),
        }

    if etype == "thinking":
        return {"event_type": "reasoning", "text": event.get("text", "")}

    if etype in ("message_stop", "done"):
        return {
            "event_type": "message_complete",
            "thread_id": event.get("thread_id"),
            "message_id": event.get("message_id"),
        }

    if etype == "error":
        return {
            "event_type": "error",
            "error": event.get("error", event.get("message", "")),
            "code": event.get("code"),
        }

    return {**event, "event_type": etype or "unknown"}


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

config = CortexAgentConfig()
router = APIRouter(prefix="/agent")


@router.post("/threads")
async def create_thread():
    """Create a new conversation thread."""
    try:
        headers = {**get_auth_headers(), "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(config.threads_endpoint, headers=headers, json={})
            resp.raise_for_status()
            return resp.json()
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=exc.response.text,
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Thread creation timed out")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Non-streaming chat. Collects full response and returns ChatResponse."""
    try:
        headers = {**get_auth_headers(), "Content-Type": "application/json"}
        body: dict[str, Any] = {
            "messages": [
                {"role": "user", "content": [{"type": "text", "text": req.message}]}
            ],
        }
        if req.thread_id:
            body["thread_id"] = req.thread_id
        if req.context:
            body["context"] = req.context

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                config.agent_endpoint, headers=headers, json=body
            )
            resp.raise_for_status()

        full_text = ""
        sources: list = []
        tool_calls: list = []
        sql_result: str | None = None
        thread_id = req.thread_id or ""
        message_id = ""

        for line in resp.text.splitlines():
            if not line.startswith("data: "):
                continue
            payload = line[len("data: "):]
            if payload == "[DONE]":
                break
            event = json.loads(payload)
            mapped = map_cortex_event(event)
            if mapped["event_type"] == "text_delta":
                full_text += mapped.get("text", "")
            elif mapped["event_type"] == "tool_result":
                tool_calls.append(mapped)
                if mapped.get("sql"):
                    sql_result = mapped["sql"]
            elif mapped["event_type"] == "message_complete":
                thread_id = mapped.get("thread_id") or thread_id
                message_id = mapped.get("message_id") or message_id

        return ChatResponse(
            response=full_text,
            thread_id=thread_id,
            message_id=message_id,
            sources=sources,
            tool_calls=tool_calls,
            sql=sql_result,
            context=req.context,
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=exc.response.text,
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Agent request timed out")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/run")
async def run_stream(req: ChatRequest):
    """SSE streaming endpoint. Returns mapped events as text/event-stream."""

    async def event_generator():
        try:
            headers = {**get_auth_headers(), "Content-Type": "application/json"}
            body: dict[str, Any] = {
                "messages": [
                    {"role": "user", "content": [{"type": "text", "text": req.message}]}
                ],
            }
            if req.thread_id:
                body["thread_id"] = req.thread_id
            if req.context:
                body["context"] = req.context

            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST", config.agent_endpoint, headers=headers, json=body
                ) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        payload = line[len("data: "):]
                        if payload == "[DONE]":
                            break
                        event = json.loads(payload)
                        mapped = map_cortex_event(event)
                        yield f"data: {json.dumps(mapped)}\n\n"
        except Exception as exc:
            err = {"event_type": "error", "error": str(exc)}
            yield f"data: {json.dumps(err)}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/health")
async def health():
    """Health check returning agent name and endpoint."""
    return {
        "status": "ok",
        "agent_name": config.agent_name,
        "agent_endpoint": config.agent_endpoint,
    }
