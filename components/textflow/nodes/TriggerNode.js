// components/textflow/nodes/TriggerNode.js (NEW)
import React from "react";
import { Handle, Position } from "reactflow";
import { useTextflowStore } from "../hooks/useTextflowStore.js";
import { Target, Webhook, Clock, Play } from "lucide-react";

export default function TriggerNode({ id, data, selected }) {
  const setSelection = useTextflowStore((s) => s.setSelection);
  const config = data?.config || {};
  const triggerKind = config.kind || "manual";

  // Choose icon based on trigger type
  const Icon = triggerKind === "webhook" ? Webhook : triggerKind === "schedule" ? Clock : Target;
  
  // Choose color scheme
  const colorScheme = {
    webhook: {
      gradient: "from-blue-500 to-cyan-600",
      border: "border-blue-500/30",
      glow: "shadow-blue-500/20",
      text: "text-blue-400"
    },
    schedule: {
      gradient: "from-purple-500 to-pink-600",
      border: "border-purple-500/30",
      glow: "shadow-purple-500/20",
      text: "text-purple-400"
    },
    manual: {
      gradient: "from-gray-500 to-slate-600",
      border: "border-gray-500/30",
      glow: "shadow-gray-500/20",
      text: "text-gray-400"
    }
  };

  const colors = colorScheme[triggerKind] || colorScheme.manual;

  const ringColor = triggerKind === 'webhook' ? 'ring-blue-500' : triggerKind === 'schedule' ? 'ring-purple-500' : 'ring-gray-500';

  return (
    <div
      onClick={() => setSelection(id)}
      className={`px-2 py-1.5 min-w-[110px] rounded-lg border-2 ${colors.border} bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:${colors.glow} ${
        selected ? `ring-2 ${ringColor} ring-offset-2 ring-offset-gray-950` : ""
      }`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg ${colors.glow}`}>
          <Icon className="w-3 h-3 text-white" />
        </div>
        <div className={`text-[8px] uppercase tracking-wide ${colors.text} font-semibold`}>
          {triggerKind} trigger
        </div>
      </div>
      <div className="font-medium text-white text-[10px]">{data?.label || "Trigger"}</div>
      <div className="text-[8px] text-gray-400 mt-0.5 capitalize">
        {triggerKind === "webhook" && "🌐 HTTP POST"}
        {triggerKind === "schedule" && "⏰ Cron Schedule"}
        {triggerKind === "manual" && "▶️ Manual"}
      </div>
      
      {/* Only target handle (triggers are entry points) */}
      <Handle type="source" position={Position.Right} className={`!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-gray-900`} />
    </div>
  );
}