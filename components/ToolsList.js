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
        className="w-[47px] h-[20px] text-[12px] leading-[20px] text-center text-[#9EFBCD]"
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
        className="w-[47px] h-[20px] text-[12px]  leading-[20px] text-center text-[#FFD666]"
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

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rows_per_page");
      return saved ? Number(saved) : 5;
    }
    return 5;
  });
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);


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

  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredTools.slice(indexOfFirst, indexOfLast);

  // Navigation
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const goToLastPage = () => setCurrentPage(totalPages);


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
            <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 ">
              {/* Table */}
              <div className="overflow-x-auto rounded-tl-2xl rounded-tr-2xl  ">
                <table className="w-full">
                  {/* Table Header */}
                  <thead className="border-b border-white/10 " >
                      <tr
                        className="border-b border-white/10 "
                        style={{ background: "rgba(145, 158, 171, 0.08)" }}
                      >
                      <th className="px-4 py-4 text-left">
                        <div className="flex items-center gap-2">
                     
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-white uppercase">Name</span>
                            <ArrowDown size={16} className="text-white/60" />
                          </div>
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-white uppercase">API</span>
                          <ArrowDown size={16} className="text-white/60" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left w-[200px]">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-white uppercase">Status</span>
                          <ArrowDown size={16} className="text-white/60" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left w-[125px]">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-white uppercase">State</span>
                          <ArrowDown  size={16} className="text-white/60" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left w-[125px]">
                       
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody>
                    {currentItems.map((tool, index) => (
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
                            <span className="text-xs font-medium text-white">{tool.method}</span>
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
                              <span className="w-[38px] h-[20px] text-[12px] leading-[20px] text-center text-[#9EFBCD]">
                                Config
                              </span>
                            </button>
                            <button
                              onClick={() => handleDelete(tool.id)}
                              style={{ backgroundColor: "rgba(255, 86, 48, 0.16)" }}
                              className="flex justify-center items-center px-[6px] py-0 gap-[6px] w-[50px] min-w-[24px] h-[24px] rounded-[4px] transition-colors"
                            >
                              <span className="w-[38px] h-[20px] text-[12px]  leading-[20px] text-center text-[#FFAC82]">
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
              {/* Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-end w-full border-t border-[rgba(145,158,171,0.2)] py-1 px-5 bg-white/[0.05] rounded-bl-2xl rounded-br-2xl gap-3">

                  {/* Pagination (right) */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">

                    
                    {/* Rows per page selector */}
                    <div className="relative flex items-center gap-1">
                      <span className="text-[12px] text-gray-300 whitespace-nowrap">
                        Rows per page:
                      </span>

                      <div
                        onClick={() => setRowsDropdownOpen(!rowsDropdownOpen)}
                        className="flex items-center justify-center bg-transparent text-white text-[12px] px-2 py-1 w-[50px] rounded-xl outline-none border border-white/[0.2] hover:bg-white/[0.1] transition-all cursor-pointer"
                      >
                        {itemsPerPage === filteredTools.length ? "All" : itemsPerPage}
                        <span className="ml-1 text-[10px]">
                          <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.8344 5.8344C5.63969 5.83478 5.45099 5.76696 5.30106 5.64273L0.301063 1.47606C-0.0533202 1.18151 -0.101823 0.655445 0.192729 0.301062C0.487281 -0.0533202 1.01335 -0.101823 1.36773 0.192729L5.8344 3.92606L10.3011 0.326063C10.4732 0.186254 10.694 0.120838 10.9145 0.1443C11.1351 0.167761 11.3372 0.278163 11.4761 0.451063C11.6303 0.624279 11.7054 0.85396 11.6833 1.08486C11.6612 1.31576 11.5438 1.52699 11.3594 1.66773L6.3594 5.69273C6.20516 5.79733 6.02031 5.8472 5.8344 5.8344Z" fill="#919EAB" fill-opacity="0.8"/>
                          </svg>
                        </span>
                      </div>

                      {rowsDropdownOpen && (
                        <div className="absolute left-[85px] top-full mt-[2px] w-[50px] bg-black/80  rounded-lg backdrop-blur-2xl z-50">
                          {[5, 10, 20, "All"].map((option) => (
                            <div
                              key={option}
                              onClick={() => {
                                const value = option === "All" ? filteredTools.length : Number(option);

                                setItemsPerPage(value);
                                localStorage.setItem("rows_per_page", value);   // <-- SAVE TO STORAGE

                                setCurrentPage(1);
                                setRowsDropdownOpen(false);
                              }}
                              className={`px-2 py-1 text-[12px] text-white hover:bg-white/10 rounded-[7px] cursor-pointer text-center ${
                                (option === "All" && itemsPerPage === filteredTools.length) || option === itemsPerPage
                                  ? "bg-white/10"
                                  : ""
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Page info */}
                    <span className="text-white text-[12px] min-w-[100px] text-center">
                      Page {totalPages > 0 ? currentPage : 0} of {totalPages}
                    </span>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-2">

                      {/* First */}
                      <button
                        onClick={goToFirstPage}
                        disabled={currentPage === 1 || totalPages === 0}
                        className={`w-10 h-8 flex items-center justify-center rounded-lg transition-all text-2xl ${
                          currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-white/[0.08]"
                        }`}
                      >
                        «
                      </button>

                      {/* Prev */}
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1 || totalPages === 0}
                        className={`w-10 h-8 flex items-center justify-center rounded-lg transition-all text-2xl ${
                          currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-white/[0.08]"
                        }`}
                      >
                        ‹
                      </button>

                      {/* Next */}
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className={`w-10 h-8 flex items-center justify-center rounded-lg transition-all text-2xl ${
                          currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-white/[0.08]"
                        }`}
                      >
                        ›
                      </button>

                      {/* Last */}
                      <button
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className={`w-10 h-8 flex items-center justify-center rounded-lg transition-all text-2xl ${
                          currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-white/[0.08]"
                        }`}
                      >
                        »
                      </button>
                    </div>
                  </div>
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