import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, X, Send, Sparkles, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { aiService } from '@/services/aiService';
import type { ChatMessage, ChatContext } from '@/services/aiService';

interface ExtendedChatMessage extends ChatMessage {
  id: string;
  tool_used?: boolean;
  tools_used?: string[];
  isError?: boolean;
}

const formatToolNames = (tools: string[]): string => {
  const map: Record<string, string> = {
    'calculate': 'Calculated',
    'search_inventory': 'Checked Inventory',
    'get_inventory_summary': 'Checked Inventory',
    'get_low_stock_items': 'Checked Inventory',
    'get_my_borrowings': 'Checked My Borrowings',
    'get_my_supply_requests': 'Checked My Supply Requests',
  };
  
  const formatted = Array.from(new Set(tools.map(t => map[t] || 'Checked System')));
  return formatted.join(' · ');
};

export const GlobalAIAssistant: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    { id: 'initial', role: 'assistant', content: 'Hi there! I am your Local AI Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    const apiMessages = [...messages, userMsg].filter(m => m.role !== 'tool' && !m.isError).map(m => ({
      role: m.role,
      content: m.content
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const context: ChatContext = {
      current_route: location.pathname,
      current_page: document.title
    };

    try {
      const response = await aiService.chat(apiMessages, context);
      
      if (response.success && response.data) {
        const astMsg: ExtendedChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message,
          tool_used: response.data.tool_used,
          tools_used: response.data.tools_used
        };
        setMessages(prev => [...prev, astMsg]);
      } else {
        throw new Error(response.message || 'Unknown error');
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: err.response?.data?.message || err.message || 'Sorry, I encountered an error.',
        isError: true
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const fabStyle: React.CSSProperties = {
    position: 'fixed',
    right: 18,
    bottom: 80,
    zIndex: 80,
  };

  const fabButton = (
    <button
      onClick={() => setOpen(!open)}
      aria-label="Toggle AI Assistant"
      title="Local AI Assistant"
      style={{
        width: 56, height: 56,
        borderRadius: 999, border: 'none',
        background: '#4F46E5', color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 18px rgba(79, 70, 229, 0.4)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {open ? <X size={24} /> : <Bot size={28} />}
    </button>
  );

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    bottom: 68,
    width: 'min(90vw, 360px)',
    height: 'min(70vh, 600px)',
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 16px 48px rgba(2,6,23,0.18)',
    border: '1px solid #E6EDF4',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  return (
    <div style={fabStyle}>
      <div style={{ position: 'relative' }}>
        {open && (
          <div style={panelStyle}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', background: '#4F46E5', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={20} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>AI Assistant</div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>Local AI • Powered by Ollama</div>
                </div>
              </div>
              <button onClick={() => setMessages([messages[0]])} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, opacity: 0.8, padding: 4 }}>
                Clear
              </button>
            </div>
            
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16, background: '#F8FAFC' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  
                  {msg.tool_used && msg.tools_used && msg.tools_used.length > 0 && (
                    <div style={{ fontSize: 11, color: '#059669', background: '#D1FAE5', padding: '2px 8px', borderRadius: 12, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <Sparkles size={12} />
                      ⚡ {formatToolNames(msg.tools_used)}
                    </div>
                  )}

                  {msg.isError && (
                    <div style={{ fontSize: 11, color: '#DC2626', background: '#FEE2E2', padding: '2px 8px', borderRadius: 12, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <AlertTriangle size={12} />
                      Connection Error
                    </div>
                  )}

                  <div style={{
                    maxWidth: '90%',
                    padding: '10px 14px',
                    borderRadius: 16,
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 16,
                    background: msg.role === 'user' ? '#0B3D91' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#1E293B',
                    fontSize: 14,
                    lineHeight: 1.5,
                    boxShadow: msg.role === 'assistant' ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                    border: msg.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
                  }}>
                    {msg.role === 'assistant' ? (
                      <div className="markdown-body" style={{ margin: 0 }}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: 16, borderBottomLeftRadius: 4, background: '#fff', border: '1px solid #E2E8F0', color: '#64748B', fontSize: 13, display: 'flex', gap: 6
                  }}>
                    <div className="typing-dot" style={{ animationDelay: '0s' }}>.</div>
                    <div className="typing-dot" style={{ animationDelay: '0.2s' }}>.</div>
                    <div className="typing-dot" style={{ animationDelay: '0.4s' }}>.</div>
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: 12, borderTop: '1px solid #E2E8F0', background: '#fff', display: 'flex', gap: 8 }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={loading}
                style={{
                  flex: 1,
                  resize: 'none',
                  border: '1px solid #CBD5E1',
                  borderRadius: 20,
                  padding: '10px 14px',
                  fontSize: 14,
                  height: 42,
                  maxHeight: 120,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  width: 42, height: 42, borderRadius: 21, border: 'none',
                  background: input.trim() && !loading ? '#4F46E5' : '#E2E8F0',
                  color: input.trim() && !loading ? '#fff' : '#94A3B8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  flexShrink: 0, transition: 'background 0.2s'
                }}
              >
                <Send size={18} />
              </button>
            </div>
            <style>{`
              .typing-dot { animation: typing 1.4s infinite ease-in-out both; }
              @keyframes typing { 0%, 80%, 100% { opacity: 0; } 40% { opacity: 1; } }
              .markdown-body p { margin-top: 0; margin-bottom: 0.5em; }
              .markdown-body p:last-child { margin-bottom: 0; }
              .markdown-body ul, .markdown-body ol { margin-top: 0.5em; margin-bottom: 0.5em; padding-left: 1.5em; }
              .markdown-body code { background: rgba(0,0,0,0.05); padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
              .markdown-body pre { background: #f1f5f9; padding: 1em; border-radius: 8px; overflow-x: auto; margin-top: 0.5em; margin-bottom: 0.5em; }
              .markdown-body pre code { background: transparent; padding: 0; border-radius: 0; }
              .markdown-body strong { font-weight: 600; color: #0f172a; }
            `}</style>
          </div>
        )}
        {fabButton}
      </div>
    </div>
  );
};
