/**
 * NetworkGraph - Force-directed graph for relationship visualization
 * 
 * Executive-grade network visualization using D3 force simulation.
 * Perfect for entity relationships, influence mapping, dependency analysis.
 * 
 * Features:
 * - Force-directed layout with collision detection
 * - Node sizing by importance/value
 * - Edge strength visualization
 * - Interactive hover states
 * - Category-based coloring
 */

import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { colors } from '../design-tokens';

// =============================================================================
// TYPES
// =============================================================================

export type NetworkNodeCategory = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'success' | 'default';

export interface NetworkNode {
  id: string;
  label: string;
  category?: NetworkNodeCategory;
  value?: number;  // For sizing nodes
  metadata?: Record<string, unknown>;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight?: number;  // Edge strength
  label?: string;
}

export interface NetworkGraphProps {
  /** Array of nodes */
  nodes: NetworkNode[];
  /** Array of edges connecting nodes */
  edges: NetworkEdge[];
  /** Chart title */
  title?: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Width in pixels (default: container width) */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Node click handler */
  onNodeClick?: (node: NetworkNode) => void;
  /** Edge click handler */
  onEdgeClick?: (edge: NetworkEdge) => void;
  /** Custom node colors by category */
  categoryColors?: Partial<Record<NetworkNodeCategory, string>>;
  /** Additional CSS classes */
  className?: string;
  /** Show loading state */
  loading?: boolean;
  /** Force simulation strength (0-1) */
  forceStrength?: number;
}

// =============================================================================
// COLOR SYSTEM
// =============================================================================

const defaultCategoryColors: Record<NetworkNodeCategory, string> = {
  primary: colors.primary[500],
  secondary: colors.primary[300],
  tertiary: colors.slate[400],
  warning: colors.warning.main,
  success: colors.success.main,
  default: colors.slate[500],
};

// =============================================================================
// LOADING SKELETON
// =============================================================================

const NetworkSkeleton: React.FC<{ height: number }> = ({ height }) => (
  <div className="relative" style={{ height }}>
    <svg className="w-full h-full">
      {/* Skeleton nodes */}
      {[
        { cx: '30%', cy: '30%', r: 24 },
        { cx: '70%', cy: '25%', r: 18 },
        { cx: '50%', cy: '50%', r: 30 },
        { cx: '25%', cy: '70%', r: 20 },
        { cx: '75%', cy: '65%', r: 22 },
        { cx: '60%', cy: '80%', r: 16 },
      ].map((node, i) => (
        <circle
          key={i}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          className="fill-slate-200 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
      
      {/* Skeleton edges */}
      {[
        { x1: '30%', y1: '30%', x2: '50%', y2: '50%' },
        { x1: '70%', y1: '25%', x2: '50%', y2: '50%' },
        { x1: '50%', y1: '50%', x2: '25%', y2: '70%' },
        { x1: '50%', y1: '50%', x2: '75%', y2: '65%' },
        { x1: '75%', y1: '65%', x2: '60%', y2: '80%' },
      ].map((edge, i) => (
        <line
          key={i}
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          className="stroke-slate-200 animate-pulse"
          strokeWidth={2}
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </svg>
    
    {/* Loading indicator */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
        <span className="text-sm text-slate-500">Building network...</span>
      </div>
    </div>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function NetworkGraph({
  nodes,
  edges,
  title,
  subtitle,
  width,
  height = 400,
  onNodeClick,
  onEdgeClick,
  categoryColors = {},
  className = '',
  loading = false,
  forceStrength = 0.5,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: width || 600, height });

  // Merge custom colors
  const nodeColors = useMemo(
    () => ({ ...defaultCategoryColors, ...categoryColors }),
    [categoryColors]
  );

  // Update dimensions on resize
  useEffect(() => {
    if (!containerRef.current || width) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      const { width: containerWidth } = entries[0].contentRect;
      setDimensions({ width: containerWidth, height });
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [height, width]);

  // D3 force simulation
  useEffect(() => {
    if (loading || !svgRef.current || !nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width: w, height: h } = dimensions;

    // Create simulation data (clone to avoid mutation)
    const simulationNodes = nodes.map((n) => ({ ...n }));
    const simulationEdges = edges.map((e) => ({
      ...e,
      source: e.source,
      target: e.target,
    }));

    // Calculate node sizes based on value
    const maxValue = Math.max(...nodes.map((n) => n.value || 1));
    const getNodeRadius = (node: NetworkNode) => {
      const base = 12;
      const scale = (node.value || 1) / maxValue;
      return base + scale * 18;
    };

    // Force simulation
    const simulation = d3
      .forceSimulation(simulationNodes as any)
      .force(
        'link',
        d3
          .forceLink(simulationEdges)
          .id((d: any) => d.id)
          .distance(100)
          .strength(forceStrength)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d: any) => getNodeRadius(d) + 5)
      );

    // Create container groups
    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);

    // Draw edges
    const link = g
      .append('g')
      .attr('class', 'edges')
      .selectAll('line')
      .data(simulationEdges)
      .join('line')
      .attr('stroke', colors.slate[300])
      .attr('stroke-width', (d: any) => Math.max(1, (d.weight || 1) * 2))
      .attr('stroke-opacity', 0.6)
      .style('cursor', onEdgeClick ? 'pointer' : 'default')
      .on('click', (_event, d) => {
        if (onEdgeClick) {
          onEdgeClick(d as unknown as NetworkEdge);
        }
      });

    // Draw nodes
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simulationNodes)
      .join('g')
      .style('cursor', onNodeClick ? 'pointer' : 'default')
      .on('click', (_event, d) => {
        if (onNodeClick) {
          onNodeClick(d as NetworkNode);
        }
      })
      .on('mouseenter', (_event, d: any) => setHoveredNode(d.id))
      .on('mouseleave', () => setHoveredNode(null))
      .call(
        d3
          .drag<SVGGElement, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // Node circles
    node
      .append('circle')
      .attr('r', (d) => getNodeRadius(d as NetworkNode))
      .attr('fill', (d: any) => nodeColors[d.category || 'default'])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

    // Node labels
    node
      .append('text')
      .text((d: any) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => getNodeRadius(d as NetworkNode) + 14)
      .attr('fill', colors.slate[700])
      .attr('font-size', 11)
      .attr('font-weight', 500);

    // Tick function
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, edges, dimensions, nodeColors, loading, onNodeClick, onEdgeClick, forceStrength]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${className}`}>
        {title && <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-slate-500 mb-4">{subtitle}</p>}
        <NetworkSkeleton height={height} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${className}`}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}

      {/* Graph */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
      />

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm font-medium text-slate-900">
            {nodes.find((n) => n.id === hoveredNode)?.label}
          </p>
        </div>
      )}
    </div>
  );
}

export default NetworkGraph;
