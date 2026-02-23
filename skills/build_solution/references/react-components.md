# React Component Library Reference

> Load this reference during Step 2 (Generate Specification) when the solution includes a React-based frontend.

## Component Library v2.1

### Core Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `CortexConversation` | Full chat container with message list and input | `agentName`, `database`, `schema`, `initialMessages` |
| `CortexMessage` | Individual message bubble (user or assistant) | `role`, `content`, `toolResults` |
| `CortexTool` | Tool invocation display with expandable details | `toolName`, `toolInput`, `toolOutput`, `status` |
| `CortexSources` | Citation/source display from search results | `sources`, `maxDisplay` |
| `CortexReasoning` | Expandable reasoning/thinking display | `reasoning`, `defaultExpanded` |
| `CortexPromptInput` | Text input with send button and suggestions | `onSubmit`, `placeholder`, `suggestions`, `disabled` |

### Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useCortexAgent` | Manages agent connection, streaming, message state | `{ messages, sendMessage, isStreaming, error, reset }` |
| `useAutoScroll` | Auto-scroll to latest message | `{ scrollRef, scrollToBottom }` |

### Usage Pattern

```tsx
import {
  CortexConversation,
  CortexPromptInput,
  useCortexAgent,
  useAutoScroll
} from '@snowflake/cortex-react';

function AgentChat() {
  const { messages, sendMessage, isStreaming } = useCortexAgent({
    agentName: 'MY_AGENT',
    database: 'MY_DB',
    schema: 'MY_SCHEMA',
  });
  const { scrollRef } = useAutoScroll(messages);

  return (
    <div ref={scrollRef}>
      <CortexConversation messages={messages} />
      <CortexPromptInput
        onSubmit={sendMessage}
        disabled={isStreaming}
        suggestions={['Show me revenue trends', 'Which products are at risk?']}
      />
    </div>
  );
}
```

## Rule Categories

When specifying a React frontend, the spec must address these categories:

### 1. Architecture Rules
- **Connection pattern**: `SNOWFLAKE_CONNECTION_NAME` environment variable
- **State management**: Use React hooks, avoid external state libraries for solutions
- **Routing**: React Router for multi-page solutions, single page for simple agents

### 2. Component Rules
- Use library components for Cortex interactions (don't rebuild chat UI)
- Custom components only for domain-specific visualizations
- All components must handle loading, error, and empty states

### 3. Styling Rules
- Snowflake Design System tokens for colors, spacing, typography
- CSS Modules or Tailwind — no inline styles except dynamic values
- Responsive breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)

### 4. Data Rules
- SSE streaming for agent responses (not polling)
- Client-side caching for repeated analyst queries
- Pagination for large result sets (50 rows default)

### 5. Security Rules
- Token-based auth via Snowflake session
- No secrets in client-side code
- Input sanitization on all user text before sending to agent

### 6. CSP-Blocked Libraries

These libraries are blocked by Snowflake's Content Security Policy and **must not be used**:

| Blocked | Alternative |
|---------|------------|
| D3.js | Recharts, Nivo, or Snowflake chart components |
| Leaflet | PyDeck with `map_style=None` |
| Plotly Geo | PyDeck with `map_style=None` |
| MapboxGL | PyDeck with `map_style=None` |
| Any CDN-loaded library | Bundle all dependencies locally |

### 7. SSE Event Handling

```tsx
// Handle different event types from agent stream
function handleEvent(event: AgentEvent) {
  switch (event.type) {
    case 'text':
      appendToCurrentMessage(event.data.text);
      break;
    case 'tool_result':
      addToolResult(event.data);
      break;
    case 'analyst_result':
      renderQueryResult(event.data.query, event.data.data, event.data.columns);
      break;
    case 'error':
      showError(event.data.message);
      break;
    case 'done':
      finalizeMessage();
      break;
  }
}
```

## Spec Output Mapping

When specifying React components in the solution spec, map each feature to components:

| Feature | Components | Hook |
|---------|-----------|------|
| Chat with agent | `CortexConversation`, `CortexPromptInput` | `useCortexAgent` |
| SQL query results | `CortexTool` (analyst_result) | — |
| Document search | `CortexSources` | — |
| Reasoning display | `CortexReasoning` | — |
| Auto-scroll chat | — | `useAutoScroll` |
| Custom dashboard | Domain components + library components | `useCortexAgent` |

## Production Patterns

For implementation-time patterns (race conditions, SSE buffer management,
multi-agent orchestration, fallback strategies, chart consistency), load
`references/react-production-patterns.md`.

That document covers:
- Race condition prevention with useRef guards and AbortController
- SSE buffer management for split-chunk handling
- Context injection for contextual AI responses
- Zustand chat state management
- Multi-agent intent classification and routing
- Cortex service integration (Search, Analyst, Complete)
- Fallback query patterns (3-tier)
- Chart color consistency across components

## React Frontend Checklist

Before finalizing React components in spec:

- [ ] All Cortex interactions use library components (not custom chat UI)
- [ ] SSE event types handled: text, tool_result, analyst_result, error, done
- [ ] No CSP-blocked libraries (D3, Leaflet, Plotly Geo, Mapbox)
- [ ] Connection uses `SNOWFLAKE_CONNECTION_NAME` env var
- [ ] Loading, error, and empty states defined for all components
- [ ] Suggested prompts defined for initial user guidance
- [ ] HTTP client uses `httpx` (Python) or native fetch with SSE (JavaScript)
- [ ] All dependencies bundled (no CDN references)
