# WebSocket Real-Time Pattern

FastAPI WebSocket backend + React hook for bidirectional real-time communication. Use for live dashboards, monitoring, or any push-from-server scenario.

## When to Use

| Need | Pattern |
|------|---------|
| Chat with Cortex Agent | SSE (existing `useCortexAgent` hook) |
| Server pushes live data (monitoring, alerts) | **WebSocket** |
| Bidirectional messaging (user actions + server updates) | **WebSocket** |

## Backend: FastAPI WebSocket

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        self.active_connections.setdefault(channel, []).append(websocket)

    def disconnect(self, websocket: WebSocket, channel: str):
        conns = self.active_connections.get(channel, [])
        if websocket in conns:
            conns.remove(websocket)

    async def broadcast(self, channel: str, data: dict):
        for conn in self.active_connections.get(channel, []):
            try:
                await conn.send_json(data)
            except Exception:
                self.disconnect(conn, channel)

manager = ConnectionManager()

@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle incoming messages (e.g., filter changes)
            response = await process_message(channel, data)
            await websocket.send_json(response)
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
```

### Server-Push Variant (polling Snowflake)

```python
@app.websocket("/ws/monitor/{entity_id}")
async def monitor_endpoint(websocket: WebSocket, entity_id: str):
    await manager.connect(websocket, entity_id)
    try:
        while True:
            data = await fetch_latest_from_snowflake(entity_id)
            await websocket.send_json(data)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket, entity_id)
```

## Frontend: React Hook

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'

interface UseWebSocketOptions {
  url: string
  reconnectInterval?: number
  maxRetries?: number
}

export function useWebSocket<T>({ url, reconnectInterval = 3000, maxRetries = 5 }: UseWebSocketOptions) {
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)

  const connect = useCallback(() => {
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('open')
      retriesRef.current = 0
    }

    ws.onmessage = (event) => {
      setData(JSON.parse(event.data))
    }

    ws.onclose = () => {
      setStatus('closed')
      if (retriesRef.current < maxRetries) {
        retriesRef.current++
        setTimeout(connect, reconnectInterval)
      }
    }

    ws.onerror = () => setStatus('error')
  }, [url, reconnectInterval, maxRetries])

  useEffect(() => {
    connect()
    return () => wsRef.current?.close()
  }, [connect])

  const send = useCallback((msg: unknown) => {
    wsRef.current?.send(JSON.stringify(msg))
  }, [])

  return { data, status, send }
}
```

## nginx Configuration

WebSocket requires HTTP/1.1 Upgrade headers. Add to nginx.conf:

```nginx
location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

See `isf-deployment/references/nginx-spcs-pattern.md` for the full nginx + supervisord setup.

## Critical Patterns

| Pattern | Requirement | Reason |
|---------|-------------|--------|
| `proxy_read_timeout 86400` | High value in nginx | Default 60s kills idle WS connections |
| Reconnect with backoff | Required in React hook | Network blips are common in SPCS |
| `send_json` / `receive_json` | Use over `send_text` | Ensures consistent serialization |
| Channel-based routing | Recommended | Isolate connections by entity/topic |
| Cleanup on disconnect | Required | Prevent memory leaks in ConnectionManager |
