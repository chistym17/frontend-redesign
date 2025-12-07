// components/textflow/components/TemplateGallery.js - FIXED: Description handling + Credential warnings
import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Star, Download, Heart, Share2, ArrowRight, Sparkles, TrendingUp, 
  Tag, User, Calendar, Plus, X, Check, Copy, Code, MessageSquare, AlertCircle, Shield 
} from "lucide-react";
import Editor from "@monaco-editor/react";
import SaveTemplateModal from "./SaveTemplateModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://176.9.16.194:5403/api';

// ============================================================================
// TEMPLATE CARD COMPONENT
// ============================================================================

function truncate(text = "", max = 20) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function TemplateCard({ template, onSelect, isFavorite, onToggleFavorite }) {
const rawTitle = template?.name || "";
const titleWords = rawTitle.trim().split(/\s+/);
const firstLineTitle = titleWords.slice(0, 3).join(" ");
const remainingTitle = titleWords.slice(3).join(" ");
const descriptionText = truncate(template?.description || "No description provided", 60);
  return (
    <div 
      className="rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg group node-card-surface"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.12)',
      }}
    >
      <div className="p-4 space-y-3 relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex-1 space-y-0.5">
            <span
              className="inline-flex px-2 py-1 rounded-full text-xs uppercase tracking-wide node-badge-immediate"
            >
              {template.category}
            </span>
            <h3 className="text-base font-semibold text-white/85 transition-colors leading-tight">
              <span className="block">{firstLineTitle}</span>
              {remainingTitle && (
                <span className="block text-white/70">
                  {truncate(remainingTitle, 35)}
                </span>
              )}
            </h3>
            {/* FIXED: Show description properly */}
            <p className="text-sm text-white/50 line-clamp-2">
              {descriptionText}
            </p>
          </div>
          <button
            onClick={() => onToggleFavorite(template.template_id)}
            className="flex-shrink-0 text-white/40 hover:text-red-400 transition-colors"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </button>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-1 flex-wrap text-xs text-white/55">
          <span>{template.usage_count || 0} users</span>
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex items-center gap-0.5 flex-wrap">
            {template.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-xs"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.75)',
                }}
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-xs text-white/40">+{template.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          <div className="flex-1 flex">
          <button
            onClick={() => onSelect(template)}
              className="px-2.5 py-1.5 rounded-xl text-sm font-semibold transition-all text-left flex items-center gap-1.5"
              style={{
                background: "rgba(19, 245, 132, 0.12)",
                color: "#9EFBCD",
              }}
            >
              Use
          </button>
          </div>
          <button 
            className="px-2 py-1 text-white/70 hover:text-white transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLATE DISCOVERY TAB
// ============================================================================

function TemplateDiscovery({ assistantId, onSelectTemplate, onClose, mode = "browse" }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [favorites, setFavorites] = useState([]);
  const showCategories = mode === "browse";

  const categories = ["all", "api", "data", "notification", "database", "ai"];

  useEffect(() => {
    loadTemplates();
  }, [sortBy, selectedCategory, mode]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      let url;
      if (mode === "trending") {
        url = `${API_BASE}/templates/discover/trending?limit=50`;
      } else {
        url = new URL(`${API_BASE}/templates/flow/list`);
        url.searchParams.append("public_only", "true");
        url.searchParams.append("limit", "50");
        
        if (showCategories && selectedCategory !== "all") {
          url.searchParams.append("category", selectedCategory);
        }
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load templates");
      
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      loadTemplates();
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/templates/discover/search?q=${encodeURIComponent(query)}&limit=50`
      );
      if (!response.ok) throw new Error("Search failed");
      
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (templateId) => {
    setFavorites(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Search & Filters */}
      <div className="px-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl text-sm text-white placeholder-white/40 transition-colors focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/60 border"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(145, 158, 171, 0.2)'
            }}
          />
        </div>

        {showCategories && (
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all"
                style={
                  selectedCategory === cat
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
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-auto px-4 pb-4 template-scroll">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-gray-700 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3"></div>
              <div className="text-base text-white/60">Loading templates...</div>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center space-y-2">
              <Sparkles className="w-12 h-12 mx-auto text-white/30" />
              <div className="text-base font-semibold text-white/75">No templates found</div>
              <div className="text-sm text-white/45">Try adjusting your filters</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {templates.map(template => (
              <TemplateCard
                key={template.template_id}
                template={template}
                onSelect={(t) => {
                  onSelectTemplate(t);
                  onClose();
                }}
                isFavorite={favorites.includes(template.template_id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MY TEMPLATES - FIXED
// ============================================================================

function MyTemplates({ assistantId, onSelectTemplate, onClose, refreshKey = 0, onOpenSaveModal }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadMyTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/templates/flow/list?assistant_id=${assistantId}&public_only=false`
      );
      if (!response.ok) throw new Error("Failed to load templates");

      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyTemplates();
  }, [assistantId, refreshKey]);

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    setDeleteLoading(true);
    setDeleteError("");
    try {
      const response = await fetch(
        `${API_BASE}/templates/flow/${templateToDelete.template_id}?assistant_id=${assistantId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete template");

      setSuccess("Template deleted");
      setTimeout(() => setSuccess(""), 2000);
      loadMyTemplates();
      setTemplateToDelete(null);
    } catch (err) {
      setDeleteError(err.message || "Failed to delete template");
      console.error("Failed to delete template:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/10">
        <div>
          <h3 className="text-base font-semibold text-white/90">My Templates</h3>
          <p className="text-sm text-white/50">{templates.length} templates</p>
        </div>
        {onOpenSaveModal && (
          <button
            onClick={onOpenSaveModal}
            className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all"
            style={{
              background: "rgba(19, 245, 132, 0.12)",
              color: "#9EFBCD",
            }}
          >
            <Plus className="w-4 h-4" />
            Save Current
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-4 bg-red-950/30 border border-red-800/50 rounded-lg p-4 flex items-start gap-2">
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
        <div className="mx-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-base text-emerald-300">{success}</span>
        </div>
      )}

      {/* Templates List */}
      <div className="flex-1 overflow-auto px-4 pb-4 space-y-2 template-scroll">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-xs text-white/60">Loading...</div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Code className="w-12 h-12 mx-auto text-white/30" />
            <div className="text-base font-semibold text-white/75">No templates yet</div>
            <div className="text-sm text-white/50">Save your flows as templates to reuse them</div>
          </div>
        ) : (
          templates.map(template => (
            <div
              key={template.template_id}
              className="rounded-lg border p-3 transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderColor: 'rgba(255, 255, 255, 0.12)'
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white/90">{template.name}</h4>
                  <p className="text-sm text-white/50 mt-1 line-clamp-2">
                    {template.description || "No description"}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                    <span
                      className="px-2.5 py-1 rounded capitalize"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'rgba(255,255,255,0.7)'
                      }}
                    >
                      {template.category}
                    </span>
                    <span>v{template.version}</span>
                    <span>{template.usage_count} uses</span>
                    {template.is_public && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Shield className="w-4 h-4" />
                        Public
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      onSelectTemplate(template);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold text-[#9EFBCD] transition-all"
                    style={{ background: 'rgba(19, 245, 132, 0.12)' }}
                  >
                    Use
                  </button>
                  <button
                    onClick={() => {
                      setTemplateToDelete(template);
                      setDeleteError("");
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-sm font-semibold text-red-300 transition-all"
                    style={{ background: 'rgba(255, 72, 72, 0.1)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => {
              if (!deleteLoading) {
                setTemplateToDelete(null);
                setDeleteError("");
              }
            }}
          />
          <div
            className="relative rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "24px"
            }}
          >
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white/90">Delete Template</h3>
                <button
                  onClick={() => {
                    if (!deleteLoading) {
                      setTemplateToDelete(null);
                      setDeleteError("");
                    }
                  }}
                  className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-white/60">
                Are you sure you want to delete{" "}
                <span className="text-white/90 font-semibold">
                  {templateToDelete.name}
                </span>
                ? This action cannot be undone.
              </p>
              {deleteError && (
                <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-300">{deleteError}</span>
                </div>
              )}
              <div className="flex justify-end items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    if (!deleteLoading) {
                      setTemplateToDelete(null);
                      setDeleteError("");
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white/70 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTemplate}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-red-200 transition-all disabled:opacity-50"
                  style={{ background: "rgba(255, 72, 72, 0.15)" }}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN TEMPLATE GALLERY
// ============================================================================

export default function TemplateGallery({ assistantId, onSelectTemplate, onClose, onGetCurrentFlow, bottomOffset = 140 }) {
  const [activeTab, setActiveTab] = useState("browse");
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [myTemplatesRefreshKey, setMyTemplatesRefreshKey] = useState(0);

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template);
  };

  return (
    <>
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
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <div>
            <h2 className="text-xl font-semibold text-white/90 tracking-tight">Template Library</h2>
            <p className="text-sm text-white/60">Discover and reuse flow templates</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-2 flex gap-1 overflow-x-auto scrollbar-none sm:overflow-visible whitespace-nowrap">

          {[
            { id: "browse", label: "Browse", icon: Sparkles },
            { id: "trending", label: "Trending", icon: TrendingUp },
            { id: "saved", label: "Saved", icon: Heart },
            { id: "my-templates", label: "My Templates", icon: Code }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-[rgba(19,245,132,0.08)] text-[#9EFBCD]"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                <Icon className="w-4 h-4 opacity-80" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "browse" && (
            <TemplateDiscovery
              assistantId={assistantId}
              onSelectTemplate={handleSelectTemplate}
              onClose={onClose}
              mode="browse"
            />
          )}
          {activeTab === "trending" && (
            <TemplateDiscovery
              assistantId={assistantId}
              onSelectTemplate={handleSelectTemplate}
              onClose={onClose}
              mode="trending"
            />
          )}
          {activeTab === "saved" && (
            <TemplateDiscovery
              assistantId={assistantId}
              onSelectTemplate={handleSelectTemplate}
              onClose={onClose}
              mode="saved"
            />
          )}
          {activeTab === "my-templates" && (
            <MyTemplates
              assistantId={assistantId}
              onSelectTemplate={handleSelectTemplate}
              onClose={onClose}
              refreshKey={myTemplatesRefreshKey}
              onOpenSaveModal={() => setShowSaveTemplateModal(true)}
            />
          )}
        </div>
      </div>
    </div>
    {showSaveTemplateModal && (
      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        assistantId={assistantId}
        onGetCurrentFlow={onGetCurrentFlow}
        onSuccess={() => {
          setShowSaveTemplateModal(false);
          setMyTemplatesRefreshKey((prev) => prev + 1);
        }}
      />
    )}
    </>
  );
}