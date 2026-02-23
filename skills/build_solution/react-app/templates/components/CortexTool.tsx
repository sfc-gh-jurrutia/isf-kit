import React, { createContext, useContext, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Database, Search, Zap, ChevronDown, ChevronRight, Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ToolStatus, ToolType } from '../types/cortex';

interface ToolContextValue {
  name: string;
  type: ToolType;
  status: ToolStatus;
  duration?: number;
}

const ToolContext = createContext<ToolContextValue>({
  name: '',
  type: 'custom',
  status: 'pending',
});

export function useToolContext() {
  return useContext(ToolContext);
}

interface CortexToolProps {
  name: string;
  type: ToolType;
  status: ToolStatus;
  duration?: number;
  defaultOpen?: boolean;
  children?: ReactNode;
  className?: string;
}

export function CortexTool({
  name,
  type,
  status,
  duration,
  defaultOpen = false,
  children,
  className,
}: CortexToolProps) {
  const shouldBeOpen = defaultOpen || status === 'error' || status === 'running';

  return (
    <ToolContext.Provider value={{ name, type, status, duration }}>
      <Collapsible defaultOpen={shouldBeOpen} className={cn('mt-2', className)}>
        {children}
      </Collapsible>
    </ToolContext.Provider>
  );
}

interface CortexToolHeaderProps {
  className?: string;
}

const toolIconMap: Record<ToolType, typeof Database> = {
  cortex_analyst: Database,
  cortex_search: Search,
  custom: Zap,
};

const toolLabelMap: Record<ToolType, string> = {
  cortex_analyst: 'Cortex Analyst',
  cortex_search: 'Cortex Search',
  custom: 'Tool',
};

export function CortexToolHeader({ className }: CortexToolHeaderProps) {
  const { name, type, status, duration } = useToolContext();
  const Icon = toolIconMap[type];
  const typeLabel = toolLabelMap[type];

  return (
    <CollapsibleTrigger
      className={cn(
        'w-full flex items-center gap-2 p-3 bg-navy-900/50 rounded-lg hover:bg-navy-900/70 transition-colors text-left',
        className
      )}
    >
      <Icon size={14} className={getStatusIconColor(status)} />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-300 font-medium truncate block">{name}</span>
        <span className="text-[10px] text-slate-500">{typeLabel}</span>
      </div>
      <CortexToolStatusBadge status={status} />
      {duration !== undefined && status === 'complete' && (
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <Clock size={10} />
          {duration}ms
        </span>
      )}
      <ChevronDown size={14} className="text-slate-500 transition-transform data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
}

interface CortexToolContentProps {
  children: ReactNode;
  className?: string;
}

export function CortexToolContent({ children, className }: CortexToolContentProps) {
  return (
    <CollapsibleContent className={cn('mt-2 space-y-2 animate-in slide-in-from-top-1', className)}>
      {children}
    </CollapsibleContent>
  );
}

interface CortexToolInputProps {
  input: Record<string, unknown>;
  className?: string;
}

export function CortexToolInput({ input, className }: CortexToolInputProps) {
  return (
    <div className={className}>
      <p className="text-[10px] text-cyan-400 mb-1 uppercase tracking-wider">Input</p>
      <pre className="text-xs text-slate-400 font-mono bg-navy-950 p-2 rounded overflow-x-auto max-h-32">
        {JSON.stringify(input, null, 2)}
      </pre>
    </div>
  );
}

interface CortexToolOutputProps {
  sql?: string;
  output?: unknown;
  error?: string;
  className?: string;
}

export function CortexToolOutput({ sql, output, error, className }: CortexToolOutputProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {sql && (
        <div>
          <p className="text-[10px] text-cyan-400 mb-1 uppercase tracking-wider">SQL Query</p>
          <pre className="text-xs text-slate-400 font-mono bg-navy-950 p-2 rounded overflow-x-auto">
            {sql}
          </pre>
        </div>
      )}
      {output && (
        <div>
          <p className="text-[10px] text-green-400 mb-1 uppercase tracking-wider">Result</p>
          <pre className="text-xs text-slate-400 font-mono bg-navy-950 p-2 rounded max-h-40 overflow-auto">
            {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
          </pre>
        </div>
      )}
      {error && (
        <div>
          <p className="text-[10px] text-red-400 mb-1 uppercase tracking-wider">Error</p>
          <div className="text-xs text-red-400 bg-red-950/50 p-2 rounded border border-red-900/50">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}

interface CortexToolStatusBadgeProps {
  status: ToolStatus;
  className?: string;
}

const statusConfig: Record<ToolStatus, { label: string; className: string; icon: typeof Check }> = {
  pending: {
    label: 'Pending',
    className: 'bg-slate-600 text-slate-200',
    icon: Clock,
  },
  running: {
    label: 'Running',
    className: 'bg-cyan-600 text-white animate-pulse',
    icon: Loader2,
  },
  complete: {
    label: 'Complete',
    className: 'bg-green-600 text-white',
    icon: Check,
  },
  error: {
    label: 'Error',
    className: 'bg-red-600 text-white',
    icon: AlertCircle,
  },
};

export function CortexToolStatusBadge({ status, className }: CortexToolStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium',
        config.className,
        className
      )}
    >
      <Icon size={10} className={status === 'running' ? 'animate-spin' : ''} />
      {config.label}
    </span>
  );
}

function getStatusIconColor(status: ToolStatus): string {
  switch (status) {
    case 'pending':
      return 'text-slate-400';
    case 'running':
      return 'text-cyan-400 animate-pulse';
    case 'complete':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
}
