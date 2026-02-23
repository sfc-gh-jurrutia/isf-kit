import React, { useState, useRef, useCallback, createContext, useContext, ReactNode, KeyboardEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { Send, Paperclip, Mic, Square, Loader2 } from 'lucide-react';

interface PromptInputContextValue {
  value: string;
  setValue: (value: string) => void;
  isLoading: boolean;
  isDisabled: boolean;
  onSubmit: () => void;
}

const PromptInputContext = createContext<PromptInputContextValue>({
  value: '',
  setValue: () => {},
  isLoading: false,
  isDisabled: false,
  onSubmit: () => {},
});

export function usePromptInput() {
  return useContext(PromptInputContext);
}

interface CortexPromptInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
}

export function CortexPromptInput({
  value: controlledValue,
  onChange,
  onSubmit,
  isLoading = false,
  isDisabled = false,
  placeholder = 'Type your message...',
  children,
  className,
}: CortexPromptInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue ?? internalValue;
  const setValue = onChange ?? setInternalValue;

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isLoading || isDisabled) return;
    onSubmit?.(value.trim());
    setValue('');
  }, [value, isLoading, isDisabled, onSubmit, setValue]);

  return (
    <PromptInputContext.Provider value={{ value, setValue, isLoading, isDisabled, onSubmit: handleSubmit }}>
      <div className={cn('border-t border-navy-600/50 p-4', className)}>
        <div className="flex items-end gap-2 bg-navy-800/50 rounded-2xl border border-navy-600/50 focus-within:border-accent-blue/50 transition-colors">
          {children || (
            <>
              <CortexPromptInputTextarea placeholder={placeholder} />
              <CortexPromptInputSubmit />
            </>
          )}
        </div>
      </div>
    </PromptInputContext.Provider>
  );
}

interface CortexPromptInputTextareaProps {
  placeholder?: string;
  maxRows?: number;
  className?: string;
}

export function CortexPromptInputTextarea({
  placeholder = 'Type your message...',
  maxRows = 5,
  className,
}: CortexPromptInputTextareaProps) {
  const { value, setValue, isLoading, isDisabled, onSubmit } = usePromptInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const lineHeight = 24;
      const maxHeight = lineHeight * maxRows;
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={isLoading || isDisabled}
      rows={1}
      className={cn(
        'flex-1 bg-transparent text-slate-200 placeholder-slate-500 resize-none py-3 px-4 focus:outline-none min-h-[48px]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    />
  );
}

interface CortexPromptInputSubmitProps {
  className?: string;
}

export function CortexPromptInputSubmit({ className }: CortexPromptInputSubmitProps) {
  const { value, isLoading, isDisabled, onSubmit } = usePromptInput();
  const canSubmit = value.trim() && !isLoading && !isDisabled;

  return (
    <button
      onClick={onSubmit}
      disabled={!canSubmit}
      className={cn(
        'p-3 m-1 rounded-xl transition-all',
        canSubmit
          ? 'bg-accent-blue hover:bg-accent-blue/90 text-white'
          : 'bg-navy-700/50 text-slate-500 cursor-not-allowed',
        className
      )}
      aria-label="Send message"
    >
      {isLoading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <Send size={20} />
      )}
    </button>
  );
}

interface CortexPromptInputStopProps {
  onStop?: () => void;
  className?: string;
}

export function CortexPromptInputStop({ onStop, className }: CortexPromptInputStopProps) {
  const { isLoading } = usePromptInput();

  if (!isLoading) return null;

  return (
    <button
      onClick={onStop}
      className={cn(
        'p-3 m-1 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors',
        className
      )}
      aria-label="Stop generating"
    >
      <Square size={20} />
    </button>
  );
}

interface CortexPromptInputToolsProps {
  children: ReactNode;
  className?: string;
}

export function CortexPromptInputTools({ children, className }: CortexPromptInputToolsProps) {
  return (
    <div className={cn('flex items-center gap-1 px-2', className)}>
      {children}
    </div>
  );
}

interface CortexPromptInputToolButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  title?: string;
  className?: string;
}

export function CortexPromptInputToolButton({
  icon,
  onClick,
  title,
  className,
}: CortexPromptInputToolButtonProps) {
  const { isLoading, isDisabled } = usePromptInput();

  return (
    <button
      onClick={onClick}
      disabled={isLoading || isDisabled}
      title={title}
      className={cn(
        'p-2 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-navy-700/50 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {icon}
    </button>
  );
}
