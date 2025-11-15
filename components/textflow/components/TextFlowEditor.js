// components/textflow/components/TextFlowEditor.js - WITH AI CHAT + UCG FEATURE
import React, { useCallback, useEffect, useState, useRef } from "react";
import ReactFlow, { Background, Controls, addEdge, useEdgesState, useNodesState, ConnectionLineType, useReactFlow, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "../nodes/index.js";
import { useTextflowStore } from "../hooks/useTextflowStore.js";
import { saveTextFlow, getTextFlow } from "../api/textflowApi.js";
import { useWebSocketStream } from "../hooks/useWebSocketStream.js";
import ConfigPanel from "./ConfigPanel.js";
import ConsolePanel from "./ConsolePanel.js";
import TriggerManager from "./TriggerManager.js";
import TemplateGallery from "./TemplateGallery.js";
import ComponentLibraryPanel from "./ComponentLibraryPanel.js";
import FlowChatbotPanel from "./FlowChatbotPanel.js";
import ConnectorPanel from "./ConnectorPanel.js";
import { Play, Save, Layers, Zap, Download, Upload, Key, Activity, Settings, Sparkles, Package, AlertCircle, CheckCircle, GripHorizontal, Bot, MessageSquare, Plug, Target, Globe, Brain, GitBranch, Clock } from "lucide-react";

function FlowContent({ assistantId }) {
  const tf = useTextflowStore();
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [testInput, setTestInput] = useState("Test my flow");
  // Initialize flowName from localStorage or default
  const [flowName, setFlowName] = useState(() => {
    if (typeof window !== 'undefined' && assistantId) {
      const saved = localStorage.getItem(`flow_name_${assistantId}`);
      return saved || "Untitled Text Flow";
    }
    return "Untitled Text Flow";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [showTriggerManager, setShowTriggerManager] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [showConnectorPanel, setShowConnectorPanel] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // AI Chatbot states
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotMinimized, setChatbotMinimized] = useState(false);
  const [chatSessionId] = useState(() => 
    `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );
  
  // Console height state (resizable)
  const [consoleHeight, setConsoleHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(true);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);
  
  const isLoadingRef = useRef(false);
  const { sendMessage, isConnected } = useWebSocketStream(true, assistantId);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Console resize handlers
  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = consoleHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };


  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const delta = resizeStartY.current - e.clientY;
      const newHeight = Math.max(150, Math.min(600, resizeStartHeight.current + delta));
      setConsoleHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Load flow from backend
  useEffect(() => {
    if (!assistantId || isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getTextFlow(assistantId);
        
        // Load flow name first (even if no flow_data exists)
        // Try API response first, then fallback to localStorage
        if (data.name) {
          setFlowName(data.name);
          tf.setFlow({ name: data.name });
          if (typeof window !== 'undefined') {
            localStorage.setItem(`flow_name_${assistantId}`, data.name);
          }
          console.log('✅ Loaded flow name from API:', data.name);
        } else {
          // Fallback to localStorage if API doesn't return name
          if (typeof window !== 'undefined') {
            const savedName = localStorage.getItem(`flow_name_${assistantId}`);
            if (savedName) {
              setFlowName(savedName);
              tf.setFlow({ name: savedName });
              console.log('✅ Loaded flow name from localStorage:', savedName);
            } else {
              console.log('⚠️ No name in API response or localStorage');
            }
          } else {
            console.log('⚠️ No name in API response');
          }
        }
        
        if (data.flow_data?.nodes?.length > 0) {
          setNodes(data.flow_data.nodes);
          // Normalize edge styles to match visual editor
          const normalizedEdges = (data.flow_data.edges || []).map(edge => ({
            ...edge,
            animated: false,
            style: {
              ...edge.style,
              stroke: '#13F584',
              strokeWidth: 1,
              opacity: 0.6,
            }
          }));
          setEdges(normalizedEdges);
          tf.setNodes(data.flow_data.nodes);
          tf.setEdges(normalizedEdges);
          
          tf.appendConsole({ 
            ts: Date.now(), 
            kind: "info", 
            text: `Loaded flow with ${data.flow_data.nodes.length} nodes${data.name ? `, name: ${data.name}` : ''}` 
          });
        } else if (data.flow_data) {
          // Flow exists but has no nodes yet
          setNodes([]);
          setEdges([]);
          tf.setNodes([]);
          tf.setEdges([]);
        }
      } catch (e) {
        tf.appendConsole({ ts: Date.now(), kind: "error", text: `Load failed: ${e.message}` });
        showNotification('error', `Failed to load flow: ${e.message}`);
        console.error('Failed to load flow:', e);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    })();
  }, [assistantId]);

  // Sync store to ReactFlow
  useEffect(() => {
    if (isLoadingRef.current) return;
    setNodes(tf.flow.nodes);
    // Fit view to show all nodes when they change
    if (tf.flow.nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, [tf.flow.nodes, fitView]);

  useEffect(() => {
    if (isLoadingRef.current) return;
    const normalizedEdges = (tf.flow.edges || []).map(edge => ({
      ...edge,
      animated: false,
      style: {
        ...edge.style,
        stroke: '#13F584',
        strokeWidth: 1,
        opacity: 0.6,
      }
    }));
    setEdges(normalizedEdges);
  }, [tf.flow.edges]);

  // Debounced sync back to store
  const syncTimeoutRef = useRef(null);
  useEffect(() => {
    if (isLoadingRef.current) return;
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      tf.setNodes(nodes);
      tf.setEdges(edges);
    }, 100);
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [nodes, edges]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((event, node) => {
    tf.setSelection(node.id);
  }, [tf]);

  const onPaneClick = useCallback(() => {
    tf.setSelection(null);
  }, [tf]);

  const handleSave = useCallback(async () => {
    if (!assistantId) {
      tf.appendConsole({ ts: Date.now(), kind: "error", text: "No assistant ID" });
      showNotification('error', 'Cannot save: No assistant ID');
      return;
    }
    
    try {
      setSaveStatus("Saving...");
      const payload = { nodes, edges, name: flowName };
      await saveTextFlow(assistantId, payload);
      
      // Save name to localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem(`flow_name_${assistantId}`, flowName);
      }
      
      setSaveStatus("✓ Saved");
      tf.appendConsole({ 
        ts: Date.now(), 
        kind: "info", 
        text: `Flow saved: ${nodes.length} nodes, ${edges.length} edges, name: ${flowName}` 
      });
      showNotification('success', 'Flow saved successfully');
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      setSaveStatus("✗ Failed");
      tf.appendConsole({ ts: Date.now(), kind: "error", text: `Save failed: ${e.message}` });
      showNotification('error', `Save failed: ${e.message}`);
      setTimeout(() => setSaveStatus(""), 3000);
    }
  }, [assistantId, nodes, edges, flowName, tf]);

  const handleRun = useCallback(() => {
    if (!nodes.length) {
      tf.appendConsole({ ts: Date.now(), kind: "error", text: "No nodes to execute" });
      showNotification('error', 'No nodes to execute');
      return;
    }

    if (!isConnected()) {
      tf.appendConsole({ ts: Date.now(), kind: "error", text: "WebSocket not connected" });
      showNotification('error', 'WebSocket not connected');
      return;
    }

    const entryNode = nodes.find(n => n.type === "start" || n.type === "trigger") || nodes[0];
    
    if (!entryNode) {
      tf.appendConsole({ ts: Date.now(), kind: "error", text: "No entry node found" });
      showNotification('error', 'No entry node found');
      return;
    }

    tf.appendConsole({ 
      ts: Date.now(), 
      kind: "info", 
      text: `Starting execution from: ${entryNode.id}` 
    });
    
    const success = sendMessage(testInput, { assistant_id: assistantId });
    
    if (!success) {
      tf.appendConsole({ ts: Date.now(), kind: "error", text: "Failed to send message" });
      showNotification('error', 'Failed to send message');
    } else {
      showNotification('success', 'Flow execution started');
    }
  }, [nodes, isConnected, sendMessage, testInput, assistantId, tf]);

  const handleExport = () => {
    const flowData = { nodes, edges };
    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowName.replace(/\s+/g, '_')}_flow.json`;
    a.click();
    URL.revokeObjectURL(url);
    tf.appendConsole({ ts: Date.now(), kind: "info", text: "Flow exported" });
    showNotification('success', 'Flow exported successfully');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const flowData = JSON.parse(text);
        if (flowData.nodes && flowData.edges) {
          setNodes(flowData.nodes);
          const normalizedEdges = flowData.edges.map(edge => ({
            ...edge,
            animated: false,
            style: {
              ...edge.style,
              stroke: '#13F584',
              strokeWidth: 1,
              opacity: 0.6,
            }
          }));
          setEdges(normalizedEdges);
          tf.setNodes(flowData.nodes);
          tf.setEdges(normalizedEdges);
          tf.appendConsole({ ts: Date.now(), kind: "info", text: "Flow imported" });
          showNotification('success', `Flow imported: ${flowData.nodes.length} nodes`);
        } else {
          throw new Error("Invalid flow data format");
        }
      } catch (err) {
        tf.appendConsole({ ts: Date.now(), kind: "error", text: `Import failed: ${err.message}` });
        showNotification('error', `Import failed: ${err.message}`);
      }
    };
    input.click();
  };

  // AI Chatbot handlers
  const handleApplyChatbotFlow = (flow) => {
    if (!flow || !flow.nodes) {
      showNotification('error', 'Invalid flow data from chatbot');
      return;
    }
    console.log("Applying chatbot flow:", flow);
    
    setNodes(flow.nodes);
    const normalizedEdges = (flow.edges || []).map(edge => ({
      ...edge,
      animated: false,
      style: {
        ...edge.style,
        stroke: '#13F584',
        strokeWidth: 1,
        opacity: 0.6,
      }
    }));
    setEdges(normalizedEdges);
    tf.setNodes(flow.nodes);
    tf.setEdges(normalizedEdges);
    
    tf.appendConsole({ 
      ts: Date.now(), 
      kind: "info", 
      text: `AI-generated flow applied: ${flow.nodes.length} nodes, ${flow.edges?.length || 0} edges` 
    });
    showNotification('success', `Flow applied: ${flow.nodes.length} nodes`);
  };

  const handlePreviewChatbotFlow = (flow) => {
    console.log("Preview chatbot flow:", flow);
  };

  const handleSelectConnector = (connector) => {
    console.log('Connector selected:', connector);
    // Connector selection is handled in ConfigPanel when HTTP node is configured
  };

  const handleSelectTemplate = (template) => {
    console.log("📥 Loading template:", template.name, template);
    
    if (!template.flow_data) {
      console.error("❌ Template missing flow_data:", template);
      showNotification('error', 'Invalid template: No flow data');
      tf.appendConsole({ 
        ts: Date.now(), 
        kind: "error", 
        text: `Template "${template.name}" has no flow data` 
      });
      return;
    }

    if (!template.flow_data.nodes || !Array.isArray(template.flow_data.nodes)) {
      console.error("❌ Template has invalid nodes:", template.flow_data);
      showNotification('error', 'Invalid template: No nodes found');
      tf.appendConsole({ 
        ts: Date.now(), 
        kind: "error", 
        text: `Template "${template.name}" has invalid nodes` 
      });
      return;
    }

    if (template.flow_data.nodes.length === 0) {
      showNotification('error', 'Template is empty (no nodes)');
      tf.appendConsole({ 
        ts: Date.now(), 
        kind: "error", 
        text: `Template "${template.name}" is empty` 
      });
      return;
    }

    const httpNodesWithoutCreds = template.flow_data.nodes.filter(node => {
      const config = node.data?.config || {};
      return node.type === 'http' && !config.credential_id && !config.connector_id;
    });

    const invalidNodes = template.flow_data.nodes.filter(node => {
      return !node.id || !node.type || !node.position;
    });

    if (invalidNodes.length > 0) {
      console.error("❌ Template has invalid node structure:", invalidNodes);
      showNotification('error', `Template has ${invalidNodes.length} invalid nodes`);
      return;
    }

    try {
      const newNodes = template.flow_data.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          config: node.data?.config || {}
        }
      }));

      const newEdges = template.flow_data.edges || [];

      console.log("✅ Loading template nodes:", newNodes.length, "edges:", newEdges.length);

      const normalizedEdges = newEdges.map(edge => ({
        ...edge,
        animated: false,
        style: {
          ...edge.style,
          stroke: '#13F584',
          strokeWidth: 1,
          opacity: 0.6,
        }
      }));

      setNodes(newNodes);
      setEdges(normalizedEdges);
      tf.setNodes(newNodes);
      tf.setEdges(normalizedEdges);
      
      let message = `Template "${template.name}" loaded: ${newNodes.length} nodes`;
      if (httpNodesWithoutCreds.length > 0) {
        message += ` (⚠️ ${httpNodesWithoutCreds.length} HTTP nodes need credentials)`;
      }
      
      tf.appendConsole({ 
        ts: Date.now(), 
        kind: "info", 
        text: message
      });

      showNotification('success', message);

      if (httpNodesWithoutCreds.length > 0) {
        setTimeout(() => {
          showNotification('warning', 
            `⚠️ ${httpNodesWithoutCreds.length} HTTP node(s) need authentication. Configure in node settings.`
          );
        }, 3000);
      }

      setShowTemplateGallery(false);
      
    } catch (err) {
      console.error("❌ Failed to load template:", err);
      showNotification('error', `Failed to load template: ${err.message}`);
      tf.appendConsole({ 
        ts: Date.now(), 
        kind: "error", 
        text: `Failed to load template: ${err.message}` 
      });
    }
  };

  const handleSelectComponent = (component) => {
    const id = `${component.node_type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const existingNodes = nodes.length;
    const x = 20 + (existingNodes % 4) * 150;
    const y = 50 + Math.floor(existingNodes / 4) * 120;
    
    const newNode = {
      id,
      type: component.node_type,
      position: { x, y },
      data: { 
        label: component.name,
        config: component.config
      }
    };
    
    setNodes([...nodes, newNode]);
    tf.setNodes([...nodes, newNode]);
    tf.setSelection(id);
    
    tf.appendConsole({ 
      ts: Date.now(), 
      kind: "info", 
      text: `Added component: ${component.name}` 
    });

    showNotification('success', `Component "${component.name}" added`);
    
    setShowComponentLibrary(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#141A21' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-sm font-medium text-gray-300">Loading flow...</div>
        </div>
      </div>
    );
  }

  const selectedNode = nodes.find(n => n.id === tf.selection);

  return (
    <div className="h-screen flex bg-[#141A21] relative">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className={`
              px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-sm max-w-md
              ${notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-800/50 text-emerald-100' : ''}
              ${notification.type === 'error' ? 'bg-red-950/90 border-red-800/50 text-red-100' : ''}
              ${notification.type === 'warning' ? 'bg-yellow-950/90 border-yellow-800/50 text-yellow-100' : ''}
            `}>
              <div className="flex items-start gap-3">
                {notification.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                {notification.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                {notification.type === 'warning' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <div className="text-sm font-medium">{notification.message}</div>
                </div>
                <button 
                  onClick={() => setNotification(null)}
                  className="text-current hover:opacity-70 transition-opacity"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Bar */}
      <div
        className="h-12 px-4 flex items-center justify-between shadow-2xl"
        style={{
          background: '#141A21',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              {isEditingName ? (
                <input
                  type="text"
                  value={flowName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFlowName(newName);
                    tf.setFlow({ name: newName });
                    // Update localStorage immediately as user types
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(`flow_name_${assistantId}`, newName);
                    }
                  }}
                  onBlur={() => {
                    setIsEditingName(false);
                    if (!flowName.trim()) {
                      const defaultName = "Untitled Text Flow";
                      setFlowName(defaultName);
                      tf.setFlow({ name: defaultName });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingName(false);
                      if (!flowName.trim()) {
                        const defaultName = "Untitled Text Flow";
                        setFlowName(defaultName);
                        tf.setFlow({ name: defaultName });
                      }
                    } else if (e.key === 'Escape') {
                      setIsEditingName(false);
                      const originalName = tf.flow.name || "Untitled Text Flow";
                      setFlowName(originalName);
                    }
                  }}
                  className="text-sm font-bold text-white bg-transparent border-none outline-none focus:outline-none px-1 py-0.5 rounded"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-sm font-bold text-white cursor-pointer hover:text-emerald-400 transition-colors px-1 py-0.5 rounded"
                  onClick={() => setIsEditingName(true)}
                  title="Click to edit workflow name"
                >
                  {flowName}
                </h1>
              )}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isConnected() ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-[11px] text-white/70">{isConnected() ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowTemplateGallery(true)}
            className="px-3 py-1.5 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderColor: 'rgba(255, 255, 255, 0.18)'
            }}
            title="Browse Templates"
          >
            <Sparkles className="w-4 h-4" />
            Templates
          </button>

          <button
            onClick={() => setShowConnectorPanel(true)}
            className="px-3 py-1.5 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderColor: 'rgba(255, 255, 255, 0.18)'
            }}
            title="API Connectors"
          >
            <Plug className="w-4 h-4" />
            Connectors
          </button>

          <button
            onClick={() => setShowComponentLibrary(true)}
            className="px-3 py-1.5 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderColor: 'rgba(255, 255, 255, 0.18)'
            }}
            title="Component Library"
          >
            <Package className="w-4 h-4" />
            Components
          </button>

          <button
            onClick={() => setShowTriggerManager(true)}
            className="px-3 py-1.5 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderColor: 'rgba(255, 255, 255, 0.18)'
            }}
            title="Manage Triggers & Credentials"
          >
            <Key className="w-4 h-4" />
            <Activity className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Test input..."
            className="w-56 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <button
            onClick={handleRun}
            disabled={!nodes.length || !isConnected()}
            className="px-4 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Run
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-1.5 text-white rounded-lg text-xs font-semibold border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saveStatus || "Save"}
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 text-white rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all shadow-lg"
            title="Export flow"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleImport}
            className="p-1.5 text-white rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all shadow-lg"
            title="Import flow"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area - Full Page */}
      <div className="flex-1 relative bg-[#141A21]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{
            stroke: '#13F584',
            strokeWidth: 1,
            strokeDasharray: '5 5',
            opacity: 0.6,
          }}
          defaultEdgeOptions={{ 
            type: "smoothstep",
            animated: false,
            style: { 
              stroke: '#13F584', 
              strokeWidth: 1,
              opacity: 0.6
            }
          }}
          style={{ 
            background: '#141A21',
            width: '100%',
            height: '100%'
          }}
        >
            <Background 
              color="#FFFFFF" 
              gap={10} 
              size={1.5}
              variant="dots"
              style={{ opacity: 0.2 }}
            />
            <Controls 
              className="!bg-white/8 !border-white/20 !rounded-xl !shadow-2xl !backdrop-blur-xl [&_button]:!bg-transparent [&_button]:!border-white/20 [&_button:hover]:!bg-white/10 [&_button]:!text-white [&_svg]:!text-white [&_svg_path]:!stroke-white [&_svg_path]:!fill-white"
              showInteractive={false}
              showFitView={false}
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                bottom: '16px',
                left: '16px',
                right: 'auto',
                top: 'auto'
              }}
            />
            <style dangerouslySetInnerHTML={{__html: `
              .react-flow__controls button svg path {
                stroke: #FFFFFF !important;
                fill: #FFFFFF !important;
              }
              .react-flow__controls button {
                color: #FFFFFF !important;
              }
              .react-flow__controls button svg {
                color: #FFFFFF !important;
              }
            `}} />
          </ReactFlow>
          
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <span className="text-sm text-gray-400">Create your flows, use minibar</span>
              </div>
            </div>
          )}

        {/* AI Chatbot Panel - Right Side */}
        {showChatbot && !chatbotMinimized && (
          <div className="absolute right-0 top-0 bottom-0 w-[420px] flex-shrink-0 p-4 pl-0 z-10">
            <FlowChatbotPanel
              currentFlow={{ nodes, edges }}
              onApplyFlow={handleApplyChatbotFlow}
              onPreviewFlow={handlePreviewChatbotFlow}
              sessionId={chatSessionId}
              isMinimized={chatbotMinimized}
              onToggleMinimize={() => setChatbotMinimized(!chatbotMinimized)}
            />
          </div>
        )}

        {/* Minimized Chatbot Button */}
        {showChatbot && chatbotMinimized && (
          <FlowChatbotPanel
            currentFlow={{ nodes, edges }}
            onApplyFlow={handleApplyChatbotFlow}
            onPreviewFlow={handlePreviewChatbotFlow}
            sessionId={chatSessionId}
            isMinimized={chatbotMinimized}
            onToggleMinimize={() => setChatbotMinimized(!chatbotMinimized)}
          />
        )}


        {/* Bottom Control Bar - Center */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center"
          style={{
            bottom: consoleCollapsed ? '60px' : `${consoleHeight + 20}px`,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '58px',
            padding: '14px 16px',
            gap: '10px',
            transition: 'bottom 0.3s ease',
            pointerEvents: 'none'
          }}
        >
        {/* Components Button */}
        <button
          onClick={() => setShowComponentModal(true)}
          className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-white/12"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            pointerEvents: 'auto'
          }}
          title="Components"
        >
          <Package className="w-5 h-5 text-white" />
        </button>

        {/* Templates Button */}
        <button
          onClick={() => setShowTemplateGallery(true)}
          className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-white/12"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            pointerEvents: 'auto'
          }}
          title="Templates"
        >
          <Sparkles className="w-5 h-5 text-white" />
        </button>

        {/* AI Button */}
        <button
          onClick={() => {
            setShowChatbot(!showChatbot);
            setChatbotMinimized(false);
          }}
          className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-white/12"
          style={{
            background: showChatbot ? 'rgba(19, 245, 132, 0.16)' : 'rgba(255, 255, 255, 0.12)',
            pointerEvents: 'auto'
          }}
          title="AI Builder"
        >
          <Bot className="w-5 h-5" style={{ color: showChatbot ? '#9EFBCD' : '#FFFFFF' }} />
        </button>

        {/* Console Button */}
        <button
          onClick={() => setConsoleCollapsed(!consoleCollapsed)}
          className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-white/12"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            pointerEvents: 'auto'
          }}
          title="Console"
        >
          <Activity className="w-5 h-5 text-white" />
        </button>
        </div>

        {/* Resizable Console Panel */}
        <div 
          className="absolute bottom-0 left-0 right-0 transition-all duration-300 overflow-hidden cursor-pointer z-20" 
          style={{ height: consoleCollapsed ? '40px' : consoleHeight, paddingBottom: consoleCollapsed ? '0' : '1rem' }}
          onClick={() => setConsoleCollapsed(!consoleCollapsed)}
        >
        {/* Resize Handle */}
        {!consoleCollapsed && (
          <div
            className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-emerald-500/20 transition-colors group z-10"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleResizeStart(e);
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-gray-700 rounded-full group-hover:bg-emerald-500 transition-colors flex items-center justify-center">
              <GripHorizontal className="w-4 h-4 text-gray-600 group-hover:text-emerald-400" />
            </div>
          </div>
        )}
        {!consoleCollapsed && (
          <div className="h-full pt-2">
            <ConsolePanel />
          </div>
        )}
        </div>
      </div>

      {/* Config Panel Modal (Centered with Blur) */}
      {selectedNode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => tf.setSelection(null)}
          />
          
          {/* Config Panel - Scrollable content */}
          <div className="relative z-50 w-full max-w-2xl h-[90vh] flex flex-col">
            <ConfigPanel assistantId={assistantId} />
          </div>
        </div>
      )}

      {/* Other Modals */}
      {showTriggerManager && (
        <TriggerManager 
          assistantId={assistantId} 
          onClose={() => setShowTriggerManager(false)} 
        />
      )}

      {showTemplateGallery && (
        <TemplateGallery
          assistantId={assistantId}
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateGallery(false)}
          onGetCurrentFlow={() => ({ nodes, edges })}
        />
      )}

      {showComponentLibrary && (
        <ComponentLibraryPanel
          assistantId={assistantId}
          nodeType={selectedNodeType}
          onSelectComponent={handleSelectComponent}
          onClose={() => setShowComponentLibrary(false)}
        />
      )}

      {showConnectorPanel && (
        <ConnectorPanel
          assistantId={assistantId}
          onSelectConnector={handleSelectConnector}
          onClose={() => setShowConnectorPanel(false)}
        />
      )}

      {/* Component Selection Modal */}
      {showComponentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowComponentModal(false)} 
          />
          
          {/* Modal */}
          <div 
            className="relative rounded-3xl w-[600px] max-w-[90vw] max-h-[80vh] overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="flex flex-col gap-4 p-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Select Component</h2>
                <button
                  onClick={() => setShowComponentModal(false)}
                  className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  title="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Component Grid */}
              <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[60vh] pr-2">
                {[
                  { type: "start", label: "Start", icon: Play, color: "from-emerald-400 to-teal-500" },
                  { type: "trigger", label: "Trigger", icon: Target, color: "from-blue-400 to-cyan-500" },
                  { type: "http", label: "HTTP", icon: Globe, color: "from-violet-400 to-purple-500" },
                  { type: "llm", label: "AI Model", icon: Brain, color: "from-pink-400 to-rose-500" },
                  { type: "transform", label: "Transform", icon: Zap, color: "from-amber-400 to-orange-500" },
                  { type: "conditional", label: "Branch", icon: GitBranch, color: "from-indigo-400 to-blue-500" },
                  { type: "parallel", label: "Parallel", icon: Layers, color: "from-fuchsia-400 to-purple-500" },
                  { type: "wait", label: "Delay", icon: Clock, color: "from-gray-400 to-slate-500" },
                  { type: "subflow", label: "Subflow", icon: Package, color: "from-cyan-400 to-blue-500" }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        const id = `${item.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                        const existingNodes = nodes.length;
                        const x = 100 + (existingNodes % 3) * 280;
                        const y = 100 + Math.floor(existingNodes / 3) * 160;
                        
                        const node = {
                          id,
                          type: item.type,
                          position: { x, y },
                          data: { 
                            label: item.label,
                            config: {}
                          }
                        };
                        
                        setNodes([...nodes, node]);
                        tf.setSelection(id);
                        
                        if (!tf.flow.entryNodeId || item.type === "start") {
                          tf.setFlow({ entryNodeId: id });
                        }
                        
                        tf.appendConsole({ 
                          ts: Date.now(), 
                          kind: "info", 
                          text: `Added ${item.type} node` 
                        });
                        
                        setShowComponentModal(false);
                      }}
                      className="group relative overflow-hidden rounded-xl border border-white/20 bg-gray-800/50 hover:bg-gray-750 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 p-4 flex items-center gap-3"
                    >
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-sm text-gray-100">{item.label}</div>
                        <div className="text-xs text-gray-400 capitalize">{item.type}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function TextFlowEditor({ assistantId }) {
  return (
    <ReactFlowProvider>
      <FlowContent assistantId={assistantId} />
    </ReactFlowProvider>
  );
}