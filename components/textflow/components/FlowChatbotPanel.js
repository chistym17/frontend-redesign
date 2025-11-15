// components/textflow/components/FlowChatbotPanel.js
import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, Send, Sparkles, Bot, User, AlertCircle, 
  CheckCircle, Trash2, Eye, Code, Lightbulb, X, Minimize2, Maximize2
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "https://176.9.16.194:5403/api";

export default function FlowChatbotPanel({ 
  currentFlow, 
  onApplyFlow, 
  onPreviewFlow,
  sessionId,
  isMinimized = false,
  onToggleMinimize
}) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your Flow Builder assistant. I can help you create workflows through conversation. Try saying things like:\n\n• \"Create a flow that fetches weather data and summarizes it\"\n• \"Add an HTTP node that calls the GitHub API\"\n• \"Add error handling to this flow\"",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewFlow, setPreviewFlow] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    setMessages(prev => [
      ...prev,
      { role: "user", content: userMessage, timestamp: Date.now() }
    ]);

    setIsLoading(true);

    try {
      const response = await fetch(`${BASE}/textflow/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          current_flow: currentFlow
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage = {
        role: "assistant",
        content: data.explanation,
        timestamp: Date.now(),
        flow: data.flow,
        warnings: data.warnings || [],
        suggestions: data.suggestions || [],
        error: data.error,
        success: data.success
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If flow was generated successfully, set it for preview
      if (data.success && data.flow) {
        setPreviewFlow(data.flow);
        setShowPreview(true);
      }

    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}`,
          timestamp: Date.now(),
          error: error.message,
          success: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreview = () => {
    if (previewFlow && onApplyFlow) {
      onApplyFlow(previewFlow);
      setShowPreview(false);
      setPreviewFlow(null);
      
      setMessages(prev => [
        ...prev,
        {
          role: "system",
          content: "✓ Flow applied to editor",
          timestamp: Date.now()
        }
      ]);
    }
  };

  const handleClearChat = async () => {
    try {
      await fetch(`${BASE}/textflow/chatbot/clear-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId })
      });
      
      setMessages([
        {
          role: "assistant",
          content: "Chat history cleared. How can I help you build a new flow?",
          timestamp: Date.now()
        }
      ]);
      setPreviewFlow(null);
      setShowPreview(false);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggleMinimize}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-2xl flex items-center justify-center transition-all hover:scale-110 group"
        >
          <Bot className="w-6 h-6 text-white group-hover:animate-pulse" />
          {messages.length > 1 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {messages.length - 1}
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div 
      className="h-full flex flex-col rounded-3xl shadow-2xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Flow Builder AI</h3>
            <p className="text-white/80 text-xs">Chat to create workflows</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-3 text-gray-400">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(19, 245, 132, 0.16)'
              }}
            >
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Preview Panel */}
      {showPreview && previewFlow && (
        <div 
          className="mx-4 mb-4 p-4 rounded-xl border"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            borderColor: 'rgba(255, 255, 255, 0.12)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">Flow Preview</span>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div 
            className="rounded-lg p-3 mb-3 max-h-32 overflow-y-auto font-mono text-xs text-gray-300"
            style={{
              background: 'rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="text-emerald-400 mb-1">
              {previewFlow.nodes?.length || 0} nodes, {previewFlow.edges?.length || 0} edges
            </div>
            {previewFlow.nodes?.slice(0, 3).map((node, i) => (
              <div key={i} className="text-gray-300">
                • {node.type}: {node.data?.label}
              </div>
            ))}
            {previewFlow.nodes?.length > 3 && (
              <div className="text-gray-400">... and {previewFlow.nodes.length - 3} more</div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleApplyPreview}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Apply to Editor
            </button>
            <button
              onClick={() => {
                if (onPreviewFlow) {
                  onPreviewFlow(previewFlow);
                }
              }}
              className="px-4 py-2 text-white rounded-lg text-sm font-semibold transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the flow you want to create..."
            className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 resize-none transition-all focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <Sparkles className="w-3 h-3" />
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div 
          className="px-4 py-2 rounded-full text-xs text-gray-300 border"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.12)'
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? "bg-gradient-to-br from-blue-500 to-cyan-500" 
          : "bg-gradient-to-br from-green-500 to-emerald-600"
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div 
          className={`px-4 py-3 rounded-2xl max-w-[85%] ${
            isUser
              ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white ml-auto"
              : "text-white"
          }`}
          style={!isUser ? {
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          } : {}}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Warnings */}
        {message.warnings && message.warnings.length > 0 && (
          <div className="space-y-1">
            {message.warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 bg-yellow-950/40 border border-yellow-800/50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-yellow-300">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="space-y-1">
            {message.suggestions.map((suggestion, i) => (
              <div 
                key={i} 
                className="flex items-start gap-2 px-3 py-2 rounded-lg border"
                style={{
                  background: 'rgba(19, 245, 132, 0.16)',
                  borderColor: 'rgba(19, 245, 132, 0.3)'
                }}
              >
                <Lightbulb className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-emerald-300">{suggestion}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {message.error && (
          <div className="flex items-start gap-2 px-3 py-2 bg-red-950/40 border border-red-800/50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-red-300">{message.error}</span>
          </div>
        )}

        {/* Success indicator */}
        {message.success && message.flow && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/40 border border-emerald-800/50 rounded-lg">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">
              Flow generated: {message.flow.nodes?.length || 0} nodes
            </span>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-gray-500 px-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}