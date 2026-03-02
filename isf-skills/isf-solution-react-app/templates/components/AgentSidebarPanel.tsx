import React, { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { useCortexAgent } from '../hooks/useCortexAgent';
import { CortexConversation, CortexConversationContent, CortexConversationEmptyState, CortexConversationScrollButton } from './CortexConversation';
import { CortexMessage, CortexMessageContent, CortexMessageStreamingIndicator } from './CortexMessage';
import { CortexPromptInput } from './CortexPromptInput';
import AgentWorkflowViewer from './AgentWorkflowViewer';
import type { CortexAgentMessage } from '../types/cortex';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SidebarTab = 'chat' | 'workflow';

interface AgentSidebarPanelProps {
  agentEndpoint?: string;
  agentName?: string;
  agentDescription?: string;
  suggestions?: string[];
  pendingPrompt?: string | null;
  onClearPendingPrompt?: () => void;
  metadataEndpoint?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ENDPOINT = '/api/agent/run';
const DEFAULT_METADATA_ENDPOINT = '/api/agent/metadata';
const DEFAULT_NAME = 'AI Assistant';
const DEFAULT_DESCRIPTION = 'Ask me anything about your data';
const DEFAULT_WIDTH = 420;
const DEFAULT_MIN_WIDTH = 350;
const DEFAULT_MAX_WIDTH = 600;
const HANDLE_WIDTH = 4;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentSidebarPanel({
  agentEndpoint = DEFAULT_ENDPOINT,
  agentName = DEFAULT_NAME,
  agentDescription = DEFAULT_DESCRIPTION,
  suggestions,
  pendingPrompt,
  onClearPendingPrompt,
  metadataEndpoint = DEFAULT_METADATA_ENDPOINT,
  defaultWidth = DEFAULT_WIDTH,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
  className,
}: AgentSidebarPanelProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('chat');
  const [width, setWidth] = useState(defaultWidth);
  const isDragging = useRef(false);
  const lastSentPromptRef = useRef<string | null>(null);

  const { messages, status, sendMessage, reasoningStage } = useCortexAgent({
    endpoint: agentEndpoint,
  });

  // -- Agent pre-warming ------------------------------------------------
  useEffect(() => {
    fetch(agentEndpoint, { method: 'HEAD' }).catch(() => {});
  }, [agentEndpoint]);

  // -- Pending-prompt auto-send (ref-based dedup) -----------------------
  useEffect(() => {
    if (
      pendingPrompt &&
      pendingPrompt !== lastSentPromptRef.current &&
      status !== 'streaming'
    ) {
      lastSentPromptRef.current = pendingPrompt;
      setActiveTab('chat');
      sendMessage(pendingPrompt);
      onClearPendingPrompt?.();
    }
  }, [pendingPrompt, status, sendMessage, onClearPendingPrompt]);

  // -- Resize logic -----------------------------------------------------
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const startX = e.clientX;
      const startWidth = width;

      const onMove = (ev: PointerEvent) => {
        if (!isDragging.current) return;
        const delta = startX - ev.clientX;
        const next = Math.min(maxWidth, Math.max(minWidth, startWidth + delta));
        setWidth(next);
      };

      const onUp = () => {
        isDragging.current = false;
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [width, minWidth, maxWidth],
  );

  // -- Suggestion click handler -----------------------------------------
  const handleSuggestionClick = useCallback(
    (text: string) => {
      if (status !== 'streaming') {
        sendMessage(text);
      }
    },
    [status, sendMessage],
  );

  // -- Keyboard tab switching -------------------------------------------
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, tab: SidebarTab) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveTab(tab);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'chat' ? 'workflow' : 'chat'));
      }
    },
    [],
  );

  const isStreaming = status === 'streaming';

  return (
    <div
      className={clsx('agent-sidebar-panel', className)}
      style={{
        width,
        minWidth,
        maxWidth,
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        position: 'relative',
        transition: isDragging.current ? 'none' : 'width 0.15s ease',
      }}
    >
      {/* ---- Drag handle ---- */}
      <div
        onPointerDown={handlePointerDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        aria-valuenow={width}
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        tabIndex={0}
        style={{
          width: HANDLE_WIDTH,
          cursor: 'col-resize',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-elevated)',
          borderRight: '1px solid var(--border-subtle)',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Grip dots */}
        <svg
          width="2"
          height="20"
          viewBox="0 0 2 20"
          fill="none"
          aria-hidden="true"
          style={{ opacity: 0.4 }}
        >
          {[2, 6, 10, 14, 18].map((cy) => (
            <circle key={cy} cx="1" cy={cy} r="1" fill="var(--text-muted)" />
          ))}
        </svg>
      </div>

      {/* ---- Main panel ---- */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Sidebar tabs"
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            flexShrink: 0,
          }}
        >
          {(['chat', 'workflow'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === 'chat' ? 'Chat' : 'Workflow';
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(e) => handleTabKeyDown(e, tab)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  background: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? 'var(--accent, var(--snowflake-blue))' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  borderBottom: isActive
                    ? '2px solid var(--accent, var(--snowflake-blue))'
                    : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab panels */}
        <div
          id="tabpanel-chat"
          role="tabpanel"
          aria-labelledby="tab-chat"
          hidden={activeTab !== 'chat'}
          style={{
            flex: 1,
            display: activeTab === 'chat' ? 'flex' : 'none',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <ChatPanel
            messages={messages}
            isStreaming={isStreaming}
            reasoningStage={reasoningStage}
            agentName={agentName}
            agentDescription={agentDescription}
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            onSend={sendMessage}
          />
        </div>

        <div
          id="tabpanel-workflow"
          role="tabpanel"
          aria-labelledby="tab-workflow"
          hidden={activeTab !== 'workflow'}
          style={{
            flex: 1,
            display: activeTab === 'workflow' ? 'flex' : 'none',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          <AgentWorkflowViewer
            metadataEndpoint={metadataEndpoint}
            className="agent-sidebar-workflow"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat sub-panel
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  messages: CortexAgentMessage[];
  isStreaming: boolean;
  reasoningStage: string;
  agentName: string;
  agentDescription: string;
  suggestions?: string[];
  onSuggestionClick: (text: string) => void;
  onSend: (text: string) => Promise<void>;
}

function ChatPanel({
  messages,
  isStreaming,
  agentName,
  agentDescription,
  suggestions,
  onSuggestionClick,
  onSend,
}: ChatPanelProps) {
  const hasMessages = messages.length > 0;

  return (
    <CortexConversation className="agent-sidebar-chat">
      {!hasMessages ? (
        <CortexConversationEmptyState
          icon={
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(var(--accent-rgb, 41, 181, 232), 0.1)',
                color: 'var(--accent, var(--snowflake-blue))',
                fontSize: 24,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          }
          title={agentName}
          description={agentDescription}
          suggestions={suggestions}
          onSuggestionClick={onSuggestionClick}
        />
      ) : (
        <CortexConversationContent autoScroll>
          {messages.map((msg) => (
            <CortexMessage key={msg.id} from={msg.role}>
              <CortexMessageContent>
                {msg.content}
                {msg.isStreaming && <CortexMessageStreamingIndicator />}
              </CortexMessageContent>
            </CortexMessage>
          ))}
        </CortexConversationContent>
      )}

      {hasMessages && (
        <div style={{ position: 'relative' }}>
          <CortexConversationScrollButton />
        </div>
      )}

      <CortexPromptInput
        onSubmit={onSend}
        isLoading={isStreaming}
        placeholder={`Ask ${agentName}…`}
      />
    </CortexConversation>
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export type { AgentSidebarPanelProps };
export default AgentSidebarPanel;
