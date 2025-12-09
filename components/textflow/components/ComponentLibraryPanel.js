// components/textflow/components/ComponentLibraryPanel.js - FULLY FIXED
import React, { useState, useEffect } from "react";
import { Copy, Trash2, X, Star, Package, Check, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://176.9.16.194:5403/api';

function ComponentCard({ component, onUse, onDelete }) {
  // SAFETY CHECK: Ensure component has required fields
  if (!component || !component.component_id) {
    console.error("Invalid component data:", component);
    return null;
  }

  // Utility function to truncate text
  const truncateText = (text, max) => {
    if (!text) return "";
    return text.length > max ? text.substring(0, max) + "…" : text;
  };

  // Utility function to split title into two lines
  const splitTitle = (title, firstLineWords = 3, restMax = 35) => {
    const words = title.trim().split(/\s+/);
    const firstLine = words.slice(0, firstLineWords).join(" ");
    const remaining = words.slice(firstLineWords).join(" ");
    return {
      firstLine,
      remaining: truncateText(remaining, restMax),
    };
  };

  const { firstLine, remaining } = splitTitle(component.name || "Unnamed", 3, 35);
  const descriptionText = truncateText(component.description || "No description provided", 60);

  return (
    <div 
      className="rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg group node-card-surface flex flex-col min-h-[200px]"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.12)'
      }}
    >
      <div className="p-4 space-y-3 flex-1 min-h-[120px] flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-1.5">
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex px-2 py-1 rounded-full text-xs uppercase tracking-wide node-badge-immediate">
                {component.node_type || "unknown"}
              </span>
              {component.category && (
                <span 
                  className="px-2 py-1 rounded-full text-xs"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.75)'
                  }}
                >
                  {component.category}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-white/90 leading-tight mt-1">
              <span className="block">{firstLine}</span>
              {remaining && <span className="block text-white/75">{remaining}</span>}
            </h3>
            <p className="text-sm text-white/60 line-clamp-2 leading-snug">
              {descriptionText}
            </p>
          </div>
            <button
              onClick={() => onDelete(component.component_id)}
            className="p-1.5 text-white/50 hover:text-red-400 transition-colors flex-shrink-0"
            title="Delete component"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-1 text-xs text-white/55">
          <span>{component.usage_count || 0} uses</span>
          {component.rating && component.rating > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                {component.rating.toFixed(1)}
              </span>
            </>
        )}
        </div>

        {/* Tags */}
        {component.tags && Array.isArray(component.tags) && component.tags.length > 0 && (
          <div className="flex items-center gap-0.5 flex-wrap">
            {component.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={`${component.component_id}-tag-${idx}`}
                className="px-2.5 py-1 rounded-full text-xs"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.75)'
                }}
              >
                {tag}
              </span>
            ))}
            {component.tags.length > 3 && (
              <span className="text-xs text-white/40">+{component.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-white/5 px-3 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex-1 flex">
          <button
            onClick={() => onUse(component)}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all text-left flex items-center gap-1.5"
              style={{
                background: "rgba(19, 245, 132, 0.12)",
                color: "#9EFBCD",
              }}
          >
            <Copy className="w-4 h-4" />
            Use
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComponentLibraryPanel({ assistantId, nodeType, onSelectComponent, onClose, onOpenCreateModal, refreshTrigger, bottomOffset = 140 }) {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [filterByType, setFilterByType] = useState(nodeType || "all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [renderError, setRenderError] = useState(null);

  const nodeTypes = ["http", "llm", "transform", "conditional", "trigger"];

  useEffect(() => {
    try {
      loadComponents();
    } catch (err) {
      console.error("Error in useEffect:", err);
      setRenderError(err.message);
    }
  }, [filterByType]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger !== null) {
      loadComponents();
    }
  }, [refreshTrigger]);

  const loadComponents = async () => {
    try {
      setLoading(true);
      setError("");

      // BUILD URL AS STRING (avoid URL object issues with Next.js fetch wrapper)
      let urlString = `${API_BASE}/templates/component/list?limit=50&assistant_id=${encodeURIComponent(assistantId)}`;
      
      if (filterByType !== "all") {
        urlString += `&node_type=${encodeURIComponent(filterByType)}`;
      }

      console.log("Loading components from:", urlString);

      const response = await fetch(urlString, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Loaded components:", data);
      
      // SAFETY: Validate data structure
      if (!Array.isArray(data)) {
        console.error("Invalid response - expected array, got:", typeof data);
        setComponents([]);
        return;
      }
      
      // CRITICAL FIX: Validate each component before setting state
      const validComponents = data.map(comp => {
        // Ensure tags is always an array
        if (!Array.isArray(comp.tags)) {
          console.warn(`Component ${comp.component_id} has invalid tags:`, comp.tags);
          comp.tags = [];
        }
        
        // Ensure config is always an object
        if (typeof comp.config !== 'object' || comp.config === null) {
          console.warn(`Component ${comp.component_id} has invalid config:`, comp.config);
          comp.config = {};
        }
        
        // Ensure required string fields
        comp.name = comp.name || "Unnamed";
        comp.node_type = comp.node_type || "unknown";
        comp.rating = comp.rating || 0;
        comp.usage_count = comp.usage_count || 0;
        
        return comp;
      });
      
      console.log("Validated components:", validComponents);
      setComponents(validComponents);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load components:", err);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteComponent = async (componentId) => {
    if (!window.confirm("Delete this component? This cannot be undone.")) return;

    try {
      const urlString = `${API_BASE}/templates/component/${componentId}?assistant_id=${encodeURIComponent(assistantId)}`;
      
      const response = await fetch(urlString, { 
        method: "DELETE" 
      });

      if (!response.ok) throw new Error("Failed to delete component");

      setSuccess("Component deleted");
      loadComponents();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
    className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none px-4 sm:px-0"
    style={{ paddingBottom: bottomOffset }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-transparent pointer-events-auto" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div 
        className="relative pointer-events-auto rounded-3xl w-full shadow-2xl flex flex-col overflow-hidden"
        style={{
          width: '700px',
          height: '60vh',
          maxHeight: '60vh',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white/90 tracking-tight">Component Library</h2>
            <p className="text-sm text-white/60">Reusable node configurations</p>
          </div>
          
          <button
            onClick={() => onOpenCreateModal && onOpenCreateModal()}
            className="
              flex items-center justify-center gap-0        /* Mobile: square, no gap */
              px-3 py-3 rounded-lg transition-all
              sm:px-4 sm:py-2 sm:gap-2 sm:flex-row        /* Desktop: rectangle with text & icon */
              text-[#9EFBCD]
            " 
            style={{
              color: "#9EFBCD",
              background: "rgba(19, 245, 132, 0.08)",
            }}
          >
            {/* Icon always visible */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>

            {/* Text only on desktop */}
            <span className="hidden sm:inline text-sm font-semibold">New Component</span>
          </button>

        </div>

        {/* Filters */}
        <div className="px-6 py-2 border-b border-white/10 flex items-center gap-3">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterByType("all")}
              className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
              style={
                filterByType === "all"
                  ? {
                      background: "rgba(19, 245, 132, 0.08)",
                      color: "#9EFBCD",
                    }
                  : {
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "rgba(255,255,255,0.7)",
                    }
              }
            >
              All
            </button>
            {nodeTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterByType(type)}
                className="px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-all"
                style={
                  filterByType === type
                    ? {
                        background: "rgba(19, 245, 132, 0.08)",
                        color: "#9EFBCD",
                      }
                    : {
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "rgba(255,255,255,0.7)",
                      }
                }
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {renderError && (
          <div className="mx-6 mt-4 bg-red-950/30 border border-red-800/50 rounded-lg p-4">
            <div className="text-base font-semibold text-red-300 mb-1">Render Error</div>
            <div className="text-sm text-red-400 font-mono">{renderError}</div>
            <button 
              onClick={() => setRenderError(null)}
              className="mt-2 text-sm text-red-300 hover:text-red-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 bg-red-950/30 border border-red-800/50 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-base text-red-300">{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-4 flex items-start gap-2">
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-base text-emerald-300">{success}</span>
          </div>
        )}

        {/* Component Grid */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-gray-700 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3"></div>
                <div className="text-base text-gray-200">Loading components...</div>
              </div>
            </div>
          ) : components.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center text-center gap-2 translate-y-3">
                <Package className="w-12 h-12 text-gray-500/80" />
                <div className="text-base font-semibold text-white/75">No components yet</div>
                <p className="text-sm text-white/45 max-w-xs">
                  Create reusable node configurations to speed up your flow building.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {components.map((component, index) => {
                // SAFETY: Skip invalid components
                if (!component || !component.component_id) {
                  console.warn(`Skipping invalid component at index ${index}:`, component);
                  return null;
                }
                
                try {
                  return (
                    <ComponentCard
                      key={component.component_id}
                      component={component}
                      onUse={onSelectComponent}
                      onDelete={handleDeleteComponent}
                    />
                  );
                } catch (cardError) {
                  console.error(`Error rendering component ${component.component_id}:`, cardError);
                  setRenderError(`Component render error: ${cardError.message}`);
                  return (
                    <div key={component.component_id} className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                      <div className="text-xs text-red-400">Error rendering component</div>
                      <div className="text-xs text-red-500 font-mono mt-1">{cardError.message}</div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}