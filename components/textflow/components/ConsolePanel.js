// components/textflow/components/ConsolePanel.js
import React from "react";
import { useTextflowStore } from "../hooks/useTextflowStore";
import { Activity, X, Trash2 } from "lucide-react";

export default function ConsolePanel({ onClose }) {
  const lines = useTextflowStore((s) => s.consoleLines);
  const clearConsole = useTextflowStore((s) => s.clearConsole);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .console-panel button:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }
      `}} />
      <div 
        className="h-full rounded-xl overflow-hidden flex flex-col shadow-xl console-panel"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
      <div 
        className="px-3 py-2 flex items-center justify-between backdrop-blur-sm"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-semibold text-white">Console</span>
          <span 
            className="text-[9px] text-gray-300 px-1.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.08)'
            }}
          >
            {lines.length} {lines.length === 1 ? 'log' : 'logs'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={clearConsole}
            className="text-[10px] text-gray-300 hover:text-white transition-colors px-1.5 py-0.5 rounded-md flex items-center gap-1"
            style={{
              background: 'transparent'
            }}
          >
            <Trash2 className="w-2.5 h-2.5" />
            Clear
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[10px] text-red-400 hover:text-red-300 transition-colors px-1.5 py-0.5 rounded-md flex items-center gap-1"
              style={{
                background: 'transparent'
              }}
            >
              <X className="w-2.5 h-2.5" />
              Close
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-2 space-y-1 font-mono text-[10px]">
        {lines.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Activity className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
              <div className="text-[11px]">No logs yet</div>
              <div className="text-[9px] mt-1">Run your flow to see activity</div>
            </div>
          </div>
        ) : (
          lines.map((l, i) => (
            <div 
              key={i} 
              className="px-2 py-1.5 rounded-lg transition-all"
              style={{
                background: l.kind === 'error' 
                  ? 'rgba(220, 38, 38, 0.1)' 
                  : l.kind === 'chunk'
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderLeft: `2px solid ${
                  l.kind === 'error' 
                    ? 'rgba(220, 38, 38, 0.5)' 
                    : l.kind === 'chunk'
                    ? 'rgba(59, 130, 246, 0.5)'
                    : 'rgba(255, 255, 255, 0.2)'
                }`
              }}
            >
              <div className="flex items-start gap-1.5">
                <span className="text-gray-400 text-[9px] leading-4 flex-shrink-0">
                  {new Date(l.ts).toLocaleTimeString()}
                </span>
                <span 
                  className="flex-1"
                  style={{
                    color: l.kind === 'error' 
                      ? 'rgba(248, 113, 113, 1)' 
                      : l.kind === 'chunk'
                      ? 'rgba(147, 197, 253, 1)'
                      : 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  {l.text}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </>
  );
}