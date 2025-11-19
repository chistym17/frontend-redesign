// components/flows/VoiceFlowChatbotPanel.jsx - FIXED INFINITE LOOP
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Loader, Minimize2, Maximize2, Trash2, Download, AlertCircle, CheckCircle, Sparkles, X, Replace } from 'lucide-react';
import Image from 'next/image';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://176.9.16.194:5403/api';

export default function VoiceFlowChatbotPanel({
  assistantId,
  currentFlow,
  onApplyFlow,
  onPreviewFlow,
  sessionId,
  isMinimized,
  onToggleMinimize
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your Voice Flow Designer. I can help you create conversational voice flows.\n\nTell me what kind of conversation flow you need, and I\'ll generate it for you!',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contextSet, setContextSet] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // FIX: Memoize the context setting function
  const setContextInBackground = useCallback(async () => {
    if (!assistantId && !currentFlow) return;
    
    try {
      console.log('Setting context...', { assistantId, hasFlow: !!currentFlow });
      await fetch(`${API_BASE}/voice-flow-chatbot/set-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          assistant_id: assistantId,
          current_flow: currentFlow
        })
      });
      console.log('✓ Context set successfully');
      setContextSet(true);
    } catch (e) {
      console.warn('Context setting failed:', e);
    }
  }, [assistantId, sessionId]); // FIX: Remove currentFlow from dependencies

  // FIX: Only set context once on mount if assistantId exists
  useEffect(() => {
    if (assistantId && !contextSet) {
      console.log('Initial context setup for assistant:', assistantId);
      setContextInBackground();
    }
  }, [assistantId, contextSet, setContextInBackground]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    }]);

    setLoading(true);

    try {
      // Set context with current flow before sending message
      if (currentFlow) {
        await fetch(`${API_BASE}/voice-flow-chatbot/set-context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            assistant_id: assistantId,
            current_flow: currentFlow
          })
        });
      }

      const response = await fetch(`${API_BASE}/voice-flow-chatbot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          assistant_id: assistantId,
          current_flow: currentFlow
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.flow) {
        // Add success message with flow
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.explanation,
          flow: data.flow,
          tools: data.tools || [],
          warnings: data.warnings || [],
          suggestions: data.suggestions || [],
          timestamp: Date.now()
        }]);
      } else {
        // Add error message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || 'Failed to generate flow. Please try again.',
          isError: true,
          timestamp: Date.now()
        }]);
      }
    } catch (e) {
      console.error('Chat error:', e);
      setError(e.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${e.message}\n\nPlease try again or rephrase your request.`,
        isError: true,
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleApply = (msg) => {
    if (onApplyFlow && msg.flow) {
      // Pass both flow AND tools to the handler
      onApplyFlow(msg.flow, msg.tools || []);
      setMessages(prev => [...prev, {
        role: 'system',
        content: '✅ Flow applied to canvas successfully!',
        timestamp: Date.now()
      }]);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear conversation history?')) return;

    try {
      await fetch(`${API_BASE}/voice-flow-chatbot/clear-history?session_id=${sessionId}`, {
        method: 'POST'
      });
      setMessages([{
        role: 'assistant',
        content: 'History cleared. Let\'s start fresh! What flow do you want to create?',
        timestamp: Date.now()
      }]);
      setContextSet(false); // Reset context flag
    } catch (e) {
      console.error('Clear history error:', e);
    }
  };

  const exportFlow = (flow) => {
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_flow_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Minimized view - removed chat bubble icon
  if (isMinimized) {
    return null;
  }

  return (
   <div 
  className="h-[89vh] rounded-2xl shadow-2xl flex flex-col overflow-y-auto"
  style={{
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  }}
>

      {/* Header */}
      <div 
        className="px-4 py-2.5 flex items-center justify-between"
        style={{
          background: 'rgba(19, 245, 132, 0.24)'
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center">
            <Image 
              src="/images/ai2.svg"
              alt="Chatbot"
              width={40}
              height={40}
              className="rounded-lg"
            />

          </div>
          <div>
            <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Public Sans' }}>AI Asistance</h3>
          </div>
        </div>
        <button
          onClick={onToggleMinimize}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors hover:bg-white/10"
          style={{
            background: 'rgba(19, 245, 132, 0.08)'
          }}
          title="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.0202 11.4336H3.98021C3.18688 11.4336 2.54688 10.7936 2.54688 10.0002C2.54688 9.20689 3.18688 8.56689 3.98021 8.56689H16.0202C16.8135 8.56689 17.4535 9.20689 17.4535 10.0002C17.4535 10.7936 16.8135 11.4336 16.0202 11.4336Z" fill="white"/>
          </svg>

        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={` flex flex-col ${msg.role === 'user' ? 'items-end pl-10' : 'items-start pr-10'}`}
          >
            {/* Message bubble */}
            <div className={`max-w-[85%] ${
              msg.role === 'user' 
                ? 'rounded-tl-2xl rounded-tr-none rounded-br-2xl rounded-bl-2xl p-3'
                : msg.role === 'system'
                  ? 'rounded-xl p-3 bg-green-600/20 text-green-300 border border-green-600/30'
                  : msg.isError
                    ? 'rounded-xl p-3 bg-red-600/20 text-red-300 border border-red-600/30'
                    : 'rounded-tl-none rounded-tr-2xl rounded-br-2xl rounded-bl-2xl p-4'
            }`}
            style={msg.role === 'user' 
              ? {
                  background: 'rgba(19, 245, 132, 0.12)',
                  boxShadow: '0px 1px 1px -0.5px rgba(0, 0, 0, 0.09)'
                }
              : msg.role !== 'system' && !msg.isError
                ? {
                    background: 'rgba(63, 67, 70, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }
                : {}
            }>
              {/* Message content */}
              <div 
                className="text-sm whitespace-pre-wrap"
                style={msg.role === 'user' 
                  ? { color: '#13F584' }
                  : msg.role !== 'system' && !msg.isError
                    ? { color: 'rgba(255, 255, 255, 0.72)' }
                    : {}
                }
              >
                {msg.content}
              </div>

              {/* Warnings */}
              {msg.warnings && msg.warnings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-xs text-yellow-400 mb-2">
                    <AlertCircle className="w-3 h-3" />
                    <span>Warnings</span>
                  </div>
                  <ul className="space-y-1">
                    {msg.warnings.map((warning, i) => (
                      <li key={i} className="text-xs text-yellow-300">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Suggestions</span>
                  </div>
                  <ul className="space-y-1">
                    {msg.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-xs text-green-300">• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Flow actions */}
              {msg.flow && (
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span>Flow generated: {msg.flow.nodes?.length || 0} nodes, {msg.flow.edges?.length || 0} edges</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApply(msg)}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Apply to Canvas
                    </button>
                    <button
                      onClick={() => exportFlow(msg.flow)}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs transition-all"
                      title="Export flow"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tools */}
              {msg.tools && msg.tools.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-xs text-emerald-300 mb-2">
                    <Sparkles className="w-3 h-3" />
                    <span>{msg.tools.length} Tool{msg.tools.length > 1 ? 's' : ''} Suggested</span>
                  </div>
                  <div className="space-y-2">
                    {msg.tools.map((tool, i) => (
                      <div key={i} className="bg-gray-900/50 rounded-lg p-2 border border-gray-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-xs font-medium text-white">{tool.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{tool.description}</div>
                            <div className="text-xs text-gray-500 mt-1">{tool.method} • {tool.endpoint_url}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    💡 Tools will be created when you apply the flow. Enable and verify them in Tool Management.
                  </div>
                </div>
              )}
            </div>

            {/* Role and Timestamp under the bubble, aligned to side */}
            <div 
              className={`text-xs flex items-center gap-1.5 max-w-[85%] ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
              style={{ color: 'rgba(255, 255, 255, 0.32)', marginTop: '0.25rem' }}
            >
              {msg.role === 'user' && <span style={{ color: 'rgba(255, 255, 255, 0.48)' }}>You</span>}
              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="text-sm text-gray-300">Generating flow...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>


      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-600/20 border-y border-red-600/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-300 flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 pt-0">
        <div 
          className="flex items-center justify-between gap-4 px-1 py-1 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
       
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a anything"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none px-4"
            style={{ color: '#919EAB' }}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
         
          >
            {loading ? (
              <Loader className="w-5 h-5 text-white animate-spin" />
            ) : (
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#13F584" fill-opacity="0.08"/>
              <path d="M27.6528 18.9101L12.9949 11.76C12.8689 11.6985 12.7305 11.6665 12.5902 11.6665C12.0803 11.6665 11.667 12.0798 11.667 12.5897V12.6163C11.667 12.7402 11.6822 12.8636 11.7122 12.9838L13.1183 18.6079C13.1567 18.7616 13.2866 18.8751 13.4439 18.8926L19.6239 19.5792C19.8382 19.603 20.0003 19.7842 20.0003 19.9998C20.0003 20.2155 19.8382 20.3967 19.6239 20.4204L13.4439 21.1071C13.2866 21.1246 13.1567 21.2381 13.1183 21.3917L11.7122 27.0158C11.6822 27.1361 11.667 27.2595 11.667 27.3833V27.41C11.667 27.9198 12.0803 28.3332 12.5902 28.3332C12.7305 28.3332 12.8689 28.3012 12.9949 28.2397L27.6528 21.0895C28.0693 20.8864 28.3337 20.4634 28.3337 19.9998C28.3337 19.5363 28.0693 19.1133 27.6528 18.9101Z" fill="#13F584"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}