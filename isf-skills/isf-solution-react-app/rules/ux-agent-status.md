# Rule: Agent Status Indicators

## Impact: MEDIUM - Improves AI transparency and trust

## Pattern

Show visual status indicators for background AI agents:

```tsx
interface AgentStatus {
  name: string
  icon: LucideIcon
  status: 'idle' | 'active' | 'processing'
  lastAction?: string
}

function AgentStatusBar({ agents }: { agents: AgentStatus[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-400'
      case 'processing': return 'bg-cyan-400 animate-pulse'
      default: return 'bg-slate-500'
    }
  }
  
  return (
    <div className="flex items-center gap-3">
      {agents.map((agent) => (
        <div 
          key={agent.name}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100"
          title={`${agent.name}: ${agent.lastAction || 'Ready'}`}
        >
          <agent.icon 
            size={14} 
            className={agent.status === 'active' ? 'text-emerald-500' : 'text-gray-400'} 
          />
          <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(agent.status)}`} />
        </div>
      ))}
    </div>
  )
}
```

## Usage Example

```tsx
function CommandCenter() {
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: 'Orchestrator', icon: Brain, status: 'idle', lastAction: 'Ready' },
    { name: 'Search', icon: Search, status: 'idle', lastAction: '1,000 docs indexed' },
    { name: 'Analyst', icon: Database, status: 'idle', lastAction: '6 tables available' },
    { name: 'Monitor', icon: Shield, status: 'active', lastAction: 'Watching...' },
  ])
  
  // Update status when processing
  const handleChatSend = async (message: string) => {
    setAgents(prev => prev.map(a => 
      a.name === 'Orchestrator' ? { ...a, status: 'processing' } : a
    ))
    
    const response = await sendMessage(message)
    
    setAgents(prev => prev.map(a => 
      a.name === 'Orchestrator' 
        ? { ...a, status: 'idle', lastAction: `Classified: ${response.intent}` } 
        : a
    ))
  }
  
  return (
    <header>
      <AgentStatusBar agents={agents} />
    </header>
  )
}
```

## Icon Suggestions

| Agent Type | Icon |
|------------|------|
| Orchestrator | Brain |
| Search/RAG | Search |
| SQL/Analytics | Database |
| Monitor/Watch | Shield |
| Recommend | Lightbulb |
| Generate | Sparkles |

## Why

- Transparency: Users see what AI is doing
- Trust: Activity indicators show system is working
- Debugging: Status helps identify stuck processes
- Engagement: Visual feedback keeps users informed
