/**
 * CortexAgentChat - Reusable React Chat Widget for Snowflake Cortex Agents
 * 
 * Features:
 * - Streaming SSE responses from Cortex Agent API
 * - Multi-stage thinking indicators (classifying, searching, analyzing, generating)
 * - Tool call visualization (Analyst SQL, Search results)
 * - Source citations display
 * - Thread-based conversation context
 * - Typing animation for responses
 * - Suggested questions
 * - Error handling and retry
 * 
 * Usage:
 *   <CortexAgentChat 
 *     agentEndpoint="/api/agent/run"
 *     agentName="My Assistant"
 *     suggestedQuestions={["What are the top sales?", "Show me trends"]}
 *     onContextUpdate={(ctx) => console.log(ctx)}
 *   />
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Brain, 
  Search, 
  Database, 
  Zap,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Source[]
  toolCalls?: ToolCall[]
  sql?: string
  rowCount?: number
  isStreaming?: boolean
  isError?: boolean
}

interface Source {
  title: string
  snippet?: string
  score?: number
}

interface ToolCall {
  name: string
  type: 'cortex_analyst' | 'cortex_search' | 'custom'
  status: 'pending' | 'running' | 'complete' | 'error'
  input?: Record<string, any>
  output?: any
  sql?: string
  duration?: number
}

type ThinkingStage = 'idle' | 'classifying' | 'searching' | 'analyzing' | 'generating'

interface CortexAgentChatProps {
  agentEndpoint: string
  agentName?: string
  agentDescription?: string
  welcomeMessage?: string
  suggestedQuestions?: Array<{ text: string; icon?: string }>
  onContextUpdate?: (context: any) => void
  className?: string
  showToolCalls?: boolean
  showSources?: boolean
  maxHeight?: string
}

// ============================================================================
// Thinking Indicator Component
// ============================================================================

interface AIThinkingProps {
  stage: ThinkingStage
  toolName?: string
}

function AIThinking({ stage, toolName }: AIThinkingProps) {
  const stages = {
    idle: { icon: Brain, text: 'Ready', color: 'slate' },
    classifying: { icon: Brain, text: 'Understanding your question...', color: 'purple' },
    searching: { icon: Search, text: toolName ? `Searching ${toolName}...` : 'Searching knowledge base...', color: 'green' },
    analyzing: { icon: Database, text: toolName ? `Querying ${toolName}...` : 'Analyzing data...', color: 'blue' },
    generating: { icon: Sparkles, text: 'Generating response...', color: 'cyan' },
  }

  const current = stages[stage]
  const Icon = current.icon

  if (stage === 'idle') return null

  return (
    <div className="flex items-center gap-3 p-4 animate-fade-in">
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl bg-${current.color}-500/20 flex items-center justify-center`}>
          <Icon size={20} className={`text-${current.color}-400`} />
          <div className={`absolute inset-0 bg-${current.color}-500/20 rounded-xl animate-ping`} />
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm text-${current.color}-400 font-medium`}>
            {current.text}
          </span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 bg-${current.color}-400 rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-2 h-1 bg-navy-700 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r from-${current.color}-500 to-${current.color}-400 rounded-full animate-progress`}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Tool Call Display Component
// ============================================================================

interface ToolCallDisplayProps {
  toolCall: ToolCall
  expanded?: boolean
  onToggle?: () => void
}

function ToolCallDisplay({ toolCall, expanded = false, onToggle }: ToolCallDisplayProps) {
  const iconMap = {
    cortex_analyst: Database,
    cortex_search: Search,
    custom: Zap,
  }
  const Icon = iconMap[toolCall.type] || Zap

  const statusColors = {
    pending: 'text-slate-400',
    running: 'text-cyan-400 animate-pulse',
    complete: 'text-green-400',
    error: 'text-red-400',
  }

  return (
    <div className="mt-2 p-3 bg-navy-900/50 rounded-lg border border-navy-700">
      <button 
        onClick={onToggle}
        className="w-full flex items-center gap-2 text-left"
      >
        <Icon size={14} className={statusColors[toolCall.status]} />
        <span className="text-xs text-slate-300 font-medium flex-1">
          {toolCall.name}
        </span>
        {toolCall.duration && (
          <span className="text-xs text-slate-500">{toolCall.duration}ms</span>
        )}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 animate-slide-down">
          {toolCall.sql && (
            <div>
              <p className="text-xs text-cyan-400 mb-1">SQL Query</p>
              <pre className="text-xs text-slate-400 font-mono bg-navy-950 p-2 rounded overflow-x-auto">
                {toolCall.sql}
              </pre>
            </div>
          )}
          {toolCall.output && (
            <div>
              <p className="text-xs text-green-400 mb-1">Result</p>
              <pre className="text-xs text-slate-400 font-mono bg-navy-950 p-2 rounded overflow-x-auto max-h-32">
                {typeof toolCall.output === 'string' 
                  ? toolCall.output.substring(0, 500) 
                  : JSON.stringify(toolCall.output, null, 2).substring(0, 500)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Sources Display Component
// ============================================================================

interface SourcesDisplayProps {
  sources: Source[]
}

function SourcesDisplay({ sources }: SourcesDisplayProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-navy-600/50">
      <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
        <Search size={12} />
        Sources ({sources.length})
      </p>
      <div className="flex flex-wrap gap-1">
        {sources.map((source, i) => (
          <span
            key={i}
            className="text-xs px-2 py-1 bg-navy-600/50 text-accent-blue rounded-full hover:bg-navy-600 cursor-pointer"
            title={source.snippet}
          >
            {source.title}
            {source.score && <span className="text-slate-500 ml-1">({Math.round(source.score * 100)}%)</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Message Bubble Component
// ============================================================================

interface MessageBubbleProps {
  message: Message
  showToolCalls?: boolean
  showSources?: boolean
}

function MessageBubble({ message, showToolCalls = true, showSources = true }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [expandedTool, setExpandedTool] = useState<number | null>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
      .replace(/\n/g, '<br />')
      .replace(/• /g, '<span class="text-accent-blue">•</span> ')
      .replace(/`([^`]+)`/g, '<code class="bg-navy-700 px-1 rounded text-cyan-300">$1</code>')
  }

  return (
    <div className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        message.role === 'user'
          ? 'bg-gradient-to-br from-accent-blue to-accent-blue/70'
          : 'bg-gradient-to-br from-navy-600 to-navy-700 ring-1 ring-navy-500'
      }`}>
        {message.role === 'user' ? (
          <User size={16} className="text-white" />
        ) : (
          <Sparkles size={16} className="text-accent-blue" />
        )}
      </div>

      <div className={`max-w-[80%] rounded-2xl p-4 group relative ${
        message.role === 'user'
          ? 'bg-gradient-to-br from-accent-blue to-accent-blue/80 text-white'
          : message.isError
            ? 'bg-red-900/30 text-red-200 ring-1 ring-red-700'
            : 'bg-navy-700/80 text-slate-200 ring-1 ring-navy-600'
      }`}>
        {message.isStreaming && !message.content ? (
          <AIThinking stage="generating" />
        ) : (
          <>
            <div 
              className="text-sm whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-accent-blue animate-pulse rounded" />
            )}
          </>
        )}

        {/* Copy button */}
        {message.role === 'assistant' && !message.isStreaming && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-navy-600"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-slate-400" />}
          </button>
        )}

        {/* Tool calls */}
        {showToolCalls && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolCalls.map((tool, i) => (
              <ToolCallDisplay
                key={i}
                toolCall={tool}
                expanded={expandedTool === i}
                onToggle={() => setExpandedTool(expandedTool === i ? null : i)}
              />
            ))}
          </div>
        )}

        {/* Sources */}
        {showSources && message.sources && <SourcesDisplay sources={message.sources} />}
      </div>
    </div>
  )
}

// ============================================================================
// Main Chat Component
// ============================================================================

export function CortexAgentChat({
  agentEndpoint,
  agentName = 'AI Assistant',
  agentDescription = 'Powered by Snowflake Cortex',
  welcomeMessage,
  suggestedQuestions = [],
  onContextUpdate,
  className = '',
  showToolCalls = true,
  showSources = true,
  maxHeight = 'h-full',
}: CortexAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (welcomeMessage) {
      return [{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      }]
    }
    return []
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [thinkingStage, setThinkingStage] = useState<ThinkingStage>('idle')
  const [currentToolName, setCurrentToolName] = useState<string>()
  const [threadId, setThreadId] = useState<string | null>(null)
  const [lastMessageId, setLastMessageId] = useState<string>('0')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Parse SSE events from Cortex Agent
  const parseSSEEvent = useCallback((eventData: string): Partial<Message> | null => {
    try {
      const data = JSON.parse(eventData)
      
      // Handle different event types from Cortex Agent
      if (data.event_type === 'tool_start') {
        setThinkingStage(data.tool_type === 'cortex_search' ? 'searching' : 'analyzing')
        setCurrentToolName(data.tool_name)
        return null
      }
      
      if (data.event_type === 'tool_end') {
        setThinkingStage('generating')
        return null
      }
      
      if (data.event_type === 'text_delta') {
        return { content: data.text }
      }
      
      if (data.event_type === 'message_complete') {
        setLastMessageId(data.message_id || lastMessageId)
        return {
          sources: data.citations?.map((c: any) => ({
            title: c.source || c.title,
            snippet: c.text,
            score: c.score,
          })),
          toolCalls: data.tool_calls?.map((t: any) => ({
            name: t.name,
            type: t.type,
            status: 'complete',
            sql: t.sql,
            output: t.output,
            duration: t.duration_ms,
          })),
        }
      }
      
      // Fallback for simple response format
      if (data.response || data.content || data.text) {
        return { content: data.response || data.content || data.text }
      }
      
      return null
    } catch {
      return null
    }
  }, [lastMessageId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setThinkingStage('classifying')

    const placeholderId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }])

    try {
      const response = await fetch(agentEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ 
          message: input,
          thread_id: threadId,
          parent_message_id: lastMessageId,
        }),
      })

      // Check if response is SSE stream
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('text/event-stream')) {
        // Handle SSE streaming
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let finalSources: Source[] = []
        let finalToolCalls: ToolCall[] = []

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const eventData = line.slice(6)
                if (eventData === '[DONE]') continue

                const parsed = parseSSEEvent(eventData)
                if (parsed) {
                  if (parsed.content) {
                    fullContent += parsed.content
                    setMessages(prev => prev.map(msg =>
                      msg.id === placeholderId
                        ? { ...msg, content: fullContent }
                        : msg
                    ))
                  }
                  if (parsed.sources) finalSources = parsed.sources
                  if (parsed.toolCalls) finalToolCalls = parsed.toolCalls
                }
              }
            }
          }
        }

        // Final update
        setMessages(prev => prev.map(msg =>
          msg.id === placeholderId
            ? { 
                ...msg, 
                content: fullContent, 
                isStreaming: false,
                sources: finalSources,
                toolCalls: finalToolCalls,
              }
            : msg
        ))

        if (onContextUpdate) {
          onContextUpdate({ sources: finalSources, toolCalls: finalToolCalls })
        }

      } else {
        // Handle regular JSON response
        const data = await response.json()
        
        // Set thread ID if returned
        if (data.thread_id) setThreadId(data.thread_id)
        if (data.message_id) setLastMessageId(data.message_id)

        // Simulate streaming for better UX
        const fullText = data.response || data.content || data.text || ''
        let currentText = ''
        const words = fullText.split(' ')
        
        setThinkingStage('generating')
        
        for (let i = 0; i < words.length; i++) {
          currentText += (i > 0 ? ' ' : '') + words[i]
          const textToShow = currentText
          
          setMessages(prev => prev.map(msg =>
            msg.id === placeholderId
              ? { ...msg, content: textToShow, isStreaming: i < words.length - 1 }
              : msg
          ))
          
          await new Promise(resolve => setTimeout(resolve, 15))
        }

        // Final update with metadata
        setMessages(prev => prev.map(msg =>
          msg.id === placeholderId
            ? {
                ...msg,
                content: fullText,
                sources: data.sources?.map((s: any) => ({
                  title: s.title || s.source || s,
                  snippet: s.snippet || s.text,
                  score: s.score,
                })),
                toolCalls: data.tool_calls || data.toolCalls,
                sql: data.sql || data.context?.sql,
                rowCount: data.row_count || data.context?.row_count,
                isStreaming: false,
              }
            : msg
        ))

        if (data.context && onContextUpdate) {
          onContextUpdate(data.context)
        }
      }

    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => prev.map(msg =>
        msg.id === placeholderId
          ? {
              ...msg,
              content: 'Sorry, I encountered an error. Please try again.',
              isStreaming: false,
              isError: true,
            }
          : msg
      ))
    } finally {
      setIsLoading(false)
      setThinkingStage('idle')
      setCurrentToolName(undefined)
    }
  }

  const handleSuggestionClick = (text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      setMessages(prev => prev.slice(0, -1)) // Remove last assistant message
      setInput(lastUserMessage.content)
    }
  }

  return (
    <div className={`flex flex-col bg-gradient-to-b from-navy-900 to-navy-800 ${maxHeight} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-navy-700 bg-navy-800/50 backdrop-blur">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <div className="relative">
            <Bot className="text-accent-blue" size={20} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent-green rounded-full animate-pulse" />
          </div>
          {agentName}
          <span className="ml-auto text-xs text-slate-500 font-normal">
            {agentDescription}
          </span>
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message}
            showToolCalls={showToolCalls}
            showSources={showSources}
          />
        ))}

        {/* Thinking indicator */}
        {isLoading && thinkingStage !== 'idle' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-600 to-navy-700 ring-1 ring-navy-500 flex items-center justify-center">
              <Sparkles size={16} className="text-accent-blue" />
            </div>
            <div className="bg-navy-700/80 rounded-2xl ring-1 ring-navy-600 overflow-hidden">
              <AIThinking stage={thinkingStage} toolName={currentToolName} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 2 && suggestedQuestions.length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(q.text)}
                className="text-xs px-3 py-2 bg-navy-700/50 text-slate-300 rounded-full 
                         hover:bg-navy-600 hover:text-white transition-all duration-200
                         hover:scale-105 active:scale-95 flex items-center gap-1.5
                         ring-1 ring-navy-600 hover:ring-accent-blue/50"
              >
                {q.icon && <span>{q.icon}</span>}
                {q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error retry */}
      {messages.length > 0 && messages[messages.length - 1].isError && (
        <div className="px-4 pb-2">
          <button
            onClick={handleRetry}
            className="text-xs px-3 py-2 bg-red-900/30 text-red-300 rounded-lg 
                     hover:bg-red-900/50 transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Retry last message
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-navy-700 bg-navy-800/50 backdrop-blur">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${agentName}...`}
            className="flex-1 bg-navy-700/50 border border-navy-600 rounded-xl px-4 py-3 
                     text-slate-200 placeholder-slate-500 
                     focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue
                     transition-all duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-accent-blue to-accent-blue/80 
                     hover:from-accent-blue hover:to-accent-blue
                     disabled:from-navy-600 disabled:to-navy-600 disabled:cursor-not-allowed
                     text-white font-medium px-5 py-3 rounded-xl 
                     transition-all duration-200 flex items-center gap-2
                     hover:scale-105 active:scale-95 disabled:scale-100"
          >
            <Send size={18} />
          </button>
        </div>
      </form>

      {/* CSS for animations */}
      <style>{`
        @keyframes progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
        @keyframes slide-down {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 200px; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes slide-up {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default CortexAgentChat
