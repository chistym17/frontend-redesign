// components/textflow/components/ConfigPanel.js - FIXED TOGGLE ISSUE
import React, { useState, useEffect, useRef } from "react";
import { useTextflowStore } from "../hooks/useTextflowStore";
import Editor from "@monaco-editor/react";
import ConditionTester from "./ConditionTester";
import { 
  Settings, Trash2, Copy, Play, Target, Globe, Brain, Zap, GitBranch, 
  Layers, Clock, Package, FileJson, Webhook, Calendar, CheckCircle, 
  XCircle, ChevronDown, Eye, EyeOff, Plug, Shield, Activity, X
} from "lucide-react";
import { 
  getWebhookUrl, testWebhook, createSchedule, deleteSchedule, listCredentials 
} from "../api/textflowApi";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://176.9.16.194:5403/api';

const ICON_MAP = {
  start: Play,
  trigger: Target,
  http: Globe,
  llm: Brain,
  transform: Zap,
  conditional: GitBranch,
  parallel: Layers,
  wait: Clock,
  subflow: Package,
};

const COLOR_MAP = {
  start: "from-emerald-400 to-teal-500",
  trigger: "from-blue-400 to-cyan-500",
  http: "from-violet-400 to-purple-500",
  llm: "from-pink-400 to-rose-500",
  transform: "from-amber-400 to-orange-500",
  conditional: "from-indigo-400 to-blue-500",
  parallel: "from-fuchsia-400 to-purple-500",
  wait: "from-gray-400 to-slate-500",
  subflow: "from-cyan-400 to-blue-500",
};

// ============================================================================
// CONNECTOR SELECTOR COMPONENT
// ============================================================================

function ConnectorSelector({ selectedConnectorId, onSelect, assistantId }) {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (showPicker) {
      loadConnectors();
    }
  }, [showPicker]);

  const loadConnectors = async () => {
  try {
    setLoading(true);
    
    // Fetch both owned AND installed connectors
    const [ownedRes, installedRes] = await Promise.all([
      fetch(`${API_BASE}/textflow/connectors/list?limit=100&owner_id=${assistantId}`),
      fetch(`${API_BASE}/textflow/connectors/list?limit=100&installed_for=${assistantId}`)
    ]);
    
    if (!ownedRes.ok || !installedRes.ok) throw new Error('Failed to load connectors');
    
    const owned = await ownedRes.json();
    const installed = await installedRes.json();
    
    // Merge and deduplicate by connector_id
    const map = new Map();
    for (const c of [...owned, ...installed]) {
      map.set(c.connector_id, c);
    }
    
    setConnectors(Array.from(map.values()));
  } catch (err) {
    console.error('Failed to load connectors:', err);
  } finally {
    setLoading(false);
  }
};

  const selectedConnector = connectors.find(c => c.connector_id === selectedConnectorId);

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
        <Plug className="w-4 h-4 text-emerald-400" />
        API Connector
      </label>
      
      {selectedConnector ? (
        <div 
          className="rounded-lg p-3"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="font-medium text-white">{selectedConnector.name}</div>
              <div className="text-xs text-gray-400">{selectedConnector.slug}</div>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="text-emerald-400 hover:text-emerald-300 text-xs"
            >
              Change
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{selectedConnector.spec?.endpoints?.length || 0} endpoints</span>
            {selectedConnector.validated && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                Validated
              </span>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full px-3 py-2.5 rounded-lg text-sm text-white transition-all flex items-center justify-center gap-2"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          <Plug className="w-4 h-4" />
          Select Connector
        </button>
      )}

      {/* Connector Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div 
            className="rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Select Connector</h3>
              <button
                onClick={() => setShowPicker(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-gray-400">Loading connectors...</div>
              </div>
            ) : connectors.length === 0 ? (
              <div className="text-center py-12">
                <Plug className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <div className="text-sm text-gray-400">No connectors available</div>
                <div className="text-xs text-gray-600 mt-1">Create connectors in the Connectors panel</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {connectors.map(connector => (
                  <button
                    key={connector.connector_id}
                    onClick={() => {
                      onSelect(connector);
                      setShowPicker(false);
                    }}
                    className="w-full p-3 rounded-lg text-left transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-100">{connector.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{connector.description}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span className="px-2 py-0.5 bg-gray-900 rounded text-gray-400">
                            {connector.category}
                          </span>
                          <span className="text-gray-600">
                            {connector.spec?.endpoints?.length || 0} endpoints
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ENDPOINT SELECTOR COMPONENT
// ============================================================================

function EndpointSelector({ connector, selectedEndpointId, onSelect }) {
  const [showPicker, setShowPicker] = useState(false);

  if (!connector || !connector.spec?.endpoints) return null;

  const endpoints = connector.spec.endpoints;
  const selectedEndpoint = endpoints.find(ep => ep.id === selectedEndpointId);

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-300">Endpoint</label>
      
      {selectedEndpoint ? (
        <div 
          className="rounded-lg p-3"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="font-medium text-gray-100">{selectedEndpoint.name}</div>
              <div className="text-xs text-gray-500 font-mono mt-1">
                {selectedEndpoint.method} {selectedEndpoint.path}
              </div>
            </div>
            <button
              onClick={() => setShowPicker(true)}
              className="text-emerald-400 hover:text-emerald-300 text-xs"
            >
              Change
            </button>
          </div>
          {selectedEndpoint.description && (
            <div className="text-xs text-gray-500 mt-2">{selectedEndpoint.description}</div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-all"
        >
          Select Endpoint
        </button>
      )}

      {/* Endpoint Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div 
            className="rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Select Endpoint</h3>
              <button
                onClick={() => setShowPicker(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {endpoints.map(endpoint => (
                <button
                  key={endpoint.id}
                  onClick={() => {
                    onSelect(endpoint);
                    setShowPicker(false);
                  }}
                  className="w-full p-3 rounded-lg text-left transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-mono font-semibold ${
                      endpoint.method === 'GET' ? 'bg-blue-900/30 text-blue-400' :
                      endpoint.method === 'POST' ? 'bg-green-900/30 text-green-400' :
                      endpoint.method === 'PUT' ? 'bg-yellow-900/30 text-yellow-400' :
                      endpoint.method === 'DELETE' ? 'bg-red-900/30 text-red-400' :
                      'bg-gray-900/30 text-gray-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-100">{endpoint.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">{endpoint.path}</div>
                      {endpoint.description && (
                        <div className="text-xs text-gray-500 mt-1">{endpoint.description}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ENDPOINT PARAMETERS EDITOR
// ============================================================================

function EndpointParametersEditor({ endpoint, params, onChange }) {
  if (!endpoint) return null;

  const pathParams = endpoint.path_params || [];
  const queryParams = endpoint.query_params || [];
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method);

  return (
    <div className="space-y-4">
      {/* Path Parameters */}
      {pathParams.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">Path Parameters</label>
          {pathParams.map(param => (
            <div key={param.name} className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">{param.name}</label>
                {param.required && <span className="text-red-400 text-xs">*</span>}
              </div>
              <input
                type="text"
                value={params[param.name] || ''}
                onChange={(e) => onChange({ ...params, [param.name]: e.target.value })}
                placeholder={`{{variable}} or literal value`}
                className="w-full px-3 py-2 rounded-lg text-white text-sm transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              />
              {param.description && (
                <div className="text-xs text-gray-600">{param.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Query Parameters */}
      {queryParams.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">Query Parameters</label>
          {queryParams.map(param => (
            <div key={param.name} className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">{param.name}</label>
                {param.required && <span className="text-red-400 text-xs">*</span>}
              </div>
              <input
                type="text"
                value={params[param.name] || ''}
                onChange={(e) => onChange({ ...params, [param.name]: e.target.value })}
                placeholder={param.default || `{{variable}} or value`}
                className="w-full px-3 py-2 rounded-lg text-white text-sm transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Request Body */}
      {hasBody && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">Request Body (JSON)</label>
          <div 
            className="rounded-lg overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Editor
              height="150px"
              defaultLanguage="json"
              value={JSON.stringify(params.body || {}, null, 2)}
              onChange={(v) => {
                try {
                  const parsed = JSON.parse(v || '{}');
                  onChange({ ...params, body: parsed });
                } catch (e) {
                  // Invalid JSON, ignore
                }
              }}
              theme="vs-dark"
              options={{ 
                minimap: { enabled: false }, 
                fontSize: 12,
                lineNumbers: "off",
                scrollBeyondLastLine: false,
                scrollbar: {
                  vertical: 'hidden',
                  horizontal: 'hidden',
                  useShadows: false,
                  verticalHasArrows: false,
                  horizontalHasArrows: false,
                },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
              }}
              beforeMount={(monaco) => {
                monaco.editor.defineTheme('custom-dark', {
                  base: 'vs-dark',
                  inherit: true,
                  rules: [],
                  colors: {
                    'editor.background': '#00000000',
                    'editor.foreground': '#FFFFFF',
                  }
                });
              }}
              onMount={(editor, monaco) => {
                monaco.editor.setTheme('custom-dark');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CUSTOM SELECT DROPDOWN COMPONENT
// ============================================================================

function CustomSelectDropdown({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1 text-xs rounded-lg transition-all text-white text-left flex items-center justify-between"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <span className="capitalize">{value}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
          style={{
            background: '#2D3748',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="w-full px-2 py-1.5 text-left text-xs text-white hover:bg-emerald-500/20 transition-colors capitalize"
              style={{
                background: value === option 
                  ? 'rgba(19, 245, 132, 0.2)' 
                  : 'transparent',
                color: value === option ? '#9EFBCD' : '#FFFFFF'
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TRIGGER CONFIG (SAME AS BEFORE)
// ============================================================================

function TriggerConfig({ node, assistantId }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [cronExpression, setCronExpression] = useState("0 9 * * *");
  const [scheduleStatus, setScheduleStatus] = useState("");
  const [testPayload, setTestPayload] = useState('{"test": "data"}');
  const [testResult, setTestResult] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState("");

  const config = node?.data?.config || {};
  const triggerKind = config.kind || "manual";

  useEffect(() => {
    if (triggerKind === "webhook" && assistantId) {
      setLoadingUrl(true);
      setUrlError("");
      getWebhookUrl(assistantId)
        .then(data => {
          setWebhookUrl(data.webhook_url);
          setLoadingUrl(false);
        })
        .catch(err => {
          console.error("Failed to get webhook URL:", err);
          if (err.message.includes("404") || err.message.includes("no webhook trigger")) {
            setUrlError("Save the flow first to generate webhook URL");
          } else {
            setUrlError(err.message || "Failed to load webhook URL");
          }
          setLoadingUrl(false);
        });
    }
  }, [triggerKind, assistantId]);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestWebhook = async () => {
    try {
      const payload = JSON.parse(testPayload);
      const result = await testWebhook(assistantId, payload);
      setTestResult(`✓ Success: ${JSON.stringify(result, null, 2)}`);
    } catch (err) {
      setTestResult(`✗ Error: ${err.message}`);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      setScheduleStatus("Creating...");
      await createSchedule(assistantId, node.id, cronExpression);
      setScheduleStatus("✓ Schedule created!");
      setTimeout(() => setScheduleStatus(""), 3000);
    } catch (err) {
      setScheduleStatus(`✗ Error: ${err.message}`);
      setTimeout(() => setScheduleStatus(""), 5000);
    }
  };

  const handleDeleteSchedule = async () => {
    try {
      setScheduleStatus("Deleting...");
      await deleteSchedule(assistantId, node.id);
      setScheduleStatus("✓ Schedule deleted");
      setTimeout(() => setScheduleStatus(""), 3000);
    } catch (err) {
      setScheduleStatus(`✗ Error: ${err.message}`);
      setTimeout(() => setScheduleStatus(""), 5000);
    }
  };

  if (!assistantId) {
    return (
      <div className="space-y-3 pt-2">
        <div className="bg-yellow-950/40 border border-yellow-800/60 rounded-lg p-3 backdrop-blur">
          <div className="text-xs text-yellow-300 font-medium">⚠️ No assistant ID available</div>
          <div className="text-xs text-yellow-300/70 mt-1">Trigger configuration requires a valid assistant ID.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Trigger Configuration</div>

      {triggerKind === "webhook" && (
        <div className="space-y-3">
          <div className="bg-blue-950/40 border border-blue-800/60 rounded-lg p-4 backdrop-blur">
            <div className="flex items-center gap-2 mb-3">
              <Webhook className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-blue-300">Webhook URL</span>
            </div>
            {loadingUrl ? (
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Loading webhook URL...
              </div>
            ) : urlError ? (
              <div className="text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-800/50">Error: {urlError}</div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs rounded-lg text-white font-mono transition-colors"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                  <button
                    onClick={handleCopyWebhook}
                    className="px-3 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all shadow-lg shadow-blue-500/20"
                  >
                    {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div 
            className="rounded-lg p-4 backdrop-blur"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <label className="text-xs font-semibold text-gray-300 block mb-3">Test Webhook</label>
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg text-white font-mono resize-none transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              rows={3}
            />
            <button
              onClick={handleTestWebhook}
              className="mt-3 w-full px-3 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              Send Test
            </button>
            {testResult && (
              <pre className="mt-3 p-2 bg-gray-900/50 rounded text-[10px] text-gray-300 overflow-auto max-h-24 border border-gray-700/50 font-mono">
                {testResult}
              </pre>
            )}
          </div>
        </div>
      )}

      {triggerKind === "schedule" && (
        <div className="space-y-3">
          <div className="bg-purple-950/40 border border-purple-800/60 rounded-lg p-4 backdrop-blur">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300">Cron Schedule</span>
            </div>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg text-white font-mono transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              placeholder="0 9 * * *"
            />
            <div className="mt-3 text-[10px] text-purple-300/80 space-y-1 bg-purple-950/30 p-2 rounded border border-purple-800/30">
              <div className="font-semibold text-purple-300">Examples:</div>
              <div className="font-mono space-y-0.5">
                <div>• 0 9 * * * — Daily at 9 AM</div>
                <div>• */15 * * * * — Every 15 min</div>
                <div>• 0 */2 * * * — Every 2 hours</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateSchedule}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
              style={{
                background: 'rgba(147, 51, 234, 0.08)',
                border: '1px solid rgba(147, 51, 234, 0.4)',
                color: '#E9D5FF'
              }}
            >
              <Calendar className="w-3 h-3" />
              Create
            </button>
            <button
              onClick={handleDeleteSchedule}
              className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-all shadow-lg shadow-red-500/20"
            >
              Delete
            </button>
          </div>
          {scheduleStatus && (
            <div 
              className="text-xs text-center py-2 text-gray-300 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >{scheduleStatus}</div>
          )}
        </div>
      )}

      {triggerKind === "manual" && (
        <div 
          className="rounded-lg p-4 text-xs text-gray-400 backdrop-blur"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          Manual trigger — executes when explicitly called via API or editor.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN CONFIG PANEL WITH FIXED TOGGLE
// ============================================================================

export default function ConfigPanel({ assistantId }) {
  const { flow, selection, setNodes, setSelection } = useTextflowStore();
  const node = flow.nodes.find((n) => n.id === selection);
  const [config, setConfig] = useState({});
  const [activeTab, setActiveTab] = useState('config');
  const [credentials, setCredentials] = useState([]);
  
  // FIXED: Connector state management
  const [httpMode, setHttpMode] = useState('traditional');
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [endpointParams, setEndpointParams] = useState({});
  const [connectorLoaded, setConnectorLoaded] = useState(false);

  useEffect(() => {
    if (assistantId) {
      listCredentials(assistantId)
        .then(creds => setCredentials(creds))
        .catch(err => console.error("Failed to load credentials:", err));
    }
  }, [assistantId]);

  // FIXED: Node loading logic - ADDED CONFIG DEPENDENCY
  // FIXED: Check both node config AND local config state to avoid race conditions
  useEffect(() => {
    if (node) {
      const nodeConfig = node.data?.config || {};
      
      // Only update config if it's different (avoid unnecessary re-renders)
      // But always check both nodeConfig and local config for connector_id
      const hasConnectorId = !!(nodeConfig.connector_id || config.connector_id);
      
      console.log('🔍 ConfigPanel: Node loaded', {
        nodeId: node.id,
        nodeType: node.type,
        hasConnectorId: hasConnectorId,
        nodeConfigConnectorId: nodeConfig.connector_id,
        localConfigConnectorId: config.connector_id,
        endpointId: nodeConfig.endpoint_id || config.endpoint_id,
        fullConfig: nodeConfig
      });
      
      // Only update config state if node config is different
      if (JSON.stringify(nodeConfig) !== JSON.stringify(config)) {
        setConfig(nodeConfig);
      }
      
      // Detect if this is a connector-based HTTP node
      // Check both nodeConfig and local config to handle async updates
      if (node.type === 'http' && hasConnectorId) {
        // Only switch mode if it's not already in connector mode (avoid flickering)
        if (httpMode !== 'connector') {
          console.log('✅ Switching to CONNECTOR mode');
          setHttpMode('connector');
        }
        setConnectorLoaded(false);
        const connectorId = nodeConfig.connector_id || config.connector_id;
        const endpointId = nodeConfig.endpoint_id || config.endpoint_id;
        if (connectorId) {
          loadConnectorData(connectorId, endpointId);
        }
        setEndpointParams(nodeConfig.endpoint_params || config.endpoint_params || {});
      } else if (node.type === 'http' && !hasConnectorId && httpMode === 'connector') {
        // Only switch to traditional if we're currently in connector mode but no connector_id exists
        console.log('✅ Switching to TRADITIONAL mode (no connector_id found)');
        setHttpMode('traditional');
        setSelectedConnector(null);
        setSelectedEndpoint(null);
        setEndpointParams({});
        setConnectorLoaded(false);
      } else if (node.type === 'http' && !hasConnectorId && httpMode !== 'connector') {
        // Ensure traditional mode is set if not already
        if (httpMode !== 'traditional') {
          console.log('✅ Ensuring TRADITIONAL mode');
          setHttpMode('traditional');
        }
        // Only clear if we're switching from connector mode
        if (selectedConnector || selectedEndpoint) {
          setSelectedConnector(null);
          setSelectedEndpoint(null);
          setEndpointParams({});
          setConnectorLoaded(false);
        }
      }
    }
  }, [node?.id, node?.data?.config?.connector_id, node?.data?.config?.endpoint_id, config.connector_id, config.endpoint_id]);

  // FIXED: Load connector data function
  const loadConnectorData = async (connectorId, endpointId) => {
    if (!connectorId) {
      console.warn('⚠️ loadConnectorData called with no connectorId');
      return;
    }
    
    console.log('📡 Loading connector data:', { connectorId, endpointId });
    
    try {
      const response = await fetch(`${API_BASE}/textflow/connectors/${connectorId}`);
      if (response.ok) {
        const connector = await response.json();
        console.log('✅ Connector loaded:', connector.name);
        
        setSelectedConnector(connector);
        setConnectorLoaded(true);
        
        if (endpointId) {
          const endpoint = connector.spec?.endpoints?.find(ep => ep.id === endpointId);
          if (endpoint) {
            console.log('✅ Endpoint loaded:', endpoint.name);
            setSelectedEndpoint(endpoint);
          } else {
            console.warn('⚠️ Endpoint not found:', endpointId);
          }
        }
      } else {
        console.error('❌ Failed to load connector:', response.status);
        setConnectorLoaded(false);
      }
    } catch (err) {
      console.error('❌ Error loading connector:', err);
      setConnectorLoaded(false);
    }
  };

  if (!node) {
    return (
      <div 
        className="h-full flex flex-col items-center justify-center rounded-3xl p-8"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-2xl" style={{
            background: 'rgba(255, 255, 255, 0.08)'
          }}>
            <Settings className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">No node selected</p>
          <p className="text-xs text-gray-400">Click a node to configure</p>
        </div>
      </div>
    );
  }

  const Icon = ICON_MAP[node.type] || Settings;
  const color = COLOR_MAP[node.type] || "from-gray-400 to-gray-500";

  const handleChange = (name, value) => {
    const newConfig = { ...config, [name]: value };
    setConfig(newConfig);
    
    const updatedNodes = flow.nodes.map((n) =>
      n.id === node.id ? { ...n, data: { ...n.data, config: newConfig } } : n
    );
    setNodes(updatedNodes);
  };

  // FIXED: Handle connector select - IMMEDIATE SAVE
  const handleConnectorSelect = (connector) => {
    console.log('🔌 handleConnectorSelect called:', connector ? connector.name : 'NULL');
    
    if (connector) {
      // SELECTING a connector
      console.log('✅ Selecting connector:', connector.connector_id);
      
      setSelectedConnector(connector);
      setSelectedEndpoint(null);
      setEndpointParams({});
      setConnectorLoaded(true);
      
      // CRITICAL: Update config AND store immediately
      const newConfig = {
        ...config,
        connector_id: connector.connector_id,
        endpoint_id: null,
        endpoint_params: {}
      };
      setConfig(newConfig);
      
      // IMMEDIATELY update store (don't wait for handleChange)
      const updatedNodes = flow.nodes.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, config: newConfig } } : n
      );
      setNodes(updatedNodes);
      
      // CRITICAL: Keep mode as connector
      setHttpMode('connector');
      console.log('✅ Mode kept as CONNECTOR, config saved:', newConfig);
    } else {
      // CLEARING connector (switching to traditional)
      console.log('❌ Clearing connector, switching to traditional mode');
      
      setSelectedConnector(null);
      setSelectedEndpoint(null);
      setEndpointParams({});
      setConnectorLoaded(false);
      
      // Remove connector fields from config
      const newConfig = { ...config };
      delete newConfig.connector_id;
      delete newConfig.endpoint_id;
      delete newConfig.endpoint_params;
      setConfig(newConfig);
      
      // Update store
      const updatedNodes = flow.nodes.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, config: newConfig } } : n
      );
      setNodes(updatedNodes);
      
      // Switch to traditional mode
      setHttpMode('traditional');
      console.log('✅ Switched to TRADITIONAL mode');
    }
  };

  const handleEndpointSelect = (endpoint) => {
    console.log('📍 Endpoint selected:', endpoint.name);
    setSelectedEndpoint(endpoint);
    
    // IMMEDIATELY update config
    const newConfig = {
      ...config,
      endpoint_id: endpoint.id
    };
    setConfig(newConfig);
    
    // IMMEDIATELY update store
    const updatedNodes = flow.nodes.map((n) =>
      n.id === node.id ? { ...n, data: { ...n.data, config: newConfig } } : n
    );
    setNodes(updatedNodes);
    
    console.log('✅ Endpoint config saved:', newConfig);
  };

  const handleEndpointParamsChange = (params) => {
    console.log('⚙️ Params changed:', params);
    setEndpointParams(params);
    
    // IMMEDIATELY update config
    const newConfig = {
      ...config,
      endpoint_params: params
    };
    setConfig(newConfig);
    
    // IMMEDIATELY update store
    const updatedNodes = flow.nodes.map((n) =>
      n.id === node.id ? { ...n, data: { ...n.data, config: newConfig } } : n
    );
    setNodes(updatedNodes);
    
    console.log('✅ Params config saved:', newConfig);
  };

  // FIXED: Toggle handlers
  const handleSwitchToConnector = () => {
    console.log('🔄 User clicked: Switch to Connector mode');
    setHttpMode('connector');
    
    // Clear connector data (user will select new one)
    setSelectedConnector(null);
    setSelectedEndpoint(null);
    setEndpointParams({});
    setConnectorLoaded(false);
    
    console.log('✅ Switched to CONNECTOR mode (empty state)');
  };

  const handleSwitchToTraditional = () => {
    console.log('🔄 User clicked: Switch to Traditional mode');
    
    // Remove connector-related fields from config
    const newConfig = { ...config };
    delete newConfig.connector_id;
    delete newConfig.endpoint_id;
    delete newConfig.endpoint_params;
    
    setConfig(newConfig);
    setSelectedConnector(null);
    setSelectedEndpoint(null);
    setEndpointParams({});
    setConnectorLoaded(false);
    
    // Update store
    const updatedNodes = flow.nodes.map((n) =>
      n.id === node.id ? { ...n, data: { ...n.data, config: newConfig } } : n
    );
    setNodes(updatedNodes);
    
    setHttpMode('traditional');
    console.log('✅ Switched to TRADITIONAL mode');
  };

  const handleDelete = () => {
    const updated = flow.nodes.filter(n => n.id !== node.id);
    setNodes(updated);
    setSelection(null); // Close the modal after deletion
  };

  const handleDuplicate = () => {
    const newNode = { 
      ...node, 
      id: `${node.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 }
    };
    setNodes([...flow.nodes, newNode]);
  };

  const renderHttpNodeConfig = () => {
    return (
      <div className="space-y-4">
        {/* HTTP Mode Selector - tab style like header tabs */}
        <div 
          className="rounded-xl p-4 border backdrop-blur"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            borderColor: 'rgba(255, 255, 255, 0.12)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">HTTP Configuration Mode</span>
            </div>
            {/* DEBUG INFO (remove after testing) */}
            <span className="ml-4 text-[10px] text-gray-500 font-mono">
              Mode: {httpMode} | Connector: {selectedConnector ? 'YES' : 'NO'} | Loaded: {connectorLoaded ? 'YES' : 'NO'}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-white/10 mb-2">
            <button
              onClick={handleSwitchToTraditional}
              className={`px-0 py-2 text-[11px] font-medium transition-all ${
                httpMode === 'traditional' 
                  ? 'text-[#13F584] border-b-2 border-[#13F584]' 
                  : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
              }`}
              style={{ height: '28px' }}
            >
              Traditional
            </button>
            <button
              onClick={handleSwitchToConnector}
              className={`px-0 py-2 text-[11px] font-medium transition-all ${
                httpMode === 'connector' 
                  ? 'text-[#13F584] border-b-2 border-[#13F584]' 
                  : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
              }`}
              style={{ height: '28px' }}
            >
              Use Connector
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {httpMode === 'connector' 
              ? '🔌 Using API connector with pre-configured endpoints'
              : '⚙️ Manual HTTP request configuration'
            }
          </div>
        </div>

        {/* Connector Mode */}
        {httpMode === 'connector' && (
          <div className="space-y-4">
            <ConnectorSelector
              selectedConnectorId={config.connector_id}
              onSelect={handleConnectorSelect}
              assistantId={assistantId}
            />

            {selectedConnector && (
              <EndpointSelector
                connector={selectedConnector}
                selectedEndpointId={config.endpoint_id}
                onSelect={handleEndpointSelect}
              />
            )}

            {selectedEndpoint && (
              <EndpointParametersEditor
                endpoint={selectedEndpoint}
                params={endpointParams}
                onChange={handleEndpointParamsChange}
              />
            )}

            {/* Credential Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                Authentication
              </label>
              <select
                value={endpointParams.credential_id || ''}
                onChange={(e) => handleEndpointParamsChange({
                  ...endpointParams,
                  credential_id: e.target.value
                })}
                className="w-full px-2 py-1 text-xs rounded-lg transition-all text-white"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              >
                <option value="">No authentication</option>
                {credentials.map((cred) => (
                  <option key={cred.credential_id} value={cred.credential_id}>
                    {cred.name} ({cred.credential_type.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Timeout Override */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={endpointParams.timeout || 30}
                onChange={(e) => handleEndpointParamsChange({
                  ...endpointParams,
                  timeout: parseInt(e.target.value)
                })}
                className="w-full px-2 py-1 text-xs rounded-lg transition-all text-white"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}

        {/* Traditional Mode - Existing Fields */}
        {httpMode === 'traditional' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                Method
                <span className="text-red-400 text-sm">•</span>
              </label>
              <div className="relative">
                <select
                  value={config.method || 'GET'}
                  onChange={(e) => handleChange('method', e.target.value)}
                  className="w-full px-2 py-1 pr-7 text-xs rounded-lg transition-all text-white appearance-none cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((method) => (
                    <option key={method} value={method} style={{ background: 'rgba(26, 26, 26, 0.95)', color: '#FFFFFF' }}>{method}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                URL
                <span className="text-red-400 text-sm">•</span>
              </label>
              <input
                type="text"
                value={config.url || ""}
                onChange={(e) => handleChange('url', e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-lg transition-all text-white placeholder-gray-400"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Authentication</label>
              <div className="relative">
                <select
                  value={config.credential_id || ''}
                  onChange={(e) => handleChange('credential_id', e.target.value)}
                  className="w-full px-2 py-1 pr-7 text-xs rounded-lg transition-all text-white appearance-none cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <option value="" style={{ background: 'rgba(26, 26, 26, 0.95)', color: '#FFFFFF' }}>No authentication</option>
                  {credentials.map((cred) => (
                    <option key={cred.credential_id} value={cred.credential_id} style={{ background: 'rgba(26, 26, 26, 0.95)', color: '#FFFFFF' }}>
                      {cred.name} ({cred.credential_type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Headers (JSON)</label>
              <div 
                className="rounded-lg overflow-hidden transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              >
                <Editor
                  height="110px"
                  defaultLanguage="json"
                  value={JSON.stringify(config.headers || {}, null, 2)}
                  onChange={(v) => {
                    try {
                      const parsed = JSON.parse(v || "{}");
                      handleChange('headers', parsed);
                    } catch (e) {}
                  }}
                  theme="vs-dark"
                  options={{ 
                    minimap: { enabled: false }, 
                    fontSize: 12,
                    lineNumbers: "off",
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Query Params (JSON)</label>
              <div 
                className="rounded-lg overflow-hidden transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              >
                <Editor
                  height="110px"
                  defaultLanguage="json"
                  value={JSON.stringify(config.params || {}, null, 2)}
                  onChange={(v) => {
                    try {
                      const parsed = JSON.parse(v || "{}");
                      handleChange('params', parsed);
                    } catch (e) {}
                  }}
                  theme="vs-dark"
                  options={{ 
                    minimap: { enabled: false }, 
                    fontSize: 12,
                    lineNumbers: "off",
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Body (JSON)</label>
              <div 
                className="rounded-lg overflow-hidden transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              >
                <Editor
                  height="110px"
                  defaultLanguage="json"
                  value={JSON.stringify(config.body || {}, null, 2)}
                  onChange={(v) => {
                    try {
                      const parsed = JSON.parse(v || "{}");
                      handleChange('body', parsed);
                    } catch (e) {}
                  }}
                  theme="vs-dark"
                  options={{ 
                    minimap: { enabled: false }, 
                    fontSize: 12,
                    lineNumbers: "off",
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Timeout (seconds)</label>
              <input
                type="number"
                value={config.timeout || 30}
                onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-xs rounded-lg transition-all text-white"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNodeConfig = () => {
    if (node.type === 'http') {
      return renderHttpNodeConfig();
    }

    // For other node types, render standard config
    const fields = {
      start: [{ name: "description", label: "Description", type: "textarea" }],
      trigger: [{ name: "kind", label: "Trigger Type", type: "select", options: ["webhook", "schedule", "manual"] }],
      llm: [
        { name: "assistant_id", label: "Assistant ID", type: "text" },
        { name: "text", label: "Prompt Text", type: "textarea" },
        { name: "stream", label: "Stream Response", type: "checkbox" },
      ],
      transform: [
        { name: "template", label: "Jinja2 Template", type: "textarea" },
        { name: "variables", label: "Variables (JSON)", type: "json" },
      ],
      conditional: [{ name: "condition", label: "JMESPath Expression", type: "text", required: true }],
      wait: [{ name: "seconds", label: "Wait Duration (seconds)", type: "number" }],
      subflow: [
        { name: "flow_id", label: "Flow ID", type: "text" },
        { name: "mode", label: "Execution Mode", type: "select", options: ["sync", "async"] },
      ],
    };

    const nodeFields = fields[node.type] || [];

    return (
      <div className="space-y-3">
        {nodeFields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              {field.label}
              {field.required && <span className="text-red-400 text-sm">•</span>}
            </label>
            
            {field.type === "text" && (
              <input
                type="text"
                value={config[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-lg transition-all text-white placeholder-gray-400"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: config[field.name] ? 'left' : 'center',
                  outline: 'none'
                }}
                placeholder={field.label}
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                value={config[field.name] || ""}
                onChange={(e) => handleChange(field.name, parseInt(e.target.value))}
                className="w-full px-2 py-1 text-xs rounded-lg transition-all text-white"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              />
            )}

            {field.type === "select" && (
              <CustomSelectDropdown
                value={config[field.name] || field.options[0]}
                options={field.options}
                onChange={(value) => handleChange(field.name, value)}
              />
            )}

            {field.type === "checkbox" && (
              <label 
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={config[field.name] || false}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                  className="rounded accent-indigo-500"
                />
                <span className="text-sm text-gray-300">Enable</span>
              </label>
            )}

            {field.type === "textarea" && (
              <textarea
                value={config[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-lg transition-all resize-none font-mono text-white placeholder-gray-400"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
                rows={4}
                placeholder={field.label}
              />
            )}

            {field.type === "json" && (
              <div 
                className="rounded-lg overflow-hidden transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              >
                <Editor
                  height="110px"
                  defaultLanguage="json"
                  value={JSON.stringify(config[field.name] || {}, null, 2)}
                  onChange={(v) => {
                    try {
                      const parsed = JSON.parse(v || "{}");
                      handleChange(field.name, parsed);
                    } catch (e) {}
                  }}
                  theme="vs-dark"
                  options={{ 
                    minimap: { enabled: false }, 
                    fontSize: 12,
                    lineNumbers: "off",
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className="rounded-3xl flex flex-col shadow-2xl overflow-hidden config-panel h-full"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(60px)',
        WebkitBackdropFilter: 'blur(60px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        height: '100%'
      }}
    >
      {/* Header */}
      <div className="p-3 flex-shrink-0" style={{ gap: '12px' }}>
        {/* Header Title and Close */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-white" style={{
            background: 'linear-gradient(180deg, rgba(248, 248, 248, 1) 18%, rgba(146, 146, 146, 1) 82%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {node.data?.label || node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </h2>
          <button
            onClick={() => setSelection(null)}
            className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-6 pb-0">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-0 py-2 text-xs font-medium transition-all ${
              activeTab === 'config' 
                ? 'text-[#13F584] border-b-2 border-[#13F584]' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            style={{ height: '28px' }}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-0 py-2 text-xs font-medium transition-all ${
              activeTab === 'advanced' 
                ? 'text-[#13F584] border-b-2 border-[#13F584]' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            style={{ height: '28px' }}
          >
            Advance
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .config-panel-content::-webkit-scrollbar {
          width: 8px;
        }
        .config-panel-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .config-panel-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .config-panel-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .monaco-editor .monaco-scrollable-element > .scrollbar {
          display: none !important;
        }
        .monaco-editor .monaco-scrollable-element > .scrollbar > .slider {
          display: none !important;
        }
        .monaco-editor .overflow-guard {
          overflow: hidden !important;
        }
        .monaco-editor, .monaco-editor .monaco-editor-background {
          background: transparent !important;
        }
        .monaco-editor .margin {
          background: transparent !important;
        }
        .monaco-editor .monaco-scrollable-element {
          background: transparent !important;
        }
        .config-panel select option {
          background: rgba(26, 26, 26, 0.95) !important;
          color: #FFFFFF !important;
        }
        .config-panel select:focus option:checked {
          background: rgba(19, 245, 132, 0.2) !important;
        }
        .config-panel input::placeholder {
          color: rgba(156, 163, 175, 0.8) !important;
          opacity: 1 !important;
          text-align: center;
        }
        .config-panel input:not(:placeholder-shown) {
          text-align: left !important;
        }
        .config-panel input:focus,
        .config-panel textarea:focus,
        .config-panel select:focus {
          outline: none !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: none !important;
          ring: none !important;
        }
        .config-panel input,
        .config-panel textarea,
        .config-panel select {
          outline: none !important;
        }
        .config-panel input:focus-visible,
        .config-panel textarea:focus-visible,
        .config-panel select:focus-visible {
          outline: none !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: none !important;
          ring: none !important;
        }
        .config-panel input *,
        .config-panel textarea *,
        .config-panel select * {
          outline: none !important;
        }
        .config-panel [class*="ring"],
        .config-panel [class*="ring-blue"],
        .config-panel [class*="ring-indigo"] {
          --tw-ring-color: transparent !important;
          --tw-ring-shadow: 0 0 #0000 !important;
        }
        .config-panel input:focus,
        .config-panel input:focus-visible,
        .config-panel input:active,
        .config-panel textarea:focus,
        .config-panel textarea:focus-visible,
        .config-panel textarea:active,
        .config-panel select:focus,
        .config-panel select:focus-visible,
        .config-panel select:active {
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          outline: 2px solid transparent !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 0 transparent !important;
          --tw-ring-offset-shadow: 0 0 #0000 !important;
          --tw-ring-shadow: 0 0 #0000 !important;
          --tw-shadow: 0 0 #0000 !important;
          --tw-shadow-colored: 0 0 #0000 !important;
        }
      `}} />

      {/* Content - Scrollable */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 pb-20 config-panel-content" 
        style={{ 
          gap: '12px', 
          display: 'flex', 
          flexDirection: 'column', 
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
          msOverflowStyle: 'none',
          minHeight: 0,
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {activeTab === 'config' ? (
          <>
            {/* JSON Config Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="text-xs font-semibold" style={{ color: '#919EAB', fontSize: '12px', fontWeight: 600 }}>
                Paste config JSON
              </label>
              <div 
                className="rounded-lg overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <Editor
                  height="110px"
                  defaultLanguage="json"
                  value={JSON.stringify(config, null, 2)}
                  onChange={(v) => {
                    try {
                      const parsed = JSON.parse(v || "{}");
                      setConfig(parsed);
                      const updatedNodes = flow.nodes.map((n) =>
                        n.id === node.id ? { ...n, data: { ...n.data, config: parsed } } : n
                      );
                      setNodes(updatedNodes);
                    } catch (e) {}
                  }}
                  theme="vs-dark"
                  options={{ 
                    minimap: { enabled: false }, 
                    fontSize: 12,
                    lineNumbers: "off",
                    scrollBeyondLastLine: false,
                    scrollbar: {
                      vertical: 'hidden',
                      horizontal: 'hidden',
                      useShadows: false,
                      verticalHasArrows: false,
                      horizontalHasArrows: false,
                    },
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                  }}
                />
              </div>
            </div>

            {/* Node-specific configuration */}
            {renderNodeConfig()}

            {/* Conditional tester */}
            {node.type === "conditional" && (
              <div className="pt-2">
                <ConditionTester />
              </div>
            )}

            {/* Trigger-specific configuration */}
            {node.type === "trigger" && (
              <TriggerConfig node={node} assistantId={assistantId} />
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div 
              className="rounded-xl p-4 border backdrop-blur"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="text-[10px] font-semibold text-white mb-2 uppercase tracking-wide">Node ID</div>
              <div 
                className="text-xs font-mono text-white p-3 rounded-lg break-all select-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              >
                {node.id}
              </div>
            </div>
            
            <div 
              className="rounded-xl p-4 border backdrop-blur"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="text-[10px] font-semibold text-white mb-3 uppercase tracking-wide">Position</div>
              <div 
                className="text-xs text-white space-y-2 p-3 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              >
                <div className="flex justify-between">
                  <span>X:</span>
                  <span className="font-mono text-white">{node.position.x}</span>
                </div>
                <div className="flex justify-between">
                  <span>Y:</span>
                  <span className="font-mono text-white">{node.position.y}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                }}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-all flex items-center gap-1.5"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              >
                <Copy className="w-3 h-3" />
                Copy config
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="p-3 flex-shrink-0 flex items-center gap-2">
        <button
          onClick={handleDuplicate}
          className="px-3 py-1.5 text-xs font-semibold transition-all rounded-lg flex items-center justify-center gap-1.5"
          style={{
            background: 'rgba(142, 51, 255, 0.08)',
            color: '#C684FF',
            height: '28px',
            fontSize: '11px',
            lineHeight: '1.5em'
          }}
        >
          Duplicate
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-xs font-semibold transition-all rounded-lg flex items-center justify-center gap-1.5"
          style={{
            background: 'rgba(255, 86, 48, 0.08)',
            color: '#FFAC82',
            height: '28px',
            fontSize: '11px',
            lineHeight: '1.5em'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}