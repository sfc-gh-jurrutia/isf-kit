---
title: Extract Expensive Work into Memoized Components
impact: MEDIUM
impactDescription: Enables early returns before computation
tags: rerender, memo, performance, optimization
---

## Extract Expensive Work into Memoized Components

Extract computationally expensive work into memoized child components to skip computation when parent state changes.

**Why it matters**: In React, components re-render when their parent re-renders. If expensive computation is inline, it runs every time—even when the result won't change. Memoized components only re-render when their props change.

**Incorrect (computes on every parent render):**

```tsx
function ChatPanel({ messages, isLoading, sidebarOpen }: Props) {
  // This runs every time sidebarOpen changes!
  const formattedMessages = messages.map(msg => ({
    ...msg,
    content: formatMarkdown(msg.content),  // Expensive
    timestamp: formatDate(msg.timestamp),
  }))

  if (isLoading) return <Skeleton />
  
  return (
    <div>
      {formattedMessages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  )
}
```

**Correct (memoized component skips unnecessary work):**

```tsx
import { memo, useMemo } from 'react'

const MessageList = memo(function MessageList({ messages }: { messages: Message[] }) {
  const formattedMessages = useMemo(() => 
    messages.map(msg => ({
      ...msg,
      content: formatMarkdown(msg.content),
      timestamp: formatDate(msg.timestamp),
    })),
    [messages]
  )

  return (
    <>
      {formattedMessages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </>
  )
})

function ChatPanel({ messages, isLoading, sidebarOpen }: Props) {
  if (isLoading) return <Skeleton />
  
  return (
    <div>
      <MessageList messages={messages} />
    </div>
  )
}
```

**Key insight**: Early return (`if (isLoading)`) now skips the expensive computation entirely, because `MessageList` isn't rendered.

**When to apply**:
- Large list rendering (>50 items)
- Complex data transformations
- Components with frequently changing siblings
- Charts and visualizations

**Common patterns:**

```tsx
// Memoize chart component
const SalesChart = memo(function SalesChart({ data }: { data: DataPoint[] }) {
  const chartData = useMemo(() => processChartData(data), [data])
  return <LineChart data={chartData} />
})

// Memoize table rows
const DataRow = memo(function DataRow({ row }: { row: RowData }) {
  return (
    <tr>
      {Object.values(row).map((cell, i) => <td key={i}>{cell}</td>)}
    </tr>
  )
})
```

**Note**: If your project has [React Compiler](https://react.dev/learn/react-compiler) enabled, manual memoization is typically unnecessary—the compiler handles it automatically.
