import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ChatWidget from './ChatWidget';
import { useAssistant } from '../lib/assistantContext';
import { API_ENDPOINTS } from '../config/api';
import { useRouter } from 'next/router';
import LeftSidebar from './LeftSidebar';
import { useSidebar } from '../lib/sidebarContext';
import { Search } from 'lucide-react';
import AgentsPopup from './AgentsPopup';

const ChatInterface = () => {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [loadingSessionType, setLoadingSessionType] = useState(null); // 'new' or 'previous'
  const isLoadingSessionRef = useRef(false);
  const { assistantId, setAssistant } = useAssistant();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
      
    
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // Assistant list state
  const [assistants, setAssistants] = useState([]);
  const [loadingAssistant, setLoadingAssistant] = useState(true);
  const [assistantSearch, setAssistantSearch] = useState('');

  const connectWebSocket = (sessionId = null) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('Closing existing WebSocket connection');
      ws.close();
      setWs(null);
      setIsConnected(false);
    }

    const base = process.env.NEXT_PUBLIC_BACKEND_WS_CHAT || "wss://esapdev.xyz:7000/agentbuilder/api/ws/chat";
    const activeAssistantId = assistantId || "7b50109b-b041-4d4a-824c-37eb7cf64b09";
    
    let wsUrl = `${base}?assistant_id=${activeAssistantId}`;
    if (sessionId) {
      wsUrl += `&session_id=${sessionId}`;
    }
    
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('Connected to chat WebSocket', sessionId ? `with session: ${sessionId}` : 'reusing previous session');
      isLoadingSessionRef.current = false;
      setIsConnected(true);
      setIsLoadingSession(false);
      setLoadingSessionType(null);
      setWs(websocket);
      if (sessionId) {
        setCurrentSessionId(sessionId);
      }
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'stream_chunk') {
          setStreamingMessage(prev => prev ? prev + data.content : data.content);
          setIsTyping(false);
        } else if (data.type === 'stream_complete') {
          const botMessage = {
            id: Date.now(),
            type: 'bot',
            content: data.content,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
          setStreamingMessage(null);
          setIsTyping(false);
        } else if (data.type === 'error') {
          const errorMessage = {
            id: Date.now(),
            type: 'bot',
            content: data.content,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          setStreamingMessage(null);
          setIsTyping(false);
        } else {
          const botMessage = {
            id: Date.now(),
            type: 'bot',
            content: event.data,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
        }
      } catch (error) {
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: event.data,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }
    };

    websocket.onclose = () => {
      console.log('Disconnected from chat WebSocket');
      setIsConnected(false);
      // Only reset loading state if we're not actively loading a session
      // This prevents the header from disappearing during reconnection
      if (!isLoadingSessionRef.current) {
        setIsLoadingSession(false);
      }
      setStreamingMessage(null);
      setWs(null);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      isLoadingSessionRef.current = false;
      setIsConnected(false);
      setIsLoadingSession(false);
      setLoadingSessionType(null);
      setStreamingMessage(null);
    };

    return websocket;
  };

  const startNewSession = () => {
    isLoadingSessionRef.current = true;
    setIsLoadingSession(true);
    setLoadingSessionType('new');
    const newSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setMessages([]);
    setStreamingMessage(null);
    connectWebSocket(newSessionId);
  };

  const loadPreviousSession = () => {
    isLoadingSessionRef.current = true;
    setIsLoadingSession(true);
    setLoadingSessionType('previous');
    setMessages([]);
    setStreamingMessage(null);
    setCurrentSessionId(null);
    connectWebSocket();
  };

  // Fetch assistants
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setLoadingAssistant(true);
        const response = await fetch(API_ENDPOINTS.ASSISTANTS);
        if (!response.ok) {
          throw new Error('Failed to fetch assistants');
        }
        const data = await response.json();
        setAssistants(data);
      } catch (error) {
        console.error('Error fetching assistants:', error);
      } finally {
        setLoadingAssistant(false);
      }
    };
    fetchAssistants();
  }, []);

  // Filter assistants based on search
  const filteredAssistants = useMemo(() => {
    if (!assistantSearch.trim()) return assistants;
    const searchLower = assistantSearch.toLowerCase();
    return assistants.filter((a) =>
      (a.name || '').toLowerCase().includes(searchLower)
    );
  }, [assistants, assistantSearch]);

  // Handle assistant change
  const handleAssistantChange = useCallback((id) => {
    const assistant = assistants.find((a) => a.id === id);
    if (assistant) {
      setAssistant(assistant);
    }
  }, [assistants, setAssistant]);

  useEffect(() => {
    let websocket = null;
    let reconnectTimeout = null;

    // Set loading state when assistant changes
    if (assistantId) {
      isLoadingSessionRef.current = true;
      setIsLoadingSession(true);
      setLoadingSessionType('agent');
    }

    const initialConnect = () => {
      websocket = connectWebSocket();
    };

    initialConnect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (websocket) {
        websocket.close();
      }
      setWs(null);
      setIsConnected(false);
    };
  }, [assistantId]);

  const handleSendMessage = async (message) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setStreamingMessage(null);
    setIsTyping(true);
    ws.send(JSON.stringify({ type: 'user', content: message }));
  };

  return (
    <div className="min-h-screen h-screen bg-[#141A21] text-white">
      {/* Left Sidebar */}
  
      <div className="relative flex h-full flex-col overflow-hidden" style={{  marginLeft:isMobile ? '0px' : isCollapsed ? '64px' : '105px' }}>
      
        <div className="flex h-full flex-col">
          <main className="flex h-full flex-1 flex-col overflow-hidden items-center justify-center p-6 lg:p-[60px_120px]">
            {/* Parent Container with margins (matching Figma design) */}
            <div className="flex flex-1 min-h-0 w-full max-w-[1800px] max-h-[900px] flex-col gap-5 overflow-hidden lg:flex-row lg:items-stretch -mt-4 lg:-mt-6">
              {/* Left Panel - Agent List */}
             {!isMobile && (
              <div className="flex min-h-0 w-full flex-shrink-0 flex-col lg:h-full lg:max-w-[280px]">
                <div className="flex h-full w-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5  backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3 pl-2">
                    <h3 className="text-sm font-medium text-white">Agent List</h3>
                    {(isConnected || isLoadingSession) && (
                      <button
                        type="button"
                        onClick={startNewSession}
                        disabled={isLoadingSession}
                        className="inline-flex items-center justify-center rounded-[8px] bg-[rgba(19,245,132,0.08)] px-4 py-2.5 text-[11px] font-medium text-[#9EFBCD] transition-all duration-200 hover:bg-[rgba(19,245,132,0.14)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        New session
                      </button>
                    )}
                  </div>
                  <div className="relative mt-4">
                    <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      value={assistantSearch}
                      onChange={(e) => setAssistantSearch(e.target.value)}
                      placeholder="Search agents..."
                      className="w-full h-55 rounded-[8px] border-2 border-[rgba(145,158,171,0.2)] bg-transparent py-1.5 pl-10 pr-3 text-xs text-white placeholder:text-white/40 focus:border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                      disabled={loadingAssistant}
                    />
                  </div>
                  <div className="mt-4 flex flex-1 flex-col overflow-hidden min-h-0 space-y-2.5">
                    {loadingAssistant ? (
                      <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="h-14 animate-pulse rounded-2xl bg-white/5"
                            style={{ animationDelay: `${idx * 80}ms` }}
                          />
                        ))}
                      </div>
                    ) : filteredAssistants.length ? (
                      <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-0 custom-scrollbar">
                        {filteredAssistants.map((assistant) => {
                          const isActive = assistantId === assistant.id;
                          const rawName = assistant.name || "Untitled Assistant";
                          const displayName =
                            rawName.length > 12 ? `${rawName.slice(0, 15)}...` : rawName;
                          return (
                            <button
                              key={assistant.id}
                              type="button"
                              onClick={() => handleAssistantChange(assistant.id)}
                              className={`group flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left transition-all duration-200 ${
                                isActive
                                  ? "bg-white/5  hover:bg-white/10"
                                  : "bg-transparent  hover:bg-white/10"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                    
                                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M27.846 14.4555L26.6665 13.8661C26.6665 7.97426 21.8905 3.19922 16 3.19922C10.1088 3.19922 5.33307 7.97426 5.33307 13.8661L4.15419 14.4555C3.62939 14.7179 3.19995 15.413 3.19995 15.9992V18.1327C3.19995 18.7189 3.62939 19.4139 4.15419 19.6763L5.33307 20.2658H6.93307V13.8661C6.93307 8.8661 11.0006 4.79922 16 4.79922C20.999 4.79922 25.0665 8.8661 25.0665 13.8661V22.3992C25.0665 25.0501 22.9177 27.1992 20.2665 27.1992H17.0665V25.5992H14.9331V28.7992H20.2665C23.8009 28.7992 26.6665 25.9336 26.6665 22.3992V20.2658L27.846 19.6763C28.3708 19.4139 28.7999 18.7189 28.7999 18.1327V15.9992C28.7999 15.413 28.3708 14.7179 27.846 14.4555Z" fill="#8E33FF"/>
                                    <path d="M20.2665 11.2004H16.8V8.93351C17.4291 8.71911 17.8665 8.26471 17.8665 7.73351C17.8665 6.99719 17.0313 6.40039 16 6.40039C14.9686 6.40039 14.1331 6.99719 14.1331 7.73351C14.1331 8.26471 14.5705 8.72039 15.2 8.93351V11.2004H11.7331C9.96668 11.2004 8.53308 12.6337 8.53308 14.4004V18.667C8.53308 21.6106 10.9232 24.0004 13.8668 24.0004H18.1334C21.0771 24.0004 23.4665 21.6106 23.4665 18.667V14.4004C23.4665 12.6337 22.0332 11.2004 20.2665 11.2004ZM12.2668 16.5338V15.4673C12.2668 14.8772 12.7449 14.4004 13.3331 14.4004C13.9219 14.4004 14.4 14.8772 14.4 15.4673V16.5338C14.4 17.1245 13.9219 17.6004 13.3331 17.6004C12.7449 17.6004 12.2668 17.1245 12.2668 16.5338ZM18.6665 20.8004L16.5334 21.3338H15.4668L13.3331 20.8004V19.7338H18.6665V20.8004ZM19.7334 16.5338C19.7334 17.1245 19.2553 17.6004 18.6665 17.6004C18.078 17.6004 17.6 17.1245 17.6 16.5338V15.4673C17.6 14.8772 18.078 14.4004 18.6665 14.4004C19.2553 14.4004 19.7334 14.8772 19.7334 15.4673V16.5338Z" fill="#8E33FF"/>
                                  </svg>

                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">
                                      {displayName}
                                    </div>
                                  </div>
                                </div>
                                <div
                              className={`relative flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/20 box-border transition-all`}
                                  aria-hidden="true"
                                >
                                  {isActive && (
                                    <div className="absolute h-4 w-4  rounded-full border-4 border-[#13F584] box-border" />
                                  )}
                                </div>

                                  </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-10 text-center text-xs text-white/50">
                        No assistants matched your search.
                      </div>
                    )}
                  </div>
                </div>
                
              </div>
                )}

                  {isMobile && (
                    <div className="flex justify-between items-center ">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const selectedAssistant = assistants.find(a => a.id === assistantId);
                          const name = selectedAssistant?.name || "AI VoiceAgent";
                          const displayName = name.length > 15 ? `${name.slice(0, 15)}...` : name;
                          return (
                            <>
                              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M27.846 14.4555L26.6665 13.8661C26.6665 7.97426 21.8905 3.19922 16 3.19922C10.1088 3.19922 5.33307 7.97426 5.33307 13.8661L4.15419 14.4555C3.62939 14.7179 3.19995 15.413 3.19995 15.9992V18.1327C3.19995 18.7189 3.62939 19.4139 4.15419 19.6763L5.33307 20.2658H6.93307V13.8661C6.93307 8.8661 11.0006 4.79922 16 4.79922C20.999 4.79922 25.0665 8.8661 25.0665 13.8661V22.3992C25.0665 25.0501 22.9177 27.1992 20.2665 27.1992H17.0665V25.5992H14.9331V28.7992H20.2665C23.8009 28.7992 26.6665 25.9336 26.6665 22.3992V20.2658L27.846 19.6763C28.3708 19.4139 28.7999 18.7189 28.7999 18.1327V15.9992C28.7999 15.413 28.3708 14.7179 27.846 14.4555Z" fill="#8E33FF"/>
                                <path d="M20.2665 11.2004H16.8V8.93351C17.4291 8.71911 17.8665 8.26471 17.8665 7.73351C17.8665 6.99719 17.0313 6.40039 16 6.40039C14.9686 6.40039 14.1331 6.99719 14.1331 7.73351C14.1331 8.26471 14.5705 8.72039 15.2 8.93351V11.2004H11.7331C9.96668 11.2004 8.53308 12.6337 8.53308 14.4004V18.667C8.53308 21.6106 10.9232 24.0004 13.8668 24.0004H18.1334C21.0771 24.0004 23.4665 21.6106 23.4665 18.667V14.4004C23.4665 12.6337 22.0332 11.2004 20.2665 11.2004ZM12.2668 16.5338V15.4673C12.2668 14.8772 12.7449 14.4004 13.3331 14.4004C13.9219 14.4004 14.4 14.8772 14.4 15.4673V16.5338C14.4 17.1245 13.9219 17.6004 13.3331 17.6004C12.7449 17.6004 12.2668 17.1245 12.2668 16.5338ZM18.6665 20.8004L16.5334 21.3338H15.4668L13.3331 20.8004V19.7338H18.6665V20.8004ZM19.7334 16.5338C19.7334 17.1245 19.2553 17.6004 18.6665 17.6004C18.078 17.6004 17.6 17.1245 17.6 16.5338V15.4673C17.6 14.8772 18.078 14.4004 18.6665 14.4004C19.2553 14.4004 19.7334 14.8772 19.7334 15.4673V16.5338Z" fill="#8E33FF"/>
                              </svg>
                              <h1 className="text-lg font-bold text-white">
                                {displayName}
                              </h1>
                            </>
                          );
                        })()}
                      </div>
                      <button
                        onClick={() => setAgentsOpen(true)}
                        className="group inline-flex items-center gap-2 px-4 py-2 border border-emerald-400/50 text-emerald-300 rounded-lg hover:bg-emerald-400/10 transition-colors"
                      >
                        Agent List
                      </button>
                    </div>
                  )}

              {/* Right Panel - Chat Area */}
              <div
                  className={`flex min-h-0 flex-col overflow-hidden lg:h-full
                  ${isMobile ? "h-[calc(100vh-150px)]" : "flex-1"} 
                  
                `}
                >
                <ChatWidget
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isTyping={isTyping}
                  isConnected={isConnected}
                  streamingMessage={streamingMessage}
                  onStartNewSession={startNewSession}
                  onLoadPreviousSession={loadPreviousSession}
                  currentSessionId={currentSessionId}
                  isLoadingSession={isLoadingSession}
                  loadingSessionType={loadingSessionType}
                />
              </div>
            </div>
             {/* Agents Popup (mobile only) */}
            {isMobile && (
              <AgentsPopup
                open={agentsOpen}
                onClose={() => setAgentsOpen(false)}
                assistants={filteredAssistants}
                loadingAssistant={loadingAssistant}
                assistantSearch={assistantSearch}
                setAssistantSearch={setAssistantSearch}
                assistantId={assistantId}
                handleAssistantChange={(id) => {
                  handleAssistantChange(id);
                  setAgentsOpen(false); // close popup on select
                }}
                startNewSession={startNewSession}          
                isLoadingSession={isLoadingSession}         
                isConnected={isConnected}   
              />

            )}
          </main>
        </div>
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
  );
};

export default ChatInterface;
