// components/textflow/components/FlowChatbotPanel.js
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  AlertCircle, Bot,
  CheckCircle, Trash2, Eye, Code, Lightbulb, X, Minimize2, Loader
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "https://176.9.16.194:5403/api";

export default function FlowChatbotPanel({ 
  currentFlow, 
  onApplyFlow, 
  onPreviewFlow,
  sessionId,
  isMinimized = false,
  onToggleMinimize,
  onCloseChatbot = null
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
        const responseText = await response.text();
        const isHTML = responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html');
        
        if (isHTML) {
          throw new Error('SERVICE_UNAVAILABLE');
        } else {
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || errorData.error || 'SERVICE_UNAVAILABLE');
          } catch {
            throw new Error('SERVICE_UNAVAILABLE');
          }
        }
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
          content: "Service not available now",
        timestamp: Date.now(),
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
          className="w-16 h-16 rounded-full bg-white/5 border border-white/10 shadow-2xl flex items-center justify-center transition-all hover:scale-110"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <div className="relative w-11 h-11 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-[#13F584] opacity-40 blur-md" />
            <div className="relative w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Image src="/images/ai2.svg" alt="AI Assistant" width={28} height={28} priority />
            </div>
          </div>
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
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(19, 245, 132, 0.24)" }}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-11 h-11 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-[#13F584] opacity-30 blur-md" />
            <div className="relative w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Image src="/images/ai2.svg" alt="AI Assistant" width={32} height={32} priority />
            </div>
          </div>
          <div>
            <h3
              className="text-white font-semibold text-lg"
              style={{ fontFamily: "Public Sans, sans-serif" }}
            >
              AI Asistance
            </h3>
            <p className="text-white/80 text-xs">Chat to create workflows</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await handleClearChat();
              if (onCloseChatbot) {
                onCloseChatbot();
              }
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors hover:bg-white/15 border border-white/10"
            style={{ background: "rgba(19, 245, 132, 0.08)" }}
            title="Clear & Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16.0202 11.4336H3.98021C3.18688 11.4336 2.54688 10.7936 2.54688 10.0002C2.54688 9.20689 3.18688 8.56689 3.98021 8.56689H16.0202C16.8135 8.56689 17.4535 9.20689 17.4535 10.0002C17.4535 10.7936 16.8135 11.4336 16.0202 11.4336Z"
                fill="white"
              />
            </svg>
          </button>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors hover:bg-white/15 border border-white/10"
              style={{ background: "rgba(19, 245, 132, 0.08)" }}
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
          <div className="flex items-center gap-2 text-gray-400">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs tracking-wide text-white/60">Thinking...</span>
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
      <div className="px-4 pb-4 pt-2">
        <div
          className="flex items-center justify-between gap-4 px-1 py-1 rounded-xl"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything"
            className="flex-1 bg-transparent text-sm text-white placeholder-[#919EAB] resize-none focus:outline-none px-4 py-2 leading-relaxed"
            style={{ fontFamily: "Public Sans, sans-serif" }}
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 text-white animate-spin" />
            ) : (
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="#13F584" fillOpacity="0.08" />
                <path
                  d="M27.6528 18.9101L12.9949 11.76C12.8689 11.6985 12.7305 11.6665 12.5902 11.6665C12.0803 11.6665 11.667 12.0798 11.667 12.5897V12.6163C11.667 12.7402 11.6822 12.8636 11.7122 12.9838L13.1183 18.6079C13.1567 18.7616 13.2866 18.8751 13.4439 18.8926L19.6239 19.5792C19.8382 19.603 20.0003 19.7842 20.0003 19.9998C20.0003 20.2155 19.8382 20.3967 19.6239 20.4204L13.4439 21.1071C13.2866 21.1246 13.1567 21.2381 13.1183 21.3917L11.7122 27.0158C11.6822 27.1361 11.667 27.2595 11.667 27.3833V27.41C11.667 27.9198 12.0803 28.3332 12.5902 28.3332C12.7305 28.3332 12.8689 28.3012 12.9949 28.2397L27.6528 21.0895C28.0693 20.8864 28.3337 20.4634 28.3337 19.9998C28.3337 19.5363 28.0693 19.1133 27.6528 18.9101Z"
                  fill="#13F584"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isError = Boolean(message.error || message.isError);

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div
          className="px-4 py-2 rounded-full text-xs text-gray-300 border"
          style={{
            background: "rgba(19, 245, 132, 0.16)",
            borderColor: "rgba(255, 255, 255, 0.12)"
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  const bubbleShape = isUser
    ? "rounded-tl-2xl rounded-tr-none rounded-br-2xl rounded-bl-2xl ml-auto"
    : "rounded-tr-2xl rounded-tl-none rounded-br-2xl rounded-bl-2xl";

  const bubbleStyle = (() => {
    if (isError) {
      return {
        background: "rgba(220, 38, 38, 0.18)",
        border: "1px solid rgba(248, 113, 113, 0.35)"
      };
    }
    if (isUser) {
      return {
        background: "rgba(19, 245, 132, 0.12)",
        boxShadow: "0px 1px 1px -0.5px rgba(0, 0, 0, 0.09)"
      };
    }
    return {
      background: "rgba(63, 67, 70, 0.3)",
      border: "1px solid rgba(255, 255, 255, 0.1)"
    };
  })();

  const textStyle = {
    color: isError
      ? "#FECACA"
      : isUser
        ? "#13F584"
        : "rgba(255, 255, 255, 0.72)"
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col gap-2 max-w-[85%] w-full">
        <div className={`px-4 py-3 ${bubbleShape}`} style={bubbleStyle}>
          <p className="text-sm whitespace-pre-wrap break-words" style={textStyle}>
            {message.content}
          </p>
        </div>

        {/* Warnings */}
        {message.warnings && message.warnings.length > 0 && (
          <div className="space-y-1 max-w-[85%]">
            {message.warnings.map((warning, i) => (
              <div
                key={i}
                className="flex items-start gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-yellow-200">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="space-y-1 max-w-[85%]">
            {message.suggestions.map((suggestion, i) => (
              <div
                key={i}
                className="flex items-start gap-2 px-3 py-2 rounded-lg border bg-emerald-500/10 border-emerald-500/30"
              >
                <Lightbulb className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-emerald-200">{suggestion}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {message.error && message.error !== message.content && (
          <div className="max-w-[85%] flex items-start gap-2 px-3 py-2 bg-red-600/15 border border-red-600/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-red-200">{message.error}</span>
          </div>
        )}

        {/* Success indicator */}
        {message.success && message.flow && (
          <div className="max-w-[85%] flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <CheckCircle className="w-4 h-4 text-emerald-300" />
            <span className="text-xs text-emerald-200">
              Flow generated: {message.flow.nodes?.length || 0} nodes
            </span>
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-[10px] flex items-center gap-1 ${isUser ? "justify-end" : "justify-start"}`}
          style={{ color: "rgba(255, 255, 255, 0.35)" }}
        >
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}