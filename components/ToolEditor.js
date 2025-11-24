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
  'w-full rounded-lg px-3.5 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/30 transition-all backdrop-blur';
const INPUT_STYLE_OBJ = {
  width: "100%",                      // w-full
  borderRadius: "0.5rem",             // rounded-lg
  background: "rgba(255, 255, 255, 0)", // bg-white/0
  padding: "0.625rem 0.875rem",       // py-2.5 px-3.5
  color: "white",                     // text-white
  backdropFilter: "blur(8px)",        // backdrop-blur
  WebkitBackdropFilter: "blur(8px)",
  transition: "all 150ms ease",       // transition-all
  border: "1px solid transparent",    // Tailwind adds a base border for focus to work
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

const FieldBlock = ({ label, isRequired = false, children }) => (
  <label className="block space-y-2 text-white/80 text-sm">
    <span className="flex items-center gap-0 text-xs tracking-[0.2em] text-white/50">
      {label}
      {isRequired && <span className="text-red-400">*</span>}
    </span>
    {children}
  </label>
);

const ToolEditor = ({ assistantId, tool = null, onCancel, onSaved, isOpen }) => {
  const [form, setForm] = useState(emptyTool);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState('configure'); // 'configure' | 'verify'
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false); // <-- Add this
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - Updated to match Figma */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        style={{ WebkitBackdropFilter: "blur(16px)" }}
      />

      {/* Modal */}
      <div
          className="relative w-full max-w-[900px] max-h-[95vh] flex flex-col p-4 gap-4 isolate rounded-3xl overflow-y-auto overflow-x-hidden custom-scrollbar"
          style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(80, 80, 80, 0.24)",
          borderRadius: "24px",
        }}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="relative z-10 p-5 space-y-4 overflow-y-auto custom-scrollbar">
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
        <div className="flex items-start justify-between   border-white/10 relative">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {tool ? 'Edit Tool' : 'Create New Tool'}
            </h2>
            <p className="text-sm text-white/60 mt-1">
              {tool 
              ? "Update your tool configuration and settings"
              : "Create a new tool and configure its settings"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition"
          >
            ×
          </button>
        </div>
          

          {/* Tabs */}
          <div className="flex items-center gap-4  border-b border-white/20">
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
            <form onSubmit={onSubmit} className="space-y-4 pt-4">
              {/* Section: Basics */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                <SectionLabel title="HTTP Configuration" />
                <div className="flex-1 space-y-4">
                  <FieldBlock label="Tool Name" isRequired>
                  <div className="space-y-2">
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
                    </FieldBlock>
                            
                
                  
                  <FieldBlock label="Header (JSON)" isRequired>
                  <div className="space-y-2">
                    <textarea
                      className={`${INPUT_STYLES} font-mono text-xs resize-none`}
                      rows={4}
                      value={JSON.stringify(
                        form.headers.reduce((acc, h) => {
                          if (h.key) acc[h.key] = h.value;
                          return acc;
                        }, {}),
                        null,
                        2
                      )}
                      onChange={e => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          const headersArray = Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
                          setForm(prev => ({ ...prev, headers: headersArray }));
                        } catch {
                          /* ignore */
                        }
                      }}
                      placeholder='{"Content-Type": "application/json"}'
                      style={INPUT_STYLE_Orange_OBJ}
                    />
                  </div>
                  </FieldBlock>


                    <FieldBlock label="Status">
                  <div className="space-y-2">
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
                  </FieldBlock>
                </div>
              </div>

              {/* Section: HTTP Configuration */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                <SectionLabel title="HTTP Configuration" />
                <div className="flex-1 space-y-4">
                  <FieldBlock label="Method" isRequired>
                 <div className="space-y-1.5">
                    <div className="relative w-full mt-2">
                      {/* Dropdown header */}
                      <div
                        onClick={() => setMethodDropdownOpen(!methodDropdownOpen)}
                        className="flex px-3.5 py-2.5 justify-between items-center p-2 bg-white/0 rounded-lg text-white text-sm cursor-pointer backdrop-blur-md transition hover:bg-white/20"
                        
                      >
                        {form.method || "Select Method"}
                        <span className="ml-2 text-xs opacity-70">▼</span>
                      </div>

                      {/* Dropdown menu */}
                      {methodDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-black/80 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-scroll">
                          <style>{`
                            div::-webkit-scrollbar {
                              display: none;
                            }
                          `}</style>

                          {/* Option to clear selection */}
                          <div
                            onClick={() => {
                              update('method', '');
                              setMethodDropdownOpen(false);
                            }}
                            className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                          >
                            Select Method
                          </div>

                          {/* Options */}
                          {['GET', 'POST', 'PUT', 'DELETE'].map((method) => (
                            <div
                              key={method}
                              onClick={() => {
                                update('method', method);
                                setMethodDropdownOpen(false);
                              }}
                              className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                            >
                              {method}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  </FieldBlock>

                  <FieldBlock label="Endpoint URL" isRequired>
                  <div className="space-y-1.5">
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
                  </FieldBlock>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Left side: toggle + label */}
                      <div className="flex items-center gap-3">
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
                        <p className="text-sm  text-white/70">Headers</p>
                      </div>

                      {/* Right side: Add Header button */}
                      <button
                        type="button"
                        onClick={addHeader}
                        className="w-[132px] h-[36px] px-3 py-0 flex items-center justify-center gap-2 
                                    text-[#9EFBCD] bg-[rgba(19,245,132,0.08)] rounded-lg font-bold text-sm"
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

                <FieldBlock label="Input Schema" isRequired>
                  <div className="space-y-2">
                   
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
                      style={INPUT_STYLE_Orange_OBJ}
                    />
                  </div>
                  </FieldBlock>

                  <FieldBlock label="Output Schema" isRequired>
                  <div className="space-y-2">
                 
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
                      style={INPUT_STYLE_Orange_OBJ}
                    />
                  </div>
                    </FieldBlock>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6  border-white/10">
                <button
                  type="button"
                  disabled
                  className="flex justify-center items-center px-[12px] py-0 gap-[8px] w-[103px] min-w-[64px] h-[36px] rounded-[8px] text-[14px] font-bold leading-[24px] text-center text-[rgba(145,158,171,0.8)] cursor-not-allowed"
                  style={{ backgroundColor: "rgba(145, 158, 171, 0.2)" }}
                >
                  Go to Verify
                </button>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={onCancel}
                     className="w-[71px] h-[36px] px-3 py-0 flex items-center justify-center gap-2 
                                    text-[#FFAC82] bg-[rgba(255,86,48,0.08)] rounded-lg font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                     className="w-[100px] h-[36px] px-3 py-0 flex items-center justify-center gap-2 
                                    text-[#9EFBCD] bg-[rgba(19,245,132,0.08)] rounded-lg font-bold text-sm"
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                       
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
      {/* Custom Scrollbar */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.12);
            border-radius: 3px;
          }
            /* in your CSS file or a <style> block */
          .placeholder-orange-custom::placeholder {
            color: rgba(255, 171, 0, 0.48);
          }

        `}</style>
    </div>
  );
};

export default ToolEditor;
