import React, { createContext, useContext, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { User, Bot, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { MessageRole } from '../types/cortex';

interface MessageContextValue {
  role: MessageRole;
}

const MessageContext = createContext<MessageContextValue>({ role: 'user' });

export function useMessageContext() {
  return useContext(MessageContext);
}

interface CortexMessageProps {
  from: MessageRole;
  children: ReactNode;
  className?: string;
}

export function CortexMessage({ from, children, className }: CortexMessageProps) {
  return (
    <MessageContext.Provider value={{ role: from }}>
      <div
        className={cn(
          'flex gap-3',
          from === 'user' ? 'flex-row-reverse' : '',
          className
        )}
      >
        <CortexMessageAvatar />
        <div
          className={cn(
            'max-w-[80%] rounded-2xl',
            from === 'user'
              ? 'bg-accent-blue text-white'
              : 'bg-navy-700/80 text-slate-200'
          )}
        >
          {children}
        </div>
      </div>
    </MessageContext.Provider>
  );
}

interface CortexMessageAvatarProps {
  className?: string;
}

export function CortexMessageAvatar({ className }: CortexMessageAvatarProps) {
  const { role } = useMessageContext();

  return (
    <div
      className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        role === 'user' ? 'bg-accent-blue/20' : 'bg-cyan-500/20',
        className
      )}
    >
      {role === 'user' ? (
        <User size={16} className="text-accent-blue" />
      ) : (
        <Bot size={16} className="text-cyan-400" />
      )}
    </div>
  );
}

interface CortexMessageContentProps {
  children: ReactNode;
  className?: string;
}

export function CortexMessageContent({ children, className }: CortexMessageContentProps) {
  return (
    <div className={cn('p-4 text-sm whitespace-pre-wrap', className)}>
      {children}
    </div>
  );
}

interface CortexMessageActionsProps {
  children: ReactNode;
  className?: string;
}

export function CortexMessageActions({ children, className }: CortexMessageActionsProps) {
  return (
    <div className={cn('flex gap-1 px-4 pb-3', className)}>
      {children}
    </div>
  );
}

interface CortexMessageCopyButtonProps {
  content: string;
  className?: string;
}

export function CortexMessageCopyButton({ content, className }: CortexMessageCopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-300 transition-colors',
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

interface CortexMessageFeedbackProps {
  onPositive?: () => void;
  onNegative?: () => void;
  className?: string;
}

export function CortexMessageFeedback({ onPositive, onNegative, className }: CortexMessageFeedbackProps) {
  const [feedback, setFeedback] = React.useState<'positive' | 'negative' | null>(null);

  const handlePositive = () => {
    setFeedback('positive');
    onPositive?.();
  };

  const handleNegative = () => {
    setFeedback('negative');
    onNegative?.();
  };

  return (
    <div className={cn('flex gap-1', className)}>
      <button
        onClick={handlePositive}
        className={cn(
          'p-1.5 rounded hover:bg-white/10 transition-colors',
          feedback === 'positive' ? 'text-green-400' : 'text-slate-400 hover:text-slate-300'
        )}
        title="Good response"
        disabled={feedback !== null}
      >
        <ThumbsUp size={14} />
      </button>
      <button
        onClick={handleNegative}
        className={cn(
          'p-1.5 rounded hover:bg-white/10 transition-colors',
          feedback === 'negative' ? 'text-red-400' : 'text-slate-400 hover:text-slate-300'
        )}
        title="Poor response"
        disabled={feedback !== null}
      >
        <ThumbsDown size={14} />
      </button>
    </div>
  );
}

interface CortexMessagePartsProps {
  children: ReactNode;
  className?: string;
}

export function CortexMessageParts({ children, className }: CortexMessagePartsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {children}
    </div>
  );
}

interface CortexMessageStreamingIndicatorProps {
  className?: string;
}

export function CortexMessageStreamingIndicator({ className }: CortexMessageStreamingIndicatorProps) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
    </span>
  );
}
