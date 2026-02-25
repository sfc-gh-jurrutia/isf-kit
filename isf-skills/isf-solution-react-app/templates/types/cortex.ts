export type MessageRole = 'user' | 'assistant';

export type ToolStatus = 'pending' | 'running' | 'complete' | 'error';

export type ToolType = 'cortex_analyst' | 'cortex_search' | 'custom';

export type ReasoningStage = 'classifying' | 'searching' | 'analyzing' | 'generating' | 'idle';

export interface CortexSource {
  title: string;
  snippet?: string;
  score?: number;
  url?: string;
}

export type CortexMessagePart =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string; stage: ReasoningStage }
  | { type: 'tool'; name: string; toolType: ToolType; status: ToolStatus; input?: Record<string, unknown>; output?: unknown; sql?: string; error?: string; duration?: number }
  | { type: 'source'; title: string; snippet?: string; score?: number; url?: string };

export interface CortexAgentMessage {
  id: string;
  role: MessageRole;
  content: string;
  parts: CortexMessagePart[];
  isStreaming?: boolean;
  timestamp?: Date;
}

export interface CortexAgentEvent {
  type: 'text_delta' | 'reasoning' | 'tool_start' | 'tool_end' | 'tool_result' | 'sources' | 'done' | 'error';
  data: unknown;
}

export interface UseCortexAgentOptions {
  endpoint: string;
  threadId?: string;
  onEvent?: (event: CortexAgentEvent) => void;
}

export interface UseCortexAgentReturn {
  messages: CortexAgentMessage[];
  status: 'idle' | 'streaming' | 'error';
  sendMessage: (text: string) => Promise<void>;
  threadId?: string;
  reasoningStage: ReasoningStage;
  clearMessages: () => void;
}
