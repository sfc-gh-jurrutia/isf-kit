/**
 * TechnicalMetadata - Data transparency component for executive dashboards
 * 
 * Shows technical reviewers that visualizations use real Snowflake data.
 * Displays: SQL queries, data lineage, query latency, Snowflake role.
 * 
 * Based on aura-marketing-guardian's "Engineering Manifest" pattern.
 * 
 * Usage:
 * <TechnicalMetadata
 *   chartName="Revenue Trend"
 *   sqlQuery="SELECT * FROM ANALYTICS.REVENUE_VIEW"
 *   queryRole="ANALYST_ROLE"
 *   queryLatencyMs={234}
 *   lineage={[
 *     { type: 'stream', name: 'SALESFORCE_STREAM', schema: 'RAW' },
 *     { type: 'dynamic_table', name: 'UNIFIED_DATA', schema: 'SILVER' },
 *     { type: 'view', name: 'REVENUE_VIEW', schema: 'ANALYTICS' },
 *   ]}
 * />
 */

'use client';

import React, { useState } from 'react';
import { 
  Database, 
  X, 
  GitBranch, 
  Copy, 
  Check, 
  Code, 
  ArrowRight,
  Shield,
  Zap,
  Table,
  Eye,
  Activity,
  Clock,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export type LineageNodeType = 
  | 'stream' 
  | 'table' 
  | 'dynamic_table' 
  | 'view' 
  | 'search_service' 
  | 'agent' 
  | 'procedure'
  | 'stage';

export interface LineageNode {
  type: LineageNodeType;
  name: string;
  schema?: string;
  description?: string;
}

export interface TechnicalMetadataProps {
  /** Chart/component name */
  chartName: string;
  /** Type of visualization */
  chartType?: 'line' | 'bar' | 'pie' | 'sankey' | 'table' | 'kpi' | 'scatter' | 'network';
  /** SQL query used to fetch data */
  sqlQuery?: string;
  /** Snowflake role used for query */
  queryRole?: string;
  /** Query execution time in ms */
  queryLatencyMs?: number;
  /** Number of rows returned */
  rowsReturned?: number;
  /** Data lineage (stream → table → view) */
  lineage?: LineageNode[];
  /** Primary data source identifier */
  dataSource?: string;
  /** Last refresh timestamp */
  lastRefreshed?: Date;
  /** Button position */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// =============================================================================
// LINEAGE NODE STYLING
// =============================================================================

const lineageStyles: Record<LineageNodeType, { icon: typeof Activity; colorClass: string }> = {
  stream: { 
    icon: Activity, 
    colorClass: 'text-purple-600 bg-purple-50 border-purple-200' 
  },
  table: { 
    icon: Table, 
    colorClass: 'text-blue-600 bg-blue-50 border-blue-200' 
  },
  dynamic_table: { 
    icon: Zap, 
    colorClass: 'text-amber-600 bg-amber-50 border-amber-200' 
  },
  view: { 
    icon: Eye, 
    colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200' 
  },
  search_service: { 
    icon: Database, 
    colorClass: 'text-cyan-600 bg-cyan-50 border-cyan-200' 
  },
  agent: { 
    icon: Shield, 
    colorClass: 'text-pink-600 bg-pink-50 border-pink-200' 
  },
  procedure: { 
    icon: Code, 
    colorClass: 'text-orange-600 bg-orange-50 border-orange-200' 
  },
  stage: { 
    icon: Database, 
    colorClass: 'text-sky-600 bg-sky-50 border-sky-200' 
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function TechnicalMetadata({
  chartName,
  chartType = 'bar',
  sqlQuery,
  queryRole,
  queryLatencyMs,
  rowsReturned,
  lineage = [],
  dataSource,
  lastRefreshed,
  position = 'bottom-right',
}: TechnicalMetadataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'lineage' | 'sql'>('lineage');
  const [copied, setCopied] = useState(false);

  const positionClasses: Record<string, string> = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-1.5 right-3',
    'bottom-left': 'bottom-1.5 left-3',
  };

  const handleCopy = async () => {
    if (sqlQuery) {
      await navigator.clipboard.writeText(sqlQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate lineage path description
  const lineageDescription = lineage.length > 0
    ? lineage.map(node => `${node.type.replace('_', ' ').toUpperCase()}: ${node.name}`).join(' → ')
    : '';

  return (
    <>
      {/* Trigger Button - Small database icon */}
      <button
        onClick={() => setIsOpen(true)}
        className={`absolute ${positionClasses[position]} w-5 h-5 rounded 
          bg-slate-100 hover:bg-slate-200 
          border border-slate-300 
          flex items-center justify-center 
          transition-all hover:scale-105 z-10`}
        title="View data source"
      >
        <Database size={10} className="text-slate-500" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div 
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <Database size={18} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-bold">{chartName}</h3>
                  <p className="text-slate-500 text-xs">Data Source Details</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('lineage')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'lineage'
                    ? 'text-slate-900 border-b-2 border-slate-800 bg-slate-50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <GitBranch size={14} />
                Data Lineage
              </button>
              <button
                onClick={() => setActiveTab('sql')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'sql'
                    ? 'text-slate-900 border-b-2 border-slate-800 bg-slate-50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Code size={14} />
                SQL Query
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
              {activeTab === 'lineage' && (
                <div className="space-y-4">
                  {/* Lineage Path Summary */}
                  {lineageDescription && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
                      <p className="text-xs text-slate-500 mb-2">Data Flow Path:</p>
                      <p className="text-sm text-slate-900 font-mono">{lineageDescription}</p>
                    </div>
                  )}

                  {/* Visual Lineage */}
                  {lineage.length > 0 ? (
                    <div className="space-y-3">
                      {lineage.map((node, index) => {
                        const style = lineageStyles[node.type] || lineageStyles.table;
                        const IconComponent = style.icon;
                        
                        return (
                          <React.Fragment key={index}>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                              <div className={`p-2 rounded-lg border ${style.colorClass}`}>
                                <IconComponent size={16} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] uppercase tracking-widest text-slate-400">
                                    {node.type.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-900 font-mono mt-0.5">
                                  {node.schema ? `${node.schema}.${node.name}` : node.name}
                                </p>
                                {node.description && (
                                  <p className="text-xs text-slate-500 mt-1">{node.description}</p>
                                )}
                              </div>
                            </div>
                            
                            {index < lineage.length - 1 && (
                              <div className="flex justify-center">
                                <ArrowRight size={16} className="text-slate-300 rotate-90" />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 text-center">
                      <GitBranch size={24} className="text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No lineage information available</p>
                    </div>
                  )}

                  {/* Data Source Footer */}
                  {dataSource && (
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Primary Data Source:</span>
                      <span className="text-[10px] text-sky-600 font-mono font-medium">{dataSource}</span>
                    </div>
                  )}

                  {lastRefreshed && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Last Refreshed:</span>
                      <span className="text-slate-600">{lastRefreshed.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sql' && (
                <div className="space-y-4">
                  {/* Query Metadata Badges */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {queryRole && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <Shield size={12} className="text-amber-600" />
                        <span className="text-[10px] text-slate-500">Role:</span>
                        <span className="text-[10px] text-amber-700 font-mono font-medium">{queryRole}</span>
                      </div>
                    )}
                    {queryLatencyMs !== undefined && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <Clock size={12} className="text-indigo-600" />
                        <span className="text-[10px] text-slate-500">Latency:</span>
                        <span className="text-[10px] text-indigo-700 font-mono font-medium">{queryLatencyMs}ms</span>
                      </div>
                    )}
                    {rowsReturned !== undefined && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <Table size={12} className="text-emerald-600" />
                        <span className="text-[10px] text-slate-500">Rows:</span>
                        <span className="text-[10px] text-emerald-700 font-mono font-medium">{rowsReturned.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* SQL Query Display */}
                  {sqlQuery ? (
                    <div className="relative group">
                      <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                        <pre className="text-[11px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {sqlQuery}
                        </pre>
                      </div>
                      <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        title="Copy SQL"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 text-center">
                      <Code size={24} className="text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No SQL query available</p>
                    </div>
                  )}

                  {/* Engineering Note */}
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[10px] text-slate-600 font-medium">
                      Data executed directly on Snowflake. No frontend calculations.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-sky-500" fill="currentColor">
                  <path d="M12.394 2.013c-.456-.27-.991-.27-1.448 0l-7.5 4.448c-.456.27-.737.766-.737 1.304v8.47c0 .538.281 1.034.737 1.304l7.5 4.448c.457.27.992.27 1.448 0l7.5-4.448c.456-.27.737-.766.737-1.304v-8.47c0-.538-.281-1.034-.737-1.304l-7.5-4.448z"/>
                </svg>
                <span>Powered by Snowflake</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TechnicalMetadata;
