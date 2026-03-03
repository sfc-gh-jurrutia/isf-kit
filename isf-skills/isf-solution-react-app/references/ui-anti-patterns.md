# UI Anti-Patterns

Patterns that signal generic, low-quality UI. Never generate these. Check every ISF solution against this list during implementation and review.

Sourced from [ui-design-brain](https://github.com/carmahhawwari/ui-design-brain) and extended with ISF-specific anti-patterns.

---

## Generic UI Anti-Patterns

These apply to any web application and are the most common ways AI-generated UIs fall short of production quality.

| # | Anti-Pattern | Why It's Bad | Do This Instead |
|---|-------------|-------------|-----------------|
| 1 | **Rainbow badges** -- every status a different bright color with no semantic meaning | Creates visual noise; users can't learn the color system | Map badge colors to a limited semantic palette: success (green), warning (amber), danger (red), info (blue), neutral (gray) |
| 2 | **Modal inside modal** | Confusing layering, broken focus trapping, escape-key ambiguity | Use a page or drawer for complex flows that need nested content |
| 3 | **Disabled submit with no explanation** | Users don't know what's missing or broken | Always show inline validation errors indicating what needs fixing |
| 4 | **Spinner for predictable layouts** | Layout shift when content appears; spinner gives no sense of shape | Use skeleton screens matching the actual content layout (shimmer animation) |
| 5 | **"Click here" links** | Meaningless to screen readers; poor scannability | Link text must describe the destination: "View documentation", not "Click here" |
| 6 | **Hamburger menu on desktop** | Hides navigation when there's plenty of space to show it | Use visible horizontal or sidebar navigation on desktop; hamburger for mobile only |
| 7 | **Auto-advancing carousels** | Low engagement; users lose control of pacing | Let users control navigation with arrows/dots; pause on hover/focus |
| 8 | **Placeholder-only form fields** | Placeholder disappears on focus; users forget what the field is for | Always use visible labels above inputs; placeholder is a format hint, never a label replacement |
| 9 | **Equal-weight buttons** | No visual hierarchy; users don't know which action is primary | Establish primary/secondary/tertiary hierarchy with fill, outline, and text-only variants |
| 10 | **Tiny text (< 12 px)** | Unreadable on mobile; fails accessibility standards | Body text minimum 14 px, prefer 16 px; labels can be 12-13 px |

---

## ISF-Specific Anti-Patterns

These are additional anti-patterns specific to ISF solutions and Snowflake copilot applications.

| # | Anti-Pattern | Why It's Bad | Do This Instead |
|---|-------------|-------------|-----------------|
| 11 | **Non-clickable metrics** | Dashboard becomes view-only; no bridge between data and AI agent | Every metric, table cell, and chart element must have click-to-ask wired (`setPendingPrompt`) |
| 12 | **New Snowflake connection per request** | 200-400ms handshake overhead on every API call | Use the connection pool from `snowflake_conn.py` template (8 connections, thread-safe) |
| 13 | **New httpx client per request** | Wasted TLS handshakes and TCP connections | Use a persistent `httpx.AsyncClient` with FastAPI lifespan cleanup |
| 14 | **Full-page spinner on data load** | No sense of layout; jarring content shift when data arrives | Use `DataState` wrapper with shimmer loading that matches the final layout shape |
| 15 | **Hardcoded hex colors in components** | Theme switching breaks; no visual consistency | Always use `var()` token references from `tokens.css` |
| 16 | **Agent sidebar as a fixed-width panel** | Wastes space or feels cramped depending on screen size | Use resizable `AgentSidebarPanel` with drag handle (min 350px, max 600px) |
| 17 | **No loading state during agent streaming** | Users think the app is broken while waiting for a response | Use `AIThinking` component with multi-stage progress during streaming |
| 18 | **Cumulative text duplicates in SSE** | Agent responses show repeated text chunks | Use SSE dedup logic in `cortex_agent_service.py` (accumulated_text tracking) |
| 19 | **Sequential API calls on page load** | Dashboard loads in 3-5 seconds instead of 1-2 | Use `Promise.all()` or `Promise.allSettled()` for parallel frontend fetches |
| 20 | **No data lineage access** | Users can't understand where metrics come from or trust the data | Include `DataLineageModal` accessible from the dashboard header or a dedicated button |
| 21 | **Chat-only copilot layout** | An AI copilot app that is just a chat window with sidebar navigation. Wastes the entire data pipeline, ML models, and Cortex investment. Users get no data visibility. | Copilot apps MUST show data alongside the chat. Use the **CommandCenter** page template (`references/page-templates.md`) with KPI strip, data table, detail section, and agent sidebar. The chat is a *companion* to the data, not the whole app. Even Knowledge Assistant layouts require a context panel showing query results and sources. |

---

## Quick Checklist

During code review, verify none of these patterns exist:

- [ ] No rainbow badges (limited semantic palette only)
- [ ] No nested modals (use drawers or pages for complex flows)
- [ ] No disabled buttons without explanation
- [ ] Skeleton screens for all loading states (not spinners)
- [ ] All link text is descriptive
- [ ] Desktop navigation is visible (no unnecessary hamburger)
- [ ] No auto-advancing carousels
- [ ] All form fields have visible labels
- [ ] Clear button hierarchy (primary/secondary/ghost)
- [ ] Body text >= 14 px
- [ ] Every metric has click-to-ask
- [ ] Connection pool used (never per-request)
- [ ] Persistent httpx client
- [ ] Theme tokens used (no hardcoded colors)
- [ ] Agent sidebar is resizable
- [ ] AI thinking animation during streaming
- [ ] Parallel API fetches on page load
- [ ] Data lineage accessible
- [ ] No chat-only copilot layouts (data visible alongside chat; page template enforced)
