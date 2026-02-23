/**
 * SankeyChart - Flow visualization for journey/funnel analysis
 * 
 * Executive-grade Sankey diagram using Recharts.
 * Perfect for customer journeys, conversion funnels, data lineage.
 * 
 * Inspired by aura-marketing-guardian's JourneySankey patterns.
 * 
 * Features:
 * - Crisis/warning mode with threshold detection
 * - Dynamic node coloring by type
 * - Smooth gradient links
 * - TechnicalMetadata integration
 * - Hero mode for full-width display
 */

import React, { useMemo } from 'react';
import {
  Sankey,
  Tooltip,
  Rectangle,
  Layer,
  ResponsiveContainer,
} from 'recharts';
import { colors } from '../design-tokens';

// =============================================================================
// TYPES
// =============================================================================

export type SankeyNodeType = 'source' | 'channel' | 'conversion' | 'warning' | 'crisis' | 'default';

export interface SankeyNode {
  name: string;
  type?: SankeyNodeType;
  value?: number;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  type?: 'positive' | 'negative' | 'neutral';
}

export interface SankeyChartProps {
  /** Array of nodes */
  nodes: SankeyNode[];
  /** Array of links connecting nodes */
  links: SankeyLink[];
  /** Chart title */
  title?: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Height in pixels */
  height?: number;
  /** Enable crisis mode styling */
  crisisMode?: boolean;
  /** Node width in pixels */
  nodeWidth?: number;
  /** Gap between nodes */
  nodePadding?: number;
  /** Margin around chart */
  margin?: { top: number; right: number; bottom: number; left: number };
  /** Custom node colors by type */
  nodeColors?: Partial<Record<SankeyNodeType, string>>;
  /** Click handler for nodes */
  onNodeClick?: (node: SankeyNode, index: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Show loading skeleton */
  loading?: boolean;
}

// =============================================================================
// COLOR SYSTEM
// =============================================================================

const defaultNodeColors: Record<SankeyNodeType, string> = {
  source: colors.primary[500],     // Indigo - entry points
  channel: colors.primary[400],    // Indigo light - touchpoints
  conversion: colors.success.main, // Emerald - success outcomes
  warning: colors.warning.main,    // Amber - at-risk
  crisis: colors.error.main,       // Rose - critical
  default: colors.slate[400],      // Neutral
};

const linkColors = {
  positive: `rgba(16, 185, 129, 0.45)`,  // Emerald with opacity
  negative: `rgba(244, 63, 94, 0.5)`,     // Rose with opacity
  neutral: `rgba(100, 116, 139, 0.35)`,   // Slate with opacity
};

// Infer node type from name
function inferNodeType(name: string): SankeyNodeType {
  const lower = name.toLowerCase();
  
  if (lower.includes('crisis') || lower.includes('churn') || lower.includes('lost')) {
    return 'crisis';
  }
  if (lower.includes('abandon') || lower.includes('bounce') || lower.includes('risk')) {
    return 'warning';
  }
  if (lower.includes('purchase') || lower.includes('convert') || lower.includes('success') || lower.includes('won')) {
    return 'conversion';
  }
  if (lower.includes('organic') || lower.includes('paid') || lower.includes('referral') || lower.includes('direct')) {
    return 'source';
  }
  if (lower.includes('web') || lower.includes('email') || lower.includes('app') || lower.includes('mobile')) {
    return 'channel';
  }
  
  return 'default';
}

// Get node color
function getNodeColor(
  node: SankeyNode,
  nodeColors: Partial<Record<SankeyNodeType, string>>,
  crisisMode: boolean
): string {
  const type = node.type || inferNodeType(node.name);
  const mergedColors = { ...defaultNodeColors, ...nodeColors };
  
  // In crisis mode, conversion nodes turn red
  if (crisisMode && type === 'conversion') {
    return colors.error.main;
  }
  
  return mergedColors[type];
}

// Get link color based on target
function getLinkColor(
  targetNode: SankeyNode,
  crisisMode: boolean
): string {
  const type = targetNode.type || inferNodeType(targetNode.name);
  
  if (type === 'crisis' || type === 'warning') {
    return crisisMode ? linkColors.negative : linkColors.neutral;
  }
  if (type === 'conversion') {
    return crisisMode ? linkColors.negative : linkColors.positive;
  }
  
  return linkColors.neutral;
}

// =============================================================================
// CUSTOM NODE COMPONENT
// =============================================================================

interface CustomNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: SankeyNode & { depth?: number };
  nodeColors: Partial<Record<SankeyNodeType, string>>;
  crisisMode: boolean;
  onNodeClick?: (node: SankeyNode, index: number) => void;
  index: number;
}

const CustomNode: React.FC<CustomNodeProps> = ({
  x,
  y,
  width,
  height,
  payload,
  nodeColors,
  crisisMode,
  onNodeClick,
  index,
}) => {
  const color = getNodeColor(payload, nodeColors, crisisMode);
  const type = payload.type || inferNodeType(payload.name);
  const isHighlight = type === 'crisis' || type === 'conversion';
  
  return (
    <Layer>
      {/* Subtle glow for important nodes */}
      {isHighlight && (
        <rect
          x={x - 2}
          y={y - 2}
          width={width + 4}
          height={height + 4}
          fill={color}
          opacity={0.2}
          rx={6}
          ry={6}
        />
      )}
      
      {/* Main node */}
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        rx={4}
        ry={4}
        onClick={() => onNodeClick?.(payload, index)}
        style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
      />
      
      {/* Node label */}
      <text
        x={x + width + 8}
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="middle"
        className="fill-slate-700 text-xs font-medium"
        style={{ fontSize: 11 }}
      >
        {payload.name}
      </text>
    </Layer>
  );
};

// =============================================================================
// CUSTOM LINK COMPONENT
// =============================================================================

interface CustomLinkProps {
  sourceX: number;
  targetX: number;
  sourceY: number;
  targetY: number;
  sourceControlX: number;
  targetControlX: number;
  linkWidth: number;
  payload: {
    source: SankeyNode;
    target: SankeyNode;
    value: number;
  };
  crisisMode: boolean;
}

const CustomLink: React.FC<CustomLinkProps> = ({
  sourceX,
  targetX,
  sourceY,
  targetY,
  sourceControlX,
  targetControlX,
  linkWidth,
  payload,
  crisisMode,
}) => {
  const color = getLinkColor(payload.target, crisisMode);
  
  return (
    <Layer>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        fill="none"
        stroke={color}
        strokeWidth={linkWidth}
        strokeOpacity={0.6}
        style={{
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
        }}
      />
    </Layer>
  );
};

// =============================================================================
// TOOLTIP
// =============================================================================

interface TooltipPayload {
  payload?: {
    source?: SankeyNode;
    target?: SankeyNode;
    value?: number;
    name?: string;
  };
}

const CustomTooltip: React.FC<{ active?: boolean; payload?: TooltipPayload[] }> = ({
  active,
  payload,
}) => {
  if (!active || !payload?.[0]?.payload) return null;
  
  const data = payload[0].payload;
  
  // Link tooltip
  if (data.source && data.target) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-slate-900">
          {data.source.name} → {data.target.name}
        </p>
        <p className="text-lg font-bold text-indigo-600">
          {data.value?.toLocaleString()}
        </p>
      </div>
    );
  }
  
  // Node tooltip
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-slate-900">{data.name}</p>
    </div>
  );
};

// =============================================================================
// LOADING SKELETON
// =============================================================================

const SankeySkeleton: React.FC<{ height: number }> = ({ height }) => (
  <div className="relative" style={{ height }}>
    {/* Left nodes */}
    <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-around w-20">
      {[...Array(3)].map((_, i) => (
        <div
          key={`left-${i}`}
          className="h-12 bg-slate-200 rounded-lg animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
    
    {/* Center area */}
    <div className="absolute left-28 right-28 top-8 bottom-8">
      <svg className="w-full h-full" preserveAspectRatio="none">
        {[...Array(5)].map((_, i) => (
          <path
            key={i}
            d={`M 0 ${20 + i * 35} C 80 ${20 + i * 35}, 120 ${25 + i * 32}, 200 ${22 + i * 34}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
            className="animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </svg>
    </div>
    
    {/* Right nodes */}
    <div className="absolute right-4 top-0 bottom-0 flex flex-col justify-around w-20">
      {[...Array(4)].map((_, i) => (
        <div
          key={`right-${i}`}
          className="h-10 bg-slate-200 rounded-lg animate-pulse"
          style={{ animationDelay: `${i * 150 + 100}ms` }}
        />
      ))}
    </div>
    
    {/* Loading indicator */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
        <span className="text-sm text-slate-500">Loading flow data...</span>
      </div>
    </div>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SankeyChart({
  nodes,
  links,
  title,
  subtitle,
  height = 300,
  crisisMode = false,
  nodeWidth = 12,
  nodePadding = 24,
  margin = { top: 20, right: 140, bottom: 20, left: 20 },
  nodeColors = {},
  onNodeClick,
  className = '',
  loading = false,
}: SankeyChartProps) {
  // Transform data for Recharts
  const sankeyData = useMemo(() => ({
    nodes: nodes.map((node, i) => ({
      ...node,
      name: node.name,
    })),
    links: links.map((link) => ({
      source: link.source,
      target: link.target,
      value: link.value,
    })),
  }), [nodes, links]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${className}`}>
        {title && <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-slate-500 mb-4">{subtitle}</p>}
        <SankeySkeleton height={height} />
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-xl border shadow-sm p-6
        ${crisisMode ? 'border-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-slate-200'}
        ${className}
      `}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className={`text-lg font-semibold ${crisisMode ? 'text-rose-900' : 'text-slate-900'}`}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      )}
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <Sankey
          data={sankeyData}
          nodeWidth={nodeWidth}
          nodePadding={nodePadding}
          margin={margin}
          link={(props: any) => (
            <CustomLink {...props} crisisMode={crisisMode} />
          )}
          node={(props: any) => (
            <CustomNode
              {...props}
              nodeColors={nodeColors}
              crisisMode={crisisMode}
              onNodeClick={onNodeClick}
            />
          )}
        >
          <Tooltip content={<CustomTooltip />} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}

export default SankeyChart;
