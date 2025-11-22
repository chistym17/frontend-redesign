import React, { useState, useRef, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import Image from 'next/image';

const ChatWidget = ({ messages, onSendMessage, isTyping, isConnected, streamingMessage, onStartNewSession, onLoadPreviousSession, currentSessionId }) => {
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/30 backdrop-blur-xl">
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-[45px] h-[45px] rounded-full bg-[#13F584] opacity-20 blur-[10px]"></div>
            <div className="relative w-[45px] h-[45px] rounded-full bg-[rgba(19,245,132,0.1)] border border-[rgba(19,245,132,0.3)] flex items-center justify-center">
              <Image src="/images/ai2.svg" alt="AI Assistant" width={45} height={45} />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Asistance</h2>
            <p className="text-xs text-white/50">
              {isConnected ? "Ready to chat" : "Connecting..."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-4">
          {/* Session Management Buttons */}
          {isConnected && (
            <div className="flex items-center gap-2 p-1 rounded-[9px] bg-white/[0.04]">
              <button
                onClick={onStartNewSession}
                className="h-[30px] px-2 bg-[rgba(19,245,132,0.08)] text-[#9EFBCD] rounded-lg hover:bg-[rgba(19,245,132,0.12)] transition-all duration-200 flex items-center justify-center font-bold text-[13px] leading-[1.6923076923076923em]"
                style={{ fontFamily: 'Public Sans, sans-serif' }}
              >
                Start New Session
              </button>
              <button
                onClick={onLoadPreviousSession}
                className="h-[30px] px-1 text-white rounded-lg hover:bg-white/5 transition-all duration-200 flex items-center justify-center font-bold text-[13px] leading-[1.6923076923076923em]"
                style={{ fontFamily: 'Public Sans, sans-serif' }}
              >
                Load Previous
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden px-6 py-6">
        <div className="h-full overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 && !streamingMessage && !isTyping ? (
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
                    <Image src="/images/ai2.svg" alt="AI" width={30} height={30} className="flex-shrink-0 self-start" />
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 self-start ${
                      message.type === 'user'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-white/10'
                        : 'bg-white/5 text-white border border-white/10'
                    }`}
                  >
                    <p className={`text-sm leading-relaxed ${
                      message.type === 'user' ? 'text-emerald-400' : 'text-white'
                    }`}>{message.content}</p>
                  </div>
                  {message.type === 'user' && (
                    <User size={16} className="text-emerald-400 mt-1 flex-shrink-0 self-start" />
                  )}
                </div>
              ))}

              {/* Streaming Message */}
              {streamingMessage && (
                <div className="flex gap-3 justify-start items-start">
                  <Image src="/images/ai2.svg" alt="AI" width={30} height={30} className="flex-shrink-0 self-start" />
                  <div className="bg-white/5 rounded-2xl px-4 py-3 max-w-[70%] border border-white/10 self-start">
                    <p className="text-sm leading-relaxed text-white">
                      {streamingMessage}
                      <span className="inline-block w-1 h-4 bg-emerald-400 ml-1 animate-pulse"></span>
                    </p>
                  </div>
                </div>
              )}

              {/* Typing Indicator */}
              {isTyping && !streamingMessage && (
                <div className="flex gap-3 justify-start items-start">
                  <Image src="/images/ai2.svg" alt="AI" width={30} height={30} className="flex-shrink-0 self-start" />
                  <div className="bg-white/5 rounded-2xl px-4 py-3 max-w-[70%] border border-white/10 self-start">
                    <div className="flex items-center gap-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/5 px-6 pt-4 pb-4">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative flex items-center w-full">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isConnected ? "Ask anything" : "Connecting to server..."}
              className="w-full pl-6 pr-24 py-5 rounded-[66px] border-0 bg-white/[0.04] text-white placeholder:text-[#919EAB] focus:outline-none disabled:opacity-50 text-sm"
              style={{ fontFamily: 'Public Sans, sans-serif', fontSize: '14px', lineHeight: '1.5714285714285714em' }}
              disabled={!isConnected || isTyping || streamingMessage}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping || !isConnected || streamingMessage}
              className="absolute right-2 h-11 px-4 bg-white/[0.12] border border-[rgba(19,245,132,0.32)] text-[#13F584] rounded-[99px] hover:bg-white/[0.16] hover:border-[rgba(19,245,132,0.48)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-bold"
              style={{ fontFamily: 'Public Sans, sans-serif', fontSize: '15px', lineHeight: '1.7333333333333334em' }}
            >
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWidget; 