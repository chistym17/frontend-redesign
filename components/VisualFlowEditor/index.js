// components/flows/index.js - Complete Visual Flow Editor with AI Voice Chatbot
import React, { useState, useEffect, useCallback, useRef } from "react";
import FlowCanvas from "./FlowCanvas";
import NodeEditor from "./NodeEditor";
import VoiceFlowChatbotPanel from "./VoiceFlowChatbotPanel";
import { flowsService } from "../../lib/flowsService";
import { convertToReactFlow, convertFromReactFlow, createDefaultNode, PositionStorage } from "./utils";
import ToolEditor from "../ToolEditor";
import ToolsList from "../ToolsList";

import LeaveConfirmPopup from "./LeaveConfirmPopup"

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeavePopup, setShowLeavePopup] = useState(false);

  // Tools state
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [showToolEditor, setShowToolEditor] = useState(false);
  const [toolsRefreshTrigger, setToolsRefreshTrigger] = useState(0);
  const [toolsReloadKey, setToolsReloadKey] = useState(0);
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
    setHasUnsavedChanges(true); // ⬅️ Mark unsaved
  }, []);

  // Update node data
  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...newData } }
        : node
    ));
    setHasUnsavedChanges(true); // ⬅️ Mark unsaved
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
      setHasUnsavedChanges(false);
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
        <div className="absolute inset-0 pointer-events-none"/>
        
        <div className="relative z-10 flex items-center justify-between w-full">
          {/* Left: Breadcrumb and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* Back Button */}
              {router && (
                <button
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      setShowLeavePopup(true); // show popup instead of window.confirm
                      return;
                    }

                    router.push(`/assistants/${assistantId}`);
                  }}
                  className="p-0.5 text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M15 19l-7-7 7-7" />
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
              <label className="text-[10px] font-semibold text-white/60 uppercase">Select Initial Node</label>
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
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <p className={`text-xs ${activating ? 'text-emerald-300' : 'text-white/60'}`}>
          {activating ? 'Active' : 'Disabled'}
        </p>
        <button
          type="button"
          className={`relative inline-flex h-6 w-12 items-center rounded-full border transition-colors ${
            activating ? 'bg-emerald-500/30 border-emerald-400/50' : 'bg-white/5 border-white/15'
          }`}
          onClick={() => setActivating(prev => !prev)}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              activating ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>


          
          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1">
      
              {/* Run/Activate Button */}
              <button
                onClick={() => router.push('/voice')}
                className="px-2 py-1 text-xs font-bold text-white  rounded-lg bg-transparent hover:bg-white/10 transition-all flex items-center gap-1"
                style={{
                  border: "2px solid rgba(145, 158, 171, 0.32)",
                }}
              >
               <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.16675 9.99884V5.66808C4.16675 3.8738 6.10947 2.75139 7.66156 3.64984L11.4142 5.81652L15.1668 7.9832C16.7215 8.87904 16.7215 11.1238 15.1668 12.0197L11.4142 14.1864L7.66156 16.353C6.10947 17.2463 4.16675 16.1265 4.16675 14.3322V9.99884Z" fill="white"/>
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
                className="px-2 py-1 text-xs font-bold text-white  rounded-lg bg-transparent hover:bg-white/10 transition-all flex items-center gap-1"
                style={{
                  border: "2px solid rgba(145, 158, 171, 0.32)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.125 12.5C3.125 12.3342 3.05915 12.1753 2.94194 12.0581C2.82473 11.9408 2.66576 11.875 2.5 11.875C2.33424 11.875 2.17527 11.9408 2.05806 12.0581C1.94085 12.1753 1.875 12.3342 1.875 12.5V12.5458C1.875 13.685 1.875 14.6042 1.9725 15.3267C2.0725 16.0767 2.28917 16.7083 2.79 17.21C3.29167 17.7117 3.92333 17.9267 4.67333 18.0283C5.39583 18.125 6.315 18.125 7.45417 18.125H12.5458C13.685 18.125 14.6042 18.125 15.3267 18.0283C16.0767 17.9267 16.7083 17.7117 17.21 17.21C17.7117 16.7083 17.9267 16.0767 18.0283 15.3267C18.125 14.6042 18.125 13.685 18.125 12.5458V12.5C18.125 12.3342 18.0592 12.1753 17.9419 12.0581C17.8247 11.9408 17.6658 11.875 17.5 11.875C17.3342 11.875 17.1753 11.9408 17.0581 12.0581C16.9408 12.1753 16.875 12.3342 16.875 12.5C16.875 13.6958 16.8733 14.53 16.7892 15.16C16.7067 15.7717 16.5558 16.095 16.3258 16.3258C16.095 16.5567 15.7717 16.7067 15.1592 16.7892C14.53 16.8733 13.6958 16.875 12.5 16.875H7.5C6.30417 16.875 5.46917 16.8733 4.84 16.7892C4.22833 16.7067 3.905 16.5558 3.67417 16.3258C3.44333 16.095 3.29333 15.7717 3.21083 15.1592C3.12667 14.53 3.125 13.6958 3.125 12.5Z" fill="white"/>
                <path d="M9.54507 2.07801C9.60363 2.01396 9.67489 1.96282 9.7543 1.92782C9.83371 1.89283 9.91954 1.87476 10.0063 1.87476C10.0931 1.87476 10.1789 1.89283 10.2583 1.92782C10.3378 1.96282 10.409 2.01396 10.4676 2.07801L13.8009 5.72384C13.9101 5.84659 13.9666 6.00741 13.9582 6.17149C13.9497 6.33558 13.877 6.48974 13.7557 6.6006C13.6344 6.71146 13.4744 6.77011 13.3102 6.76385C13.146 6.7576 12.9909 6.68694 12.8784 6.56717L10.6317 4.10884L10.6317 13.333C10.6317 13.4988 10.5659 13.6577 10.4487 13.7749C10.3315 13.8922 10.1725 13.958 10.0067 13.958C9.84098 13.958 9.68201 13.8922 9.5648 13.775C9.44759 13.6577 9.38174 13.4988 9.38174 13.333L9.38174 4.10968L7.13424 6.56801C7.0223 6.69034 6.86634 6.76319 6.70068 6.77054C6.53503 6.77788 6.37324 6.71912 6.2509 6.60718C6.12857 6.49523 6.05572 6.33928 6.04838 6.17362C6.04103 6.00796 6.09979 5.84617 6.21174 5.72384L9.54507 2.07801Z" fill="white"/>
                </svg>

                Import
              </button>
              
              {/* Export Button */}
              <button
                onClick={exportFlow}
                className="px-2 py-1 text-xs font-bold text-white  rounded-lg bg-transparent hover:bg-white/10 transition-all flex items-center gap-1"
                style={{
                  border: "2px solid rgba(145, 158, 171, 0.32)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.4617 13.755C10.4031 13.819 10.3319 13.8702 10.2524 13.9052C10.173 13.9402 10.0872 13.9582 10.0004 13.9582C9.91364 13.9582 9.82781 13.9402 9.74839 13.9052C9.66898 13.8702 9.59773 13.819 9.53917 13.755L6.20583 10.1092C6.09661 9.98642 6.04012 9.8256 6.04858 9.66151C6.05705 9.49743 6.12978 9.34327 6.25105 9.23241C6.37232 9.12155 6.53236 9.0629 6.69655 9.06916C6.86073 9.07541 7.01585 9.14607 7.12833 9.26583L9.375 11.7242V2.5C9.375 2.33424 9.44085 2.17527 9.55806 2.05806C9.67527 1.94085 9.83424 1.875 10 1.875C10.1658 1.875 10.3247 1.94085 10.4419 2.05806C10.5592 2.17527 10.625 2.33424 10.625 2.5V11.7233L12.8725 9.265C12.9844 9.14267 13.1404 9.06982 13.3061 9.06247C13.4717 9.05513 13.6335 9.11389 13.7558 9.22583C13.8782 9.33778 13.951 9.49373 13.9584 9.65939C13.9657 9.82505 13.9069 9.98684 13.795 10.1092L10.4617 13.755Z" fill="white"/>
                <path d="M3.125 12.5C3.125 12.3342 3.05915 12.1753 2.94194 12.0581C2.82473 11.9408 2.66576 11.875 2.5 11.875C2.33424 11.875 2.17527 11.9408 2.05806 12.0581C1.94085 12.1753 1.875 12.3342 1.875 12.5V12.5458C1.875 13.685 1.875 14.6042 1.9725 15.3267C2.0725 16.0767 2.28917 16.7083 2.79 17.21C3.29167 17.7117 3.92333 17.9267 4.67333 18.0283C5.39583 18.125 6.315 18.125 7.45417 18.125H12.5458C13.685 18.125 14.6042 18.125 15.3267 18.0283C16.0767 17.9267 16.7083 17.7117 17.21 17.21C17.7117 16.7083 17.9267 16.0767 18.0283 15.3267C18.125 14.6042 18.125 13.685 18.125 12.5458V12.5C18.125 12.3342 18.0592 12.1753 17.9419 12.0581C17.8247 11.9408 17.6658 11.875 17.5 11.875C17.3342 11.875 17.1753 11.9408 17.0581 12.0581C16.9408 12.1753 16.875 12.3342 16.875 12.5C16.875 13.6958 16.8733 14.53 16.7892 15.16C16.7067 15.7717 16.5558 16.095 16.3258 16.3258C16.095 16.5567 15.7717 16.7067 15.1592 16.7892C14.53 16.8733 13.6958 16.875 12.5 16.875H7.5C6.30417 16.875 5.46917 16.8733 4.84 16.7892C4.22833 16.7067 3.905 16.5558 3.67417 16.3258C3.44333 16.095 3.29333 15.7717 3.21083 15.1592C3.12667 14.53 3.125 13.6958 3.125 12.5Z" fill="white"/>
                </svg>

                Export
              </button>

               {/* Save Button */}
              <button
                onClick={saveFlow}
                disabled={saving}
                className="px-2 py-1 text-xs font-bold text-[#13F584] border border-[#13F584] rounded-lg bg-transparent hover:bg-[#13F584]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.0154 5.01013L14.9899 3.98464C14.5733 3.56736 14.0083 3.3335 13.4188 3.3335H4.86106C4.01715 3.3335 3.33325 4.0174 3.33325 4.86131V15.139C3.33325 15.9829 4.01715 16.6668 4.86106 16.6668H15.1388C15.9827 16.6668 16.6666 15.9829 16.6666 15.139V6.58128C16.6666 5.99178 16.4327 5.4268 16.0154 5.01013ZM5.55544 6.80568V5.41683C5.55544 5.18683 5.74211 5.00016 5.97211 5.00016H11.8054C12.0354 5.00016 12.2221 5.18683 12.2221 5.41683V6.80568C12.2221 7.03569 12.0354 7.22235 11.8054 7.22235H5.97211C5.74211 7.22235 5.55544 7.03569 5.55544 6.80568ZM9.99992 14.4446C8.6194 14.4446 7.49992 13.3252 7.49992 11.9446C7.49992 10.564 8.6194 9.44464 9.99992 9.44464C11.3804 9.44464 12.4999 10.564 12.4999 11.9446C12.4999 13.3252 11.3804 14.4446 9.99992 14.4446Z" fill="#13F584"/>
                </svg>

                {saving ? 'Saving...' : 'Save'}
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

      {/* AI Chatbot Panel - Right Side (Full) */}
      {showChatbot && !chatbotMinimized && (
        <div className="flex-shrink-0 w-[420px] transition-all duration-300 p-4 pl-0 h-full">
          <VoiceFlowChatbotPanel
            assistantId={assistantId}
            currentFlow={getCurrentFlow()}
            onApplyFlow={handleApplyChatbotFlow}
            onPreviewFlow={handlePreviewChatbotFlow}
            sessionId={chatSessionId}
            isMinimized={false}
            onToggleMinimize={() => setChatbotMinimized(true)}
            onCloseChatbot={() => {
              setShowChatbot(false);
              setChatbotMinimized(false);
            }}
          />
        </div>
      )}

      {/* Node Editor Sidebar - Right Side */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed || !selectedNode ? 'w-0' : 'w-[326px]'
      } relative flex-shrink-0`}>
       {/* Collapsible Arrow Button */}
        {selectedNode && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 rounded-full p-2 shadow-xl border border-white/20 transition-all duration-200"
            style={{
              backgroundColor: 'white', // solid white circle
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${
                sidebarCollapsed ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              style={{ stroke: 'rgba(0, 0, 0, 0.8)' }} // very light or transparent arrow
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" />
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

      {showChatbot && chatbotMinimized && (
        <VoiceFlowChatbotPanel
          assistantId={assistantId}
          currentFlow={getCurrentFlow()}
          onApplyFlow={handleApplyChatbotFlow}
          onPreviewFlow={handlePreviewChatbotFlow}
          sessionId={chatSessionId}
          isMinimized
          onToggleMinimize={() => setChatbotMinimized(false)}
          onCloseChatbot={() => {
            setShowChatbot(false);
            setChatbotMinimized(false);
          }}
        />
      )}

      {/* Bottom Navigation Bar - Figma Design */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(8.18182px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: "2px solid rgba(255, 255, 255, 0.03)",
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.5027 5.00586C14.3701 5.00587 14.2429 5.05855 14.1491 5.15231C14.0554 5.24608 14.0027 5.37326 14.0027 5.50586V10.5059C14.0027 10.6385 14.0554 10.7656 14.1491 10.8594C14.2429 10.9532 14.3701 11.0058 14.5027 11.0059H16.5027V15.5059H14.5027C14.3701 15.5059 14.2429 15.5585 14.1491 15.6523C14.0554 15.7461 14.0027 15.8733 14.0027 16.0059V21.0059C14.0027 21.1385 14.0554 21.2656 14.1491 21.3594C14.2429 21.4532 14.3701 21.5058 14.5027 21.5059H19.5027C19.6353 21.5058 19.7625 21.4532 19.8562 21.3594C19.95 21.2656 20.0027 21.1385 20.0027 21.0059V16.0059C20.0027 15.8733 19.95 15.7461 19.8562 15.6523C19.7625 15.5585 19.6353 15.5059 19.5027 15.5059H17.5027V11.0059H19.5027C19.6353 11.0058 19.7625 10.9532 19.8562 10.8594C19.95 10.7656 20.0027 10.6385 20.0027 10.5059V5.50586C20.0027 5.37326 19.95 5.24608 19.8562 5.15231C19.7625 5.05855 19.6353 5.00587 19.5027 5.00586H14.5027Z" fill="white"/>
              <path d="M7.50269 2.00586C7.37008 2.00586 7.2429 2.05855 7.14913 2.15231C7.05536 2.24608 7.00269 2.37325 7.00269 2.50586V5.00586H4.50269C4.37008 5.00586 4.2429 5.05855 4.14913 5.15231C4.05536 5.24608 4.00269 5.37325 4.00269 5.50586C4.00269 5.63847 4.05536 5.76564 4.14913 5.85941C4.2429 5.95317 4.37008 6.00586 4.50269 6.00586H7.00269V8.50586C7.00269 8.63847 7.05536 8.76564 7.14913 8.85941C7.2429 8.95317 7.37008 9.00586 7.50269 9.00586C7.63529 9.00586 7.76247 8.95317 7.85624 8.85941C7.95001 8.76564 8.00268 8.63847 8.00269 8.50586V6.00586H10.5027C10.6353 6.00586 10.7625 5.95317 10.8562 5.85941C10.95 5.76564 11.0027 5.63847 11.0027 5.50586C11.0027 5.37325 10.95 5.24608 10.8562 5.15231C10.7625 5.05855 10.6353 5.00586 10.5027 5.00586H8.00269V2.50586C8.00268 2.37325 7.95001 2.24608 7.85624 2.15231C7.76247 2.05855 7.63529 2.00586 7.50269 2.00586Z" fill="white"/>
            </svg>

          </button>

          {/* Delete Node Button */}
          {selectedNode && (
            <button
              onClick={deleteSelectedNode}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/12"
              title="Delete Node"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M10.1111 2C9.37473 2 8.77778 2.59695 8.77778 3.33333C8.77778 3.70152 8.4793 4 8.11111 4H8H5C4.44772 4 4 4.44772 4 5C4 5.55228 4.44772 6 5 6H8H8.11111H15.8873H15.8889H16H19C19.5523 6 20 5.55228 20 5C20 4.44772 19.5523 4 19 4H15.8881C15.5203 3.99956 15.2222 3.70126 15.2222 3.33333C15.2222 2.59695 14.6253 2 13.8889 2H10.1111Z" fill="white"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6 8C5.72035 8 5.45348 8.1171 5.26412 8.32289C5.07477 8.52868 4.98023 8.80436 5.00346 9.08305L5.77422 18.3322C5.94698 20.4054 7.68005 22 9.7604 22H14.2396C16.32 22 18.053 20.4054 18.2258 18.3322L18.9965 9.08305C19.0198 8.80436 18.9252 8.52868 18.7359 8.32289C18.5465 8.1171 18.2797 8 18 8H6Z" fill="white"/>
              </svg>

            </button>
          )}

          {/* Tools Button */}
          <button
            onClick={() => setShowToolsPanel(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/12"
            title="Manage Tools"
          >
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.637 16.2027L21.261 16.0146L12.7861 20.2521C12.2997 20.4985 11.7003 20.4985 11.2139 20.2521L2.73902 16.0146L2.36297 16.2027C2.16445 16.3019 2.03906 16.5048 2.03906 16.7267C2.03906 16.9487 2.16445 17.1516 2.36297 17.2508L11.738 21.9383C11.9029 22.0208 12.0971 22.0208 12.262 21.9383L21.637 17.2508C21.8355 17.1516 21.9609 16.9487 21.9609 16.7267C21.9609 16.5048 21.8355 16.3019 21.637 16.2027Z" fill="white"/>
            <path d="M21.637 13.4683L21.261 13.2803L12.7861 17.5177C12.2997 17.7641 11.7003 17.7641 11.2139 17.5177L2.73902 13.2803L2.36297 13.4683C2.16445 13.5675 2.03906 13.7704 2.03906 13.9923C2.03906 14.2143 2.16445 14.4172 2.36297 14.5164L11.738 19.2039C11.9029 19.2864 12.0971 19.2864 12.262 19.2039L21.637 14.5164C21.8355 14.4172 21.9609 14.2143 21.9609 13.9923C21.9609 13.7704 21.8355 13.5675 21.637 13.4683Z" fill="white"/>
            <path d="M6.84715 8.89527L8.01903 10.925C8.18082 11.2053 8.53918 11.3013 8.81946 11.1395L9.30196 10.8609C9.59453 11.0827 9.90879 11.2655 10.2422 11.4078V11.9609C10.2422 12.2845 10.5045 12.5469 10.8281 12.5469H13.1719C13.4955 12.5469 13.7578 12.2845 13.7578 11.9609V11.4078C14.0912 11.2655 14.4055 11.0827 14.6981 10.8609L15.1805 11.1395C15.4608 11.3013 15.8191 11.2053 15.9809 10.925L17.1528 8.89527C17.3146 8.61504 17.2186 8.25668 16.9384 8.09488L16.4579 7.81746C16.4807 7.635 16.4922 7.45312 16.4922 7.27344C16.4922 7.09375 16.4807 6.91187 16.4579 6.72941L16.9384 6.45199C17.2186 6.2902 17.3147 5.93184 17.1529 5.6516L15.981 3.62184C15.8192 3.3416 15.4608 3.24555 15.1806 3.40738L14.6981 3.68594C14.4056 3.46414 14.0912 3.28129 13.7578 3.13906V2.58594C13.7578 2.26234 13.4955 2 13.1719 2H10.8281C10.5045 2 10.2422 2.26234 10.2422 2.58594V3.13906C9.90879 3.28129 9.59446 3.46414 9.30196 3.68594L8.81946 3.40734C8.53922 3.24555 8.18086 3.34156 8.01907 3.6218L6.84719 5.65156C6.68539 5.9318 6.78141 6.29016 7.06164 6.45195L7.54211 6.72937C7.5193 6.91187 7.50782 7.09375 7.50782 7.27344C7.50782 7.45312 7.5193 7.635 7.54207 7.81746L7.0616 8.09488C6.78137 8.25668 6.68535 8.61504 6.84715 8.89527ZM12 5.51562C12.9693 5.51562 13.7578 6.30418 13.7578 7.27344C13.7578 8.2427 12.9693 9.03125 12 9.03125C11.0307 9.03125 10.2422 8.2427 10.2422 7.27344C10.2422 6.30418 11.0307 5.51562 12 5.51562Z" fill="white"/>
            <path d="M2.36297 11.7822L11.738 16.4697C11.9029 16.5522 12.0971 16.5522 12.262 16.4697L21.637 11.7822C21.8355 11.6829 21.9609 11.4801 21.9609 11.2581C21.9609 11.0362 21.8355 10.8333 21.637 10.734L18.3359 9.0835C18.2972 9.21971 18.2417 9.35338 18.1678 9.48143L16.9959 11.5112C16.6829 12.0534 16.0993 12.3903 15.473 12.3903C15.473 12.3903 15.473 12.3903 15.473 12.3903C15.277 12.3903 15.0826 12.3572 14.8982 12.2933C14.7425 13.1044 14.0276 13.719 13.1719 13.719H10.8281C9.97238 13.719 9.2575 13.1044 9.1018 12.2933C8.91746 12.3572 8.72309 12.3903 8.52703 12.3903C7.90066 12.3903 7.31711 12.0534 7.0041 11.5112L5.83227 9.48154C5.75898 9.35467 5.70254 9.22123 5.6632 9.08396L2.36297 10.734C2.16445 10.8333 2.03906 11.0362 2.03906 11.2581C2.03906 11.4801 2.16445 11.6829 2.36297 11.7822Z" fill="white"/>
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
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.31873 8.19742L7.06873 15.2174C7.05538 15.2564 7.05147 15.2981 7.05734 15.3389C7.0632 15.3797 7.07866 15.4185 7.10245 15.4522C7.12625 15.4859 7.15769 15.5134 7.1942 15.5326C7.23071 15.5517 7.27125 15.562 7.31248 15.5624H7.94248C7.99871 15.5623 8.05338 15.5439 8.09832 15.5101C8.14327 15.4763 8.17608 15.4289 8.19185 15.3749L8.54435 14.2499H11.625L11.5819 14.1805L11.9681 15.3749C11.9839 15.4289 12.0167 15.4763 12.0616 15.5101C12.1066 15.5439 12.1612 15.5623 12.2175 15.5624H12.8475C12.8887 15.5627 12.9295 15.5531 12.9663 15.5345C13.0032 15.516 13.0351 15.4889 13.0594 15.4556C13.0838 15.4223 13.0999 15.3836 13.1064 15.3429C13.1129 15.3021 13.1096 15.2604 13.0969 15.2212L10.8469 8.20117C10.8308 8.14735 10.7979 8.1001 10.753 8.06635C10.7082 8.0326 10.6536 8.01414 10.5975 8.01367H9.56248C9.50769 8.01479 9.45465 8.03314 9.41089 8.06613C9.36713 8.09911 9.33488 8.14506 9.31873 8.19742ZM8.91935 13.1249L10.08 9.5118L11.25 13.1249H8.91935Z" fill="#13F584"/>
            <path d="M15.675 8.01562H15.075C14.93 8.01562 14.8125 8.13315 14.8125 8.27813V15.2981C14.8125 15.4431 14.93 15.5606 15.075 15.5606H15.675C15.82 15.5606 15.9375 15.4431 15.9375 15.2981V8.27813C15.9375 8.13315 15.82 8.01562 15.675 8.01562Z" fill="#13F584"/>
            <path d="M12.6112 18.375H7.155C6.74922 18.375 6.36006 18.2138 6.07313 17.9269C5.7862 17.6399 5.625 17.2508 5.625 16.845V7.155C5.625 6.74922 5.7862 6.36006 6.07313 6.07313C6.36006 5.7862 6.74922 5.625 7.155 5.625H16.845C17.2508 5.625 17.6399 5.7862 17.9269 6.07313C18.2138 6.36006 18.375 6.74922 18.375 7.155V12C18.3784 12.1023 18.4221 12.1991 18.4966 12.2693C18.571 12.3396 18.6702 12.3775 18.7725 12.375C19.0918 12.374 19.4069 12.4472 19.6931 12.5888C19.7525 12.6192 19.8188 12.6338 19.8855 12.631C19.9522 12.6282 20.0171 12.6082 20.0738 12.5729C20.1304 12.5376 20.177 12.4882 20.2088 12.4295C20.2407 12.3708 20.2568 12.3049 20.2556 12.2381V7.155C20.2556 6.70738 20.1674 6.26415 19.9959 5.85067C19.8244 5.43719 19.5731 5.06157 19.2563 4.74532C18.9396 4.42906 18.5635 4.17836 18.1498 4.00758C17.736 3.83679 17.2926 3.74927 16.845 3.75H7.155C6.25194 3.75 5.38586 4.10874 4.7473 4.74731C4.10874 5.38587 3.75 6.25194 3.75 7.155V16.845C3.75 17.7481 4.10874 18.6141 4.7473 19.2527C5.38586 19.8913 6.25194 20.25 7.155 20.25H13.3988C13.4755 20.2501 13.5505 20.2275 13.6144 20.1849C13.6782 20.1424 13.728 20.0819 13.7575 20.0111C13.787 19.9403 13.7949 19.8623 13.7801 19.787C13.7653 19.7117 13.7285 19.6425 13.6744 19.5881C13.3826 19.3205 13.1463 18.9981 12.9788 18.6394C12.9519 18.563 12.9023 18.4967 12.8366 18.4494C12.7708 18.4022 12.6922 18.3762 12.6112 18.375Z" fill="#13F584"/>
            <path d="M20.9495 19.0876L22.6482 18.4183C22.6832 18.4044 22.7132 18.3804 22.7343 18.3493C22.7555 18.3182 22.7668 18.2815 22.7668 18.2439C22.7668 18.2063 22.7555 18.1695 22.7343 18.1384C22.7132 18.1074 22.6832 18.0833 22.6482 18.0695L20.9495 17.4001C20.6487 17.2812 20.3756 17.1019 20.147 16.8733C19.9183 16.6446 19.739 16.3715 19.6201 16.0708L18.9507 14.3833C18.9368 14.3484 18.9128 14.3185 18.8817 14.2974C18.8506 14.2763 18.8139 14.2651 18.7763 14.2651C18.7388 14.2651 18.7021 14.2763 18.671 14.2974C18.6399 14.3185 18.6158 14.3484 18.602 14.3833L17.9326 16.0708C17.814 16.3716 17.6348 16.6449 17.4061 16.8736C17.1774 17.1023 16.9041 17.2815 16.6032 17.4001L14.9157 18.0695C14.8807 18.0833 14.8507 18.1074 14.8296 18.1384C14.8084 18.1695 14.7971 18.2063 14.7971 18.2439C14.7971 18.2815 14.8084 18.3182 14.8296 18.3493C14.8507 18.3804 14.8807 18.4044 14.9157 18.4183L16.6032 19.0876C16.9041 19.2062 17.1774 19.3855 17.4061 19.6142C17.6348 19.8428 17.814 20.1161 17.9326 20.417L18.602 22.1045C18.6155 22.1397 18.6395 22.1701 18.6706 22.1915C18.7017 22.2129 18.7386 22.2244 18.7763 22.2245C18.8141 22.2244 18.851 22.2129 18.8821 22.1915C18.9132 22.1701 18.9371 22.1397 18.9507 22.1045L19.6201 20.417C19.739 20.1163 19.9183 19.8432 20.147 19.6145C20.3756 19.3859 20.6487 19.2065 20.9495 19.0876Z" fill="#13F584"/>
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
            className="rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(80, 80, 80, 0.24)",
          borderRadius: "24px",
        }}
          >
            {/* Header Section */}
            <div 
              className="px-6 py-4 flex items-center justify-between"
              
            >
              <h3 className="text-lg font-semibold text-white">Tool Management</h3>
              <button
                onClick={handleCloseToolsPanel}
              className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition"
              >
                x
              </button>
            </div>
            <div 
              className="flex-1 overflow-auto p-5 relative"
              style={{
              
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
              <ToolsList
              key={toolsReloadKey}
              assistantId={assistantId}
              onAdd={handleAddTool}
              onEdit={handleEditTool}
            />
            </div>
          </div>
        </div>
      )}

      {showToolEditor && (
  <div 
    className="fixed inset-0 z-[60] flex items-center justify-center"
    style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(80, 80, 80, 0.24)",
          borderRadius: "24px",
        }}
  >

      <ToolEditor
        assistantId={assistantId}
        tool={editingTool}
        isOpen={showToolEditor}
        onCancel={() => {
          setShowToolEditor(false);
          setEditingTool(null);
        }}
        onSaved={(updatedTool) => {
          setShowToolEditor(false);
          setEditingTool(null);
          setToolsReloadKey(prev => prev + 1);
        }}
      />
   
  </div>
)}

      </div>
      {showLeavePopup && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <LeaveConfirmPopup
      onConfirm={() => {
        router.push(`/assistants/${assistantId}`);
      }}
      onClose={() => setShowLeavePopup(false)}
    />
  </div>
)}

    </div>
  );
}