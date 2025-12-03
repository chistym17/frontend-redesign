import React, { useState, useRef, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import Image from 'next/image';

const ChatWidget = ({ messages, onSendMessage, isTyping, isConnected, streamingMessage, onStartNewSession, onLoadPreviousSession, currentSessionId, isLoadingSession = false, loadingSessionType = null }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && isConnected) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle streaming message updates
  useEffect(() => {
    if (streamingMessage) {
      scrollToBottom();
    }
  }, [streamingMessage]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5  backdrop-blur-xl">
      <style>{`
        @keyframes typing-wave {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
        .typing-dot {
          animation: typing-wave 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        .typing-dot:nth-child(3) { animation-delay: 0s; }
      `}</style>
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4  px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
          {/* Expanding Glow (softened) */}
          <div
            className="
              absolute 
              w-[60px] 
              h-[60px] 
              rounded-full 
              bg-[radial-gradient(circle,rgba(19,245,132,0.35),rgba(19,245,132,0)_70%)]
              blur-[12px]
            "
          ></div>

          {/* Icon without extra ring borders */}
          <Image
            src="/images/voiceAi.svg"
            alt="AI Assistant"
            width={45}
            height={45}
            className="relative z-10"
          />
          </div>
          <div>
            <h2 className="text-sm font-medium text-white">AI Asistance</h2>
            <p className="text-[10px] text-white/50">
              {isConnected ? "Ready to chat" : "Connecting..."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {(isConnected || isLoadingSession) && (
            <button
              type="button"
              onClick={onLoadPreviousSession}
              disabled={isLoadingSession}
              className="inline-flex items-center justify-center rounded-[8px] bg-white/5 px-4 py-2.5 text-[11px] font-medium text-white transition-all duration-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous session
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden px-6 py-6">
        <div className="h-full overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {isLoadingSession ? (
            <div className="flex h-full items-center justify-center px-6">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin"></div>
                <p className="text-xs text-white/60 text-center">
                  {loadingSessionType === 'new' ? 'Loading new session...' : loadingSessionType === 'agent' ? 'Switching agent...' : 'Loading previous session...'}
                </p>
              </div>
            </div>
          ) : messages.length === 0 && !streamingMessage && !isTyping ? (
            <div className="flex h-full items-center justify-center px-6">
              <p className="text-sm text-white/60 text-center">
                Pick an assistant on the left, then start chatting.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end items-start' : 'justify-start items-start'}`}
                >
                  {message.type === 'bot' && (
                    <Image src="/images/voiceAi.svg" alt="AI" width={24} height={24} className="flex-shrink-0 self-start" />
                  )}
                  <div
                    className={`max-w-[70%] rounded-xl px-3 py-2 self-start ${
                      message.type === 'user'
                        ? 'bg-[rgba(19,245,132,0.12)] text-[#13F584] rounded-tl-xl rounded-tr-none rounded-bl-xl rounded-br-xl'
                        : 'bg-white/5 text-[#FFBC33] rounded-tl-none rounded-tr-xl rounded-br-xl rounded-bl-xl'
                    }`}
                  >
                    <p className={`text-xs leading-relaxed ${
                      message.type === 'user' ? 'text-emerald-400' : 'text-white'
                    }`}>{message.content}</p>
                  </div>
                  {message.type === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <User size={14} className="text-emerald-400" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming Message */}
              {streamingMessage && (
                <div className="flex gap-3 justify-start items-start">
                  <Image src="/images/voiceAi.svg" alt="AI" width={24} height={24} className="flex-shrink-0 self-start" />
                  <div className="bg-white/5 rounded-xl px-3 py-2 max-w-[70%] border-[0.5px] border-white/10 self-start">
                    <p className="text-xs leading-relaxed text-white">
                      {streamingMessage}
                      <span className="inline-block w-1 h-3 bg-emerald-400 ml-1 animate-pulse"></span>
                    </p>
                  </div>
                </div>
              )}

              {/* Typing Indicator */}
              {isTyping && !streamingMessage && (
                <div className="flex gap-3 justify-start items-start">
                  <Image src="/images/voiceAi.svg" alt="AI" width={24} height={24} className="flex-shrink-0 self-start" />
                  <div className="bg-white/5 rounded-xl px-2 py-1.5 max-w-[70%] border-[0.5px] border-white/10 self-start">
                    <div className="flex items-center gap-1">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full typing-dot"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full typing-dot"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 pt-3 pb-3">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative flex items-center w-full">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isConnected ? "Ask anything" : "Connecting to server..."}
              className="w-full pl-3 pr-14 h-[52px] rounded-[66px] border-0 bg-white/[0.04] text-white placeholder:text-[#919EAB] focus:outline-none disabled:opacity-50 text-xs"
              style={{ fontFamily: 'Public Sans, sans-serif', fontSize: '12px', lineHeight: '1.5714285714285714em' }}
              disabled={!isConnected || isTyping || streamingMessage}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping || !isConnected || streamingMessage}
              className="absolute right-1.5 h-9 px-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-bold"
              style={{ 
                fontFamily: 'Public Sans, sans-serif', 
                fontSize: '15px', 
                lineHeight: '1.7333333333333334em',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid #13F584',
                color: '#13F584'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)';
                  e.currentTarget.style.borderColor = 'rgba(19, 245, 132, 0.32)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(19, 245, 132, 0.16)';
                }
              }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWidget; 