import { useState, useCallback, useRef } from 'react';
import type {
  CortexAgentMessage,
  CortexMessagePart,
  CortexAgentEvent,
  UseCortexAgentOptions,
  UseCortexAgentReturn,
  ReasoningStage,
  ToolStatus,
} from '../types/cortex';

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function useCortexAgent({
  endpoint,
  threadId: initialThreadId,
  onEvent,
}: UseCortexAgentOptions): UseCortexAgentReturn {
  const [messages, setMessages] = useState<CortexAgentMessage[]>([]);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle');
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
  const [reasoningStage, setReasoningStage] = useState<ReasoningStage>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateMessage = useCallback((id: string, updates: Partial<CortexAgentMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }, []);

  const updateToolPart = useCallback(
    (messageId: string, toolName: string, updates: Partial<CortexMessagePart & { type: 'tool' }>) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const parts = m.parts.map((p) => {
            if (p.type === 'tool' && p.name === toolName) {
              return { ...p, ...updates };
            }
            return p;
          });
          return { ...m, parts };
        })
      );
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const userMsg: CortexAgentMessage = {
        id: generateId(),
        role: 'user',
        content: text,
        parts: [{ type: 'text', text }],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const assistantId = generateId();
      const assistantMsg: CortexAgentMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        parts: [],
        isStreaming: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      setStatus('streaming');
      setReasoningStage('classifying');

      let fullText = '';
      const currentParts: CortexMessagePart[] = [];

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            message: text,
            thread_id: threadId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const eventData = line.slice(6).trim();
            if (eventData === '[DONE]') continue;

            try {
              const event = JSON.parse(eventData);
              const eventType = event.event_type || event.type;

              switch (eventType) {
                case 'text_delta':
                case 'text': {
                  const deltaText = event.text || event.data?.text || '';
                  fullText += deltaText;
                  updateMessage(assistantId, { content: fullText });
                  onEvent?.({ type: 'text_delta', data: event });
                  break;
                }

                case 'tool_start':
                case 'tool_use_start': {
                  const toolType = event.tool_type || 'custom';
                  setReasoningStage(toolType === 'cortex_search' ? 'searching' : 'analyzing');
                  
                  const toolPart: CortexMessagePart = {
                    type: 'tool',
                    name: event.tool_name || event.name || 'Unknown Tool',
                    toolType: toolType,
                    status: 'running' as ToolStatus,
                    input: event.input,
                  };
                  currentParts.push(toolPart);
                  updateMessage(assistantId, { parts: [...currentParts] });
                  onEvent?.({ type: 'tool_start', data: event });
                  break;
                }

                case 'tool_end':
                case 'tool_use_end': {
                  setReasoningStage('generating');
                  const toolName = event.tool_name || event.name;
                  updateToolPart(assistantId, toolName, {
                    status: event.error ? 'error' : 'complete',
                    output: event.result,
                    sql: event.sql,
                    error: event.error,
                    duration: event.duration,
                  });
                  onEvent?.({ type: 'tool_end', data: event });
                  break;
                }

                case 'tool_result':
                case 'tool_results': {
                  const toolName = event.tool_name || event.name;
                  if (toolName) {
                    updateToolPart(assistantId, toolName, {
                      status: 'complete',
                      output: event.result || event.data,
                      sql: event.sql,
                    });
                  }
                  onEvent?.({ type: 'tool_result', data: event });
                  break;
                }

                case 'thinking':
                case 'reasoning': {
                  const reasoningPart: CortexMessagePart = {
                    type: 'reasoning',
                    text: event.text || '',
                    stage: reasoningStage,
                  };
                  currentParts.push(reasoningPart);
                  updateMessage(assistantId, { parts: [...currentParts] });
                  onEvent?.({ type: 'reasoning', data: event });
                  break;
                }

                case 'message_complete':
                case 'done': {
                  if (event.citations && Array.isArray(event.citations)) {
                    for (const cite of event.citations) {
                      const sourcePart: CortexMessagePart = {
                        type: 'source',
                        title: cite.source || cite.title || 'Unknown Source',
                        snippet: cite.text || cite.snippet,
                        score: cite.score,
                        url: cite.url,
                      };
                      currentParts.push(sourcePart);
                    }
                    updateMessage(assistantId, { parts: [...currentParts] });
                  }

                  if (event.thread_id) {
                    setThreadId(event.thread_id);
                  }

                  onEvent?.({ type: 'done', data: event });
                  break;
                }

                case 'error': {
                  setStatus('error');
                  onEvent?.({ type: 'error', data: event });
                  break;
                }
              }
            } catch {
              // Non-JSON line, skip
            }
          }
        }

        updateMessage(assistantId, { isStreaming: false });
        setStatus('idle');
        setReasoningStage('idle');
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          updateMessage(assistantId, { isStreaming: false });
          setStatus('idle');
        } else {
          setStatus('error');
          onEvent?.({ type: 'error', data: error });
        }
        setReasoningStage('idle');
      }
    },
    [endpoint, threadId, onEvent, updateMessage, updateToolPart, reasoningStage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setThreadId(undefined);
  }, []);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('idle');
    setReasoningStage('idle');
  }, []);

  return {
    messages,
    status,
    sendMessage,
    threadId,
    reasoningStage,
    clearMessages,
  };
}
