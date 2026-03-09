# Rule: Context Panel Updates from Chat

## Impact: HIGH - Critical for AI-powered dashboards

## Pattern

Pass context data from chat responses to update sidebar panels:

```tsx
// Parent component
function CommandCenter() {
  const [context, setContext] = useState<any>(null)
  
  const handleContextUpdate = (newContext: any) => {
    setContext(newContext)
  }
  
  return (
    <div className="flex">
      {/* Left: Live data */}
      <ParameterPanel />
      
      {/* Center: Chat with callback */}
      <Chat onContextUpdate={handleContextUpdate} />
      
      {/* Right: Context panel shows chat-derived data */}
      <ContextPanel context={context} />
    </div>
  )
}
```

## Chat Component

```tsx
function Chat({ onContextUpdate }: { onContextUpdate: (ctx: any) => void }) {
  const handleSend = async (message: string) => {
    const response = await fetch('/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    })
    const data = await response.json()
    
    // Update parent context with response data
    if (data.context) {
      onContextUpdate(data.context)
    }
    
    // Add message to chat history
    setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
  }
  
  // ...
}
```

## Backend Response Shape

```python
@router.post("/chat")
async def chat(message: ChatMessage):
    result = await orchestrator.process_message(message.message)
    
    return ChatResponse(
        response=result["response"],
        sources=result.get("sources", []),
        context=result.get("context", {}),  # Data for sidebar
        intent=result.get("intent")
    )
```

## Context Panel Rendering

```tsx
function ContextPanel({ context }: { context: any }) {
  if (!context || Object.keys(context).length === 0) {
    return <EmptyState message="Ask questions to see related data here" />
  }
  
  return (
    <div className="space-y-4">
      {context.query_results && (
        <Card>
          <h4>Query Results</h4>
          <DataTable data={context.query_results.results} />
        </Card>
      )}
      
      {context.ddr_results?.length > 0 && (
        <Card>
          <h4>Related Documents</h4>
          {context.ddr_results.map(doc => (
            <DocumentPreview key={doc.id} doc={doc} />
          ))}
        </Card>
      )}
      
      {context.recommendations?.length > 0 && (
        <Card>
          <h4>Recommendations</h4>
          <RecommendationList items={context.recommendations} />
        </Card>
      )}
    </div>
  )
}
```

## Why

- Provides visual context for AI responses
- Shows data sources and evidence
- Enables drill-down into results
- Creates a richer, more trustworthy AI experience
