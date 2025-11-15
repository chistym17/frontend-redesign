// components/textflow/components/NodeSidebar.js
import React from "react";
import { useTextflowStore } from "../hooks/useTextflowStore";
import { Play, Target, Globe, Brain, Zap, GitBranch, Layers, Clock, Package } from "lucide-react";

const PALETTE = [
  { type: "start", label: "Start", icon: Play, color: "from-emerald-400 to-teal-500", border: "border-emerald-500/30" },
  { type: "trigger", label: "Trigger", icon: Target, color: "from-blue-400 to-cyan-500", border: "border-blue-500/30" },
  { type: "http", label: "HTTP", icon: Globe, color: "from-violet-400 to-purple-500", border: "border-violet-500/30" },
  { type: "llm", label: "AI Model", icon: Brain, color: "from-pink-400 to-rose-500", border: "border-pink-500/30" },
  { type: "transform", label: "Transform", icon: Zap, color: "from-amber-400 to-orange-500", border: "border-amber-500/30" },
  { type: "conditional", label: "Branch", icon: GitBranch, color: "from-indigo-400 to-blue-500", border: "border-indigo-500/30" },
  { type: "parallel", label: "Parallel", icon: Layers, color: "from-fuchsia-400 to-purple-500", border: "border-fuchsia-500/30" },
  { type: "wait", label: "Delay", icon: Clock, color: "from-gray-400 to-slate-500", border: "border-gray-500/30" },
  { type: "subflow", label: "Subflow", icon: Package, color: "from-cyan-400 to-blue-500", border: "border-cyan-500/30" },
];

export default function NodeSidebar() {
  const tf = useTextflowStore();

  const addNode = (type) => {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const existingNodes = tf.flow.nodes.length;
    const x = 20 + (existingNodes % 4) * 150;
    const y = 50 + Math.floor(existingNodes / 4) * 120;
    
    const node = {
      id,
      type,
      position: { x, y },
      data: { 
        label: type.charAt(0).toUpperCase() + type.slice(1),
        config: {}
      }
    };
    
    tf.setNodes([...tf.flow.nodes, node]);
    tf.setSelection(id);
    
    if (!tf.flow.entryNodeId || type === "start") {
      tf.setFlow({ entryNodeId: id });
    }
    
    tf.appendConsole({ 
      ts: Date.now(), 
      kind: "info", 
      text: `Added ${type} node` 
    });
  };

  return (
    <div
      className="h-full p-4 flex flex-col border-r"
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRightColor: 'rgba(255, 255, 255, 0.12)'
      }}
    >
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-100 mb-1 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          Components
        </h2>
        <p className="text-[11px] text-gray-400">Click to add nodes to canvas</p>
      </div>

      <div className="flex-1 overflow-auto space-y-2 pb-4">
        {PALETTE.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.type}
              onClick={() => addNode(p.type)}
              className={`w-full group relative overflow-hidden rounded-xl border ${p.border} bg-gray-800 hover:bg-gray-750 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 p-3`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <div className="relative flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm text-gray-100">{p.label}</div>
                  <div className="text-xs text-gray-400 capitalize">{p.type}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-gray-700/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Nodes</span>
          <span className="font-semibold text-gray-100">{tf.flow.nodes.length}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Connections</span>
          <span className="font-semibold text-gray-100">{tf.flow.edges.length}</span>
        </div>
        {tf.selection && (
          <div className="mt-3 p-2 bg-emerald-950/30 rounded-lg border border-emerald-700/40">
            <div className="text-xs text-emerald-400 font-medium">Selected</div>
            <div className="text-xs text-emerald-200 font-mono truncate mt-0.5">{tf.selection.slice(0, 20)}...</div>
          </div>
        )}
      </div>
    </div>
  );
}