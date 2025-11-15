import React, { useEffect, useMemo, useState } from 'react';
import { X, Save, Plus, Trash2, Info } from 'lucide-react';
import { toolsService } from '../lib/toolsService';
import ToolVerifyPanel from './ToolVerifyPanel';
import { validateToolConfig } from '../lib/toolValidation';

const emptyTool = {
  id: '',
  name: '',
  description: '',
  is_enabled: false,
  method: 'GET',
  endpoint_url: '',
  headers: [], // [{key, value}]
  input_schema: { type: 'object', properties: {}, required: [] },
  output_schema: { type: 'object', properties: {} },
  is_verified: false, // Changed from verification: null
};

// Helper function to sanitize tool names for Gemini compatibility
const sanitizeToolName = (name) => {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

const INPUT_STYLES =
  'w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none transition-all';

const INPUT_STYLE_OBJ = {
  background: 'rgba(255, 255, 255, 0.04)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)'
};

const SectionLabel = ({ title }) => (
  <div className="w-full md:w-[150px] shrink-0 text-white/70">
    <h3 className="text-base font-semibold text-white">{title}</h3>
  </div>
);

const FieldLabel = ({ children }) => (
  <span className="text-[11px] font-semibold text-white/60">{children}</span>
);

const ToolEditor = ({ assistantId, tool = null, onCancel, onSaved }) => {
  const [form, setForm] = useState(emptyTool);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState('configure'); // 'configure' | 'verify'
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const loadExistingNames = async () => {
    try {
      const tools = await toolsService.listTools(assistantId);
      return tools.map(t => t.name).filter(n => n !== (tool?.name || ''));
    } catch (error) {
      console.error('Failed to load existing tool names:', error);
      return [];
    }
  };

  const [existingNames, setExistingNames] = useState([]);
  const validation = useMemo(() => validateToolConfig(form, existingNames), [form, existingNames]);

  useEffect(() => {
    const loadNames = async () => {
      const names = await loadExistingNames();
      setExistingNames(names);
    };
    loadNames();
  }, [assistantId, tool]);

  useEffect(() => {
    if (tool) {
      setForm({
        ...emptyTool,
        ...tool,
        headers: Array.isArray(tool.headers)
          ? tool.headers
          : Object.entries(tool.headers || {}).map(([key, value]) => ({ key, value })),
      });
    } else {
      setForm({ ...emptyTool, id: '' });
    }
    setHasAttemptedSubmit(false); // Reset validation state when tool changes
  }, [tool]);

  // --- NEW: keep schema text as editable strings so paste/typing won't be blocked ---
  const [inputSchemaText, setInputSchemaText] = useState(JSON.stringify(form.input_schema, null, 2));
  const [outputSchemaText, setOutputSchemaText] = useState(JSON.stringify(form.output_schema, null, 2));

  // When the underlying form schemas change (e.g., on load or after verification),
  // update the textareas to reflect the current schema objects.
  useEffect(() => {
    try {
      setInputSchemaText(JSON.stringify(form.input_schema, null, 2));
    } catch {
      setInputSchemaText('');
    }
  }, [form.input_schema]);

  useEffect(() => {
    try {
      setOutputSchemaText(JSON.stringify(form.output_schema, null, 2));
    } catch {
      setOutputSchemaText('');
    }
  }, [form.output_schema]);
  // --- END NEW ---

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const updateHeader = (idx, field, value) => {
    const next = [...form.headers];
    next[idx] = { ...next[idx], [field]: value };
    setForm(prev => ({ ...prev, headers: next }));
  };

  const addHeader = () => setForm(prev => ({ ...prev, headers: [...prev.headers, { key: '', value: '' }] }));
  const removeHeader = (idx) => setForm(prev => ({ ...prev, headers: prev.headers.filter((_, i) => i !== idx) }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    
    // Check validation before proceeding
    if (validation.errors.length > 0) {
      setSaving(false);
      return;
    }
    
    setSaving(true);
    try {
      const headersObj = form.headers.reduce((acc, h) => { if (h.key) acc[h.key] = h.value; return acc; }, {});

      // Parse schemas from textarea strings if possible; fall back to form's current objects
      let parsedInput = form.input_schema;
      try {
        parsedInput = JSON.parse(inputSchemaText);
      } catch (err) {
        // keep existing form.input_schema if parse fails
      }
      let parsedOutput = form.output_schema;
      try {
        parsedOutput = JSON.parse(outputSchemaText);
      } catch (err) {
        // keep existing form.output_schema if parse fails
      }

      const payload = {
        ...form,
        headers: headersObj,
        input_schema: parsedInput,
        output_schema: parsedOutput
      };

      // Sanitize tool name for Gemini compatibility
      payload.name = sanitizeToolName(payload.name);

      // Force disabled until verified
      if (!payload.is_verified) {
        payload.is_enabled = false;
      }

      // Log payload to verify all fields are included
      console.log('💾 Saving tool with payload:', {
        name: payload.name,
        description: payload.description,
        method: payload.method,
        endpoint_url: payload.endpoint_url,
        headers: payload.headers,
        is_enabled: payload.is_enabled,
        input_schema: payload.input_schema,
        output_schema: payload.output_schema,
        is_verified: payload.is_verified
      });

      let savedTool;
      if (tool?.id) {
        savedTool = await toolsService.updateTool(assistantId, tool.id, payload);
      } else {
        savedTool = await toolsService.createTool(assistantId, payload);
      }

      onSaved(savedTool);
    } catch (e) {
      console.error(e);
      alert('Failed to save tool');
    } finally {
      setSaving(false);
    }
  };

  const onVerified = (updated) => {
    // Ensure headers are in the correct format for the form
    const updatedWithCorrectHeaders = {
      ...updated,
      headers: Array.isArray(updated.headers)
        ? updated.headers
        : Object.entries(updated.headers || {}).map(([key, value]) => ({ key, value }))
    };
    setForm(updatedWithCorrectHeaders);

    // Show success message
    if (updated.is_verified) {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }

    // Switch back to configure step
    setStep('configure');

    // Trigger parent reload if callback exists
    if (onSaved) {
      onSaved(updated);
    }
  };

  const canEnable = form.is_verified;

  return (
    <div
      className="relative w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}
    >
      <div className="relative z-10 p-5 space-y-4">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-lg flex items-center animate-fade-in-up">
          <div className="w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center mr-2">
            <span className="text-[#141A21] text-[10px] font-bold">✓</span>
          </div>
          <div className="text-emerald-300 text-sm">
            <span className="font-medium">Tool verified successfully!</span>
            <span className="text-xs ml-2">You can now enable it in the Configure step.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-base font-semibold text-white">{tool ? 'Edit Tool' : 'Create New Tool'}</h2>
        <button
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 pb-2">
        <button
          className={`pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
            step === 'configure' ? 'text-white border-b-2 border-emerald-300' : 'text-white/50'
          }`}
          onClick={() => setStep('configure')}
        >
          Configuration
        </button>
        <button
          className={`pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
            step === 'verify' ? 'text-white border-b-2 border-emerald-300' : 'text-white/50'
          }`}
          onClick={() => setStep('verify')}
        >
          Verify
        </button>
      </div>

      {step === 'configure' ? (
        <form onSubmit={onSubmit} className="space-y-3 pt-4">
          {/* Section: Basics */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <SectionLabel title="Basic Information" />
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <FieldLabel required>Tool Name</FieldLabel>
                <div className="relative">
                  <input
                    className={INPUT_STYLES}
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    required
                    placeholder="e.g., add product"
                    disabled={!!tool?.id}
                    style={INPUT_STYLE_OBJ}
                  />
                  {form.name && (
                    <div className="mt-2 flex items-start gap-2 text-[11px] text-white/60">
                      <Info size={14} className="mt-0.5" />
                      <span>
                        Tool name will be stored as{' '}
                        <code className="bg-white/5 px-1 py-0.5 rounded text-emerald-300">{sanitizeToolName(form.name)}</code>
                      </span>
                    </div>
                  )}
                  {hasAttemptedSubmit && validation.errors.length > 0 && (
                    <div className="mt-1.5 text-[11px] text-red-400">{validation.errors[0]}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel>Description</FieldLabel>
                <textarea
                  className={`${INPUT_STYLES} resize-none`}
                  rows={3}
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder="Describe what this tool does..."
                  style={INPUT_STYLE_OBJ}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel required>Status</FieldLabel>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!canEnable}
                    onClick={() => update('is_enabled', !form.is_enabled)}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full border transition-colors ${
                      form.is_enabled ? 'bg-emerald-500/30 border-emerald-400/50' : 'bg-white/5 border-white/15'
                    } ${canEnable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <div className="text-[13px] text-white/70">
                    {form.is_enabled ? 'Enabled' : 'Disabled'}
                    {!canEnable && <div className="text-[11px] text-white/40">Tool activates after verification.</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: HTTP Configuration */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <SectionLabel title="HTTP Configuration" />
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <FieldLabel required>Method</FieldLabel>
                <div className="relative">
                  <select
                    className={`${INPUT_STYLES} appearance-none pr-10`}
                    value={form.method}
                    onChange={e => update('method', e.target.value)}
                    required
                    style={INPUT_STYLE_OBJ}
                  >
                    <option value="GET" className="bg-[#141A21]">GET</option>
                    <option value="POST" className="bg-[#141A21]">POST</option>
                    <option value="PUT" className="bg-[#141A21]">PUT</option>
                    <option value="DELETE" className="bg-[#141A21]">DELETE</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/50">▾</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>Endpoint URL</FieldLabel>
                <input
                  className={INPUT_STYLES}
                  value={form.endpoint_url}
                  onChange={e => update('endpoint_url', e.target.value)}
                  required
                  placeholder="https://api.example.com/endpoint"
                  disabled={!!tool?.id}
                  style={INPUT_STYLE_OBJ}
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-12 items-center rounded-full border transition-colors ${
                      form.headers.length > 0 ? 'bg-emerald-500/30 border-emerald-400/50' : 'bg-white/5 border-white/15'
                    }`}
                    onClick={() => {
                      if (form.headers.length === 0) {
                        addHeader();
                      } else {
                        setForm(prev => ({ ...prev, headers: [] }));
                      }
                    }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.headers.length > 0 ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <p className="text-sm text-white/70">Headers</p>
                  <button
                    type="button"
                    onClick={addHeader}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
                  >
                    <Plus size={14} />
                    Add Header
                  </button>
                </div>

                {form.headers.map((h, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <input
                      className={INPUT_STYLES}
                      placeholder="Key"
                      value={h.key}
                      onChange={e => updateHeader(idx, 'key', e.target.value)}
                      style={INPUT_STYLE_OBJ}
                    />
                    <div className="flex gap-3">
                      <input
                        className={`${INPUT_STYLES} flex-1`}
                        placeholder="Value"
                        value={h.value}
                        onChange={e => updateHeader(idx, 'value', e.target.value)}
                        style={INPUT_STYLE_OBJ}
                      />
                      <button
                        type="button"
                        onClick={() => removeHeader(idx)}
                        className="h-11 w-11 rounded-2xl border border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 flex items-center justify-center transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: JSON Schemas */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <SectionLabel title="JSON Schemas" />
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <FieldLabel required>Input Schema</FieldLabel>
                <textarea
                  className={`${INPUT_STYLES} font-mono text-xs resize-none`}
                  rows={6}
                  value={inputSchemaText}
                  onChange={e => {
                    setInputSchemaText(e.target.value);
                    try {
                      update('input_schema', JSON.parse(e.target.value));
                    } catch {
                      /* ignore */
                    }
                  }}
                  placeholder='{"type": "object", "properties": {}}'
                  style={INPUT_STYLE_OBJ}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel required>Output Schema</FieldLabel>
                <textarea
                  className={`${INPUT_STYLES} font-mono text-xs resize-none`}
                  rows={6}
                  value={outputSchemaText}
                  onChange={e => {
                    setOutputSchemaText(e.target.value);
                    try {
                      update('output_schema', JSON.parse(e.target.value));
                    } catch {
                      /* ignore */
                    }
                  }}
                  placeholder='{"type": "object", "properties": {}}'
                  style={INPUT_STYLE_OBJ}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 border-t border-white/10">
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-2xl border border-white/15 text-white/40 bg-white/5 cursor-not-allowed text-sm font-semibold tracking-wide"
            >
              Go to Verify
            </button>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-2 rounded-2xl border border-red-400/40 text-red-200 bg-red-500/10 hover:bg-red-500/20 transition text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-2xl border border-emerald-300/40 bg-emerald-400/20 text-white font-semibold hover:bg-emerald-400/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-[13px]"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {tool ? 'Save Changes' : 'Create Tool'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <ToolVerifyPanel
          assistantId={assistantId}
          tool={{
            ...form,
            headers: Array.isArray(form.headers)
              ? form.headers.reduce((acc, h) => { if (h.key) acc[h.key] = h.value; return acc; }, {})
              : form.headers || {}
          }}
          onVerified={onVerified}
        />
      )}
      </div>
    </div>
  );
};

export default ToolEditor;
