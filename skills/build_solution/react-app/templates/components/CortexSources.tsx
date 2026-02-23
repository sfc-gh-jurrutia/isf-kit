import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Search, ExternalLink, ChevronDown, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { CortexSource } from '../types/cortex';

interface CortexSourcesProps {
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function CortexSources({ children, className, defaultOpen = false }: CortexSourcesProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn('mt-3 pt-3 border-t border-navy-600/30', className)}>
      {children}
    </Collapsible>
  );
}

interface CortexSourcesTriggerProps {
  count: number;
  className?: string;
}

export function CortexSourcesTrigger({ count, className }: CortexSourcesTriggerProps) {
  return (
    <CollapsibleTrigger
      className={cn(
        'flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors',
        className
      )}
    >
      <Search size={12} />
      <span>Sources ({count})</span>
      <ChevronDown size={12} className="transition-transform data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
}

interface CortexSourcesContentProps {
  children: ReactNode;
  className?: string;
}

export function CortexSourcesContent({ children, className }: CortexSourcesContentProps) {
  return (
    <CollapsibleContent className={cn('flex flex-wrap gap-1.5 mt-2 animate-in slide-in-from-top-1', className)}>
      {children}
    </CollapsibleContent>
  );
}

interface CortexSourceProps extends CortexSource {
  className?: string;
}

export function CortexSource({ title, snippet, score, url, className }: CortexSourceProps) {
  const content = (
    <>
      <FileText size={10} className="flex-shrink-0" />
      <span className="truncate max-w-[150px]">{title}</span>
      {score !== undefined && (
        <span className="text-slate-500 text-[10px]">
          ({Math.round(score * 100)}%)
        </span>
      )}
      {url && <ExternalLink size={10} className="flex-shrink-0 opacity-50" />}
    </>
  );

  const baseClassName = cn(
    'inline-flex items-center gap-1 text-xs px-2 py-1 bg-navy-600/50 text-accent-blue rounded-full transition-colors',
    url && 'hover:bg-navy-600 cursor-pointer',
    className
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClassName}
        title={snippet || title}
      >
        {content}
      </a>
    );
  }

  return (
    <span className={baseClassName} title={snippet || title}>
      {content}
    </span>
  );
}

interface CortexSourcesListProps {
  sources: CortexSource[];
  defaultOpen?: boolean;
  className?: string;
}

export function CortexSourcesList({ sources, defaultOpen = false, className }: CortexSourcesListProps) {
  if (sources.length === 0) return null;

  return (
    <CortexSources defaultOpen={defaultOpen} className={className}>
      <CortexSourcesTrigger count={sources.length} />
      <CortexSourcesContent>
        {sources.map((source, index) => (
          <CortexSource key={index} {...source} />
        ))}
      </CortexSourcesContent>
    </CortexSources>
  );
}

interface CortexSourceCardProps extends CortexSource {
  className?: string;
}

export function CortexSourceCard({ title, snippet, score, url, className }: CortexSourceCardProps) {
  const Wrapper = url ? 'a' : 'div';
  const wrapperProps = url
    ? { href: url, target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'block p-3 bg-navy-800/50 rounded-lg border border-navy-600/30 transition-colors',
        url && 'hover:border-accent-blue/50 hover:bg-navy-800/70 cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={14} className="text-accent-blue flex-shrink-0" />
          <span className="text-sm text-slate-200 font-medium truncate">{title}</span>
        </div>
        {score !== undefined && (
          <span className="text-xs text-slate-500 flex-shrink-0">
            {Math.round(score * 100)}%
          </span>
        )}
      </div>
      {snippet && (
        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{snippet}</p>
      )}
      {url && (
        <div className="flex items-center gap-1 text-xs text-accent-blue mt-2">
          <ExternalLink size={10} />
          <span className="truncate">{new URL(url).hostname}</span>
        </div>
      )}
    </Wrapper>
  );
}
