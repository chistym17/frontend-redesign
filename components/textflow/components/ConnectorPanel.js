// components/textflow/components/ConnectorPanel.js - Universal Connector Generator UI
import React, { useState, useEffect, useRef } from "react";
import { 
  Plug, Plus, Code, Star, TrendingUp, Search, X, 
  CheckCircle, AlertCircle, Zap, Clock, Activity, Globe, Eye, Trash2
} from "lucide-react";
import CreateConnectorModal from "./CreateConnectorModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://176.9.16.194:5403/api';

const truncateText = (text = "", max = 60) => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const splitTitle = (text = "", firstWords = 3, restMax = 40) => {
  const words = (text || "").trim().split(/\s+/);
  const firstLine = words.slice(0, firstWords).join(" ");
  const remaining = words.slice(firstWords).join(" ");
  return {
    firstLine,
    remaining: truncateText(remaining, restMax),
  };
};

/** Utility: make readable error messages from fetch responses */
async function readError(res) {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return json.detail || json.message || text || `${res.status} ${res.statusText}`;
    } catch {
      return text || `${res.status} ${res.statusText}`;
    }
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

// ============================================================================
// CONNECTOR CARD COMPONENT
// ============================================================================
function ConnectorCard({
  connector,
  onSelect,
  onDelete,
  onValidate,
  onTogglePublic,
  onInstall,       // install public connector for this assistant
  onUninstall,     // remove installed connector for this assistant
  currentAssistantId,
  context = 'discover', // 'discover' | 'my-connectors'
  showActions = true,
  isExpanded = false,
  onToggleDetails = () => {}
}) {
  const isOwner = connector.owner_id === currentAssistantId;
  const { firstLine, remaining } = splitTitle(connector.name || connector.slug || "Connector");
  const descriptionText = truncateText(connector.description || connector.slug || "No description provided", 70);

  return (
    <div 
      className="rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg group node-card-surface min-h-[220px] flex"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.12)'
      }}
      data-connector-card-id={connector.connector_id}
      onClick={(e) => {
        // Prevent card click from affecting other cards
        e.stopPropagation();
      }}
    >
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="space-y-2.5 flex-1 min-h-[150px]">
        {/* Header */}
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-1.5">
              <span className="inline-flex px-2 py-1 rounded-full text-xs uppercase tracking-wide node-badge-immediate">
                {connector.category || 'general'}
              </span>
              <h3 className="mt-1.5 text-base font-semibold text-white/85 leading-tight">
                <span className="block">{firstLine}</span>
                {remaining && <span className="block text-white/70">{remaining}</span>}
              </h3>
              <p className="text-sm text-white/50 line-clamp-2 leading-snug mt-1">
                {descriptionText}
              </p>
          </div>
          {showActions && isOwner && (
            <button
              onClick={() => onDelete && onDelete(connector.connector_id)}
                className="p-1.5 text-white/50 hover:text-red-400 transition-colors"
              title="Delete (owner only)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stats */}
          <div className="flex items-center gap-1 text-xs text-white/45 mt-2">
            <span>{connector.usage_count || 0} users</span>
            <span>· {connector.spec?.endpoints?.length || 0} endpoints</span>
          {connector.avg_response_time && (
              <span>· {connector.avg_response_time.toFixed(0)}ms</span>
          )}
        </div>

        {/* Tags */}
        {connector.tags && connector.tags.length > 0 && (
            <div className="flex items-center gap-0.5 flex-wrap mt-2">
            {connector.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                  className="px-2.5 py-1 rounded-full text-xs"
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.75)'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2 border-t border-white/5">
          {context === 'discover' ? (
            <div className="flex items-center justify-between text-sm font-semibold">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInstall && onInstall(connector.connector_id);
              }}
                className="text-[#9EFBCD] hover:text-white transition-colors"
              title="Add to My Connectors"
            >
              Add
            </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
                  onToggleDetails && onToggleDetails();
            }}
                className="text-white/55 hover:text-white transition-colors"
            type="button"
            data-connector-id={connector.connector_id}
          >
                {isExpanded ? 'Hide details' : 'Details'}
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                <button
                  onClick={() => onSelect && onSelect(connector)}
                  className="text-[#9EFBCD] hover:text-white transition-colors"
                >
                  Use
          </button>

                {context === 'my-connectors' && !isOwner && onUninstall && (
                  <button
                    onClick={() => onUninstall(connector.connector_id)}
                    className="text-[#FF9F9F] hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                )}

          {showActions && onValidate && (
            <button
              onClick={() => onValidate(connector.connector_id)}
                    className="text-white/65 hover:text-white transition-colors"
              title="Validate connector"
            >
                    Validate
            </button>
          )}
              </div>

              <div className="flex items-center gap-1.5 text-sm font-semibold">
          {showActions && isOwner && onTogglePublic && (
            <button
              onClick={() => onTogglePublic(connector.connector_id, !connector.is_public)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
              {connector.is_public ? 'Unpublish' : 'Publish'}
            </button>
          )}
                <span className="text-white/30">•</span>
            <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleDetails && onToggleDetails();
                  }}
                  className="text-white/55 hover:text-white transition-colors"
                  type="button"
                  data-connector-id={connector.connector_id}
                >
                  {isExpanded ? 'Hide details' : 'Details'}
            </button>
              </div>
            </>
          )}
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="pt-3 border-t border-white/10 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm space-y-1">
              <div className="flex justify-between text-gray-200">
                <span>Base URL:</span>
                <span className="font-mono text-gray-100 truncate ml-2">
                  {connector.spec?.base_url}
                </span>
              </div>
              <div className="flex justify-between text-gray-200">
                <span>Auth Type:</span>
                <span className="font-mono text-gray-100">
                  {connector.spec?.auth?.type || 'none'}
                </span>
              </div>
              <div className="flex justify-between text-gray-200">
                <span>Version:</span>
                <span className="font-mono text-gray-100">{connector.version}</span>
              </div>
              {connector.success_rate > 0 && (
                <div className="flex justify-between text-gray-200">
                  <span>Success Rate:</span>
                  <span className="font-mono text-emerald-400">
                    {connector.success_rate.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CREATE CONNECTOR MODAL - Now a standalone component
// ============================================================================
// Removed: CreateConnectorModal is now in CreateConnectorModal.js

// ============================================================================
// MAIN CONNECTOR PANEL
// ============================================================================
export default function ConnectorPanel({ assistantId, onSelectConnector, onClose, bottomOffset = 140 }) {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, connectorId: null, connectorName: '', isOwner: false });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('discover'); // 'discover', 'my-connectors'
  const [expandedCardKey, setExpandedCardKey] = useState(null);
  const searchTimer = useRef(null);

  const categories = ['all', 'communication', 'productivity', 'database', 'crm', 'analytics'];

  useEffect(() => {
    loadConnectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, activeTab]);

  const fetchList = async (params) => {
    const res = await fetch(`${API_BASE}/textflow/connectors/list?${params}`);
    if (!res.ok) throw new Error(await readError(res));
    return res.json();
  };

  const loadConnectors = async () => {
    try {
      setLoading(true);
      setError('');

      if (activeTab === 'discover') {
        // Public feed only - never includes my own connectors
        const params = new URLSearchParams();
        params.append('limit', '50');
        params.append('public_only', 'true');
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (searchQuery.trim()) params.append('search', searchQuery);
        const data = await fetchList(params);
        setConnectors(Array.isArray(data) ? data : []);
        setExpandedCardKey(null);
        return;
      }

      // --- MY CONNECTORS TAB ---
      // Fetch owned + installed separately and merge
      const ownedParams = new URLSearchParams();
      ownedParams.append('limit', '100');
      ownedParams.append('owner_id', assistantId);
      if (selectedCategory !== 'all') ownedParams.append('category', selectedCategory);
      if (searchQuery.trim()) ownedParams.append('search', searchQuery);

      const installedParams = new URLSearchParams();
      installedParams.append('limit', '100');
      installedParams.append('installed_for', assistantId);
      if (selectedCategory !== 'all') installedParams.append('category', selectedCategory);
      if (searchQuery.trim()) installedParams.append('search', searchQuery);

      // Fetch both owned and installed
      let owned = [];
      let installed = [];
      
      try {
        owned = await fetchList(ownedParams);
      } catch (err) {
        console.error('Failed to fetch owned connectors:', err);
        owned = [];
      }

      try {
        installed = await fetchList(installedParams);
      } catch (err) {
        console.error('Failed to fetch installed connectors:', err);
        installed = [];
      }

      // Merge and deduplicate by connector_id
      const map = new Map();
      for (const c of [...(Array.isArray(owned) ? owned : []), ...(Array.isArray(installed) ? installed : [])]) {
        map.set(c.connector_id, c);
      }
      const merged = Array.from(map.values());
      
      // Sort by usage and rating
      merged.sort((a, b) => {
        const aScore = (a.usage_count || 0) + (a.rating || 0);
        const bScore = (b.usage_count || 0) + (b.rating || 0);
        return bScore - aScore;
      });
      
      setConnectors(merged);
      setExpandedCardKey(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load connectors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Debounce search
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadConnectors();
    }, 400);
  };

  const handleDeleteConnector = async (connectorId) => {
    const connector = connectors.find(c => c.connector_id === connectorId);
    if (connector) {
      setDeleteModal({
        open: true,
        connectorId,
        connectorName: connector.name,
        isOwner: true
      });
      setDeleteError('');
      setDeleteLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.connectorId) return;

    setDeleteLoading(true);
    setDeleteError('');
    try {
      const response = await fetch(
        `${API_BASE}/textflow/connectors/${deleteModal.connectorId}?owner_id=${assistantId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error(await readError(response));

      setSuccess('Connector deleted');
      setTimeout(() => setSuccess(''), 2000);
      setDeleteModal({ open: false, connectorId: null, connectorName: '', isOwner: false });
      setDeleteLoading(false);
      loadConnectors();
    } catch (err) {
      const message = err.message || 'Failed to delete connector';
      setDeleteError(message);
      setDeleteLoading(false);
    }
  };

  const handleValidateConnector = async (connectorId) => {
    try {
      const response = await fetch(
        `${API_BASE}/textflow/connectors/${connectorId}/validate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }
      );
      if (!response.ok) throw new Error(await readError(response));

      const result = await response.json();
      if (result.valid) {
        setSuccess('Connector validated successfully');
      } else {
        setError(`Validation failed: ${result.error || 'unknown error'}`);
      }
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);

      loadConnectors();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleTogglePublic = async (connectorId, nextPublic) => {
    try {
      const res = await fetch(
        `${API_BASE}/textflow/connectors/${connectorId}?owner_id=${assistantId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            is_public: nextPublic, 
            change_summary: nextPublic ? 'Publishing connector' : 'Unpublishing connector' 
          })
        }
      );
      if (!res.ok) throw new Error(await readError(res));
      setSuccess(nextPublic ? 'Published! Now visible in Discover.' : 'Unpublished. No longer visible in Discover.');
      setTimeout(() => setSuccess(''), 3000);
      loadConnectors();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Install a public connector for this assistant
  const handleInstall = async (connectorId) => {
    try {
      const res = await fetch(
        `${API_BASE}/textflow/connectors/${connectorId}/install?owner_id=${assistantId}`,
        { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({}) 
        }
      );
      if (!res.ok) throw new Error(await readError(res));
      
      setSuccess('Added to My Connectors! Switch to "My Connectors" tab to use it.');
      setTimeout(() => setSuccess(''), 3000);
      
      // Optionally auto-switch to my-connectors tab
      // setActiveTab('my-connectors');
      // loadConnectors();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Remove an installed connector (non-owner)
  const handleUninstall = async (connectorId) => {
    const connector = connectors.find(c => c.connector_id === connectorId);
    if (connector) {
      setDeleteModal({
        open: true,
        connectorId,
        connectorName: connector.name,
        isOwner: false
      });
      setDeleteError('');
      setDeleteLoading(false);
    }
  };

  const confirmUninstall = async () => {
    if (!deleteModal.connectorId) return;
    
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch(
        `${API_BASE}/textflow/connectors/${deleteModal.connectorId}/install?owner_id=${assistantId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const errMsg = await readError(res);
        // Treat "not installed" as success - might have been removed already
        if (!errMsg.toLowerCase().includes('not installed')) {
          throw new Error(errMsg);
        }
      }
      
      setSuccess('Removed from My Connectors');
      setTimeout(() => setSuccess(''), 2000);
      setDeleteModal({ open: false, connectorId: null, connectorName: '', isOwner: false });
      setDeleteLoading(false);
      loadConnectors();
    } catch (err) {
      const message = err.message || 'Failed to remove connector';
      setDeleteError(message);
      setDeleteLoading(false);
    }
  };

  const handleConnectorCreated = (result) => {
    setSuccess(`Connector "${result.name}" created with ${result.endpoints_count} endpoints`);
    setTimeout(() => setSuccess(''), 5000);
    setActiveTab('my-connectors'); // Switch to my-connectors after creating
    loadConnectors();
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
        {/* Backdrop overlay to blur parent content when create modal is open */}
        {showCreateModal && (
          <div 
            className="absolute inset-0 z-[50] backdrop-blur-md"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              pointerEvents: 'none'
            }}
          />
        )}
        
        {/* Header */}
        <div className="px-6 py-3 flex items-center justify-between">
            <div>
            <h2 className="text-xl font-semibold text-white/90">API Connectors</h2>
            <p className="text-sm text-white/50">Universal connector generator</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
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
                <span className="hidden sm:inline text-sm font-semibold">New Connector</span>
            </button>
              
          
        </div>

        {/* Tabs */}
        <div className="px-6 pb-1 flex gap-1">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'discover'
                ? 'bg-[rgba(19,245,132,0.08)] text-[#9EFBCD]'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <TrendingUp className="w-4 h-4 opacity-80" />
            Discover
          </button>
          <button
            onClick={() => setActiveTab('my-connectors')}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'my-connectors'
                ? 'bg-[rgba(19,245,132,0.08)] text-[#9EFBCD]'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <Code className="w-4 h-4 opacity-80" />
            My Connectors
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-2 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search connectors..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm text-white placeholder-white/40 transition-colors focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/60 border"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'rgba(145, 158, 171, 0.18)'
              }}
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all"
                style={
                  selectedCategory === cat
                    ? { background: 'rgba(19, 245, 132, 0.08)', color: '#9EFBCD' }
                    : { background: 'rgba(255, 255, 255, 0.08)', color: 'rgba(255,255,255,0.7)' }
                }
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 bg-red-950/30 border border-red-800/50 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-base text-red-300">{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-base text-emerald-300">{success}</span>
          </div>
        )}

        {/* Connectors Grid */}
        <div className="flex-1 overflow-auto px-6 py-4 template-scroll">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-2 border-gray-700 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
                <div className="text-base text-white/60">Loading connectors...</div>
              </div>
            </div>
          ) : connectors.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-2">
                <Plug className="w-12 h-12 mx-auto text-white/30" />
                <div className="text-base font-semibold text-white/80">No connectors found</div>
                <p className="text-sm text-white/55">
                  {activeTab === 'my-connectors' 
                    ? 'Create your first connector or install one from Discover'
                    : 'Try adjusting your filters'
                  }
                </p>
                {activeTab === 'my-connectors' && (
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        color: "#9EFBCD",
                        background: "rgba(19, 245, 132, 0.08)",
                      }}
                    >
                      Create Connector
                    </button>
                    <button
                      onClick={() => setActiveTab('discover')}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all text-white/70 hover:text-white"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      Browse Discover
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {connectors.map((connector, index) => {
                const cardKey = `${connector.connector_id}-${index}-${activeTab}`;
                return (
                <ConnectorCard
                    key={cardKey}
                  connector={connector}
                  onSelect={onSelectConnector}
                  onDelete={handleDeleteConnector}
                  onValidate={handleValidateConnector}
                  onTogglePublic={handleTogglePublic}
                  onInstall={handleInstall}
                  onUninstall={handleUninstall}
                  currentAssistantId={assistantId}
                  context={activeTab}
                  showActions={activeTab === 'my-connectors'}
                    isExpanded={expandedCardKey === cardKey}
                    onToggleDetails={() =>
                      setExpandedCardKey(prev => (prev === cardKey ? null : cardKey))
                    }
                />
                );
              })}
            </div>
          )}
        </div>

        {/* Delete/Remove Confirmation Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                if (!deleteLoading) {
                  setDeleteModal({ open: false, connectorId: null, connectorName: '', isOwner: false });
                  setDeleteError('');
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
                    <h3 className="text-base font-semibold text-white/90">
                      {deleteModal.isOwner ? 'Delete Connector' : 'Remove Connector'}
                    </h3>
                  <button
                    onClick={() => {
                      if (!deleteLoading) {
                        setDeleteModal({ open: false, connectorId: null, connectorName: '', isOwner: false });
                        setDeleteError('');
                      }
                    }}
                    className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-white/60">
                    {deleteModal.isOwner ? (
                      <>
                      Are you sure you want to delete{" "}
                      <span className="text-white/90 font-semibold">"{deleteModal.connectorName}"</span>?
                      This action cannot be undone.
                      </>
                    ) : (
                      <>
                      Are you sure you want to remove{" "}
                      <span className="text-white/90 font-semibold">"{deleteModal.connectorName}"</span>?
                      You can add it again from Discover later.
                      </>
                    )}
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
                        setDeleteModal({ open: false, connectorId: null, connectorName: '', isOwner: false });
                        setDeleteError('');
                      }
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white/70 hover:text-white transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteModal.isOwner ? confirmDelete : confirmUninstall}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-red-200 transition-all disabled:opacity-50"
                    style={{ background: "rgba(255, 72, 72, 0.15)" }}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (deleteModal.isOwner ? "Deleting..." : "Removing...") : (deleteModal.isOwner ? "Delete" : "Remove")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Create Connector Modal - Standalone */}
      <CreateConnectorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleConnectorCreated}
        assistantId={assistantId}
      />
    </>
  );
}