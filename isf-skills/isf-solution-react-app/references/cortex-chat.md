# Cortex Agent Chat Widget

Full-featured React chat component for integrating with Snowflake Cortex Agents.

## Files

| Template | Location |
|----------|----------|
| `CortexAgentChat.tsx` | `templates/CortexAgentChat.tsx` |
| `cortex_agent_service.py` | `templates/cortex_agent_service.py` |

## Features

- **SSE Streaming**: Real-time response streaming from Cortex Agent
- **Multi-stage Thinking Indicators**: Shows classifying → searching → analyzing → generating states
- **Tool Call Visualization**: Displays Analyst SQL queries and Search results
- **Source Citations**: Shows referenced documents with relevance scores
- **Thread Management**: Maintains conversation context across messages
- **Typing Animation**: Smooth word-by-word text reveal
- **Suggested Questions**: Clickable prompts for common queries
- **Copy & Retry**: Copy responses, retry failed messages
- **Error Handling**: Graceful error states with retry options
- **Accessibility**: Full keyboard navigation, aria-labels, focus management

## Quick Start

### 1. Copy templates to your project

```bash
cp ~/.snowflake/cortex/skills/snowflake-demo-react-app/templates/CortexAgentChat.tsx src/ui/src/components/
cp ~/.snowflake/cortex/skills/snowflake-demo-react-app/templates/cortex_agent_service.py api/app/
```

### 2. Set environment variables

```bash
export SNOWFLAKE_ACCOUNT_URL=https://your-account.snowflakecomputing.com
export SNOWFLAKE_PAT=your-personal-access-token
export CORTEX_AGENT_DATABASE=MYDB
export CORTEX_AGENT_SCHEMA=MYSCHEMA
export CORTEX_AGENT_PERSONA_OPERATIONAL=MY_SOLUTION_OPERATIONAL_AGENT
# Optional single-persona fallback only:
# export CORTEX_AGENT_NAME=MY_AGENT
```

### 3. Include router in FastAPI

```python
from app.cortex_agent_service import router as agent_router
app.include_router(agent_router, prefix="/api/agent")
```

### 4. Use in React

```tsx
import { CortexAgentChat } from './components/CortexAgentChat'

function App() {
  return (
    <CortexAgentChat 
      agentEndpoint="/api/agent/run"
      agentName="My Assistant"
      welcomeMessage="Hello! I can help you analyze your data."
      suggestedQuestions={[
        { text: "What were the top sales?", icon: "📊" },
        { text: "Show me recent trends", icon: "📈" },
      ]}
      onContextUpdate={(ctx) => {
        console.log(ctx.sources, ctx.toolCalls)
      }}
    />
  )
}
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `agentEndpoint` | string | required | Backend API endpoint |
| `agentName` | string | "AI Assistant" | Display name in header |
| `agentDescription` | string | "Powered by Snowflake Cortex" | Subtitle text |
| `welcomeMessage` | string | undefined | Initial assistant message |
| `suggestedQuestions` | `{ text: string; icon?: string }[]` | [] | Clickable question chips |
| `onContextUpdate` | `(ctx: any) => void` | undefined | Callback when agent returns context |
| `showToolCalls` | boolean | true | Show/hide tool execution details |
| `showSources` | boolean | true | Show/hide source citations |
| `maxHeight` | string | "h-full" | Container height class |
| `className` | string | "" | Additional CSS classes |

## Backend Endpoints

The `cortex_agent_service.py` provides:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/threads` | POST | Create conversation thread |
| `/api/agent/chat` | POST | Non-streaming chat |
| `/api/agent/run` | POST | SSE streaming chat |
| `/api/agent/health` | GET | Health check |

## Customization

### Thinking Stages

Customize in the `AIThinking` component:

```tsx
const stages = {
  classifying: { icon: Brain, text: 'Understanding...', color: 'purple' },
  searching: { icon: Search, text: 'Searching docs...', color: 'green' },
  analyzing: { icon: Database, text: 'Running query...', color: 'blue' },
  generating: { icon: Sparkles, text: 'Writing response...', color: 'cyan' },
}
```

### Message Formatting

Supports basic markdown:
- `**bold**` → bold text
- `` `code` `` → inline code
- `• bullets` → styled bullets
- Newlines → line breaks

### Custom Theme

Override CSS variables or Tailwind classes:

```css
.cortex-chat {
  --chat-bg: var(--navy-800);
  --chat-border: var(--navy-700);
  --chat-accent: var(--accent-blue);
}
```

## Accessibility Features

The chat widget includes:

- `aria-live="polite"` for new messages
- `aria-label` on all icon buttons
- `role="log"` for message container
- Keyboard navigation (Enter to send, Escape to clear)
- Focus management after message send
- Screen reader announcements for loading states

## Performance Considerations

Following skill rules:

- `bundle-dynamic-chat` - Lazy load the chat widget
- `render-memo-expensive` - MessageBubble and AIThinking are memoized
- `fetch-streaming` - Uses SSE for efficient streaming
- `fetch-abort` - Cancels stale requests on unmount

### Lazy Loading Example

```tsx
import { lazy, Suspense } from 'react'

const CortexAgentChat = lazy(() => import('./components/CortexAgentChat'))

function ChatPanel() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <CortexAgentChat agentEndpoint="/api/agent/run" />
    </Suspense>
  )
}
```

## Error Handling

The component handles:

- Network errors with retry option
- SSE connection failures with fallback to non-streaming
- Thread creation failures
- Invalid response formats
- Rate limiting (429 status)

## Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CortexAgentChat } from './CortexAgentChat'

test('sends message and displays response', async () => {
  render(<CortexAgentChat agentEndpoint="/api/agent/run" />)
  
  const input = screen.getByPlaceholderText(/ask/i)
  fireEvent.change(input, { target: { value: 'Hello' } })
  fireEvent.submit(input.closest('form')!)
  
  await waitFor(() => {
    expect(screen.getByText(/hello/i)).toBeInTheDocument()
  })
})
```
