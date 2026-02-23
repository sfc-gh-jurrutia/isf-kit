import React, { useRef, useEffect, createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, MessageSquare } from 'lucide-react';

interface ConversationContextValue {
  scrollRef: React.RefObject<HTMLDivElement> | null;
  scrollToBottom: () => void;
  isAtBottom: boolean;
}

const ConversationContext = createContext<ConversationContextValue>({
  scrollRef: null,
  scrollToBottom: () => {},
  isAtBottom: true,
});

export function useConversation() {
  return useContext(ConversationContext);
}

interface CortexConversationProps {
  children: ReactNode;
  className?: string;
}

export function CortexConversation({ children, className }: CortexConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
    }
  }, []);

  return (
    <ConversationContext.Provider value={{ scrollRef, scrollToBottom, isAtBottom }}>
      <div className={cn('flex flex-col h-full overflow-hidden', className)}>
        {children}
      </div>
    </ConversationContext.Provider>
  );
}

interface CortexConversationContentProps {
  children: ReactNode;
  className?: string;
  autoScroll?: boolean;
}

export function CortexConversationContent({ 
  children, 
  className,
  autoScroll = true 
}: CortexConversationContentProps) {
  const { scrollRef, scrollToBottom, isAtBottom } = useConversation();
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = scrollRef || internalRef;

  useEffect(() => {
    if (autoScroll && isAtBottom) {
      scrollToBottom();
    }
  }, [children, autoScroll, isAtBottom, scrollToBottom]);

  const handleScroll = useCallback(() => {
    if (ref.current) {
      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    }
  }, [ref]);

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn('flex-1 overflow-y-auto p-4 space-y-4', className)}
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
}

interface CortexConversationEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
}

export function CortexConversationEmptyState({
  icon,
  title,
  description,
  suggestions,
  onSuggestionClick,
  className,
}: CortexConversationEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center h-full text-center p-8', className)}>
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}
      <h3 className="text-lg font-medium text-slate-200">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-2 max-w-md">{description}</p>
      )}
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick?.(suggestion)}
              className="text-sm px-3 py-2 bg-navy-700/50 hover:bg-navy-700 text-slate-300 rounded-lg border border-navy-600/50 hover:border-navy-500 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CortexConversationScrollButtonProps {
  className?: string;
}

export function CortexConversationScrollButton({ className }: CortexConversationScrollButtonProps) {
  const { scrollToBottom, isAtBottom } = useConversation();

  if (isAtBottom) return null;

  return (
    <button
      onClick={scrollToBottom}
      className={cn(
        'absolute bottom-4 right-4 p-2 rounded-full bg-navy-700 hover:bg-navy-600 text-slate-300 shadow-lg transition-all',
        'animate-in fade-in slide-in-from-bottom-2',
        className
      )}
      aria-label="Scroll to bottom"
    >
      <ChevronDown size={20} />
    </button>
  );
}
