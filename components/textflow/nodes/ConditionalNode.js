// ConditionalNode.js - DARK THEME
import React from "react";
import { Handle, Position } from "reactflow";
import { useTextflowStore } from "../hooks/useTextflowStore.js";
import { GitBranch } from "lucide-react";

export default function ConditionalNode({ id, data, selected }) {
  const setSelection = useTextflowStore((s) => s.setSelection);
  return (
    <div
      onClick={() => setSelection(id)}
      className={`px-2 py-1.5 min-w-[110px] rounded-lg border border-indigo-500/30 bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/20 ${
        selected ? "ring-1 ring-indigo-500 ring-offset-2 ring-offset-gray-950" : ""
      }`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <GitBranch className="w-3 h-3 text-white" />
        </div>
        <div className="text-[8px] uppercase tracking-wide text-indigo-400 font-semibold">BRANCH</div>
      </div>
      <div className="font-medium text-white text-[10px]">{data?.label || "Conditional"}</div>
      <div className="text-[8px] text-gray-400 mt-0.5">Decision point</div>
      <Handle type="target" position={Position.Left} className="!bg-indigo-500 !w-2.5 !h-2.5 !border-2 !border-gray-900" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-2.5 !h-2.5 !border-2 !border-gray-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-2.5 !h-2.5 !border-2 !border-gray-900" />
    </div>
  );
}