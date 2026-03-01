# React Flow DAG Visualization

Pattern for workflow/pipeline DAG visualization using React Flow. Use for orchestration UIs, data lineage views, or any directed graph visualization.

## Dependencies

```bash
npm install @xyflow/react
```

**CRITICAL**: The package moved from `reactflow` to `@xyflow/react`. Use the new import path.

## Custom Task Node

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

interface TaskNodeData {
  label: string
  status: TaskStatus
  duration?: string
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  pending:   'bg-slate-700 border-slate-500',
  running:   'bg-blue-900 border-blue-400 animate-pulse',
  completed: 'bg-emerald-900 border-emerald-400',
  failed:    'bg-red-900 border-red-400',
  skipped:   'bg-slate-800 border-slate-600 opacity-50',
}

const STATUS_ICONS: Record<TaskStatus, string> = {
  pending: '○', running: '◉', completed: '✓', failed: '✗', skipped: '—',
}

export function TaskNode({ data }: NodeProps) {
  const nodeData = data as TaskNodeData
  return (
    <div className={`px-4 py-2 rounded-lg border-2 min-w-[160px] ${STATUS_STYLES[nodeData.status]}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <span>{STATUS_ICONS[nodeData.status]}</span>
        <span className="text-sm font-medium text-white">{nodeData.label}</span>
      </div>
      {nodeData.duration && (
        <div className="text-xs text-slate-400 mt-1">{nodeData.duration}</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

## Workflow Graph Component

```tsx
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TaskNode } from './TaskNode'

const nodeTypes = { task: TaskNode }

interface WorkflowGraphProps {
  nodes: Node[]
  edges: Edge[]
}

export function WorkflowGraph({ nodes, edges }: WorkflowGraphProps) {
  return (
    <div className="h-[500px] w-full bg-slate-900 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#64748b' },
        }}
      >
        <Background color="#334155" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
```

## Building Nodes and Edges from API Data

```typescript
interface WorkflowStep {
  id: string
  name: string
  status: TaskStatus
  depends_on: string[]
  duration?: string
}

function buildGraph(steps: WorkflowStep[]): { nodes: Node[]; edges: Edge[] } {
  const levelMap = new Map<string, number>()

  function getLevel(stepId: string): number {
    if (levelMap.has(stepId)) return levelMap.get(stepId)!
    const step = steps.find(s => s.id === stepId)
    if (!step || step.depends_on.length === 0) {
      levelMap.set(stepId, 0)
      return 0
    }
    const level = Math.max(...step.depends_on.map(getLevel)) + 1
    levelMap.set(stepId, level)
    return level
  }

  steps.forEach(s => getLevel(s.id))

  const nodes: Node[] = steps.map((step, i) => ({
    id: step.id,
    type: 'task',
    position: { x: (i % 3) * 250, y: (levelMap.get(step.id) || 0) * 120 },
    data: { label: step.name, status: step.status, duration: step.duration },
  }))

  const edges: Edge[] = steps.flatMap(step =>
    step.depends_on.map(dep => ({
      id: `${dep}-${step.id}`,
      source: dep,
      target: step.id,
    }))
  )

  return { nodes, edges }
}
```

## Live Status Updates via WebSocket

Combine with `useWebSocket` from `references/websocket-pattern.md`:

```tsx
function WorkflowMonitor({ workflowId }: { workflowId: string }) {
  const { data } = useWebSocket<WorkflowStep[]>({
    url: `ws://${window.location.host}/ws/workflow/${workflowId}`,
  })

  const { nodes, edges } = useMemo(
    () => buildGraph(data || []),
    [data]
  )

  return <WorkflowGraph nodes={nodes} edges={edges} />
}
```

## Critical Patterns

| Pattern | Requirement | Reason |
|---------|-------------|--------|
| `nodeTypes` defined outside render | Required | Prevents re-registration on every render |
| `fitView` prop | Recommended | Auto-centers graph on data change |
| No CSS transforms on parent | Required | React Flow uses its own transform layer; parent transforms break panning |
| `proOptions.hideAttribution` | Optional | Removes watermark for production |
| `@xyflow/react` import | Required | Old `reactflow` package is deprecated |
