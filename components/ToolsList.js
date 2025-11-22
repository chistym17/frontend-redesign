import React, { useEffect, useState } from 'react';
import { Wrench, Plus, Edit, Trash2, Link as LinkIcon, Zap, CheckCircle2,ArrowDown , Clock, MoreVertical, ChevronDown, Search } from 'lucide-react';
import { toolsService } from '../lib/toolsService';

const StatusBadge = ({ is_verified }) => {
  if (is_verified) {
    return (
      <span
      className="flex justify-center items-center gap-[6px] w-[59px] min-w-[24px] h-[24px] rounded-[4px] transition-colors"
      style={{ backgroundColor: "rgba(19, 245, 132, 0.16)" }}
    >
      <span
        className="w-[47px] h-[20px] text-[12px] font-bold leading-[20px] text-center text-[#9EFBCD]"
      >
       Verified
      </span>
    </span>
    );
  }
  return (
    <span
      className="flex justify-center items-center gap-[6px] w-[59px] min-w-[24px] h-[24px] rounded-[4px] transition-colors"
      style={{ backgroundColor: "rgba(255, 171, 0, 0.16)" }}
    >
      <span
        className="w-[47px] h-[20px] text-[12px] font-bold leading-[20px] text-center text-[#FFD666]"
      >
        Pending 
      </span>
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
    if (!confirm('Delete this tool?')) return;
    try {
      await toolsService.deleteTool(assistantId, toolId);
      await loadTools();
    } catch (error) {
      console.error('Failed to delete tool:', error);
      alert('Failed to delete tool');
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
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Wrench size={48} className="text-white/70" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}>
              <Zap className="w-5 h-5 text-[#141A21] m-1.5" />
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
          <div className="relative mb-4 ">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search size={18} className="text-white/50" />
            </div>
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-350 max-w-md pl-10 pr-4 py-2 bg-white/[0.04] border border-white/15 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/20 transition-colors"
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
            <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* Table Header */}
                  <thead>
                      <tr
                        className="border-b border-white/10"
                        style={{ background: "rgba(145, 158, 171, 0.08)" }}
                      >
                      <th className="px-4 py-4 text-left">
                        <div className="flex items-center gap-2">
                     
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-white uppercase">Name</span>
                            <ArrowDown size={18} className="text-white/60" />
                          </div>
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-white uppercase">API</span>
                          <ArrowDown size={18} className="text-white/60" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left w-[200px]">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-white uppercase">Status</span>
                          <ArrowDown size={18} className="text-white/60" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left w-[125px]">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-white uppercase">State</span>
                          <ArrowDown  size={18} className="text-white/60" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left w-[125px]">
                       
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
                        <td className=" py-4">
                         <div className="flex  space-x-2">
                            <button
                              type="button"
                              aria-pressed={tool.is_enabled}
                              aria-label={tool.is_enabled ? 'Enabled' : 'Disabled'}
                              onClick={() => handleToggle(tool)}
                              disabled={!tool.is_verified || togglingToolId === tool.id}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                                tool.is_enabled
                                  ? 'bg-emerald-500/30 border-emerald-400/50'
                                  : 'bg-white/5 border-white/15'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full transition ${
                                  tool.is_enabled ? 'translate-x-6 bg-white' : 'translate-x-1 bg-white'
                                }`}
                              />
                            </button>
                            <span
                              className={`text-sm ${
                                tool.is_enabled ? 'text-emerald-300' : 'text-white/70'
                              }`}
                            >
                              {tool.is_enabled ? 'Enable' : 'Disable'}
                            </span>
                            {togglingToolId === tool.id && (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>
                        </td>

                        {/* Actions Column */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onEdit(tool)}
                              style={{ backgroundColor: "rgba(19, 245, 132, 0.16)" }}
                              className="flex justify-center items-center px-[6px] py-0 gap-[6px] w-[50px] min-w-[24px] h-[24px] rounded-[4px] transition-colors"
                            >
                              <span className="w-[38px] h-[20px] text-[12px] font-bold leading-[20px] text-center text-[#9EFBCD]">
                                Config
                              </span>
                            </button>
                            <button
                              onClick={() => handleDelete(tool.id)}
                              style={{ backgroundColor: "rgba(255, 86, 48, 0.16)" }}
                              className="flex justify-center items-center px-[6px] py-0 gap-[6px] w-[50px] min-w-[24px] h-[24px] rounded-[4px] transition-colors"
                            >
                              <span className="w-[38px] h-[20px] text-[12px] font-bold leading-[20px] text-center text-[#FFAC82]">
                                Delete
                              </span>
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