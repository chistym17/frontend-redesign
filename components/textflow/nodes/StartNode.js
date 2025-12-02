import React from "react";
import { Handle, Position } from "reactflow";
import { useTextflowStore } from "../hooks/useTextflowStore.js";
import { Play } from "lucide-react";

export default function StartNode({ id, data, selected }) {
  const setSelection = useTextflowStore((s) => s.setSelection);
  return (
    <div
      onClick={() => setSelection(id)}
      className={`px-2 py-1.5 min-w-[110px] rounded-lg border bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg cursor-pointer transition-all hover:shadow-2xl ${
        selected 
          ? "ring-1 ring-emerald-500 ring-offset-2 ring-offset-gray-950 scale-105 shadow-emerald-500/25" 
          : "hover:scale-102 border-emerald-500/50"
      }`}
      style={{
        borderColor: selected ? '#10b981' : '#10b98140'
      }}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <Play className="w-3 h-3 text-white" />
        </div>
        <div className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold">START</div>
      </div>
      <div className="font-semibold text-white text-[10px]">{data?.label || "Flow Entry Point"}</div>
      <div className="text-[8px] text-emerald-400/70 mt-0.5">Begin execution here</div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-emerald-500 !w-2.5 !h-2.5 !border-2 !border-gray-900"
      />
    </div>
  );
}