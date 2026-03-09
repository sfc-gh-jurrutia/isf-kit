---
title: Reuse httpx.AsyncClient for Cortex Agent Calls
impact: HIGH
impactDescription: 100-300ms saved per Cortex Agent call
tags: httpx, performance, tls, http2, cortex
---

## Reuse httpx.AsyncClient for Cortex Agent Calls

Maintain a persistent `httpx.AsyncClient` instead of creating one per request.

**Why it matters**: Each new `httpx.AsyncClient()` performs a fresh TLS handshake with Snowflake (100-300ms). A persistent client reuses the TCP+TLS connection. With HTTP/2 enabled, multiple concurrent streams share one connection.

**Incorrect (client per request):**

```python
@router.post("/chat")
async def chat(request: ChatRequest):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            config.agent_endpoint(),
            headers={**get_auth_headers_cached(), "Content-Type": "application/json"},
            json=payload,
            timeout=120.0,
        )
        return response.json()
```

**Correct (persistent client):**

```python
import httpx
from typing import Optional

_http_client: Optional[httpx.AsyncClient] = None


def _get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            http2=True,
            limits=httpx.Limits(
                max_keepalive_connections=5,
                keepalive_expiry=120,
            ),
            timeout=120.0,
        )
    return _http_client


@router.post("/chat")
async def chat(request: ChatRequest):
    client = _get_http_client()
    response = await client.post(
        config.agent_endpoint(),
        headers={**get_auth_headers_cached(), "Content-Type": "application/json"},
        json=payload,
        timeout=120.0,
    )
    return response.json()
```

**Key settings:**
- `http2=True` — multiplexes streams on one connection
- `max_keepalive_connections=5` — pool of warm connections
- `keepalive_expiry=120` — drop idle connections after 2 min
- `timeout=120.0` — agent calls can be slow

**Cleanup**: In FastAPI lifespan, close the client on shutdown:

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app):
    yield
    if _http_client is not None:
        await _http_client.aclose()

app = FastAPI(lifespan=lifespan)
```
