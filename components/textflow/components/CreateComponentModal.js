// components/textflow/components/CreateComponentModal.js
import React, { useState } from "react";
import { Plus, X, AlertCircle, Check, ChevronDown } from "lucide-react";
import Editor from "@monaco-editor/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://176.9.16.194:5403/api';

export default function CreateComponentModal({ 
  isOpen, 
  onClose, 
  assistantId, 
  nodeType = "http",
  onSuccess 
}) {
  const [newComponent, setNewComponent] = useState({
    name: "",
    description: "",
    node_type: nodeType || "http",
    category: "",
    tags: [],
    config: {},
    is_public: false
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const nodeTypes = ["http", "llm", "transform", "conditional", "trigger"];

  const handleCreateComponent = async () => {
    if (!newComponent.name.trim()) {
      setError("Component name is required");
      return;
    }

    // CRITICAL FIX: Validate config before sending
    let configToSave = newComponent.config;
    try {
      if (typeof configToSave === 'string') {
        configToSave = JSON.parse(configToSave);
      }
      if (!configToSave || typeof configToSave !== 'object') {
        configToSave = {};
      }
    } catch (e) {
      setError("Invalid JSON in configuration");
      return;
    }

    try {
      const urlString = `${API_BASE}/templates/component/create?assistant_id=${encodeURIComponent(assistantId)}`;
      
      const response = await fetch(urlString, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newComponent,
          config: configToSave
        })
      });

      if (!response.ok) throw new Error("Failed to create component");

      const data = await response.json();
      
      // Show warning if credentials were sanitized
      if (data.sanitized) {
        setSuccess("Component created! (Credentials removed from public component)");
      } else {
        setSuccess("Component created successfully!");
      }
      
      // Reset form
      setNewComponent({
        name: "",
        description: "",
        node_type: nodeType || "http",
        category: "",
        tags: [],
        config: {},
        is_public: false
      });
      
      // Call success callback to refresh component list
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClose = () => {
    setError("");
    setSuccess("");
    setNewComponent({
      name: "",
      description: "",
      node_type: nodeType || "http",
      category: "",
      tags: [],
      config: {},
      is_public: false
    });
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
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: '1.5em'
              }}
            >
              Create New Component
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

          {/* Success Message */}
          {success && (
            <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-2.5 flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-emerald-300">{success}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="flex flex-col gap-3">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <label 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: '11px',
                  lineHeight: '1em',
                  color: '#919EAB'
                }}
              >
                Component Name *
              </label>
              <input
                type="text"
                value={newComponent.name}
                onChange={(e) => setNewComponent({...newComponent, name: e.target.value})}
                placeholder="Discord"
                className="w-full rounded-lg text-white focus:outline-none"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '13px',
                  lineHeight: '1.4666666666666666em',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0px 10px',
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
                  fontWeight: 600,
                  fontSize: '11px',
                  lineHeight: '1em',
                  color: '#919EAB'
                }}
              >
                Description
              </label>
              <textarea
                value={newComponent.description}
                onChange={(e) => setNewComponent({...newComponent, description: e.target.value})}
                placeholder="ex:"
                rows={2}
                className="w-full rounded-lg text-white resize-none focus:outline-none"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '13px',
                  lineHeight: '1.4666666666666666em',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '12px 10px',
                  color: '#919EAB'
                }}
              />
            </div>

            {/* Node Type */}
            <div className="flex flex-col gap-2">
              <label 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: '11px',
                  lineHeight: '1em',
                  color: '#919EAB'
                }}
              >
                Node Type *
              </label>
              <div className="relative">
                <select
                  value={newComponent.node_type}
                  onChange={(e) => setNewComponent({...newComponent, node_type: e.target.value})}
                  className="w-full rounded-lg text-white appearance-none focus:outline-none pr-8"
                  style={{
                    fontFamily: 'Public Sans, sans-serif',
                    fontWeight: 400,
                    fontSize: '13px',
                    lineHeight: '1.4666666666666666em',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '0px 10px',
                    height: '36px'
                  }}
                >
                  {nodeTypes.map(type => (
                    <option key={type} value={type} style={{ background: 'rgba(20, 25, 35, 1)', color: '#FFFFFF' }}>
                      {type.toUpperCase()}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <label 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: '11px',
                  lineHeight: '1em',
                  color: '#919EAB'
                }}
              >
                Category
              </label>
              <input
                type="text"
                value={newComponent.category}
                onChange={(e) => setNewComponent({...newComponent, category: e.target.value})}
                placeholder="ex: AI"
                className="w-full rounded-lg text-white focus:outline-none"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '13px',
                  lineHeight: '1.4666666666666666em',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(145, 158, 171, 0.2)',
                  borderRadius: '8px',
                  padding: '0px 10px',
                  height: '36px',
                  color: '#919EAB'
                }}
              />
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: '11px',
                  lineHeight: '1em',
                  color: '#919EAB'
                }}
              >
                Tags
              </label>
              <input
                type="text"
                value={
                  Array.isArray(newComponent.tags) 
                    ? newComponent.tags.join(", ") 
                    : (typeof newComponent.tags === 'string' ? newComponent.tags : "")
                }
                onChange={(e) => {
                  const value = e.target.value || "";
                  const tagsArray = value.split(",").map(t => t.trim()).filter(Boolean);
                  setNewComponent({
                    ...newComponent, 
                    tags: tagsArray
                  });
                }}
                placeholder="ex: AI"
                className="w-full rounded-lg text-white focus:outline-none"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '13px',
                  lineHeight: '1.4666666666666666em',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(145, 158, 171, 0.2)',
                  borderRadius: '8px',
                  padding: '0px 10px',
                  height: '36px',
                  color: '#919EAB'
                }}
              />
              <p 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '11px',
                  lineHeight: '1.5em',
                  color: '#919EAB',
                  paddingTop: '6px'
                }}
              >
                Comma Separated
              </p>
            </div>

            {/* Configuration JSON */}
            <div className="flex flex-col gap-2">
              <label 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: '11px',
                  lineHeight: '1em',
                  color: '#919EAB'
                }}
              >
                Config (JSON)
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
                  value={JSON.stringify(newComponent.config || {}, null, 2)}
                  onChange={(v) => {
                    try {
                      const valueToUse = (v === undefined || v === null) ? "{}" : v;
                      const parsed = JSON.parse(valueToUse);
                      setNewComponent({...newComponent, config: parsed});
                      setError("");
                    } catch (e) {
                      console.log("Invalid JSON, ignoring:", e.message);
                    }
                  }}
                  theme="vs-dark"
                  options={{ 
                    minimap: { enabled: false }, 
                    fontSize: 12,
                    fontWeight: '500',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineHeight: 18
                  }}
                  onMount={(editor, monaco) => {
                    console.log("Monaco Editor mounted successfully");
                  }}
                  onValidate={(markers) => {
                    if (markers.length > 0) {
                      console.log("Monaco validation markers:", markers);
                    }
                  }}
                />
              </div>
            </div>

            {/* Public Toggle with Warning */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newComponent.is_public}
                  onChange={(e) => setNewComponent({...newComponent, is_public: e.target.checked})}
                  className="rounded text-indigo-500 focus:ring-indigo-500"
                  style={{ width: '18px', height: '18px' }}
                />
                <label 
                  className="text-white cursor-pointer"
                  style={{
                    fontFamily: 'Public Sans, sans-serif',
                    fontWeight: 400,
                    fontSize: '13px',
                    lineHeight: '1.5714285714285714em',
                    color: '#FFFFFF'
                  }}
                >
                  Make Public
                </label>
              </div>
              <p 
                className="text-white"
                style={{
                  fontFamily: 'Public Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: '11px',
                  lineHeight: '1.5em',
                  color: '#919EAB'
                }}
              >
                Warning: Public components will have all credential IDs and sensitive data removed automatically
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end items-center gap-2.5">
            <button
              onClick={handleClose}
              className="rounded-lg transition-all"
              style={{
                fontFamily: 'Public Sans, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                lineHeight: '1.7142857142857142em',
                background: 'rgba(255, 86, 48, 0.08)',
                color: '#FFAC82',
                padding: '0px 10px',
                height: '32px',
                borderRadius: '8px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateComponent}
              disabled={!newComponent.name.trim()}
              className="rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: 'Public Sans, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                lineHeight: '1.7142857142857142em',
                background: 'rgba(19, 245, 132, 0.08)',
                color: '#9EFBCD',
                padding: '0px 10px',
                height: '32px',
                borderRadius: '8px'
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

