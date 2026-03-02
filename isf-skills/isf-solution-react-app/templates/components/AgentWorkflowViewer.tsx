import React, { useState, useEffect, useCallback, memo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  Position,
  Handle,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentMetadata {
  name: string;
  description: string;
  model: string;
  tools: Array<{ name: string; type: string; description?: string }>;
  dataSources: Array<{ name: string; schema: string; type: string }>;
  routingStrategy?: string;
}

interface AgentWorkflowViewerProps {
  metadataEndpoint?: string;
  className?: string;
}

type ViewTab = 'flowchart' | 'lineage' | 'cards' | 'infographic';

// ---------------------------------------------------------------------------
// Custom ReactFlow Nodes
// ---------------------------------------------------------------------------

const QuestionNode = memo(({ data }: { data: { label: string } }) => (
  <div
    className="dashboard-card"
    style={{
      padding: '12px 20px',
      borderRadius: 12,
      border: '2px solid var(--snowflake-blue, #29B5E8)',
      background: 'var(--bg-card, rgba(15,23,42,0.6))',
      color: 'var(--text-primary)',
      minWidth: 140,
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: 18, marginBottom: 4 }}>💬</div>
    <div style={{ fontWeight: 600, fontSize: 13 }}>{data.label}</div>
    <Handle type="source" position={Position.Bottom} style={{ background: '#29B5E8' }} />
  </div>
));
QuestionNode.displayName = 'QuestionNode';

const OrchestratorNode = memo(({ data }: { data: { label: string; model?: string } }) => (
  <div
    className="dashboard-card"
    style={{
      padding: '14px 24px',
      borderRadius: 14,
      border: '2px solid transparent',
      backgroundClip: 'padding-box',
      background: 'var(--bg-elevated, #0a0f18)',
      boxShadow: '0 0 0 2px var(--snowflake-blue, #29B5E8), 0 0 24px rgba(41,181,232,0.15)',
      color: 'var(--text-primary)',
      minWidth: 160,
      textAlign: 'center',
    }}
  >
    <Handle type="target" position={Position.Top} style={{ background: '#29B5E8' }} />
    <div style={{ fontSize: 20, marginBottom: 4 }}>🧠</div>
    <div style={{ fontWeight: 700, fontSize: 14 }}>{data.label}</div>
    {data.model && (
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{data.model}</div>
    )}
    <Handle type="source" position={Position.Bottom} style={{ background: '#29B5E8' }} />
  </div>
));
OrchestratorNode.displayName = 'OrchestratorNode';

const toolColors: Record<string, string> = {
  analyst: '#3b82f6',
  cortex_analyst: '#3b82f6',
  search: '#22c55e',
  cortex_search: '#22c55e',
  custom: '#8b5cf6',
};

function resolveToolColor(type: string): string {
  const key = type.toLowerCase();
  return toolColors[key] ?? toolColors.custom;
}

const ToolNode = memo(({ data }: { data: { label: string; toolType: string; description?: string } }) => {
  const color = resolveToolColor(data.toolType);
  return (
    <div
      className="dashboard-card"
      style={{
        padding: '10px 16px',
        borderRadius: 10,
        border: `1.5px solid ${color}`,
        background: 'var(--bg-card, rgba(15,23,42,0.6))',
        color: 'var(--text-primary)',
        minWidth: 120,
        textAlign: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <div style={{ fontWeight: 600, fontSize: 12 }}>{data.label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{data.toolType}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
});
ToolNode.displayName = 'ToolNode';

const ResponseNode = memo(({ data }: { data: { label: string } }) => (
  <div
    className="dashboard-card"
    style={{
      padding: '12px 20px',
      borderRadius: 12,
      border: '2px solid var(--status-success, #22c55e)',
      background: 'var(--bg-card, rgba(15,23,42,0.6))',
      color: 'var(--text-primary)',
      minWidth: 140,
      textAlign: 'center',
    }}
  >
    <Handle type="target" position={Position.Top} style={{ background: '#22c55e' }} />
    <div style={{ fontSize: 18, marginBottom: 4 }}>✅</div>
    <div style={{ fontWeight: 600, fontSize: 13 }}>{data.label}</div>
  </div>
));
ResponseNode.displayName = 'ResponseNode';

const LayerNode = memo(({ data }: { data: { label: string; count: number } }) => (
  <div
    className="dashboard-card"
    style={{
      padding: '14px 24px',
      borderRadius: 10,
      border: '1.5px solid var(--border-strong, rgba(255,255,255,0.15))',
      background: 'var(--bg-elevated, #0a0f18)',
      color: 'var(--text-primary)',
      minWidth: 140,
      textAlign: 'center',
    }}
  >
    <Handle type="target" position={Position.Left} style={{ background: 'var(--snowflake-blue)' }} />
    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{data.label}</div>
    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
      {data.count} {data.count === 1 ? 'item' : 'items'}
    </div>
    <Handle type="source" position={Position.Right} style={{ background: 'var(--snowflake-blue)' }} />
  </div>
));
LayerNode.displayName = 'LayerNode';

const nodeTypes = {
  question: QuestionNode,
  orchestrator: OrchestratorNode,
  tool: ToolNode,
  response: ResponseNode,
  layer: LayerNode,
};

// ---------------------------------------------------------------------------
// Graph Builders
// ---------------------------------------------------------------------------

function buildFlowchartGraph(meta: AgentMetadata): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: 'question',
    type: 'question',
    position: { x: 250, y: 0 },
    data: { label: 'User Question' },
  });

  nodes.push({
    id: 'orchestrator',
    type: 'orchestrator',
    position: { x: 225, y: 120 },
    data: { label: meta.name, model: meta.model },
  });

  edges.push({
    id: 'e-q-o',
    source: 'question',
    target: 'orchestrator',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#29B5E8' },
  });

  const toolCount = meta.tools.length;
  const spacing = 180;
  const startX = 250 - ((toolCount - 1) * spacing) / 2;

  meta.tools.forEach((tool, i) => {
    const id = `tool-${i}`;
    nodes.push({
      id,
      type: 'tool',
      position: { x: startX + i * spacing, y: 280 },
      data: { label: tool.name, toolType: tool.type, description: tool.description },
    });
    edges.push({
      id: `e-o-${id}`,
      source: 'orchestrator',
      target: id,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: resolveToolColor(tool.type) },
    });
    edges.push({
      id: `e-${id}-r`,
      source: id,
      target: 'response',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#22c55e', opacity: 0.5 },
    });
  });

  nodes.push({
    id: 'response',
    type: 'response',
    position: { x: 250, y: 430 },
    data: { label: 'Response' },
  });

  return { nodes, edges };
}

function buildLineageGraph(meta: AgentMetadata): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const schemas = new Map<string, number>();
  meta.dataSources.forEach((ds) => {
    schemas.set(ds.schema, (schemas.get(ds.schema) || 0) + 1);
  });

  const layers = [
    { id: 'sources', label: 'Sources', count: meta.dataSources.length },
    { id: 'raw', label: 'RAW', count: meta.dataSources.length },
    { id: 'atomic', label: 'ATOMIC', count: schemas.size },
    { id: 'data_mart', label: 'DATA_MART', count: schemas.size },
    { id: 'agent', label: meta.name, count: meta.tools.length },
    { id: 'user', label: 'User', count: 1 },
  ];

  const ySpacing = 100;
  const startY = 0;

  layers.forEach((layer, i) => {
    nodes.push({
      id: layer.id,
      type: 'layer',
      position: { x: i * 200, y: startY + (i % 2 === 0 ? 0 : ySpacing * 0.3) },
      data: { label: layer.label, count: layer.count },
    });
    if (i > 0) {
      edges.push({
        id: `e-${layers[i - 1].id}-${layer.id}`,
        source: layers[i - 1].id,
        target: layer.id,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#29B5E8' },
      });
    }
  });

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Sub-views
// ---------------------------------------------------------------------------

function FlowchartView({ meta }: { meta: AgentMetadata }) {
  const { nodes, edges } = buildFlowchartGraph(meta);
  return (
    <div style={{ width: '100%', height: 520 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} color="var(--border-subtle, rgba(255,255,255,0.08))" />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function LineageView({ meta }: { meta: AgentMetadata }) {
  const { nodes, edges } = buildLineageGraph(meta);
  return (
    <div style={{ width: '100%', height: 340 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} color="var(--border-subtle, rgba(255,255,255,0.08))" />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function CardsView({ meta }: { meta: AgentMetadata }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {meta.tools.map((tool, i) => {
        const color = resolveToolColor(tool.type);
        return (
          <div
            key={i}
            className="dashboard-card"
            style={{
              padding: 16,
              borderRadius: 12,
              border: `1px solid var(--border-subtle)`,
              background: 'var(--bg-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{tool.name}</span>
              <span
                className="theme-badge"
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: `${color}22`,
                  color,
                  fontWeight: 600,
                }}
              >
                {tool.type}
              </span>
            </div>
            {tool.description && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {tool.description}
              </p>
            )}
            <div style={{ marginTop: 10 }}>
              <span
                className="theme-badge"
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(34,197,94,0.15)',
                  color: 'var(--status-success)',
                  fontWeight: 600,
                }}
              >
                Active
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfographicView({ meta }: { meta: AgentMetadata }) {
  const stats = [
    { label: 'Tools', value: meta.tools.length },
    { label: 'Data Sources', value: meta.dataSources.length },
    { label: 'Model', value: meta.model },
    { label: 'Routing', value: meta.routingStrategy ?? 'default' },
  ];

  const steps = [
    'User submits a question through the interface.',
    `The orchestrator (${meta.name}) classifies the intent.`,
    'Relevant tools are selected based on routing strategy.',
    'Each tool retrieves or analyzes the required data.',
    'Results are synthesized into a coherent response.',
    'The answer is returned to the user.',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {stats.map((s, i) => (
          <div
            key={i}
            className="dashboard-card"
            style={{
              padding: 14,
              borderRadius: 10,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--snowflake-blue)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div
        className="dashboard-card"
        style={{
          padding: 20,
          borderRadius: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          How It Works
        </h3>
        <ol style={{ margin: 0, paddingLeft: 20, listStyleType: 'decimal' }}>
          {steps.map((step, i) => (
            <li
              key={i}
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: 4,
              }}
            >
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Capabilities */}
      <div
        className="dashboard-card"
        style={{
          padding: 20,
          borderRadius: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          Capabilities
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {meta.tools.map((tool, i) => (
            <span
              key={i}
              className="theme-badge"
              style={{
                fontSize: 11,
                padding: '4px 12px',
                borderRadius: 999,
                background: `${resolveToolColor(tool.type)}22`,
                color: resolveToolColor(tool.type),
                fontWeight: 600,
              }}
            >
              {tool.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading / Error States
// ---------------------------------------------------------------------------

function LoadingShimmer() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
      {[260, 200, 180].map((w, i) => (
        <div
          key={i}
          style={{
            width: w,
            height: 20,
            borderRadius: 6,
            background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card) 50%, var(--bg-elevated) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        padding: 32,
        textAlign: 'center',
        color: 'var(--status-danger, #f43f5e)',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <p style={{ fontSize: 14, marginBottom: 16 }}>{message}</p>
      <button
        onClick={onRetry}
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          border: '1px solid var(--status-danger)',
          background: 'transparent',
          color: 'var(--status-danger)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        Retry
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const TAB_LABELS: Record<ViewTab, string> = {
  flowchart: 'Flowchart',
  lineage: 'Lineage',
  cards: 'Cards',
  infographic: 'Infographic',
};

export default function AgentWorkflowViewer({
  metadataEndpoint = '/api/agent/metadata',
  className,
}: AgentWorkflowViewerProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('flowchart');
  const [metadata, setMetadata] = useState<AgentMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(metadataEndpoint);
      if (!res.ok) throw new Error(`Failed to load metadata (${res.status})`);
      const data: AgentMetadata = await res.json();
      setMetadata(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [metadataEndpoint]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return (
    <div
      className={clsx('dashboard-card', className)}
      style={{
        borderRadius: 16,
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
        }}
      >
        {(Object.keys(TAB_LABELS) as ViewTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === tab ? 'var(--snowflake-blue)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid var(--snowflake-blue)' : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 20, minHeight: 300 }}>
        {loading && <LoadingShimmer />}
        {error && <ErrorState message={error} onRetry={fetchMetadata} />}
        {metadata && !loading && !error && (
          <>
            {activeTab === 'flowchart' && <FlowchartView meta={metadata} />}
            {activeTab === 'lineage' && <LineageView meta={metadata} />}
            {activeTab === 'cards' && <CardsView meta={metadata} />}
            {activeTab === 'infographic' && <InfographicView meta={metadata} />}
          </>
        )}
      </div>
    </div>
  );
}

export type { AgentWorkflowViewerProps, AgentMetadata };
