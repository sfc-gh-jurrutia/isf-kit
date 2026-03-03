# Performance Patterns — Backend + Frontend

Comprehensive guide consolidating all ISF performance optimizations. Every pattern here addresses a specific gap identified in production ISF deployments.

---

## 1. Connection Pooling

**Template:** `templates/snowflake_conn.py`
**Rule:** `rules/sf-connection-pool.md`

### Problem

Creating a new Snowflake connection per request takes 500-2000ms (TCP + TLS + auth). A dashboard with 15 endpoints means 15 cold connections per page load.

### Solution

Thread-safe connection pool with lazy health checks. Connections are pre-created up to `_POOL_SIZE` (default 8) and reused via checkout/checkin pattern.

```python
from snowflake_conn import get_connection, return_connection

conn = get_connection()
try:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM metrics")
    rows = cursor.fetchall()
finally:
    return_connection(conn)
```

### How it works

1. `get_connection()` pops a connection from the pool (or creates a new one if empty)
2. Lazy health check: only runs `SELECT 1` if connection has been idle > 120s
3. `return_connection(conn)` pushes it back (or closes it if pool is at capacity)
4. Auth auto-detection: SPCS OAuth token vs. local `connections.toml`

### Key settings

| Setting | Value | Purpose |
|---|---|---|
| `_POOL_SIZE` | 8 | Max idle connections |
| `_HEALTH_CHECK_INTERVAL` | 120s | Idle time before probe |
| `client_session_keep_alive` | `True` | Prevents Snowflake timeout |

---

## 2. HTTP Client Reuse

**Rule:** `rules/sf-httpx-reuse.md`
**Template:** `templates/cortex_agent_service.py` (lines 76-95)

### Problem

Each new `httpx.AsyncClient()` performs a fresh TLS handshake with Snowflake (100-300ms). With HTTP/2 disabled, each request opens a new TCP connection.

### Solution

Module-level persistent `httpx.AsyncClient` with HTTP/2 enabled.

```python
_http_client: Optional[httpx.AsyncClient] = None

def _get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            http2=True,
            limits=httpx.Limits(max_keepalive_connections=5, keepalive_expiry=120),
            timeout=120.0,
        )
    return _http_client
```

### Key settings

| Setting | Value | Purpose |
|---|---|---|
| `http2` | `True` | Multiplexes streams on one connection |
| `max_keepalive_connections` | 5 | Pool of warm connections |
| `keepalive_expiry` | 120s | Drop idle connections after 2 min |
| `timeout` | 120.0s | Agent calls can be slow |

### Cleanup

Close the client in FastAPI lifespan shutdown:

```python
@asynccontextmanager
async def lifespan(app):
    yield
    if _http_client is not None:
        await _http_client.aclose()

app = FastAPI(lifespan=lifespan)
```

---

## 3. Token + Endpoint Caching

**Template:** `templates/cortex_agent_service.py` (lines 159-211)

### Problem

In SPCS deployments, every API call that needs auth headers must read the token from a pooled connection. Endpoint URLs are recomputed from config on every call.

### Solution

Cache the REST token for 5 minutes (300s). Cache computed endpoint URLs after first call.

```python
_cached_token: Optional[str] = None
_token_time: float = 0
_TOKEN_TTL = 300  # 5 minutes

def get_auth_headers_cached() -> Dict[str, str]:
    global _cached_token, _token_time
    now = time.time()
    if not _cached_token or (now - _token_time) > _TOKEN_TTL:
        conn = get_connection()
        _cached_token = conn.rest.token
        return_connection(conn)
        _token_time = now
    return {
        "Authorization": f'Snowflake Token="{_cached_token}"',
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
```

### Token refresh strategy

- SPCS tokens have a longer server-side TTL but can be refreshed cheaply from the connection pool
- 5-minute cache avoids a pool checkout on every request while staying well within token validity
- Falls back to PAT-based `get_auth_headers()` when pool is unavailable (local dev)

---

## 4. Detail Bundle Endpoints

**Template:** `templates/backend_patterns.py` (lines 153-190)

### Problem

Rendering an entity detail view requires 3-5 queries (header, metrics, trajectory, actions, related entities). If each is a separate API call, the frontend makes 3-5 round-trips, each checking out a separate connection.

### Solution

Single endpoint, single connection, multiple queries, one response.

```python
@app.get("/api/{entity_type}/{entity_id}/detail-bundle")
def get_detail_bundle(entity_id: str):
    cached = cache_get(f"bundle:{entity_id}", ttl=TTL_DETAIL)
    if cached:
        return cached

    conn = get_connection()
    result = {}
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT ... WHERE id = %s", (entity_id,))
        result["header"] = serialize_row(
            [d[0] for d in cursor.description], cursor.fetchone()
        )

        cursor.execute("SELECT ... WHERE entity_id = %s", (entity_id,))
        cols = [d[0] for d in cursor.description]
        result["metrics"] = [serialize_row(cols, r) for r in cursor.fetchall()]

        # Additional queries as needed...
        cache_set(f"bundle:{entity_id}", result)
    finally:
        return_connection(conn)

    return result
```

### Benefits

| Before | After |
|---|---|
| 5 API calls × 1 connection each | 1 API call × 1 connection |
| 5 connection checkouts | 1 connection checkout |
| ~2500ms total (5 × 500ms) | ~500ms total |
| No caching | TTL_DETAIL (60s) cache |

---

## 5. Server-Side TTL Caching

**Rule:** `rules/sf-ttl-cache.md`
**Template:** `templates/backend_patterns.py` (lines 39-73)

### Problem

Without caching, every page load fires all API calls against Snowflake. For a dashboard with 15 endpoints, that's 15 queries per user per refresh.

### Solution

Thread-safe in-memory TTL cache. Check cache before querying; store results after querying.

```python
from backend_patterns import cache_get, cache_set, TTL_LIST

@router.get("/api/entities")
async def list_entities():
    cached = cache_get("entities:list", ttl=TTL_LIST)
    if cached is not None:
        return cached

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM entities ORDER BY updated_at DESC")
        rows = cursor.fetchall()
    finally:
        return_connection(conn)

    cache_set("entities:list", rows)
    return rows
```

### Recommended TTLs

| Endpoint Type | TTL | Constant | Rationale |
|---|---|---|---|
| List endpoints (all entities) | 30s | `TTL_LIST` | Data changes frequently |
| Detail bundles | 60s | `TTL_DETAIL` | Per-entity, less volatile |
| ML explanations | 120s | `TTL_ML` | Expensive to compute, rarely changes |
| Agent metadata | 300s | `TTL_METADATA` | Changes only on redeploy |

### Thread safety

Always use `threading.Lock()` — FastAPI serves requests concurrently via thread pool. The `backend_patterns.py` template includes a `_cache_lock` around all cache operations.

---

## 6. SSE Deduplication

**Template:** `templates/cortex_agent_service.py` (lines 473-514)

### Problem

Cortex Agent SSE streams may send cumulative text (each event contains the full text so far) rather than incremental deltas. Without deduplication, the frontend displays duplicated text.

### Solution

Track accumulated text server-side and emit only the new delta.

```python
accumulated_text = ""
last_text_len = 0

async for line in response.aiter_lines():
    if line.startswith("data: "):
        event = json.loads(line[6:])
        mapped = map_cortex_event(event)

        if mapped.get("event_type") == "text_delta":
            new_text = mapped.get("text", "")
            # Skip if duplicate
            if not new_text or accumulated_text.endswith(new_text):
                continue
            # Detect cumulative pattern: new_text starts with what we already have
            if new_text.startswith(accumulated_text) and len(new_text) > last_text_len:
                delta = new_text[last_text_len:]
                accumulated_text = new_text
                last_text_len = len(new_text)
                mapped["text"] = delta
            else:
                accumulated_text += new_text
                last_text_len = len(accumulated_text)

        yield f"data: {json.dumps(mapped)}\n\n"
```

### Detection logic

1. If `new_text` is empty or `accumulated_text` already ends with it → skip (duplicate)
2. If `new_text` starts with `accumulated_text` and is longer → cumulative mode, emit only the suffix
3. Otherwise → incremental mode, append and emit as-is

---

## 7. Frontend: Promise.all()

**Rule:** `rules/fetch-parallel.md`

### Problem

Sequential fetches create waterfalls. Each request waits for the previous one. A dashboard loading 5 endpoints sequentially at 300ms each takes 1500ms.

### Solution

Fire all independent fetches concurrently with `Promise.all()` or `Promise.allSettled()`.

```tsx
async function loadDashboard() {
  const results = await Promise.allSettled([
    fetch('/api/metrics').then(r => r.json()),
    fetch('/api/alerts').then(r => r.json()),
    fetch('/api/entities').then(r => r.json()),
    fetch('/api/history').then(r => r.json()),
  ]);

  return {
    metrics: results[0].status === 'fulfilled' ? results[0].value : null,
    alerts: results[1].status === 'fulfilled' ? results[1].value : null,
    entities: results[2].status === 'fulfilled' ? results[2].value : null,
    history: results[3].status === 'fulfilled' ? results[3].value : null,
  };
}
```

### When to use which

| Method | Use when |
|---|---|
| `Promise.all()` | All fetches are required — fail fast if any errors |
| `Promise.allSettled()` | Dashboard should render partial data on failures |

### Impact

| Before | After |
|---|---|
| 4 fetches × 300ms = 1200ms | max(300ms, 300ms, 300ms, 300ms) = 300ms |
| Waterfall (serial) | Parallel |

---

## 8. Frontend: Input Debouncing

### Problem

Sliders and filters that trigger API calls on every input event cause excessive requests. A time slider dragged across 50 positions fires 50 API calls.

### Solution

Debounce at 300ms using `useCallback` + `setTimeout`.

```tsx
function TimeSlider({ onChange }: { onChange: (range: TimeRange) => void }) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback((value: number[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange({ start: value[0], end: value[1] });
    }, 300);
  }, [onChange]);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return <input type="range" onChange={e => handleChange([Number(e.target.value)])} />;
}
```

### Standard debounce intervals

| Input type | Debounce | Rationale |
|---|---|---|
| Slider / range | 300ms | Dragging generates many events |
| Search / combobox | 300ms | Typing generates rapid events |
| Filter checkbox | 0ms (immediate) | Discrete action, no burst |
| Window resize | 150ms | Layout recalc is expensive |

---

## 9. Performance Budget

Every ISF solution must meet these targets:

| Metric | Target | Measurement |
|---|---|---|
| **Dashboard initial load** | < 1.5s | Time from navigation to all KPI cards rendered |
| **Agent response TTFB** | < 500ms | Time from send to first SSE event |
| **Detail bundle response** | < 300ms | Time from entity select to bundle API response |
| **Time to interactive** | < 2.0s | All click handlers registered, sidebar responsive |
| **Data refresh** | < 500ms | Time to update all visible metrics on poll/SSE |

### How to hit these targets

| Target | Key patterns |
|---|---|
| Initial load < 1.5s | `Promise.all()` for parallel fetches, connection pooling, TTL cache warm |
| Agent TTFB < 500ms | HTTP client reuse (skip TLS), token caching, agent pre-warming (`HEAD` request) |
| Detail bundle < 300ms | Single connection multi-query, server-side TTL cache |
| TTI < 2.0s | Code splitting, direct imports (`bundle-direct-imports` rule), minimal JS |
| Data refresh < 500ms | TTL cache hit, SSE deduplication, `data-updated` flash (no full re-render) |

### Pre-warming

The `AgentSidebarPanel` template fires a `HEAD` request to the agent endpoint on mount:

```tsx
useEffect(() => {
  fetch(agentEndpoint, { method: 'HEAD' }).catch(() => {});
}, [agentEndpoint]);
```

This warms the HTTP/2 connection and the agent's cold start before the user sends their first message.

---

## Cross-Reference Index

| Pattern | Template / Rule | Impact |
|---|---|---|
| Connection pooling | `templates/snowflake_conn.py`, `rules/sf-connection-pool.md` | 500-2000ms saved per connection |
| HTTP client reuse | `templates/cortex_agent_service.py`, `rules/sf-httpx-reuse.md` | 100-300ms saved per agent call |
| Token caching | `templates/cortex_agent_service.py` | Eliminates pool checkout per request |
| Detail bundles | `templates/backend_patterns.py` | N round-trips → 1 |
| Server TTL cache | `templates/backend_patterns.py`, `rules/sf-ttl-cache.md` | Eliminates redundant Snowflake queries |
| SSE deduplication | `templates/cortex_agent_service.py` | Prevents text duplication in chat |
| Promise.all() | `rules/fetch-parallel.md` | 2-10x page load improvement |
| Input debouncing | (inline pattern) | Prevents request storms |
