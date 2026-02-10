/**
 * ChatAnalytics - Split view with AI chat and live analytics
 * 
 * Use cases: Conversational BI, AI-powered data exploration, executive Q&A
 * Features: Chat interface, dynamic chart updates, context-aware visualizations
 * 
 * CUSTOMIZATION GUIDE:
 * 1. Replace mock sendMessage with your Cortex Agent API call
 * 2. Update chart components based on query results
 * 3. Customize suggested questions for your domain
 * 4. Add your KPI definitions
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BarChart3, TrendingUp, Users } from 'lucide-react';

// Import from your local copies
import { KPICard } from '../charts/KPICard';
import { LineChart } from '../charts/LineChart';
import { BarChart } from '../charts/BarChart';
import { KPIGrid } from '../layouts/KPIGrid';
import { SplitView } from '../layouts/SplitView';
import { formatCurrency, formatNumber } from '../formatters';

// =============================================================================
// TYPES
// =============================================================================

export interface ChatAnalyticsProps {
  /** Page title */
  title?: string;
  /** Suggested questions to show */
  suggestedQuestions?: string[];
  /** Dark mode */
  isDark?: boolean;
  /** Handler for sending messages - implement your Cortex Agent call here */
  onSendMessage?: (message: string) => Promise<ChatResponse>;
  /** Initial KPI data */
  initialKPIs?: KPIItem[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: QueryResult;
}

interface QueryResult {
  sql?: string;
  rows?: Record<string, unknown>[];
  chartType?: 'line' | 'bar' | 'kpi';
}

interface ChatResponse {
  content: string;
  data?: QueryResult;
}

interface KPIItem {
  label: string;
  value: number;
  change?: number;
  format: 'currency' | 'number' | 'percent';
}

// =============================================================================
// DEFAULT DATA
// =============================================================================

const defaultSuggestedQuestions = [
  "What's our marketing ROI by channel?",
  "Show me customer acquisition cost trends",
  "Which campaigns performed best this quarter?",
  "Compare revenue across regions",
];

const defaultKPIs: KPIItem[] = [
  { label: 'Total Revenue', value: 1250000, change: 12.5, format: 'currency' },
  { label: 'Active Users', value: 48500, change: 8.2, format: 'number' },
  { label: 'Conversion', value: 3.8, change: 0.5, format: 'percent' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function ChatAnalytics({
  title = 'Analytics Assistant',
  suggestedQuestions = defaultSuggestedQuestions,
  isDark = false,
  onSendMessage,
  initialKPIs = defaultKPIs,
}: ChatAnalyticsProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChart, setCurrentChart] = useState<QueryResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // If custom handler provided, use it; otherwise mock response
      const response = onSendMessage 
        ? await onSendMessage(text)
        : await mockResponse(text);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        data: response.data,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update the analytics panel with new data
      if (response.data) {
        setCurrentChart(response.data);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Chat Panel Content
  const chatPanel = (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Ask me anything about your data
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              I can analyze metrics, generate reports, and provide insights.
            </p>
            
            {/* Suggested Questions */}
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="block w-full text-left px-4 py-2 rounded-lg
                    bg-gray-100 dark:bg-gray-700 
                    hover:bg-gray-200 dark:hover:bg-gray-600
                    text-sm text-gray-700 dark:text-gray-300
                    transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.data?.sql && (
                  <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-x-auto">
                    {msg.data.sql}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 rounded-lg
              bg-gray-100 dark:bg-gray-700
              border-0 focus:ring-2 focus:ring-blue-500
              text-gray-900 dark:text-white
              placeholder-gray-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 rounded-lg
              bg-blue-500 hover:bg-blue-600 
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // Analytics Panel Content
  const analyticsPanel = (
    <div className="space-y-6">
      {/* KPIs */}
      <KPIGrid columns={3}>
        {initialKPIs.map((kpi, i) => (
          <KPICard
            key={i}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            format={kpi.format}
            size="sm"
            isDark={isDark}
          />
        ))}
      </KPIGrid>

      {/* Dynamic Chart Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {currentChart?.rows ? (
          currentChart.chartType === 'bar' ? (
            <BarChart
              data={currentChart.rows as any}
              title="Query Results"
              size="md"
              isDark={isDark}
            />
          ) : (
            <LineChart
              data={currentChart.rows as any}
              title="Query Results"
              size="md"
              isDark={isDark}
              showGrid
            />
          )
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ask a question to see visualizations</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)]">
      <SplitView
        leftPanel={chatPanel}
        rightPanel={analyticsPanel}
        leftTitle={title}
        rightTitle="Live Analytics"
        splitRatio="1/2"
        collapsible
        isDark={isDark}
      />
    </div>
  );
}

// =============================================================================
// MOCK RESPONSE (Replace with actual Cortex Agent call)
// =============================================================================

async function mockResponse(question: string): Promise<ChatResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simple mock responses based on keywords
  if (question.toLowerCase().includes('roi')) {
    return {
      content: 'Here\'s the marketing ROI breakdown by channel. Email has the highest ROI at 4.2x, followed by Organic Search at 3.8x.',
      data: {
        chartType: 'bar',
        rows: [
          { name: 'Email', value: 4.2 },
          { name: 'Organic', value: 3.8 },
          { name: 'Paid Ads', value: 2.1 },
          { name: 'Social', value: 1.8 },
        ],
      },
    };
  }

  if (question.toLowerCase().includes('trend') || question.toLowerCase().includes('cost')) {
    return {
      content: 'Customer acquisition costs have been trending down over the past 6 months, from $45 to $38.',
      data: {
        chartType: 'line',
        rows: [
          { date: 'Jan', value: 45 },
          { date: 'Feb', value: 44 },
          { date: 'Mar', value: 42 },
          { date: 'Apr', value: 41 },
          { date: 'May', value: 39 },
          { date: 'Jun', value: 38 },
        ],
      },
    };
  }

  return {
    content: 'I can help you analyze that. Could you be more specific about what metrics or time period you\'re interested in?',
  };
}

export default ChatAnalytics;
