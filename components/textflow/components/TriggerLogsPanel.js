// components/textflow/components/TriggerLogsPanel.js (NEW)
import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Webhook, Calendar, Play } from "lucide-react";
import { getTriggerLogs } from "../api/textflowApi";

export default function TriggerLogsPanel({ assistantId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState("");

  const loadLogs = async () => {
    if (!assistantId) return;
    
    try {
      setLoading(true);
      setError("");
      const data = await getTriggerLogs(assistantId, 50);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load trigger logs:", err);
      setError(`Failed to load logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [assistantId]);

  useEffect(() => {
    if (autoRefresh && assistantId) {
      const interval = setInterval(loadLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, assistantId]);

  const getTriggerIcon = (type) => {
    switch (type) {
      case "webhook": return Webhook;
      case "schedule": return Calendar;
      case "manual": return Play;
      default: return Activity;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success": return "emerald";
      case "failed": return "red";
      case "ignored": return "yellow";
      default: return "gray";
    }
  };

  return (
    <div 
      className="h-full flex flex-col rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Trigger Logs</span>
          <span 
            className="text-xs text-gray-300 px-2 py-1 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.08)'
            }}
          >
            {logs.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-emerald-500 focus:ring-emerald-500"
            />
            Auto
          </label>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-2 text-white rounded-lg transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.08)'
            }}
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {error && (
          <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
              <div className="text-sm text-gray-400">Loading logs...</div>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <div className="text-sm font-medium mb-1">No trigger logs yet</div>
            <div className="text-xs">Logs will appear when triggers execute</div>
          </div>
        ) : (
          logs.map((log) => {
            const TriggerIcon = getTriggerIcon(log.trigger_type);
            const statusColor = getStatusColor(log.status);
            const StatusIcon = log.status === "success" ? CheckCircle2 : log.status === "failed" ? XCircle : AlertCircle;

            return (
              <div
                key={log.log_id}
                className={`rounded-lg p-3 border transition-all hover:shadow-md ${
                  log.status === "success"
                    ? "bg-emerald-950/20 border-emerald-800/50 hover:border-emerald-700/50"
                    : log.status === "failed"
                    ? "bg-red-950/20 border-red-800/50 hover:border-red-700/50"
                    : "bg-yellow-950/20 border-yellow-800/50 hover:border-yellow-700/50"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg bg-${statusColor}-900/50 flex items-center justify-center`}>
                      <TriggerIcon className={`w-4 h-4 text-${statusColor}-400`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold uppercase text-${statusColor}-400`}>
                          {log.trigger_type}
                        </span>
                        <StatusIcon className={`w-3.5 h-3.5 text-${statusColor}-400`} />
                      </div>
                      <div className={`text-xs text-${statusColor}-300 mt-0.5`}>
                        {log.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(log.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Run ID */}
                {log.run_id && (
                  <div className="mb-2.5 flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Run:</span>
                    <code 
                      className="font-mono text-gray-300 px-2 py-1 rounded"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      {log.run_id.slice(0, 12)}...
                    </code>
                  </div>
                )}

                {/* Error Message */}
                {log.error && (
                  <div className="mb-2.5 p-2.5 bg-red-950/50 border border-red-800/30 rounded text-xs text-red-300">
                    <div className="font-semibold mb-1">Error:</div>
                    <div className="font-mono text-xs">{log.error}</div>
                  </div>
                )}

                {/* Payload Preview */}
                {log.payload_preview && (
                  <div 
                    className="mb-2.5 p-2.5 rounded"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div className="text-xs text-gray-400 mb-1">Payload:</div>
                    <div className="text-xs font-mono text-gray-300 truncate">
                      {log.payload_preview}
                    </div>
                  </div>
                )}

                {/* Source Info */}
                <div className="flex items-center gap-3 text-xs text-gray-400 pt-2 border-t border-white/10">
                  {log.source_ip && (
                    <div className="flex items-center gap-1">
                      <span>IP:</span>
                      <span className="font-mono text-gray-500">{log.source_ip}</span>
                    </div>
                  )}
                  {log.trigger_node_id && (
                    <div className="flex items-center gap-1">
                      <span>Node:</span>
                      <span className="font-mono text-gray-500">{log.trigger_node_id.slice(0, 8)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}