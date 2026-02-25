---
title: Promise.all() for Independent API Calls
impact: CRITICAL
impactDescription: 2-10× improvement in page load
tags: fetch, parallelization, promises, waterfalls
---

## Promise.all() for Independent API Calls

When fetching data from multiple endpoints that don't depend on each other, execute them concurrently.

**Why it matters**: Sequential fetches create "waterfalls" where each request waits for the previous one to complete. This is especially costly when fetching from Snowflake APIs where each query may take 100-500ms.

**Incorrect (sequential, 3 round trips):**

```tsx
async function loadDashboard() {
  const metrics = await fetch('/api/metrics').then(r => r.json())
  const alerts = await fetch('/api/alerts').then(r => r.json())
  const history = await fetch('/api/history').then(r => r.json())
  
  return { metrics, alerts, history }
}
// Total time: ~1500ms (500ms × 3)
```

**Correct (parallel, 1 round trip):**

```tsx
async function loadDashboard() {
  const [metrics, alerts, history] = await Promise.all([
    fetch('/api/metrics').then(r => r.json()),
    fetch('/api/alerts').then(r => r.json()),
    fetch('/api/history').then(r => r.json()),
  ])
  
  return { metrics, alerts, history }
}
// Total time: ~500ms (slowest request)
```

**With error handling:**

```tsx
async function loadDashboard() {
  const results = await Promise.allSettled([
    fetch('/api/metrics').then(r => r.json()),
    fetch('/api/alerts').then(r => r.json()),
    fetch('/api/history').then(r => r.json()),
  ])
  
  return {
    metrics: results[0].status === 'fulfilled' ? results[0].value : null,
    alerts: results[1].status === 'fulfilled' ? results[1].value : null,
    history: results[2].status === 'fulfilled' ? results[2].value : null,
  }
}
```

**Snowflake-specific note**: When querying multiple Snowflake views, parallel execution leverages warehouse concurrency. Ensure your warehouse has adequate resources.
