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
        className="px-4 py-3 flex items-center justify-between backdrop-blur-sm"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Console</span>
          <span 
            className="text-xs text-gray-300 px-2 py-1 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.08)'
            }}
          >
            {lines.length} {lines.length === 1 ? 'log' : 'logs'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearConsole}
            className="text-xs text-gray-300 hover:text-white transition-colors px-2 py-1 rounded-md flex items-center gap-1.5"
            style={{
              background: 'transparent'
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-md flex items-center gap-1.5"
              style={{
                background: 'transparent'
              }}
            >
              <X className="w-3.5 h-3.5" />
              Close
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-3 space-y-2 font-mono text-sm">
        {lines.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <div className="text-sm">No logs yet</div>
              <div className="text-xs mt-1">Run your flow to see activity</div>
            </div>
          </div>
        ) : (
          lines.map((l, i) => (
            <div 
              key={i} 
              className="px-3 py-2 rounded-lg transition-all"
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
              <div className="flex items-start gap-2">
                <span className="text-gray-400 text-xs leading-5 flex-shrink-0">
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