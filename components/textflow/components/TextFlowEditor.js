// components/textflow/components/TextFlowEditor.js - WITH AI CHAT + UCG FEATURE
import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import ReactFlow, { Background, Controls, addEdge, useEdgesState, useNodesState, ConnectionLineType, useReactFlow, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "../nodes/index.js";
import { useTextflowStore } from "../hooks/useTextflowStore.js";
import { saveTextFlow, getTextFlow } from "../api/textflowApi.js";
import { useWebSocketStream } from "../hooks/useWebSocketStream.js";
import ConfigPanel from "./ConfigPanel.js";
import ConsolePanel from "./ConsolePanel.js";
import TriggerManager from "./TriggerManager.js";
import CreateCredentialModal from "./CreateCredentialModal";
import TemplateGallery from "./TemplateGallery.js";
import ComponentLibraryPanel from "./ComponentLibraryPanel.js";
import CreateComponentModal from "./CreateComponentModal.js";
import FlowChatbotPanel from "./FlowChatbotPanel.js";
import ConnectorPanel from "./ConnectorPanel.js";
import { Play, Save, Layers, Zap, Download, Upload, Key, Activity, Settings, Sparkles, Package, AlertCircle, CheckCircle, GripHorizontal, Bot, MessageSquare, Plug, Target, Globe, Brain, GitBranch, Clock, FileText, Search, X } from "lucide-react";

const MINIBAR_ICONS = {
  components: "/textflow-icons/textflow_btn_1.png",
  templates: "/textflow-icons/textflow_btn_2.png",
  subflows: "/textflow-icons/textflow_btn_3.png",
  connectors: "/textflow-icons/textflow_btn_4.png",
  triggers: "/textflow-icons/textflow_btn_5.png",
  console: "/textflow-icons/textflow_btn_6.png",
  aiDefault: "/textflow-icons/textflow_btn_hover.png",
  aiActive: "/textflow-icons/textflow_btn_hover.png",
};

// Helper function to get Figma-style gradient and border for component icons
const getComponentIconStyle = (type) => {
  const styles = {
    start: {
      // Emerald/Teal
      background: 'rgba(16, 185, 129, 0.1)',
      borderColor: '#10B981',
      borderWidth: '1.17px',
      iconColor: '#10B981'
    },
    trigger: {
      // Sky/Blue
      background: 'rgba(0, 184, 217, 0.1)',
      borderColor: '#00B8D9',
      borderWidth: '1.17px',
      iconColor: '#00B8D9'
    },
    http: {
      // Yellow/Amber/Orange
      background: 'rgba(255, 171, 0, 0.1)',
      borderColor: '#FFAB00',
      borderWidth: '0.39px',
      iconColor: '#FFAB00'
    },
    llm: {
      // Pink/Rose/Fuchsia
      background: 'rgba(247, 28, 182, 0.1)',
      borderColor: '#F71CB6',
      borderWidth: '1.17px',
      iconColor: '#F71CB6'
    },
    transform: {
      // Purple/Violet/Indigo
      background: 'rgba(139, 92, 246, 0.1)',
      borderColor: '#8B5CF6',
      borderWidth: '1.17px',
      iconColor: '#8B5CF6'
    },
    conditional: {
      // Cyan/Blue/Indigo
      background: 'rgba(6, 182, 212, 0.1)',
      borderColor: '#06B6D4',
      borderWidth: '1.17px',
      iconColor: '#06B6D4'
    },
    parallel: {
      // Fuchsia/Purple/Blue
      background: 'rgba(217, 70, 239, 0.1)',
      borderColor: '#D946EF',
      borderWidth: '1.17px',
      iconColor: '#D946EF'
    },
    wait: {
      // Slate
      background: 'rgba(100, 116, 139, 0.1)',
      borderColor: '#64748B',
      borderWidth: '1.17px',
      iconColor: '#64748B'
    },
    subflow: {
      // Teal/Emerald/Green
      background: 'rgba(20, 184, 166, 0.1)',
      borderColor: '#14B8A6',
      borderWidth: '1.17px',
      iconColor: '#14B8A6'
    }
  };
  return styles[type] || styles.transform;
};

const COMPONENT_OPTIONS = [
  { type: "start", label: "Start", description: "Entry point for every flow", icon: Play, accent: "from-emerald-400/90 via-emerald-500 to-teal-500" },
  { type: "trigger", label: "Trigger", description: "Listen for channel activity", icon: Target, accent: "from-sky-400/90 via-sky-500 to-blue-500" },
  { type: "http", label: "HTTP", description: "Call REST or webhook endpoints", icon: Globe, accent: "from-yellow-300/80 via-amber-400 to-orange-500" },
  { type: "llm", label: "AI Model", description: "Generate content with LLMs", icon: Brain, accent: "from-pink-400/90 via-rose-500 to-fuchsia-500" },
  { type: "transform", label: "Transform", description: "Reshape and clean data", icon: Zap, accent: "from-purple-400/90 via-violet-500 to-indigo-500" },
  { type: "conditional", label: "Branch", description: "Route logic with conditions", icon: GitBranch, accent: "from-cyan-400/90 via-blue-500 to-indigo-500" },
  { type: "parallel", label: "Parallel", description: "Fan out concurrent tasks", icon: Layers, accent: "from-fuchsia-400/90 via-purple-500 to-blue-500" },
  { type: "wait", label: "Delay", description: "Pause execution by time", icon: Clock, accent: "from-slate-400/90 via-slate-500 to-slate-600" },
  { type: "subflow", label: "Subflow", description: "Reuse saved mini flows", icon: Package, accent: "from-teal-400/90 via-emerald-500 to-green-500" },
];

function FlowContent({ assistantId }) {
  const router = useRouter();
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
  const [showCreateCredentialModal, setShowCreateCredentialModal] = useState(false);
  const [credentialRefreshKey, setCredentialRefreshKey] = useState(0);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [showCreateComponentModal, setShowCreateComponentModal] = useState(false);
  const [componentRefreshTrigger, setComponentRefreshTrigger] = useState(0);
  const [showConnectorPanel, setShowConnectorPanel] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [componentSearch, setComponentSearch] = useState("");
  const [flowActive, setFlowActive] = useState(false);
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

  const componentDropdownOffset = consoleCollapsed ? 140 : Math.min(consoleHeight + 90, 520);
  const chatbotBottomOffset = consoleCollapsed ? 24 : consoleHeight + 10;
  const filteredComponents = useMemo(() => {
    const query = componentSearch.trim().toLowerCase();
    if (!query) return COMPONENT_OPTIONS;
    return COMPONENT_OPTIONS.filter((option) =>
      `${option.label} ${option.type} ${option.description}`.toLowerCase().includes(query)
    );
  }, [componentSearch]);

  
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
        fitView({ padding: 0.1, duration: 300 });
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
      if (typeof window !== 'undefined' && assistantId) {
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
    <div className="h-full flex bg-[#141A21] relative">
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
        className="relative px-4 py-0 h-12 flex items-center justify-between"
        style={{
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      >
        {/* Background shape overlay */}
        <div className="absolute inset-0 pointer-events-none"/>
        
        <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-white/70 hover:text-white transition-colors p-1"
            aria-label="Go back"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            {isEditingName ? (
              <input
                type="text"
                value={flowName}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFlowName(newName);
                  tf.setFlow({ name: newName });
                  if (typeof window !== 'undefined' && assistantId) {
                    localStorage.setItem(`flow_name_${assistantId}`, newName);
                  }
                }}
                onBlur={() => {
                  setIsEditingName(false);
                  if (!flowName.trim()) {
                    const defaultName = "Untitled Text Flow";
                    setFlowName(defaultName);
                    tf.setFlow({ name: defaultName });
                    if (typeof window !== 'undefined' && assistantId) {
                      localStorage.setItem(`flow_name_${assistantId}`, defaultName);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingName(false);
                    if (!flowName.trim()) {
                      const defaultName = "Untitled Text Flow";
                      setFlowName(defaultName);
                      tf.setFlow({ name: defaultName });
                      if (typeof window !== 'undefined' && assistantId) {
                        localStorage.setItem(`flow_name_${assistantId}`, defaultName);
                      }
                    }
                  } else if (e.key === 'Escape') {
                    setIsEditingName(false);
                    const originalName = tf.flow.name || "Untitled Text Flow";
                    setFlowName(originalName);
                  }
                }}
                className="text-sm font-semibold text-white bg-transparent border-b border-white/30 focus:outline-none focus:border-white px-1 py-0.5 max-w-[160px]"
                autoFocus
              />
            ) : (
              <h1
              className="text-sm font-semibold text-white cursor-pointer"
                onClick={() => setIsEditingName(true)}
                title="Click to edit workflow name"
              >
                {flowName}
              </h1>
            )}
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold font-["Public Sans",sans-serif] ${
                isConnected()
                  ? "bg-[rgba(19,245,132,0.12)] text-[#9EFBCD]"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {isConnected() ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <p className={`text-xs ${flowActive ? 'text-emerald-300' : 'text-white/60'}`}>
            {flowActive ? 'Active' : 'Disabled'}
          </p>
          <button
            type="button"
            className={`relative inline-flex h-6 w-12 items-center rounded-full border transition-colors ${
              flowActive ? 'bg-emerald-500/30 border-emerald-400/50' : 'bg-white/5 border-white/15'
            }`}
            onClick={() => setFlowActive((prev) => !prev)}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                flowActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-1">
            <button
              onClick={handleRun}
              disabled={!nodes.length || !isConnected()}
              className="px-2 py-1 text-xs font-bold text-white rounded-lg bg-transparent hover:bg-white/10 transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                border: "2px solid rgba(145, 158, 171, 0.32)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.16675 9.99884V5.66808C4.16675 3.8738 6.10947 2.75139 7.66156 3.64984L11.4142 5.81652L15.1668 7.9832C16.7215 8.87904 16.7215 11.1238 15.1668 12.0197L11.4142 14.1864L7.66156 16.353C6.10947 17.2463 4.16675 16.1265 4.16675 14.3322V9.99884Z"
                  fill="white"
                />
              </svg>
              Run
            </button>
            <button
              onClick={handleImport}
              className="px-2 py-1 text-xs font-bold text-white rounded-lg bg-transparent hover:bg-white/10 transition-all flex items-center gap-1"
              style={{
                border: "2px solid rgba(145, 158, 171, 0.32)",
              }}
              title="Import flow"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button
              onClick={handleExport}
              className="px-2 py-1 text-xs font-bold text-white rounded-lg bg-transparent hover:bg-white/10 transition-all flex items-center gap-1"
              style={{
                border: "2px solid rgba(145, 158, 171, 0.32)",
              }}
              title="Export flow"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-2 py-1 text-xs font-bold text-[#13F584] border border-[#13F584] rounded-lg bg-transparent hover:bg-[#13F584]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.0154 5.01013L14.9899 3.98464C14.5733 3.56736 14.0083 3.3335 13.4188 3.3335H4.86106C4.01715 3.3335 3.33325 4.0174 3.33325 4.86131V15.139C3.33325 15.9829 4.01715 16.6668 4.86106 16.6668H15.1388C15.9827 16.6668 16.6666 15.9829 16.6666 15.139V6.58128C16.6666 5.99178 16.4327 5.4268 16.0154 5.01013ZM5.55544 6.80568V5.41683C5.55544 5.18683 5.74211 5.00016 5.97211 5.00016H11.8054C12.0354 5.00016 12.2221 5.18683 12.2221 5.41683V6.80568C12.2221 7.03569 12.0354 7.22235 11.8054 7.22235H5.97211C5.74211 7.22235 5.55544 7.03569 5.55544 6.80568ZM9.99992 14.4446C8.6194 14.4446 7.49992 13.3252 7.49992 11.9446C7.49992 10.564 8.6194 9.44464 9.99992 9.44464C11.3804 9.44464 12.4999 10.564 12.4999 11.9446C12.4999 13.3252 11.3804 14.4446 9.99992 14.4446Z"
                  fill="#13F584"
                />
              </svg>
              <span>{saveStatus || "Save"}</span>
            </button>
        </div>
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
          fitViewOptions={{ padding: 0.1 }}
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
              className="!bg-white/8 !border-0 !rounded-xl !shadow-2xl !backdrop-blur-xl [&_button]:!bg-transparent [&_button]:!border-0 [&_button:hover]:!bg-white/10 [&_button]:!text-white [&_svg]:!text-white [&_svg_path]:!stroke-white [&_svg_path]:!fill-white"
              showInteractive={false}
              showFitView={false}
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: 'none',
                bottom: '16px',
                left: '2px',
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
                border: none !important;
                border-top: none !important;
                border-bottom: none !important;
                border-left: none !important;
                border-right: none !important;
              }
              .react-flow__controls button svg {
                color: #FFFFFF !important;
              }
              .react-flow__controls button + button {
                border-top: none !important;
              }
              .react-flow__controls {
                border: none !important;
              }
              .react-flow__attribution {
                display: none !important;
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
          <div
            className="absolute right-0 top-4 w-[420px] flex-shrink-0 p-4 pl-0 z-20 pointer-events-none"
            style={{ bottom: `${chatbotBottomOffset}px` }}
          >
            <div className="relative h-full">
              <div className="absolute inset-0 rounded-[32px] bg-[#0C1118] opacity-95 shadow-[0_0_40px_rgba(0,0,0,0.45)]"></div>
              <div className="relative h-full pointer-events-auto">
                <FlowChatbotPanel
                  currentFlow={{ nodes, edges }}
                  onApplyFlow={handleApplyChatbotFlow}
                  onPreviewFlow={handlePreviewChatbotFlow}
                  sessionId={chatSessionId}
                  isMinimized={chatbotMinimized}
                  onToggleMinimize={() => setChatbotMinimized(!chatbotMinimized)}
                  onCloseChatbot={() => {
                    setShowChatbot(false);
                    setChatbotMinimized(false);
                  }}
                />
              </div>
            </div>
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
            onCloseChatbot={() => {
              setShowChatbot(false);
              setChatbotMinimized(false);
            }}
          />
        )}


        {/* Bottom Control Bar - Center */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center"
          style={{
            bottom: consoleCollapsed ? '60px' : `${consoleHeight + 10}px`,
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '58px',
            padding: '8px',
            gap: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            transition: 'bottom 0.3s ease',
            pointerEvents: 'none'
          }}
        >
        {/* Components Button */}
        <div className="relative group" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowComponentModal(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ background: 'transparent' }}
          >
            <img src={MINIBAR_ICONS.components} alt="Components" className="w-10 h-10" />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            Components
          </div>
        </div>

        {/* Templates Button */}
        <div className="relative group" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowTemplateGallery(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ background: 'transparent' }}
          >
            <img src={MINIBAR_ICONS.templates} alt="Templates" className="w-10 h-10" />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            Templates
          </div>
        </div>

        {/* Subflows Button */}
        <div className="relative group" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowComponentLibrary(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ background: 'transparent' }}
          >
            <img src={MINIBAR_ICONS.subflows} alt="Subflows" className="w-10 h-10" />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            Component Library
          </div>
        </div>

        {/* Connectors Button */}
        <div className="relative group" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowConnectorPanel(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ background: 'transparent' }}
          >
            <img src={MINIBAR_ICONS.connectors} alt="Connectors" className="w-10 h-10" />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            Connectors
          </div>
        </div>

        {/* Trigger Manager Button */}
        <div className="relative group" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowTriggerManager(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ background: 'transparent' }}
          >
            <img src={MINIBAR_ICONS.triggers} alt="Triggers & Credentials" className="w-10 h-10" />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            Triggers & Credentials
          </div>
        </div>

        {/* Console Button */}
        <div className="relative group" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => setConsoleCollapsed(!consoleCollapsed)}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ background: 'transparent' }}
          >
            <img src={MINIBAR_ICONS.console} alt="Console" className="w-10 h-10" />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            Console
          </div>
        </div>

        {/* AI Button */}
        <div className="relative group" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => {
              setShowChatbot(!showChatbot);
              setChatbotMinimized(false);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ background: 'transparent' }}
          >
            <img
              src={MINIBAR_ICONS.aiDefault}
              alt="Workflow Builder"
              className="w-10 h-10"
            />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            Workflow Builder
          </div>
        </div>
        </div>

        {/* Resizable Console Panel */}
        <div 
          className="absolute bottom-0 left-0 right-0 transition-all duration-300 overflow-hidden z-20" 
          style={{ height: consoleCollapsed ? '40px' : consoleHeight, paddingBottom: consoleCollapsed ? '0' : '1rem' }}
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
            <ConsolePanel onClose={() => setConsoleCollapsed(true)} />
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
          
          {/* Config Panel - Scrollable content (auto height, clamped by viewport) */}
          <div className="relative z-50 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <ConfigPanel assistantId={assistantId} />
          </div>
        </div>
      )}

      {/* Other Modals */}
      {showTriggerManager && (
        <TriggerManager
          assistantId={assistantId}
          onClose={() => setShowTriggerManager(false)}
          onOpenCreateCredential={() => setShowCreateCredentialModal(true)}
          credentialsRefreshKey={credentialRefreshKey}
          bottomOffset={componentDropdownOffset}
        />
      )}
      <CreateCredentialModal
        isOpen={showCreateCredentialModal}
        onClose={() => setShowCreateCredentialModal(false)}
        assistantId={assistantId}
        onSuccess={() => {
          setShowCreateCredentialModal(false);
          setCredentialRefreshKey((prev) => prev + 1);
        }}
      />

      {showTemplateGallery && (
        <TemplateGallery
          assistantId={assistantId}
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateGallery(false)}
          onGetCurrentFlow={() => ({ nodes, edges })}
          bottomOffset={componentDropdownOffset}
        />
      )}

      {showComponentLibrary && (
        <ComponentLibraryPanel
          assistantId={assistantId}
          nodeType={selectedNodeType}
          onSelectComponent={handleSelectComponent}
          onClose={() => setShowComponentLibrary(false)}
          onOpenCreateModal={() => setShowCreateComponentModal(true)}
          refreshTrigger={componentRefreshTrigger}
          bottomOffset={componentDropdownOffset}
        />
      )}

      {showCreateComponentModal && (
        <CreateComponentModal
          isOpen={showCreateComponentModal}
          onClose={() => setShowCreateComponentModal(false)}
          assistantId={assistantId}
          nodeType={selectedNodeType}
          onSuccess={() => {
            // Trigger refresh of ComponentLibraryPanel
            setComponentRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {showConnectorPanel && (
        <ConnectorPanel
          assistantId={assistantId}
          onSelectConnector={handleSelectConnector}
          onClose={() => setShowConnectorPanel(false)}
          bottomOffset={componentDropdownOffset}
        />
      )}

      {/* Component Selection Dropdown */}
      {showComponentModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none"
          style={{ paddingBottom: componentDropdownOffset }}
        >
          <div
            className="absolute inset-0 bg-transparent pointer-events-auto"
            onClick={() => setShowComponentModal(false)}
          />

          <div
            className="relative pointer-events-auto w-full px-4"
            style={{ maxWidth: '700px' }}
          >
            <div
              className="rounded-[24px]"
              style={{
                width: '100%',
                height: '60vh',
                maxHeight: '60vh',
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 20px 80px rgba(0, 0, 0, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {/* Header Section */}
              <div
                className="w-full flex items-center justify-between"
                style={{ padding: '24px 20px 20px 20px', gap: '32px' }}
              >
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white/90 tracking-tight">Components</h2>
                </div>
                </div>

              {/* Search Section */}
              <div
                className="w-full"
                style={{ padding: '0px 20px 12px 20px', gap: '24px', display: 'flex', flexDirection: 'column' }}
              >
                <div 
                  className="w-full flex items-center"
                  style={{
                    borderRadius: '8px',
                    borderColor: 'rgba(145, 158, 171, 0.2)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0px 14px',
                    height: '40px'
                  }}
                >
                  <div className="flex items-center" style={{ padding: '0px 10px 0px 0px' }}>
                    <Search className="h-5 w-5 text-white/40" />
                  </div>
                  <input
                    type="text"
                    value={componentSearch}
                    onChange={(e) => setComponentSearch(e.target.value)}
                    placeholder="Search components"
                    className="flex-1 border-0 bg-transparent text-white placeholder:text-white/40 focus:outline-none"
                    style={{
                      fontFamily: 'Public Sans, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '1.4em',
                      padding: 0
                    }}
                  />
                </div>
                </div>

              {/* Component List */}
                <div
                className="component-scroll w-full overflow-y-auto"
                style={{
                  padding: '0px 20px 16px 20px',
                  gap: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1
                }}
                >
                  {filteredComponents.length === 0 && (
                  <div 
                    className="rounded-2xl border border-dashed bg-white/5 p-6 text-center text-white/60"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <p style={{ fontSize: '14px' }}>No components match "{componentSearch}".</p>
                    </div>
                  )}

                  {filteredComponents.map((item) => {
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

                          setComponentSearch("");
                          setShowComponentModal(false);
                        }}
                      className="w-full flex items-center text-left py-2"
                      style={{ gap: '12px' }}
                      >
                      <div 
                        className="flex items-center justify-center relative"
                        style={{
                          width: '64px',
                          padding: '12px',
                          borderRadius: '14px',
                          backdropFilter: 'blur(38.89px)',
                          background: getComponentIconStyle(item.type).background,
                          border: `${getComponentIconStyle(item.type).borderWidth} solid ${getComponentIconStyle(item.type).borderColor}`
                        }}
                      >
                        <Icon 
                          className="h-5 w-5" 
                          style={{ color: getComponentIconStyle(item.type).iconColor }}
                        />
                        </div>
                      <div className="flex-1 flex flex-col" style={{ gap: '6px' }}>
                        <p 
                          className="text-white"
                          style={{
                            fontFamily: 'Public Sans, sans-serif',
                            fontWeight: 600,
                            fontSize: '15px',
                            lineHeight: '1.5714285714285714em'
                          }}
                        >
                          {item.label}
                        </p>
                        <p 
                          style={{
                            fontFamily: 'Public Sans, sans-serif',
                            fontWeight: 400,
                            fontSize: '13px',
                            lineHeight: '1.5em',
                            color: '#919EAB'
                          }}
                        >
                          {item.description}
                        </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
          <style
            dangerouslySetInnerHTML={{
              __html: `
                .component-scroll::-webkit-scrollbar {
                  width: 4px;
                }
                .component-scroll::-webkit-scrollbar-track {
                  background: transparent;
                  margin: 28px 0;
                  border-radius: 999px;
                }
                .component-scroll::-webkit-scrollbar-thumb {
                  background: #454F5B;
                  border-radius: 999px;
                  border-top: 14px solid transparent;
                  border-bottom: 14px solid transparent;
                  background-clip: padding-box;
                  min-height: 28px;
                }
                .component-scroll::-webkit-scrollbar-thumb:hover {
                  background: #5a6673;
                }
              `,
            }}
          />
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