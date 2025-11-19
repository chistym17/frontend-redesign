import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Building2, Calendar,MoreVertical, MapPin, Clock, MoreHorizontal, Zap, Activity, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { useRouter } from 'next/router';
import { useAssistant } from '../lib/assistantContext';
import { useSidebar } from '../lib/sidebarContext';
import LeftSidebar from './LeftSidebar';
import Image from "next/image";

const AssistantList = ({ onEdit, onDelete, onView }) => {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showActions, setShowActions] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 6 items per page (3x2 grid)
  const router = useRouter();
  const { assistantId, setAssistant } = useAssistant();
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.ASSISTANTS);
      if (!response.ok) {
        throw new Error('Failed to fetch assistants');
      }
      const data = await response.json();
      setAssistants(data);
    } catch (error) {
      console.error('Error fetching assistants:', error);
      setError('Failed to load assistants');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assistantIdToDelete) => {
    if (!confirm('Are you sure you want to delete this assistant?')) {
      return;
    }

    try {
      setDeletingId(assistantIdToDelete);
      const response = await fetch(API_ENDPOINTS.ASSISTANT(assistantIdToDelete), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assistant');
      }

      setTimeout(() => {
        setAssistants(prev => prev.filter(assistant => assistant.id !== assistantIdToDelete));
        setDeletingId(null);
      }, 300);
    } catch (error) {
      console.error('Error deleting assistant:', error);
      alert('Failed to delete assistant. Please try again.');
      setDeletingId(null);
    }
  };

  const getIndustryIcon = (industryType) => {
    const icons = {
      restaurant: '🍽️',
      retail: '🛍️',
      healthcare: '🏥',
      education: '🎓',
      finance: '💰',
      technology: '💻',
      default: '🏢'
    };
    return icons[industryType] || icons.default;
  };

  const getIndustryGradient = (industryType) => {
    const gradients = {
      restaurant: 'from-orange-400 to-red-500',
      retail: 'from-purple-400 to-pink-500',
      healthcare: 'from-blue-400 to-cyan-500',
      education: 'from-green-400 to-blue-500',
      finance: 'from-yellow-400 to-orange-500',
      technology: 'from-indigo-400 to-purple-500',
      default: 'from-gray-400 to-gray-600'
    };
    return gradients[industryType] || gradients.default;
  };

  const activate = (assistant) => {
    setAssistant(assistant);
  };

  const filteredAssistants = assistants.filter((assistant) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const name = assistant.name?.toLowerCase() || '';
    const description = assistant.description?.toLowerCase() || '';
    const industryType = assistant.business_meta?.industry_type?.toLowerCase() || '';
    const address = assistant.business_meta?.address?.toLowerCase() || '';
    const hours = assistant.business_meta?.operating_hours?.toLowerCase() || '';

    return (
      name.includes(query) ||
      description.includes(query) ||
      industryType.includes(query) ||
      address.includes(query) ||
      hours.includes(query)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAssistants.length / itemsPerPage);
  const paginatedAssistants = filteredAssistants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#141A21] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/10 border-t-emerald-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-white/30 rounded-full animate-spin animate-reverse" style={{ animationDelay: '-0.5s' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#141A21] flex items-center justify-center">
        <div className="text-center p-8 bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Oops! Something went wrong</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchAssistants}
            className="px-6 py-3 border border-emerald-400/50 text-emerald-300 rounded-xl hover:bg-emerald-400/10 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#141A21] overflow-y-auto flex">
      <LeftSidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-48'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-white">Agent List</h1>
              <button
                onClick={() => onEdit(null)}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{
                  color: "#13F584",
                  border: "1px solid #13F584"
                }}
              >
                <Plus
                  size={18}
                  className="group-hover:rotate-90 transition-transform duration-300"
                  style={{ color: "#13F584" }}
                />
                Create Assistance
              </button>

            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search size={18} className="text-white/50" />
              </div>
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md pl-10 pr-4 py-2 bg-white/[0.04] border border-white/15 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>

          {/* Content */}
          {paginatedAssistants.length === 0 && filteredAssistants.length > 0 ? (
            <div className="text-center py-20 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Search size={48} className="text-white/50" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No results found</h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                No assistants match your search query "{searchQuery}". Try a different search term.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="group inline-flex items-center gap-2 px-6 py-3 border border-emerald-400/50 text-emerald-300 rounded-lg hover:bg-emerald-400/10 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : paginatedAssistants.length === 0 ? (
            <div className="text-center py-20 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Building2 size={48} className="text-white/70" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}>
                  <Zap className="w-5 h-5 text-[#141A21] m-1.5" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No assistants yet</h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                Transform your business with AI-powered assistants. Create your first one to get started.
              </p>
              <button
                onClick={() => onEdit(null)}
                className="group inline-flex items-center gap-2 px-6 py-3 border border-emerald-400/50 text-emerald-300 rounded-lg hover:bg-emerald-400/10 transition-colors"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                Create Your First Assistant
              </button>
            </div>
          ) : (
            <>
              {/* Grid of Assistants */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {paginatedAssistants.map((assistant, index) => (
                  <div
                    key={assistant.id}
                    className={`group relative bg-white/5 backdrop-blur-[10px] rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden animate-fade-in-up ${deletingId === assistant.id ? 'animate-scale-out opacity-50' : ''
                      }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onMouseEnter={() => setHoveredCard(assistant.id)}
                    onMouseLeave={() => {
                      setHoveredCard(null);
                      setShowActions(null);
                    }}
                  >
                    {/* Top-right area reserved (no extra pencil button) */}
                    <div className="absolute top-4 right-4"></div>

                    {/* Top Divider (neutral) */}
                    <div className="h-px bg-white/10"></div>

                    {/* Card Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`relative w-14 h-14 bg-gradient-to-br ${getIndustryGradient(assistant.business_meta?.industry_type)} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/20`}>
                            {getIndustryIcon(assistant.business_meta?.industry_type)}
                            <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors duration-300">
                              {assistant.name}
                            </h3>
                            <span className="inline-flex items-center h-6 bg-white/10 px-2 rounded-md text-[12px] font-bold text-white/70 capitalize ">
                              {assistant.business_meta?.industry_type || 'General'}
                            </span>
                          </div>
                        </div>

                       {/* Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActions(showActions === assistant.id ? null : assistant.id);
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                          aria-label="More options"
                        >
                          <MoreVertical size={16} className="text-white/70" />

                        </button>

                       {showActions === assistant.id && (
                          <div
                            className="
                             absolute right-0 mt-[-23px]
                              w-[160px] h-[125px]
                              rounded-xl
                              border border-white/10
                              bg-black/70                     <!-- base black -->
                              before:absolute before:inset-0  <!-- frosted overlay -->
                              before:bg-white/5               <!-- rgba(255,255,255,0.04) ≈ /5 -->
                              before:backdrop-blur-[64px]
                              before:rounded-xl
                              before:z-[-1]
                              shadow-lg z-10
                              flex flex-col p-1 gap-1
                              overflow-hidden

                            "
                          >

                            {/* Blur effects BEHIND content */}
                            <div className="absolute w-[80px] h-[80px] left-[-16px] bottom-[-16px] 
                                            bg-red-500/10 blur-[40px] rounded-full pointer-events-none z-0"></div>

                            <div className="absolute w-[80px] h-[80px] right-[-16px] top-[-16px] 
                                            bg-cyan-400/10 blur-[40px] rounded-full pointer-events-none z-0"></div>

                            {/* Menu Items - ABOVE blur */}
                            <div className="relative z-10 flex flex-col gap-1">
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/assistants/${assistant.id}`);
                                  setShowActions(null);
                                }}
                                className="flex items-center gap-1 px-3 py-2 text-sm text-white rounded-lg
                                          transition-all duration-200 hover:bg-green-600/20 hover:text-[#13F584]"
                              >
                                <img src="/images/setting1.svg" className="w-[20px] h-[20px]" />
                                Configure
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(assistant);
                                  setShowActions(null);
                                }}
                                className="flex items-center gap-1 px-3 py-2 text-sm text-white rounded-lg
                                          transition-all duration-200 hover:bg-green-600/20 hover:text-[#13F584]"
                              >
                                <img src="/images/draft.svg" className="w-[20px] h-[20px]" />
                                Edit Assistance
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(assistant.id);
                                  setShowActions(null);
                                }}
                                className="flex items-center gap-1 px-3 py-2 text-sm text-white rounded-lg
                                          transition-all duration-200 hover:bg-green-600/20 hover:text-[#13F584]"
                              >
                                <img src="/images/tash.svg" className="w-[20px] h-[20px]" />
                                Delete
                              </button>

                            </div>

                          </div>
                        )}

                      </div>

                      </div>

                      {/* Overview */}
                      <div className="mb-4">
                        <div className="text-xs text-white/60 mb-1">Overview</div>
                        <p className="text-white/70 text-sm leading-relaxed line-clamp-2">
                          {assistant.description}
                        </p>
                      </div>

                     {/* Info Box: Hours + Location */}
                      <div className="mb-6 bg-white/[0.04] border border-white/15 rounded-lg p-3">
                        <div className="flex flex-col gap-3">

                          {assistant.business_meta?.operating_hours && (
                            <div className="flex flex-row gap-1">
                              <div className="text-xs text-[#919EAB]  ">Hours:</div>
                              <div className="text-sm text-white flex items-center">
                          
                                {assistant.business_meta.operating_hours}
                              </div>
                            </div>
                          )}
                          
                          {assistant.business_meta?.address && (
                            <div className="flex flex-row gap-1">
                              <div className="text-xs text-[#919EAB] ">Location:</div>
                              <div className="text-sm text-white flex items-center">
                              
                                <span className="truncate">{assistant.business_meta.address}</span>
                              </div>
                            </div>
                          )}

                        

                        </div>
                      </div>

                    </div>

                    {/* Card Footer */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center text-xs text-white/50">
                         
                          <span>
                            Created {new Date(assistant.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            aria-pressed={assistantId === assistant.id}
                            aria-label={assistantId === assistant.id ? 'Active' : 'Inactive'}
                            onClick={() => activate(assistant)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${assistantId === assistant.id
                                ? 'bg-[#13F584] border-white/5'
                                : 'bg-white/10 border-white/5 hover:bg-white/15'
                              }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full transition ${assistantId === assistant.id ? 'translate-x-6 bg-white' : 'translate-x-1 bg-white'
                                }`}
                            />
                          </button>
                                                    <span className={`text-sm ${assistantId === assistant.id ? 'text-emerald-300' : 'text-white/70'}`}>
                            {assistantId === assistant.id ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  className="text-white/70 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={18} />
                </button>


                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`
                      px-2 py-1 transition
                      ${currentPage === page
                        ? "w-9 h-9 flex items-center justify-center rounded-full bg-white text-black font-semibold"
                        : "text-white/60 hover:text-white"
                      }
                    `}
                  >
                    {page}
                  </button>
                ))}


                <button
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  className="text-white/70 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={18} />
                </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes scale-out {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
        
        .animate-scale-out {
          animation: scale-out 0.3s ease-out forwards;
        }
        
        .animate-reverse {
          animation-direction: reverse;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AssistantList;
