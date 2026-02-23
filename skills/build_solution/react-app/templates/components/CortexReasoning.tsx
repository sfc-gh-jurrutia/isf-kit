import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Brain, Search, Database, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ReasoningStage } from '../types/cortex';

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  stage: ReasoningStage;
}

const ReasoningContext = createContext<ReasoningContextValue>({
  isStreaming: false,
  isOpen: false,
  setIsOpen: () => {},
  stage: 'idle',
});

export function useReasoningContext() {
  return useContext(ReasoningContext);
}

interface CortexReasoningProps {
  isStreaming?: boolean;
  stage?: ReasoningStage;
  toolName?: string;
  children?: ReactNode;
  className?: string;
  autoCloseDelay?: number;
}

export function CortexReasoning({
  isStreaming = false,
  stage = 'classifying',
  toolName,
  children,
  className,
  autoCloseDelay = 1000,
}: CortexReasoningProps) {
  const [isOpen, setIsOpen] = useState(isStreaming);

  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    } else if (isOpen && !isStreaming) {
      const timer = setTimeout(() => setIsOpen(false), autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, autoCloseDelay]);

  return (
    <ReasoningContext.Provider value={{ isStreaming, isOpen, setIsOpen, stage }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('mt-2', className)}>
        {children}
      </Collapsible>
    </ReasoningContext.Provider>
  );
}

interface CortexReasoningTriggerProps {
  className?: string;
}

const stageConfig: Record<ReasoningStage, { icon: typeof Brain; text: string; streamingText: string; colorClass: string }> = {
  classifying: {
    icon: Brain,
    text: 'Thought process',
    streamingText: 'Understanding...',
    colorClass: 'text-purple-400',
  },
  searching: {
    icon: Search,
    text: 'Thought process',
    streamingText: 'Searching...',
    colorClass: 'text-green-400',
  },
  analyzing: {
    icon: Database,
    text: 'Thought process',
    streamingText: 'Analyzing...',
    colorClass: 'text-blue-400',
  },
  generating: {
    icon: Sparkles,
    text: 'Thought process',
    streamingText: 'Generating...',
    colorClass: 'text-cyan-400',
  },
  idle: {
    icon: Brain,
    text: 'Thought process',
    streamingText: '',
    colorClass: 'text-slate-400',
  },
};

export function CortexReasoningTrigger({ className }: CortexReasoningTriggerProps) {
  const { isStreaming, isOpen, stage } = useReasoningContext();
  const config = stageConfig[stage];
  const Icon = config.icon;

  return (
    <CollapsibleTrigger
      className={cn(
        'flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-white/5 transition-colors',
        className
      )}
    >
      <Icon size={14} className={config.colorClass} />
      <span className={config.colorClass}>
        {isStreaming ? config.streamingText : config.text}
      </span>
      {isStreaming && <PulsingDots className={config.colorClass} />}
      {isOpen ? (
        <ChevronDown size={14} className="text-slate-500" />
      ) : (
        <ChevronRight size={14} className="text-slate-500" />
      )}
    </CollapsibleTrigger>
  );
}

interface CortexReasoningContentProps {
  children: ReactNode;
  className?: string;
}

export function CortexReasoningContent({ children, className }: CortexReasoningContentProps) {
  return (
    <CollapsibleContent className={cn('mt-2 animate-in slide-in-from-top-1', className)}>
      <div className="text-xs text-slate-400 bg-navy-900/50 rounded-lg p-3 border-l-2 border-purple-500/50">
        {children}
      </div>
    </CollapsibleContent>
  );
}

interface CortexReasoningStepProps {
  stage: ReasoningStage;
  text: string;
  isActive?: boolean;
  className?: string;
}

export function CortexReasoningStep({ stage, text, isActive = false, className }: CortexReasoningStepProps) {
  const config = stageConfig[stage];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-start gap-2 py-1', className)}>
      <Icon size={12} className={cn(config.colorClass, isActive && 'animate-pulse')} />
      <span className="text-slate-400">{text}</span>
    </div>
  );
}

interface PulsingDotsProps {
  className?: string;
}

function PulsingDots({ className }: PulsingDotsProps) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      <span className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: '150ms' }} />
      <span className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: '300ms' }} />
    </span>
  );
}
