// components/flows/index.js - Complete Visual Flow Editor with AI Voice Chatbot
import React, { useState, useEffect, useCallback, useRef } from "react";
import FlowCanvas from "./FlowCanvas";
import NodeEditor from "./NodeEditor";
import VoiceFlowChatbotPanel from "./VoiceFlowChatbotPanel";
import { flowsService } from "../../lib/flowsService";
import { convertToReactFlow, convertFromReactFlow, createDefaultNode, PositionStorage } from "./utils";
import ToolEditor from "../ToolEditor";
import ToolsList from "../ToolsList";

// ============================================================================
// REMOVED: Inline ToolEditor and ToolsList - now using imported redesigned components
// ============================================================================

// ============================================================================
// MAIN VISUAL FLOW EDITOR COMPONENT
// ============================================================================
export default function VisualFlowEditor({ assistantId, router }) {
  // Flow state
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [flowName, setFlowName] = useState("");
  const [initialNodeId, setInitialNodeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const fileInputRef = useRef(null);
  const savePositionTimeoutRef = useRef(null);
  // Tools state
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [showToolEditor, setShowToolEditor] = useState(false);
  const [toolsRefreshTrigger, setToolsRefreshTrigger] = useState(0);

  // AI Chatbot state
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotMinimized, setChatbotMinimized] = useState(false);
  const [chatSessionId] = useState(() => 
    `voice_chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );

  // Load flow on mount
  useEffect(() => {
  let mounted = true;
  (async () => {
    setLoading(true);
    try {
      const latest = await flowsService.latest(assistantId);
      if (!mounted || !latest) {
        const defaultNode = createDefaultNode("welcome", 100, 100);
        setNodes([defaultNode]);
        setInitialNodeId("welcome");
        setLoading(false);
        return;
      }

      const flow = latest.initial || latest.nodes || latest.edges ? latest : latest.flow;
      if (!flow || !Array.isArray(flow.nodes)) {
        const defaultNode = createDefaultNode("welcome", 100, 100);
        setNodes([defaultNode]);
        setInitialNodeId("welcome");
        setLoading(false);
        return;
      }

      // ✅ NEW: Load saved positions from localStorage
      const savedPositions = PositionStorage.loadPositions(assistantId);

      // ✅ MODIFIED: Convert with position restoration
      const { nodes: reactFlowNodes, edges: reactFlowEdges } = convertToReactFlow(flow, savedPositions);
      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
      setInitialNodeId(flow.initial || reactFlowNodes[0]?.data?.id || "welcome");

      // ✅ NEW: Show feedback if positions were restored
      if (Object.keys(savedPositions).length > 0) {
        setMessage("✅ Node positions restored from previous session");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Failed to load flow:", error);
      const defaultNode = createDefaultNode("welcome", 100, 100);
      setNodes([defaultNode]);
      setInitialNodeId("welcome");
    } finally {
      setLoading(false);
    }
  })();
  return () => { mounted = false; };
}, [assistantId]);
  // ✅ NEW: Auto-save positions when nodes change (debounced)
const savePositionsDebounced = useCallback(() => {
  // Clear existing timeout
  if (savePositionTimeoutRef.current) {
    clearTimeout(savePositionTimeoutRef.current);
  }

  // Save after 1 second of inactivity
  savePositionTimeoutRef.current = setTimeout(() => {
    PositionStorage.savePositions(assistantId, nodes);
  }, 1000);
}, [assistantId, nodes]);

// ✅ NEW: Trigger position save when nodes change
useEffect(() => {
  if (nodes.length > 0) {
    savePositionsDebounced();
  }
  
  // Cleanup timeout on unmount
  return () => {
    if (savePositionTimeoutRef.current) {
      clearTimeout(savePositionTimeoutRef.current);
    }
  };
}, [nodes, savePositionsDebounced]);
  // Add node
  const addNode = useCallback(() => {
    const newNodeId = `node_${Date.now()}`;
    const newNode = createDefaultNode(newNodeId, Math.random() * 150 + 30, Math.random() * 150 + 30);
    setNodes(prev => [...prev, newNode]);
  }, []);

  // Update node data
  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...newData } }
        : node
    ));
  }, []);

  // Auto-open/close sidebar based on node selection
  useEffect(() => {
    if (selectedNode) {
      setSidebarCollapsed(false);
    } else {
      setSidebarCollapsed(true);
    }
  }, [selectedNode]);

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    
    setNodes(prev => prev.filter(node => node.id !== selectedNode.id));
    setEdges(prev => prev.filter(edge => 
      edge.source !== selectedNode.id && edge.target !== selectedNode.id
    ));
    setSelectedNode(null);
    
    if (initialNodeId === selectedNode.data?.id) {
      const remainingNodes = nodes.filter(node => node.id !== selectedNode.id);
      setInitialNodeId(remainingNodes[0]?.data?.id || "");
    }
  }, [selectedNode, nodes, initialNodeId]);

  // Export flow
  const exportFlow = useCallback(() => {
    try {
      const flowData = convertFromReactFlow(nodes, edges, initialNodeId);
      const exportData = {
        name: flowName || "Visual Flow",
        version: 1,
        flow: flowData,
        exportedAt: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${flowName || 'flow'}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage("Flow exported successfully ✅");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage(`Export failed: ${e.message}`);
      setTimeout(() => setMessage(""), 3000);
    }
  }, [nodes, edges, initialNodeId, flowName]);

  // Import flow
  const importFlow = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!importedData.flow || !Array.isArray(importedData.flow.nodes)) {
          throw new Error("Invalid flow format");
        }
        PositionStorage.clearPositions(assistantId);

        const { nodes: reactFlowNodes, edges: reactFlowEdges } = convertToReactFlow(importedData.flow);
        setNodes(reactFlowNodes);
        setEdges(reactFlowEdges);
        setInitialNodeId(importedData.flow.initial || reactFlowNodes[0]?.data?.id || "welcome");
        setFlowName(importedData.name || "");
        
        setMessage("Flow imported successfully ✅");
        setTimeout(() => setMessage(""), 3000);
      } catch (e) {
        setMessage(`Import failed: ${e.message}`);
        setTimeout(() => setMessage(""), 3000);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Save flow
  const saveFlow = useCallback(async () => {
    setMessage("");
    setSaving(true);
    try {
      const flowData = convertFromReactFlow(nodes, edges, initialNodeId);
      const payload = {
        flow: flowData,
        name: flowName || "Visual Flow",
        version: 1,
      };
      const res = await flowsService.save(assistantId, payload);
      setMessage(res?.ok === false ? `Save failed: ${res.error || "error"}` : "Saved ✅");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, initialNodeId, flowName, assistantId]);

  // Activate flow
  const activateFlow = useCallback(async () => {
    setMessage("");
    setActivating(true);
    try {
      const flowData = convertFromReactFlow(nodes, edges, initialNodeId);
      const res = await flowsService.activate(assistantId, { flow: flowData });
      setMessage(res?.ok === false ? `Activate failed: ${res.error || "error"}` : "Activated ✅");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage(`Activate failed: ${e.message}`);
    } finally {
      setActivating(false);
    }
  }, [nodes, edges, initialNodeId, assistantId]);

  // Tool handlers
  const handleToolSaved = (tool) => {
    setEditingTool(null);
    setShowToolEditor(false);
    setShowToolsPanel(true);
    setToolsRefreshTrigger(prev => prev + 1);
    setMessage(`Tool "${tool.name}" saved successfully ✅`);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAddTool = () => {
    console.log('Add tool clicked - opening editor');
    setEditingTool(null);
    setShowToolEditor(true);
  };

  const handleEditTool = (tool) => {
    console.log('Edit tool clicked', tool);
    setEditingTool(tool);
    setShowToolEditor(true);
  };

  const handleCloseToolsPanel = () => {
    setShowToolsPanel(false);
    setShowToolEditor(false);
    setEditingTool(null);
  };

  // AI Chatbot handlers
  const handleApplyChatbotFlow = async (flow, tools = []) => {
    if (!flow || !flow.nodes) {
      setMessage('❌ Invalid flow from AI');
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    console.log("Applying AI-generated flow:", flow);
    console.log("Tools to create:", tools);

    try {
      // Step 1: Create tools first (if any)
      const createdTools = [];
      if (tools && tools.length > 0) {
        setMessage(`⏳ Creating ${tools.length} tools...`);
        
        for (const tool of tools) {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://176.9.16.194:5403/api";
            
            // Prepare tool payload
            const toolPayload = {
              name: tool.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
              description: tool.description || `Auto-generated tool: ${tool.name}`,
              method: tool.method || 'POST',
              endpoint_url: tool.endpoint_url || 'https://api.example.com/endpoint',
              input_schema: tool.input_schema || { type: 'object', properties: {} },
              output_schema: tool.output_schema || { type: 'object', properties: {} },
              headers: tool.headers || { 'Content-Type': 'application/json' },
              is_enabled: false, // Created as disabled - user must verify
              is_verified: false
            };

            console.log(`Creating tool: ${toolPayload.name}`);

            const response = await fetch(`${apiBase}/assistants/${assistantId}/tools`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(toolPayload)
            });

            if (response.ok) {
              const createdTool = await response.json();
              createdTools.push(createdTool);
              console.log(`✓ Tool created: ${createdTool.name}`);
            } else {
              const error = await response.text();
              console.error(`Failed to create tool ${toolPayload.name}:`, error);
            }
          } catch (toolError) {
            console.error(`Error creating tool ${tool.name}:`, toolError);
          }
        }

        if (createdTools.length > 0) {
          setToolsRefreshTrigger(prev => prev + 1); // Trigger tools list refresh
          setMessage(`✅ Created ${createdTools.length}/${tools.length} tools`);
        }
      }

      // Step 2: Convert AI flow format to ReactFlow format
      const { nodes: reactFlowNodes, edges: reactFlowEdges } = convertToReactFlow(flow);
      
      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
      setInitialNodeId(flow.initial || reactFlowNodes[0]?.data?.id || "welcome");
      
      const toolMessage = createdTools.length > 0 
        ? `. ${createdTools.length} tools created (verify & enable in Tool Management)`
        : '';
      
      setMessage(`✅ AI flow applied: ${reactFlowNodes.length} nodes, ${reactFlowEdges.length} edges${toolMessage}`);
      setTimeout(() => setMessage(""), 5000);

      // Step 3: Auto-save after applying
      setTimeout(async () => {
        try {
          const flowData = convertFromReactFlow(reactFlowNodes, reactFlowEdges, flow.initial);
          await flowsService.save(assistantId, {
            flow: flowData,
            name: flowName || "AI Generated Flow",
            version: 1,
          });
          setMessage("✅ AI flow applied and saved");
          setTimeout(() => setMessage(""), 3000);
        } catch (e) {
          console.error("Auto-save failed:", e);
        }
      }, 1000);

    } catch (e) {
      console.error("Apply flow error:", e);
      setMessage(`❌ Failed to apply flow: ${e.message}`);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handlePreviewChatbotFlow = (flow) => {
    console.log("Preview AI flow:", flow);
    // Optional: Show preview modal or visualization
  };

  // Get current flow for chatbot context
  const getCurrentFlow = useCallback(() => {
    try {
      return convertFromReactFlow(nodes, edges, initialNodeId);
    } catch {
      return null;
    }
  }, [nodes, edges, initialNodeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#141A21]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#13F584]"></div>
          <div className="mt-4 text-white/60">Loading flow editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-[#141A21] relative">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
      {/* Header - Compact */}
      <div 
        className="relative px-4 py-0 h-12 flex items-center justify-between"
        style={{
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      >
        {/* Background shape overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.48) 0%, transparent 100%)'
        }} />
        
        <div className="relative z-10 flex items-center justify-between w-full">
          {/* Left: Breadcrumb and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* Back Button */}
              {router && (
                <button
                  onClick={() => router.push(`/assistants/${assistantId}`)}
                  className="p-0.5 text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {/* Title */}
              <h1 className="text-sm font-semibold text-white">
                {flowName || "Visual Flow Editor"}
              </h1>
            </div>
            
            {/* Initial Node Selector */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold text-white/60 uppercase">Initial Node</label>
              <select
                value={initialNodeId}
                onChange={(e) => setInitialNodeId(e.target.value)}
                className="px-2 py-1 text-xs bg-white/4 border border-white/20 rounded-lg text-white focus:border-[#13F584] focus:outline-none focus:ring-1 focus:ring-[#13F584]/50 transition-all min-w-[150px]"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
              >
                <option value="" className="bg-[#141A21]">Select initial node</option>
                {nodes.map(node => (
                  <option key={node.id} value={node.data.id} className="bg-[#141A21]">
                    {node.data.title || node.data.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Center: Active Toggle */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <label className="text-xs text-white/60">Active</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#13F584]"></div>
            </label>
          </div>
          
          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1">
              {/* Save Button */}
              <button
                onClick={saveFlow}
                disabled={saving}
                className="px-2 py-1 text-xs font-bold text-[#13F584] border border-[#13F584]/48 rounded bg-transparent hover:bg-[#13F584]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saving ? 'Saving...' : 'Save'}
              </button>
              
              {/* Run/Activate Button */}
              <button
                onClick={() => router.push('/voice')}
                className="px-2 py-1 text-xs font-bold text-white border border-white/32 rounded bg-transparent hover:bg-white/10 transition-all flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run
              </button>
              
              {/* Import Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importFlow}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 text-xs font-bold text-white border border-white/32 rounded bg-transparent hover:bg-white/10 transition-all flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import
              </button>
              
              {/* Export Button */}
              <button
                onClick={exportFlow}
                className="px-2 py-1 text-xs font-bold text-white border border-white/32 rounded bg-transparent hover:bg-white/10 transition-all flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Export
              </button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Flow Canvas */}
        <div className="flex-1 relative">
          {/* Flow Canvas */}
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
          />
        </div>

      {/* AI Chatbot Panel - Right Side (Full or Minimized) */}
      {showChatbot && (
        <div className={`flex-shrink-0 ${chatbotMinimized ? 'w-0' : 'w-[420px]'} transition-all duration-300 p-4 pl-0 h-full`}>
          <VoiceFlowChatbotPanel
            assistantId={assistantId}
            currentFlow={getCurrentFlow()}
            onApplyFlow={handleApplyChatbotFlow}
            onPreviewFlow={handlePreviewChatbotFlow}
            sessionId={chatSessionId}
            isMinimized={chatbotMinimized}
            onToggleMinimize={() => setChatbotMinimized(!chatbotMinimized)}
          />
        </div>
      )}

      {/* Node Editor Sidebar - Right Side */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed || !selectedNode ? 'w-0' : 'w-[326px]'
      } relative flex-shrink-0`}>
        {/* Collapsible Arrow Button - Figma Design */}
        {selectedNode && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -left-2.5 top-1/2 -translate-y-1/2 z-20 bg-white/8 hover:bg-white/12 rounded-full p-2 shadow-xl border border-white/20 transition-all duration-200 backdrop-blur-md"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          >
            <svg 
              className={`w-4 h-4 text-white transition-transform duration-200 ${
                sidebarCollapsed ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {!sidebarCollapsed && selectedNode && (
          <div className="w-full h-full overflow-hidden">
            <NodeEditor
              node={selectedNode}
              assistantId={assistantId}
              onUpdate={(newData) => updateNodeData(selectedNode.id, newData)}
              toolsRefreshTrigger={toolsRefreshTrigger}
            />
          </div>
        )}
      </div>
      </div>

      {/* Bottom Navigation Bar - Figma Design */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '58px',
          padding: '8px'
        }}
      >
        <div className="flex items-center gap-3">
          {/* Add Node Button */}
          <button
            onClick={addNode}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/12"
            style={{
              background: showChatbot ? 'rgba(255, 255, 255, 0.12)' : 'transparent'
            }}
            title="Add Node"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Delete Node Button */}
          {selectedNode && (
            <button
              onClick={deleteSelectedNode}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/12"
              title="Delete Node"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Tools Button */}
          <button
            onClick={() => setShowToolsPanel(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/12"
            title="Manage Tools"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* AI Assistant Button */}
          <button
            onClick={() => {
              setShowChatbot(!showChatbot);
              setChatbotMinimized(false);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/12"
            style={{
              background: showChatbot ? 'rgba(255, 255, 255, 0.12)' : 'transparent'
            }}
            title="AI Assistant"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Message - Floating */}
      {message && (
        <div 
          className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg text-xs font-medium animate-fade-in ${
            message.includes('failed') || message.includes('❌')
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}
          style={{
            background: message.includes('failed') || message.includes('❌')
              ? 'rgba(239, 68, 68, 0.2)'
              : 'rgba(34, 197, 94, 0.2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          {message}
        </div>
      )}

      {/* Tools Panel Modal - Redesigned */}
      {showToolsPanel && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseToolsPanel();
          }}
        >
          <div 
            className="rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(60px)',
              WebkitBackdropFilter: 'blur(60px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
            }}
          >
            {/* Header Section */}
            <div 
              className="px-6 py-4 flex items-center justify-between"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-lg font-semibold text-white">Tool Management</h3>
              <button
                onClick={handleCloseToolsPanel}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
                style={{
                  color: 'rgba(255, 255, 255, 0.6)'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div 
              className="flex-1 overflow-auto p-5 relative"
              style={{
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              {!showToolEditor && (
                <button
                  onClick={handleAddTool}
                  className="absolute top-5 right-5 px-3 py-1.5 flex items-center gap-2 rounded-lg transition-all z-10"
                  style={{
                    background: 'rgba(19, 245, 132, 0.08)',
                    border: '1px solid rgba(19, 245, 132, 0.3)',
                    color: '#9EFBCD'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-semibold">Add Tool</span>
                </button>
              )}
              {showToolEditor ? (
                <ToolEditor
                  assistantId={assistantId}
                  tool={editingTool}
                  onCancel={() => {
                    setShowToolEditor(false);
                    setEditingTool(null);
                  }}
                  onSaved={handleToolSaved}
                />
              ) : (
                <ToolsList
                  assistantId={assistantId}
                  onAdd={handleAddTool}
                  onEdit={handleEditTool}
                />
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}