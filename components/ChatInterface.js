import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ChatWidget from './ChatWidget';
import { useAssistant } from '../lib/assistantContext';
import { API_ENDPOINTS } from '../config/api';
import { useRouter } from 'next/router';
import LeftSidebar from './LeftSidebar';
import { useSidebar } from '../lib/sidebarContext';
import { Search } from 'lucide-react';

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
      <LeftSidebar />
      
      <div className="relative flex h-full flex-col overflow-hidden" style={{ marginLeft: isCollapsed ? '64px' : '105px' }}>
        <div className="flex h-full flex-col">
          <main className="flex h-full flex-1 flex-col overflow-hidden items-center justify-center p-6 lg:p-[60px_120px]">
            {/* Parent Container with margins (matching Figma design) */}
            <div className="flex flex-1 min-h-0 w-full max-w-[1800px] max-h-[900px] flex-col gap-[18px] overflow-hidden lg:flex-row lg:items-stretch">
              {/* Left Panel - Agent List */}
              <div className="flex min-h-0 w-full flex-shrink-0 flex-col lg:h-full lg:max-w-[280px]">
                <div className="flex h-full w-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
                  <div className="flex items-center gap-3 pl-2">
                    <h3 className="text-sm font-medium text-white">Agent List</h3>
                  </div>
                  <div className="relative mt-4">
                    <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                    <input
                      value={assistantSearch}
                      onChange={(e) => setAssistantSearch(e.target.value)}
                      placeholder="Search agents"
                      className="w-full rounded-2xl border border-white/5 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/40 focus:border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
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
                      <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-0">
                        {filteredAssistants.map((assistant) => {
                          const isActive = assistantId === assistant.id;
                          return (
                            <button
                              key={assistant.id}
                              type="button"
                              onClick={() => handleAssistantChange(assistant.id)}
                              className={`group flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left transition-all duration-200 ${
                                isActive
                                  ? "bg-emerald-500/20 shadow-md shadow-emerald-500/20"
                                  : "bg-white/5 hover:bg-white/10"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div
                                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 text-[9px] font-semibold ${
                                    isActive ? "text-emerald-200" : "text-white/70"
                                  }`}
                                >
                                  {(assistant.name ?? "?").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-[10px] font-medium truncate ${
                                    isActive ? "text-[#00A76F]" : "text-white"
                                  }`}>
                                    {assistant.name || "Untitled Assistant"}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full border text-[7px] font-semibold transition-colors ${
                                  isActive
                                    ? "border-emerald-300 bg-emerald-500/80 text-white"
                                    : "border-white/20 text-white/40 group-hover:border-emerald-200/40 group-hover:text-emerald-200"
                                }`}
                                aria-hidden="true"
                              >
                                {isActive ? "✓" : ""}
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

              {/* Right Panel - Chat Area */}
              <div className="flex min-h-0 flex-1 flex-col lg:h-full">
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
          </main>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
