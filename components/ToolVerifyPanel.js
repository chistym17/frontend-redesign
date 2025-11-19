import React, { useMemo, useState, useEffect } from 'react';
import { Play, AlertTriangle } from 'lucide-react';
import { useApiService } from '../lib/apiService'; // Use authenticated API service
import { validateToolConfig } from '../lib/toolValidation';

const INPUT_STYLES =
  'w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none transition-all';

const INPUT_STYLE_OBJ = {
  background: 'rgba(255, 255, 255, 0.04)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const INPUT_STYLE_RED_OBJ = {
  ...INPUT_STYLE_OBJ,
  color: 'rgb(255, 86, 48)', // Tailwind red-400
};

const INPUT_STYLE_Orange_OBJ = {
  ...INPUT_STYLE_OBJ,
  color: 'rgba(255, 171, 0, 0.48)', // Tailwind red-400
};



const SectionLabel = ({ title }) => (
  <div className="w-full md:w-[150px] shrink-0 text-white/70">
    <h3 className="text-base font-semibold text-white">{title}</h3>
  </div>
);

const FieldLabel = ({ children }) => (
  <span className="text-[11px] font-semibold text-white/60">{children}</span>
);

const ToolVerifyPanel = ({ assistantId, tool, onVerified }) => {
  const [body, setBody] = useState('{}');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Use authenticated API service instead of toolsService
  const apiService = useApiService();

  const loadExistingNames = async () => {
    try {
      const tools = await apiService.listTools(assistantId);
      return tools.map(t => t.name).filter(n => n !== tool.name);
    } catch (error) {
      console.error('Failed to load existing tool names:', error);
      return [];
    }
  };

  const [existingNames, setExistingNames] = useState([]);
  const validation = useMemo(() => validateToolConfig(tool, existingNames), [tool, existingNames]);

  useEffect(() => {
    const loadNames = async () => {
      const names = await loadExistingNames();
      setExistingNames(names);
    };
    loadNames();
  }, [assistantId, tool.name]);

  const runTest = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      let init = { method: tool.method, headers: tool.headers || {} };
      if (tool.method !== 'GET' && body && body.trim()) {
        init.body = body;
        if (!init.headers['Content-Type']) init.headers['Content-Type'] = 'application/json';
      }
      const start = performance.now();
      const res = await fetch(tool.endpoint_url, init);
      const duration = Math.round(performance.now() - start);
      const contentType = res.headers.get('content-type') || '';
      let json = null, text = null;
      if (contentType.includes('application/json')) {
        try { json = await res.json(); } catch { }
      } else {
        try { text = await res.text(); } catch { }
      }
      setResult({ status: res.status, ok: res.ok, duration, contentType, json, text });
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  };

  const passed = validation.ok && result && result.ok && (!tool.output_schema || (result.json && typeof result.json === 'object'));

  const saveVerification = async () => {
    setSaving(true);
    try {
      const updated = {
        ...tool,
        is_verified: passed,
      };

      if (tool.id) {
        await apiService.updateTool(assistantId, tool.id, updated);
      }

      onVerified?.(updated);
    } catch (error) {
      console.error('Failed to save verification:', error);
      alert('Failed to save verification result');
    } finally {
      setSaving(false);
    }
  };

  // Format verification checks text
  const verificationChecksText = useMemo(() => {
    const checks = [];
    checks.push(`Config & schema basics (${validation.errors.length === 0 ? 'ok' : 'issues'})`);
    checks.push(`Live call succeeded (2xx)`);
    checks.push(`Response JSON (when output schema provided)`);

    if (validation.errors.length > 0) {
      validation.errors.forEach(err => {
        checks.push(`• ${err}`);
      });
    }

    return checks.join('\n');
  }, [validation]);

  return (
    <div className="space-y-4 pt-4">
      {/* Test Tool Section */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <SectionLabel title="Test Tool" />
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <FieldLabel>Body (JSON)</FieldLabel>
            <textarea
              className={`${INPUT_STYLES} font-mono text-xs resize-none placeholder-orange-custom`}
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              style={INPUT_STYLE_Orange_OBJ} // this keeps typed text orange too
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={running}
              onClick={runTest}
              className="px-6 py-2.5 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors rounded-lg"
            >
              {running ? (
                <>
                  <div className="h-4 w-4 border-2 border-emerald-200 border-t-transparent rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
              
                  Run
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="text-[11px] text-red-400 flex items-center gap-2">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Test Results Section */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <SectionLabel title="Test Results" />
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <FieldLabel>Response</FieldLabel>
            <textarea
              className={`${INPUT_STYLES} font-mono text-xs resize-none`}
              rows={4}
              value={result ? (result.json ? JSON.stringify(result.json, null, 2) : (result.text || '')) : 'Run a test to see the response here.'}
              readOnly
              placeholder="Run a test to see the response here."
              style={INPUT_STYLE_OBJ}
            />
          </div>
        </div>
      </div>

      {/* Verification Checks Section */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <SectionLabel title="Verification Checks" />
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <FieldLabel>Checks</FieldLabel>
            <textarea
              className={`${INPUT_STYLES} font-mono text-xs resize-none text-red-400`}
              rows={6}
              value={verificationChecksText}
              readOnly
              style={INPUT_STYLE_RED_OBJ}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center pt-4  border-white/10">
        <button
          onClick={saveVerification}
          disabled={saving}
          className="px-6 py-2.5 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors rounded-lg"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-emerald-200 border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            'Save Verification Result'
          )}
        </button>
      </div>
    </div>
  );
};

export default ToolVerifyPanel;