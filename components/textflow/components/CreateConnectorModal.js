// components/textflow/components/CreateConnectorModal.js
import React, { useState, useEffect, useRef } from "react";
import { X, AlertCircle, Check, ChevronDown } from "lucide-react";
import Editor from "@monaco-editor/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://176.9.16.194:5403/api';

async function readError(response) {
  try {
    const text = await response.text();
    const json = JSON.parse(text);
    return json.error || json.message || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

export default function CreateConnectorModal({ 
  isOpen, 
  onClose, 
  assistantId,
  onSuccess 
}) {
  const [mode, setMode] = useState('trace'); // 'trace', 'openapi'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    tags: '',
    trace_data: null,
    openapi_spec: null
  });

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'communication', label: 'Communication' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'database', label: 'Database' },
    { value: 'crm', label: 'CRM' },
    { value: 'analytics', label: 'Analytics' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [traceJson, setTraceJson] = useState('{\n  "requests": []\n}');
  const [openapiJson, setOpenapiJson] = useState('{\n  "openapi": "3.0.0"\n}');
  const [makePublic, setMakePublic] = useState(false); // default private

  const handleSubmit = async () => {
    setError('');
    if (!formData.name.trim()) {
      setError('Connector name is required');
      return;
    }

    try {
      setLoading(true);
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      let endpoint = '';
      let payload = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        tags
      };

      if (mode === 'trace') {
        endpoint = `${API_BASE}/textflow/connectors/build/trace?owner_id=${assistantId}`;
        payload.trace_data = JSON.parse(traceJson);
      } else {
        endpoint = `${API_BASE}/textflow/connectors/build/openapi?owner_id=${assistantId}`;
        payload.openapi_spec = JSON.parse(openapiJson);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(await readError(response));

      const result = await response.json();

      if (makePublic && result?.connector_id) {
        try {
          const pubRes = await fetch(
            `${API_BASE}/textflow/connectors/${result.connector_id}?owner_id=${assistantId}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_public: true, change_summary: 'Publishing on create' })
            }
          );
          if (!pubRes.ok) console.warn('Publish failed:', await readError(pubRes));
        } catch (_) {}
      }

      if (onSuccess) {
        onSuccess(result);
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'general',
        tags: '',
        trace_data: null,
        openapi_spec: null
      });
      setTraceJson('{\n  "requests": []\n}');
      setOpenapiJson('{\n  "openapi": "3.0.0"\n}');
      setMakePublic(false);
      setMode('trace');

      onClose();
    } catch (err) {
      setError(err.message);
      console.error('Failed to create connector:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setFormData({
      name: '',
      description: '',
      category: 'general',
      tags: '',
      trace_data: null,
      openapi_spec: null
    });
    setTraceJson('{\n  "requests": []\n}');
    setOpenapiJson('{\n  "openapi": "3.0.0"\n}');
    setMakePublic(false);
    setMode('trace');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-auto shadow-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3 p-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 
              className="text-white"
              style={{
                fontFamily: 'Public Sans, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '1.5em'
              }}
            >
              Create New Connector
            </h3>
            <button
              onClick={handleClose}
              className="w-5 h-5 flex items-center justify-center transition-colors hover:opacity-70"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-2.5 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs text-red-300">{error}</span>
              </div>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Tabs */}
          <div 
            className="flex items-center gap-6 border-b"
            style={{
              borderBottomColor: 'rgba(255, 255, 255, 0.15)',
              borderBottomWidth: '1px'
            }}
          >
            <button
              onClick={() => setMode('trace')}
              className={`px-0 py-2 transition-all uppercase focus:outline-none ${
                mode === 'trace' 
                  ? 'text-[#13F584] border-b-2 border-[#13F584]' 
                  : 'text-[#919EAB] hover:text-gray-300'
              }`}
              style={{ 
                height: '32px', 
                fontWeight: mode === 'trace' ? 500 : 400,
                fontFamily: 'Public Sans, sans-serif',
                fontSize: '12px'
              }}
            >
              From Trace
            </button>
            <button
              onClick={() => setMode('openapi')}
              className={`px-0 py-2 transition-all uppercase focus:outline-none ${
                mode === 'openapi' 
                  ? 'text-[#13F584] border-b-2 border-[#13F584]' 
                  : 'text-[#919EAB] hover:text-gray-300'
              }`}
              style={{ 
                height: '32px', 
                fontWeight: mode === 'openapi' ? 500 : 400,
                fontFamily: 'Public Sans, sans-serif',
                fontSize: '12px'
              }}
            >
              From OpenAPI
            </button>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-3">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <label 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 500,
                  fontSize: '10px',
                  lineHeight: '1em',
                  color: '#919EAB'
                }}
              >
                Connector Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Slack API"
                className="w-full rounded-lg text-white focus:outline-none"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '1.4666666666666666em',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0px 8px',
                  height: '36px'
                }}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 500,
                  fontSize: '10px',
                  lineHeight: '1em',
                  color: '#919EAB'
                }}
              >
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Send messages to Slack channels"
                rows={2}
                className="w-full rounded-lg text-white resize-none focus:outline-none"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '1.4666666666666666em',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '10px 8px',
                  color: '#919EAB'
                }}
              />
            </div>

            {/* Category */}
            <div ref={categoryRef} className="flex flex-col gap-2 relative">
              <label 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 500,
                  fontSize: '10px',
                  lineHeight: '1em',
                  color: '#919EAB'
                }}
              >
                Category
              </label>
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="w-full rounded-lg text-white focus:outline-none text-left flex items-center justify-between pr-8"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '1.4666666666666666em',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0px 8px',
                  height: '36px'
                }}
              >
                <span>{categories.find(c => c.value === formData.category)?.label || 'General'}</span>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
              </button>
              {categoryDropdownOpen && (
                <div
                  className="absolute z-50 w-full mt-10 rounded-lg shadow-lg overflow-hidden"
                  style={{
                    background: 'rgba(20, 25, 35, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                >
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => {
                        setFormData({...formData, category: category.value});
                        setCategoryDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left transition-colors focus:outline-none"
                      style={{
                        fontFamily: 'Public Sans, sans-serif',
                        fontSize: '12px',
                        background: formData.category === category.value 
                          ? 'rgba(19, 245, 132, 0.2)' 
                          : 'transparent',
                        color: formData.category === category.value ? '#9EFBCD' : '#FFFFFF'
                      }}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 500,
                  fontSize: '10px',
                  lineHeight: '1em',
                  color: '#919EAB'
                }}
              >
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="slack, messaging, api"
                className="w-full rounded-lg text-white focus:outline-none"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '1.4666666666666666em',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0px 8px',
                  height: '36px'
                }}
              />
              <p
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '10px',
                  lineHeight: '1.5em',
                  color: '#919EAB',
                  paddingTop: '0px'
                }}
              >
                Comma Separated
              </p>
            </div>

            {/* Trace/OpenAPI Input */}
            <div className="flex flex-col gap-2">
              <label 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 500,
                  fontSize: '10px',
                  lineHeight: '1em',
                  color: '#919EAB'
                }}
              >
                {mode === 'trace' ? 'API Trace JSON *' : 'OpenAPI Spec JSON *'}
              </label>
              <div 
                className="rounded-lg overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px'
                }}
              >
                <Editor
                  height="140px"
                  defaultLanguage="json"
                  value={mode === 'trace' ? traceJson : openapiJson}
                  onChange={(v) => {
                    if (mode === 'trace') {
                      setTraceJson(v || '{}');
                    } else {
                      setOpenapiJson(v || '{}');
                    }
                  }}
                  theme="vs-dark"
                  options={{ 
                    minimap: { enabled: false }, 
                    fontSize: 11,
                    fontWeight: '400',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineHeight: 16
                  }}
                />
              </div>
              <p
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '10px',
                  lineHeight: '1.5em',
                  color: '#919EAB',
                  paddingTop: '0px'
                }}
              >
                {mode === 'trace' 
                  ? 'Paste captured API requests with responses. Use browser dev tools or recording extension.'
                  : 'Paste OpenAPI 3.0 specification JSON.'
                }
              </p>
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-2">
              <input
                id="makePublic"
                type="checkbox"
                checked={makePublic}
                onChange={(e) => setMakePublic(e.target.checked)}
                className="rounded text-indigo-500 focus:ring-indigo-500"
                style={{ width: '18px', height: '18px' }}
              />
              <label 
                htmlFor="makePublic" 
                className="text-white cursor-pointer"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '1.5em'
                }}
              >
                Make public (show in Discover so others can find & use it)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end items-center gap-2.5 pt-2">
            <button
              onClick={handleClose}
              className="rounded-lg transition-all focus:outline-none"
              style={{
                background: 'rgba(255, 86, 48, 0.08)',
                color: '#FFAC82',
                height: '32px',
                padding: '0px 8px',
                fontFamily: 'Public Sans, sans-serif',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '1.5em'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name.trim()}
              className="rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
              style={{
                background: 'rgba(19, 245, 132, 0.08)',
                color: '#9EFBCD',
                height: '32px',
                padding: '0px 8px',
                fontFamily: 'Public Sans, sans-serif',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '1.5em'
              }}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

