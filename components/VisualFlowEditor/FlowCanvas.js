import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ToolNode from './ToolNode';

const nodeTypes = {
  toolNode: ToolNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#13F584',
  },
  style: {
    stroke: '#13F584',
    strokeWidth: 1,
    opacity: 0.6,
  },
  animated: false,
  labelStyle: { fill: '#FFFFFF', fontWeight: 500 },
  labelBgStyle: { fill: 'rgba(20, 26, 33, 0.8)', fillOpacity: 0.8 },
};

const connectionLineStyle = {
  stroke: '#13F584',
  strokeWidth: 1,
  strokeDasharray: '5 5',
  opacity: 0.6,
};

// -------------------- Condition Builder (inline, no visual restyle) --------------------
function ConditionRow({ row, onChange, onRemove }) {
  const type = row.when || 'user.contains';
  return (
    <div className="flex items-center gap-4">
      {/* Condition Type Select */}
      <div className="flex flex-col gap-2.5" style={{ width: '199px' }}>
        <select
          value={type}
          onChange={(e) => onChange({ ...row, when: e.target.value })}
          className="h-10 px-3.5 py-0 flex items-center rounded-lg text-sm text-white focus:border-[#13F584] focus:outline-none"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(145, 158, 171, 0.2)'
          }}
        >
          <option value="user.contains" className="bg-[#141A21]">User.contains</option>
          <option value="user.regex" className="bg-[#141A21]">User.regex</option>
          <option value="intent_is" className="bg-[#141A21]">Intent_is</option>
          <option value="tool.ok" className="bg-[#141A21]">Tool.ok</option>
          <option value="parameters.has" className="bg-[#141A21]">Parameters.has</option>
          <option value="parameters.equals" className="bg-[#141A21]">Parameters.equals</option>
          <option value="tool.field_equals" className="bg-[#141A21]">Tool.field_equals</option>
        </select>
      </div>

      {/* Fields by type */}
      {type === 'user.contains' && (
        <div className="flex-1">
          <input
            placeholder='Value'
            value={row.value || ''}
            onChange={(e) => onChange({ ...row, value: e.target.value })}
            className="h-10 w-full px-3.5 py-0 flex items-center rounded-lg text-sm text-white placeholder-[#919EAB] focus:border-[#13F584] focus:outline-none"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(145, 158, 171, 0.2)'
            }}
          />
        </div>
      )}

      {type === 'user.regex' && (
        <div className="flex-1">
          <input
            placeholder='Regex'
            value={row.value || ''}
            onChange={(e) => onChange({ ...row, value: e.target.value })}
            className="h-10 w-full px-3.5 py-0 flex items-center rounded-lg text-sm text-white placeholder-[#919EAB] focus:border-[#13F584] focus:outline-none"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(145, 158, 171, 0.2)'
            }}
          />
        </div>
      )}

      {type === 'intent_is' && (
        <div className="flex-1">
          <input
            placeholder='Intent name'
            value={row.value || ''}
            onChange={(e) => onChange({ ...row, value: e.target.value })}
            className="h-10 w-full px-3.5 py-0 flex items-center rounded-lg text-sm text-white placeholder-[#919EAB] focus:border-[#13F584] focus:outline-none"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(145, 158, 171, 0.2)'
            }}
          />
        </div>
      )}

      {type === 'tool.ok' && (
        <div className="flex-1">
          <div className="h-10 px-3.5 py-0 flex items-center rounded-lg text-sm text-[#919EAB]">
            ✓ true when tool returns ok: true
          </div>
        </div>
      )}

      {type === 'parameters.has' && (
        <div className="flex-1">
          <input
            placeholder='Key'
            value={row.key || ''}
            onChange={(e) => onChange({ ...row, key: e.target.value })}
            className="h-10 w-full px-3.5 py-0 flex items-center rounded-lg text-sm text-white placeholder-[#919EAB] focus:border-[#13F584] focus:outline-none"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(145, 158, 171, 0.2)'
            }}
          />
        </div>
      )}

      {type === 'parameters.equals' && (
        <>
          <div className="flex-1">
            <input
              placeholder='Key'
              value={row.key || ''}
              onChange={(e) => onChange({ ...row, key: e.target.value })}
              className="h-10 w-full px-3.5 py-0 flex items-center rounded-lg text-sm text-white placeholder-[#919EAB] focus:border-[#13F584] focus:outline-none"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(145, 158, 171, 0.2)'
              }}
            />
          </div>
          <div className="flex-1">
            <input
              placeholder='Value'
              value={row.value ?? ''}
              onChange={(e) => onChange({ ...row, value: e.target.value })}
              className="h-10 w-full px-3.5 py-0 flex items-center rounded-lg text-sm text-white placeholder-[#919EAB] focus:border-[#13F584] focus:outline-none"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(145, 158, 171, 0.2)'
              }}
            />
          </div>
        </>
      )}

      {type === 'tool.field_equals' && (
        <>
          <div className="flex-1">
            <input
              placeholder='Path (e.g. data.status)'
              value={row.path || ''}
              onChange={(e) => onChange({ ...row, path: e.target.value })}
              className="h-10 w-full px-3.5 py-0 flex items-center rounded-lg text-sm text-white placeholder-[#919EAB] focus:border-[#13F584] focus:outline-none"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(145, 158, 171, 0.2)'
              }}
            />
          </div>
          <div className="flex-1">
            <input
              placeholder='Value'
              value={row.value ?? ''}
              onChange={(e) => onChange({ ...row, value: e.target.value })}
              className="h-10 w-full px-3.5 py-0 flex items-center rounded-lg text-sm text-white placeholder-[#919EAB] focus:border-[#13F584] focus:outline-none"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(145, 158, 171, 0.2)'
              }}
            />
          </div>
        </>
      )}

      {/* Delete Button */}
      <button
        onClick={onRemove}
        className="w-12 h-12 flex items-center justify-center rounded border transition-colors"
        style={{
          background: 'rgba(255, 86, 48, 0.08)',
          borderColor: 'rgba(255, 86, 48, 0.3)'
        }}
        title="Remove condition"
      >
        <svg className="w-5 h-5 text-[#FF5630]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

function ConditionModal({ edge, onSave, onClose, onDeleteEdge }) {
  const [mode, setMode] = useState(() => {
    const c = edge?.data?.condition;
    if (!c) return 'single';
    if (c.any) return 'any';
    if (c.all) return 'all';
    if (c.not) return 'not';
    return 'single';
  });

  const [rows, setRows] = useState(() => {
    const c = edge?.data?.condition;
    if (!c) return [{ when: 'user.contains', value: '' }];
    if (c.any) return Array.isArray(c.any) ? c.any.slice() : [{ when: 'user.contains', value: '' }];
    if (c.all) return Array.isArray(c.all) ? c.all.slice() : [{ when: 'user.contains', value: '' }];
    if (c.not) return [c.not];
    return [c];
  });

  const addRow = () => setRows((r) => [...r, { when: 'user.contains', value: '' }]);
  const updateRow = (idx, val) => setRows((r) => r.map((x, i) => (i === idx ? val : x)));
  const removeRow = (idx) => setRows((r) => r.filter((_, i) => i !== idx));

  const buildCondition = () => {
    // Build JSON shape the router expects
    const cleaned = rows.map((r) => {
      const { when } = r;
      if (when === 'tool.ok') return { when: 'tool.ok' };
      if (when === 'parameters.has') return { when: 'parameters.has', key: r.key || '' };
      if (when === 'parameters.equals') return { when: 'parameters.equals', key: r.key || '', value: r.value ?? '' };
      if (when === 'tool.field_equals') return { when: 'tool.field_equals', path: r.path || '', value: r.value ?? '' };
      // user.contains, user.regex, intent_is
      return { when, value: r.value || '' };
    });

    if (mode === 'single') {
      return cleaned[0] || { when: 'user.contains', value: '' };
    }
    if (mode === 'any') {
      return { any: cleaned };
    }
    if (mode === 'all') {
      return { all: cleaned };
    }
    if (mode === 'not') {
      return { not: cleaned[0] || { when: 'user.contains', value: '' } };
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style dangerouslySetInnerHTML={{__html: `
        .edge-condition-modal select option {
          background: rgba(26, 26, 26, 0.95) !important;
          color: #FFFFFF !important;
        }
        .edge-condition-modal select:focus option:checked {
          background: rgba(19, 245, 132, 0.2) !important;
        }
        .edge-condition-modal select {
          background: rgba(255, 255, 255, 0.04) !important;
        }
      `}} />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div 
        className="relative rounded-3xl w-[810px] max-w-[90vw] shadow-2xl edge-condition-modal"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <div className="flex flex-col gap-4 p-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-white">Edge Condition</h2>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Connection Section */}
          <div className="flex gap-16 pt-4">
            <div className="flex flex-col gap-2.5" style={{ width: '150px' }}>
              <h3 className="text-base font-semibold text-white">Connection</h3>
            </div>
            <div className="flex-1 flex flex-col gap-16">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Source Field */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-semibold text-[#919EAB]">Source</label>
                    <div 
                      className="h-[53px] px-3 py-0 flex items-center rounded-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)'
                      }}
                    >
                      <span className="text-sm text-[#919EAB]/80">
                        {edge?.source?.replace('reactflow_', '') || 'Source name'}
                      </span>
                    </div>
                  </div>

                  {/* Target Field */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-semibold text-[#919EAB]">Target</label>
                    <div 
                      className="h-[53px] px-3 py-0 flex items-center rounded-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)'
                      }}
                    >
                      <span className="text-sm text-[#919EAB]/80">
                        {edge?.target?.replace('reactflow_', '') || 'node_0012dk005'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-16 py-4">
            <div className="flex flex-col gap-2.5" style={{ width: '150px' }}>
              <h3 className="text-base font-semibold text-white">Conditions</h3>
            </div>
            <div className="flex-1 flex flex-col gap-16">
              <div className="flex flex-col gap-4">
                {/* Mode Selector */}
                <div className="flex items-center gap-4">
                  <label className="text-xs font-semibold text-[#919EAB]">Mode</label>
                  <div className="relative">
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className="h-9 pl-3 pr-8 rounded-lg border text-sm font-semibold text-white transition-colors appearance-none cursor-pointer"
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF'
                      }}
                    >
                      <option value="single">Single</option>
                      <option value="any">ANY (or)</option>
                      <option value="all">ALL (and)</option>
                      <option value="not">NOT</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={addRow}
                    className="h-9 px-3 flex items-center gap-2 rounded border text-sm font-bold text-[#9EFBCD] transition-colors"
                    style={{
                      background: 'rgba(19, 245, 132, 0.08)',
                      borderColor: 'rgba(19, 245, 132, 0.3)'
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Condition
                  </button>
                </div>

                {/* Condition Rows */}
                <div className="flex flex-col gap-4">
                  {rows.map((row, idx) => (
                    <ConditionRow
                      key={idx}
                      row={row}
                      onChange={(val) => updateRow(idx, val)}
                      onRemove={() => removeRow(idx)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-2.5 pt-4">
            <button
              onClick={onDeleteEdge}
              className="h-9 px-3 flex items-center gap-2 rounded border text-sm font-bold text-[#FFAC82] transition-colors"
              style={{
                background: 'rgba(255, 86, 48, 0.08)',
                borderColor: 'rgba(255, 86, 48, 0.3)'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete edge
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="h-9 px-3 flex items-center gap-2 rounded border text-sm font-bold text-white transition-colors"
                style={{
                  background: 'rgba(145, 158, 171, 0.08)',
                  borderColor: 'rgba(145, 158, 171, 0.2)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(buildCondition())}
                className="h-9 px-3 flex items-center gap-2 rounded border text-sm font-bold text-[#9EFBCD] transition-colors"
                style={{
                  background: 'rgba(19, 245, 132, 0.08)',
                  borderColor: 'rgba(19, 245, 132, 0.3)'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// --------------------------------------------------------------------------------------

export default function FlowCanvas({ 
  nodes, 
  edges, 
  setNodes, 
  setEdges, 
  selectedNode, 
  setSelectedNode 
}) {
  const [activeEdge, setActiveEdge] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setActiveEdge(null);
    setSelectedEdge(null);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setActiveEdge(null);
    setSelectedEdge(null);
  }, [setSelectedNode]);

  const onNodeDoubleClick = useCallback((event, node) => {
    // Double click to edit
    setSelectedNode(node);
    setActiveEdge(null);
    setSelectedEdge(null);
  }, [setSelectedNode]);

  const onEdgeClick = useCallback((evt, edge) => {
    setActiveEdge(edge);
    setSelectedNode(null);
    setSelectedEdge(edge);
  }, [setSelectedNode]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      let updatedNodes = [...nds];
      
      changes.forEach(change => {
        const nodeIndex = updatedNodes.findIndex(node => node.id === change.id);
        if (nodeIndex === -1) return;
        
        const node = updatedNodes[nodeIndex];
        
        switch (change.type) {
          case 'position':
            if (change.position) {
              updatedNodes[nodeIndex] = {
                ...node,
                position: change.position,
                positionAbsolute: change.positionAbsolute
              };
            }
            break;
          case 'dimensions':
            if (change.dimensions) {
              updatedNodes[nodeIndex] = {
                ...node,
                width: change.dimensions.width,
                height: change.dimensions.height
              };
            }
            break;
          case 'select':
            updatedNodes[nodeIndex] = {
              ...node,
              selected: change.selected
            };
            break;
          case 'remove':
            updatedNodes = updatedNodes.filter(n => n.id !== change.id);
            break;
        }
      });
      
      return updatedNodes;
    });
  }, [setNodes]);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => {
      let updatedEdges = [...eds];
      
      changes.forEach(change => {
        const edgeIndex = updatedEdges.findIndex(edge => edge.id === change.id);
        if (edgeIndex === -1) return;
        
        const edge = updatedEdges[edgeIndex];
        
        switch (change.type) {
          case 'select':
            updatedEdges[edgeIndex] = {
              ...edge,
              selected: change.selected
            };
            if (change.selected) {
              setSelectedEdge(edge);
            }
            break;
          case 'remove':
            updatedEdges = updatedEdges.filter(e => e.id !== change.id);
            if (selectedEdge && selectedEdge.id === change.id) {
              setSelectedEdge(null);
              setActiveEdge(null);
            }
            break;
        }
      });
      
      return updatedEdges;
    });
  }, [setEdges, selectedEdge]);

  const onConnect = useCallback((connection) => {
    const newEdge = {
      ...connection,
      id: `edge_${Date.now()}`,
      ...defaultEdgeOptions,
      type: 'smoothstep',
      animated: false,
      data: { condition: null }, // id, source, target first; condition added after click
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  const nodesWithSelection = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      selected: selectedNode?.id === node.id,
    }));
  }, [nodes, selectedNode]);

  const edgesWithSelection = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      selected: selectedEdge?.id === edge.id,
      style: {
        ...edge.style,
        stroke: selectedEdge?.id === edge.id ? '#9EFBCD' : edge.style?.stroke || '#13F584',
        strokeWidth: selectedEdge?.id === edge.id ? 1.5 : edge.style?.strokeWidth || 1,
        opacity: selectedEdge?.id === edge.id ? 1 : edge.style?.opacity || 0.6,
      }
    }));
  }, [edges, selectedEdge]);

  // Custom styles for dark theme - Figma Design
  const reactFlowStyles = {
    background: '#141A21',
    height: '100%',
    width: '100%',
  };

  const saveConditionForActive = (cond) => {
    if (!activeEdge) return;
    setEdges((eds) =>
      eds.map((e) =>
        e.id === activeEdge.id
          ? { ...e, data: { ...(e.data || {}), condition: cond || null } }
          : e
      )
    );
    setActiveEdge(null);
  };

  const deleteActiveEdge = () => {
    if (!activeEdge) return;
    setEdges((eds) => eds.filter(e => e.id !== activeEdge.id));
    setActiveEdge(null);
    setSelectedEdge(null);
  };

  return (
    <div className="w-full h-full bg-[#141A21]">
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
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edgesWithSelection}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={connectionLineStyle}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.3}
        maxZoom={2.5}
        style={reactFlowStyles}
        selectNodesOnDrag={false}
        panOnDrag={true}
        selectionOnDrag={false}
        multiSelectionKeyCode={null}
        deleteKeyCode="Delete"
        elevateNodesOnSelect={true}
        snapToGrid={true}
        snapGrid={[15, 15]}
        proOptions={{ hideAttribution: true }}
      >
        {/* Dot Pattern Background - Figma Design */}
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
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        />

      </ReactFlow>

      {activeEdge && (
        <ConditionModal
          edge={activeEdge}
          onSave={saveConditionForActive}
          onClose={() => setActiveEdge(null)}
          onDeleteEdge={deleteActiveEdge}
        />
      )}
    </div>
  );
}