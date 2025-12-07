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
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const typeOptions = [
    { value: "user.contains", label: "User.contains" },
    { value: "user.regex", label: "User.regex" },
    { value: "intent_is", label: "Intent_is" },
    { value: "tool.ok", label: "Tool.ok" },
    { value: "parameters.has", label: "Parameters.has" },
    { value: "parameters.equals", label: "Parameters.equals" },
    { value: "tool.field_equals", label: "Tool.field_equals" },
  ];
  const type = row.when || 'user.contains';
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Condition Type Select (Custom Dropdown) */}
      <div className="relative w-full sm:w-[199px]">
        {/* Dropdown header */}
        <div
          onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
          className="flex justify-between items-center h-10 px-3.5 bg-white/0 rounded-lg text-white text-sm cursor-pointer backdrop-blur-md transition hover:bg-white/20 "
        >
          {type
            ? typeOptions.find((opt) => opt.value === type)?.label
            : "Select Type"}

          <span className="ml-2 text-xs opacity-70">
              <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.8344 5.8344C5.63969 5.83478 5.45099 5.76696 5.30106 5.64273L0.301063 1.47606C-0.0533202 1.18151 -0.101823 0.655445 0.192729 0.301062C0.487281 -0.0533202 1.01335 -0.101823 1.36773 0.192729L5.8344 3.92606L10.3011 0.326063C10.4732 0.186254 10.694 0.120838 10.9145 0.1443C11.1351 0.167761 11.3372 0.278163 11.4761 0.451063C11.6303 0.624279 11.7054 0.85396 11.6833 1.08486C11.6612 1.31576 11.5438 1.52699 11.3594 1.66773L6.3594 5.69273C6.20516 5.79733 6.02031 5.8472 5.8344 5.8344Z" fill="#919EAB" fill-opacity="0.8"/>
              </svg>
          </span>
        </div>

        {/* Dropdown menu */}
        {typeDropdownOpen && (
          <div className="absolute top-full left-0 w-full mt-1 bg-black/80 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-scroll">
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {/* Reset */}
            <div
              onClick={() => {
                onChange({ ...row, when: "" });
                setTypeDropdownOpen(false);
              }}
              className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
            >
              Select Type
            </div>

            {/* Options */}
            {typeOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange({ ...row, when: option.value });
                  setTypeDropdownOpen(false);
                }}
                className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fields by type */}
      <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
        {type === 'user.contains' && (
          <div className="flex-1">
            <input
              placeholder='Value'
              value={row.value || ''}
              onChange={(e) => onChange({ ...row, value: e.target.value })}
              className="h-10 w-full px-3.5 py-0 flex items-center rounded-lg text-sm text-white placeholder-[#919EAB] focus:border-[#13F584] focus:outline-none"
              style={{
                background: 'rgba(255, 255, 255, 0.00)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
           
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
                background: 'rgba(255, 255, 255, 0.00)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
           
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
                background: 'rgba(255, 255, 255, 0.00)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
             
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
                background: 'rgba(255, 255, 255, 0.00)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
        
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
                  background: 'rgba(255, 255, 255, 0.00)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
             
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
                  background: 'rgba(255, 255, 255, 0.00)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',

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
                  background: 'rgba(255, 255, 255, 0.00)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
        
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Delete Button */}
      <button
        onClick={onRemove}
        className="w-full sm:w-12 h-10   flex items-center justify-center rounded-lg transition-colors self-center sm:self-auto"
        style={{
          background: 'rgba(255, 86, 48, 0.08)',
        
        }}
        title="Remove condition"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.42969 7.85938L5.46754 20.3881C5.54191 21.2916 6.31152 22 7.21848 22H16.7812C17.6881 22 18.4577 21.2916 18.5321 20.3881L19.5699 7.85938H4.42969ZM9.06957 19.6562C8.76285 19.6562 8.5048 19.4177 8.48535 19.1069L7.89941 9.65379C7.87937 9.33051 8.12484 9.05242 8.44758 9.03238C8.7823 9.00891 9.0484 9.25727 9.06898 9.58055L9.65492 19.0337C9.67566 19.3684 9.41078 19.6562 9.06957 19.6562ZM12.5857 19.0703C12.5857 19.3942 12.3237 19.6562 11.9998 19.6562C11.6759 19.6562 11.4139 19.3942 11.4139 19.0703V9.61719C11.4139 9.29332 11.6759 9.03125 11.9998 9.03125C12.3237 9.03125 12.5857 9.29332 12.5857 9.61719V19.0703ZM16.1002 9.65383L15.5143 19.107C15.495 19.4145 15.2386 19.6709 14.8929 19.6551C14.5701 19.6351 14.3246 19.357 14.3447 19.0337L14.9306 9.58059C14.9507 9.2573 15.2339 9.02211 15.552 9.03242C15.8748 9.05246 16.1202 9.33055 16.1002 9.65383Z" fill="#FF5630"/>
        <path d="M19.6172 4.34375H16.1016V3.75781C16.1016 2.78852 15.313 2 14.3438 2H9.65625C8.68695 2 7.89844 2.78852 7.89844 3.75781V4.34375H4.38281C3.73559 4.34375 3.21094 4.8684 3.21094 5.51562C3.21094 6.16277 3.73559 6.6875 4.38281 6.6875C9.77211 6.6875 14.2281 6.6875 19.6172 6.6875C20.2644 6.6875 20.7891 6.16277 20.7891 5.51562C20.7891 4.8684 20.2644 4.34375 19.6172 4.34375ZM14.9297 4.34375H9.07031V3.75781C9.07031 3.43453 9.33297 3.17188 9.65625 3.17188H14.3438C14.667 3.17188 14.9297 3.43453 14.9297 3.75781V4.34375Z" fill="#FF5630"/>
        </svg>

      </button>
    </div>
  );
}


function ConditionModal({ edge, onSave, onClose, onDeleteEdge }) {
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const modeOptions = [
    { value: "single", label: "Single" },
    { value: "any", label: "ANY (or)" },
    { value: "all", label: "ALL (and)" },
    { value: "not", label: "NOT" },
  ];

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
        className="relative rounded-3xl w-full max-w-[810px] mx-4 sm:mx-auto shadow-2xl edge-condition-modal"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white">Edge Condition</h2>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition"
            >
              ×
            </button>
          </div>

          {/* Connection Section */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16 pt-4">
            <div className="flex flex-col gap-2.5 sm:w-[150px]">
              <h3 className="text-sm sm:text-base font-semibold text-white">Connection</h3>
            </div>
            <div className="flex-1 flex flex-col gap-8 sm:gap-16">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Source Field */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-semibold text-[#919EAB]">Source</label>
                    <div 
                      className="h-[53px] px-3 py-0 flex items-center rounded-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.00)',
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
                        background: 'rgba(255, 255, 255, 0.00)',
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

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16 py-4">
            <div className="flex flex-col gap-2.5 sm:w-[150px]">
              <h3 className="text-sm sm:text-base font-semibold text-white">Conditions</h3>
            </div>
            <div className="flex-1 flex flex-col gap-8 sm:gap-16">
              <div className="flex flex-col gap-4">
                {/* Mode Selector */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <label className="text-xs font-semibold text-[#919EAB]">Mode</label>

                  <div className="relative w-full sm:w-[160px]">
                    {/* Dropdown header */}
                    <div
                      onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
                      className="flex justify-between items-center h-9 px-3 bg-white/0 rounded-lg 
                                text-white text-sm font-semibold cursor-pointer backdrop-blur-md 
                                transition hover:bg-white/20 "
                    >
                      {modeOptions.find((opt) => opt.value === mode)?.label}
                      <span className="ml-2 text-xs opacity-70">
                        <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5.8344 5.8344C5.63969 5.83478 5.45099 5.76696 5.30106 5.64273L0.301063 1.47606C-0.0533202 1.18151 -0.101823 0.655445 0.192729 0.301062C0.487281 -0.0533202 1.01335 -0.101823 1.36773 0.192729L5.8344 3.92606L10.3011 0.326063C10.4732 0.186254 10.694 0.120838 10.9145 0.1443C11.1351 0.167761 11.3372 0.278163 11.4761 0.451063C11.6303 0.624279 11.7054 0.85396 11.6833 1.08486C11.6612 1.31576 11.5438 1.52699 11.3594 1.66773L6.3594 5.69273C6.20516 5.79733 6.02031 5.8472 5.8344 5.8344Z" fill="#919EAB" fill-opacity="0.8"/>
                        </svg>
                      </span>
                    </div>

                    {/* Dropdown menu */}
                    {modeDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-black/80 rounded-lg 
                                      backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 
                                      max-h-48 overflow-y-scroll">
                        <style>{`
                          div::-webkit-scrollbar { display: none; }
                        `}</style>

                        {modeOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => {
                              setMode(option.value);
                              setModeDropdownOpen(false);
                            }}
                            className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-start sm:justify-end w-full sm:w-auto">
                    <button
                      onClick={addRow}
                      className="h-9 px-3 flex items-center gap-2 rounded-lg text-sm font-bold text-[#9EFBCD] transition-colors"
                      style={{
                        background: 'rgba(19, 245, 132, 0.08)',
                      
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Condition
                    </button>
                  </div>
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
              className="h-9 px-3 flex items-center gap-2 rounded-lg  text-sm font-bold text-[#FFAC82] transition-colors"
              style={{
                background: 'rgba(255, 86, 48, 0.08)',
               
              }}
            >
          
              Delete edge
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="h-9 px-3 flex items-center gap-2 rounded-lg text-sm font-bold text-white transition-colors"
                style={{
                  background: 'rgba(145, 158, 171, 0.08)',
                
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(buildCondition())}
                className="h-9 px-3 flex items-center gap-2 rounded-lg text-sm font-bold text-[#9EFBCD] transition-colors"
                style={{
                  background: 'rgba(19, 245, 132, 0.08)',
             
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