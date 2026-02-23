/**
 * React hook for streaming communication with a Cortex Agent backend via SSE.
 *
 * Pairs with the FastAPI backend at `templates/backend/cortex_agent_service.py`
 * which serves SSE events at POST /agent/run.
 *
 * @example
 * ```tsx
 * const { messages, status, sendMessage, threadId, clearMessages } = useCortexAgent({
 *   endpoint: '/agent/run',
 * });
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolStatus = 'running' | 'complete' | 'error';
export type ReasoningStage = 'idle' | 'classifying' | 'searching' | 'analyzing' | 'generating';

export type CortexMessagePart =
  | { type: 'text'; text: string }
  | {
      type: 'tool';
      name: string;
      toolType: string;
      status: ToolStatus;
      input?: any;
      output?: any;
      sql?: string;
      error?: string;
      duration?: number;
    }
  | { type: 'reasoning'; text: string; stage: ReasoningStage }
  | { type: 'source'; title: string; snippet?: string; score?: number; url?: string };

export interface CortexAgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts: CortexMessagePart[];
  isStreaming?: boolean;
  timestamp: Date;
}

export interface UseCortexAgentOptions {
  endpoint: string;
  threadId?: string;
  onEvent?: (event: any) => void;
}

export interface UseCortexAgentReturn {
  messages: CortexAgentMessage[];
  status: 'idle' | 'streaming' | 'error';
  sendMessage: (text: string) => Promise<void>;
  threadId: string | undefined;
  reasoningStage: ReasoningStage;
  clearMessages: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export default function useCortexAgent(options: UseCortexAgentOptions): UseCortexAgentReturn {
  const [messages, setMessages] = useState<CortexAgentMessage[]>([]);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle');
  const [threadId, setThreadId] = useState<string | undefined>(options.threadId);
  const [reasoningStage, setReasoningStage] = useState<ReasoningStage>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      // Abort any in-flight stream
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMsg: CortexAgentMessage = {
        id: uid(),
        role: 'user',
        content: text,
        parts: [{ type: 'text', text }],
        timestamp: new Date(),
      };

      const assistantId = uid();
      const assistantMsg: CortexAgentMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        parts: [],
        isStreaming: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStatus('streaming');
      setReasoningStage('classifying');

      let fullText = '';

      try {
        const resp = await fetch(options.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({ message: text, thread_id: threadId }),
          signal: controller.signal,
        });

        if (!resp.ok || !resp.body) {
          setStatus('error');
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6);
            if (payload === '[DONE]') break;

            let event: any;
            try {
              event = JSON.parse(payload);
            } catch {
              continue;
            }

            options.onEvent?.(event);
            const eventType = event.event_type || event.type || '';

            switch (eventType) {
              case 'text_delta':
              case 'text': {
                fullText += event.text || '';
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullText } : m,
                  ),
                );
                break;
              }

              case 'tool_start':
              case 'tool_use_start': {
                const toolName = event.tool_name || '';
                setReasoningStage(toolName.includes('search') ? 'searching' : 'analyzing');
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          parts: [
                            ...m.parts,
                            {
                              type: 'tool',
                              name: toolName,
                              toolType: event.tool_type || '',
                              status: 'running' as ToolStatus,
                            },
                          ],
                        }
                      : m,
                  ),
                );
                break;
              }

              case 'tool_end':
              case 'tool_use_end': {
                setReasoningStage('generating');
                const toolName = event.tool_name || '';
                const hasError = !!event.error;
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantId) return m;
                    const parts = m.parts.map((p) =>
                      p.type === 'tool' && p.name === toolName && p.status === 'running'
                        ? { ...p, status: (hasError ? 'error' : 'complete') as ToolStatus, error: event.error }
                        : p,
                    );
                    return { ...m, parts };
                  }),
                );
                break;
              }

              case 'tool_result': {
                const toolName = event.tool_name || '';
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantId) return m;
                    const parts = m.parts.map((p) =>
                      p.type === 'tool' && p.name === toolName
                        ? { ...p, output: event.result, sql: event.sql }
                        : p,
                    );
                    return { ...m, parts };
                  }),
                );
                break;
              }

              case 'reasoning':
              case 'thinking': {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          parts: [
                            ...m.parts,
                            { type: 'reasoning', text: event.text || '', stage: reasoningStage },
                          ],
                        }
                      : m,
                  ),
                );
                break;
              }

              case 'message_complete':
              case 'done': {
                if (event.thread_id) setThreadId(event.thread_id);
                if (event.sources) {
                  const sources = (event.sources as any[]).map((s: any) => ({
                    type: 'source' as const,
                    title: s.title || '',
                    snippet: s.snippet,
                    score: s.score,
                    url: s.url,
                  }));
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, parts: [...m.parts, ...sources] } : m,
                    ),
                  );
                }
                break;
              }

              case 'error': {
                setStatus('error');
                break;
              }

              default:
                break;
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setStatus('error');
        }
        return;
      }

      setStatus('idle');
      setReasoningStage('idle');
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m)),
      );
    },
    [options.endpoint, options.onEvent, threadId, reasoningStage],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStatus('idle');
    setReasoningStage('idle');
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { messages, status, sendMessage, threadId, reasoningStage, clearMessages };
}
