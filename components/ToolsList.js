import React, { useEffect, useState } from 'react';
import { Wrench, Plus, Edit, Trash2, Link as LinkIcon, Zap, CheckCircle2, Clock, MoreVertical, ChevronDown, Search, AlertCircle } from 'lucide-react';
import { toolsService } from '../lib/toolsService';

const StatusBadge = ({ is_verified }) => {
  if (is_verified) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded text-xs font-bold text-emerald-300">
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 bg-yellow-500/16 border border-yellow-400/30 rounded text-xs font-bold text-yellow-300">
      Pending
    </span>
  );
};

const ToolsList = ({ assistantId, onAdd, onEdit }) => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingToolId, setTogglingToolId] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, toolId: null, toolName: '' });

  const loadTools = async () => {
    setLoading(true);
    try {
      const toolsList = await toolsService.listTools(assistantId);
      console.log('toolsList', toolsList);
      setTools(toolsList);
    } catch (error) {
      console.error('Failed to load tools:', error);
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, [assistantId]);

  const handleDelete = async (toolId) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool) {
      setDeleteModal({
        open: true,
        toolId,
        toolName: tool.name
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.toolId) return;

    try {
      await toolsService.deleteTool(assistantId, deleteModal.toolId);
      await loadTools();
      setDeleteModal({ open: false, toolId: null, toolName: '' });
    } catch (error) {
      console.error('Failed to delete tool:', error);
      alert('Failed to delete tool');
      setDeleteModal({ open: false, toolId: null, toolName: '' });
    }
  };

  const handleToggle = async (tool) => {
    if (!tool.is_verified) {
      alert('Please verify the tool before enabling it.');
      return;
    }

    setTogglingToolId(tool.id);
    try {
      await toolsService.toggleToolEnabled(assistantId, tool.id, !tool.is_enabled);
      await loadTools();

      // Show success message
      const action = tool.is_enabled ? 'disabled' : 'enabled';
      setSuccessMessage(`Tool "${tool.name}" ${action} successfully!`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

    } catch (error) {
      console.error('Failed to toggle tool:', error);
      alert('Failed to toggle tool status');
    } finally {
      setTogglingToolId(null);
    }
  };

  // Filter tools based on search query
  const filteredTools = tools.filter((tool) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const name = tool.name?.toLowerCase() || '';
    const description = tool.description?.toLowerCase() || '';
    const endpoint = tool.endpoint_url?.toLowerCase() || '';
    const method = tool.method?.toLowerCase() || '';

    return name.includes(query) || description.includes(query) || endpoint.includes(query) || method.includes(query);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="relative">
          <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-400/40 rounded-lg flex items-center animate-fade-in-up mb-4">
          <div className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center mr-3">
            <span className="text-[#141A21] text-xs font-bold">✓</span>
          </div>
          <div className="text-emerald-300 font-medium">{successMessage}</div>
        </div>
      )}

      {tools.length === 0 ? (
        <div className="text-center py-20 animate-fade-in-up">
          <div className="mb-8">
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Wrench size={48} className="text-white/70" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No tools yet</h3>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            Create your first tool to extend your assistant's capabilities.
          </p>
          <button
            onClick={onAdd}
            className="group inline-flex items-center gap-2 px-6 py-3 border border-emerald-400/50 text-emerald-300 rounded-lg hover:bg-emerald-400/10 transition-colors"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Add Your First Tool
          </button>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className="relative mb-4">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search size={18} className="text-white/50" />
            </div>
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md pl-10 pr-4 py-2 bg-white/[0.04] border border-white/15 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {filteredTools.length === 0 && searchQuery ? (
            <div className="text-center py-20 animate-fade-in-up">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Search size={48} className="text-white/50" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No results found</h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                No tools match your search query "{searchQuery}". Try a different search term.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="group inline-flex items-center gap-2 px-6 py-3 border border-emerald-400/50 text-emerald-300 rounded-lg hover:bg-emerald-400/10 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* Table Header */}
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-4 text-left">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-white/20 bg-white/[0.04] text-emerald-400 focus:ring-emerald-400/30"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-white uppercase">Name</span>
                            <ChevronDown size={18} className="text-white/60" />
                          </div>
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-white uppercase">API</span>
                          <ChevronDown size={18} className="text-white/60" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left w-[200px]">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-white uppercase">Status</span>
                          <ChevronDown size={18} className="text-white/60" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left w-[125px]">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-white uppercase">State</span>
                          <ChevronDown size={18} className="text-white/60" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left w-[125px]">
                        <span className="text-sm font-semibold text-white uppercase">Actions</span>
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody>
                    {filteredTools.map((tool, index) => (
                      <tr
                        key={tool.id}
                        className="border-b border-dashed border-white/20 last:border-b-0 hover:bg-white/5 transition-colors animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {/* Name Column */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-white/20 bg-white/[0.04] text-emerald-400 focus:ring-emerald-400/30"
                            />
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-white">{tool.name}</span>
                              {tool.description && (
                                <span className="text-xs text-white/60">{tool.description}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* API Column */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-white">{tool.method}</span>
                            <span className="text-xs text-white/60">{tool.endpoint_url}</span>
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="px-4 py-4">
                          <StatusBadge is_verified={tool.is_verified} />
                        </td>

                        {/* State Column */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleToggle(tool)}
                            disabled={!tool.is_verified || togglingToolId === tool.id}
                            className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className={`relative inline-flex h-[38px] w-[33px] items-center rounded-full transition-colors ${tool.is_enabled
                                ? 'bg-emerald-500'
                                : 'bg-white/8'
                              }`}>
                              <span className={`inline-block h-[14px] w-[14px] transform rounded-full bg-white transition-transform ${tool.is_enabled ? 'translate-x-[19px]' : 'translate-x-[3px]'
                                }`} />
                            </div>
                            <span className="text-sm text-white">{tool.is_enabled ? 'Enable' : 'Disable'}</span>
                            {togglingToolId === tool.id && (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2"></div>
                            )}
                          </button>
                        </td>

                        {/* Actions Column */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onEdit(tool)}
                              className="px-1.5 py-0.5 bg-emerald-500/16 border border-emerald-400/30 text-emerald-300 rounded text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                            >
                              Config
                            </button>
                            <button
                              onClick={() => handleDelete(tool.id)}
                              className="px-1.5 py-0.5 bg-red-500/16 border border-red-400/30 text-red-300 rounded text-xs font-bold hover:bg-red-500/20 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setDeleteModal({ open: false, toolId: null, toolName: '' })} 
          />
          
          {/* Modal */}
          <div 
            className="relative rounded-3xl max-w-md w-full shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Tool</h3>
                  <p className="text-xs text-gray-400">This action cannot be undone</p>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <p className="text-sm text-gray-300">
                  Are you sure you want to delete this tool?
                </p>
                {deleteModal.toolName && (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <p className="text-xs text-gray-400 mb-1">Tool Name:</p>
                    <p className="text-sm text-white font-medium">"{deleteModal.toolName}"</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center gap-2.5 pt-4">
                <button
                  onClick={() => setDeleteModal({ open: false, toolId: null, toolName: '' })}
                  className="px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2"
                  style={{
                    background: 'rgba(255, 86, 48, 0.08)',
                    color: '#FFAC82',
                    height: '36px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2"
                  style={{
                    background: 'rgba(255, 86, 48, 0.2)',
                    color: '#FF6B6B',
                    border: '1px solid rgba(255, 86, 48, 0.3)',
                    height: '36px'
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ToolsList; 