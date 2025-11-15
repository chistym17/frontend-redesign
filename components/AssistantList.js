import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, Building2, Calendar, MapPin, Clock, MoreHorizontal, Zap, Activity, Search, Settings } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { useRouter } from 'next/router';
import { useAssistant } from '../lib/assistantContext';
import { useSidebar } from '../lib/sidebarContext';
import LeftSidebar from './LeftSidebar';

const AssistantList = ({ onEdit, onDelete, onView }) => {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showActions, setShowActions] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredMenuItem, setHoveredMenuItem] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, assistantId: null, assistantName: '' });
  const dropdownRefs = useRef({});
  const router = useRouter();
  const { assistantId, setAssistant } = useAssistant();
  const { isCollapsed } = useSidebar();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(dropdownRefs.current).forEach((id) => {
        if (dropdownRefs.current[id] && !dropdownRefs.current[id].contains(event.target)) {
          setShowActions(null);
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    const assistant = assistants.find(a => a.id === assistantIdToDelete);
    if (assistant) {
      setDeleteModal({
        open: true,
        assistantId: assistantIdToDelete,
        assistantName: assistant.name
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.assistantId) return;

    try {
      setDeletingId(deleteModal.assistantId);
      const response = await fetch(API_ENDPOINTS.ASSISTANT(deleteModal.assistantId), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assistant');
      }

      setTimeout(() => {
        setAssistants(prev => prev.filter(assistant => assistant.id !== deleteModal.assistantId));
        setDeletingId(null);
        setDeleteModal({ open: false, assistantId: null, assistantName: '' });
      }, 300);
    } catch (error) {
      console.error('Error deleting assistant:', error);
      alert('Failed to delete assistant. Please try again.');
      setDeletingId(null);
      setDeleteModal({ open: false, assistantId: null, assistantName: '' });
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
                className="group inline-flex items-center gap-2 px-4 py-2 border border-emerald-400/50 text-emerald-300 rounded-lg hover:bg-emerald-400/10 transition-colors"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                Add Agent
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
          {filteredAssistants.length === 0 && assistants.length > 0 ? (
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
          ) : filteredAssistants.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAssistants.map((assistant, index) => (
                <div
                  key={assistant.id}
                  className={`group relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden animate-fade-in-up ${deletingId === assistant.id ? 'animate-scale-out opacity-50' : ''
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
                          <span className="inline-flex items-center h-6 bg-white/10 px-2 rounded-md text-[12px] font-bold text-white/70 capitalize border border-white/15">
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
                          <MoreHorizontal size={16} className="text-white/70" />
                        </button>

                        {showActions === assistant.id && (
                          <div
                            ref={(el) => (dropdownRefs.current[assistant.id] = el)}
                            className="absolute right-0 mt-2 w-40 rounded-xl z-10 animate-scale-in"
                            style={{
                              background: 'rgba(17, 22, 28, 0.95)',
                              backdropFilter: 'blur(128px)',
                              WebkitBackdropFilter: 'blur(128px)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              padding: '4px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/assistants/${assistant.id}`);
                                setShowActions(null);
                              }}
                              onMouseEnter={() => setHoveredMenuItem(`${assistant.id}-configure`)}
                              onMouseLeave={() => setHoveredMenuItem(null)}
                              className="w-full px-2 py-1.5 text-left flex items-center gap-2 text-sm font-medium transition-colors duration-200 rounded-md"
                              style={{
                                background: hoveredMenuItem === `${assistant.id}-configure` 
                                  ? 'rgba(19, 245, 132, 0.2)' 
                                  : 'rgba(255, 255, 255, 0.05)',
                                color: hoveredMenuItem === `${assistant.id}-configure` 
                                  ? '#13F584' 
                                  : '#FFFFFF'
                              }}
                            >
                              <Settings size={20} />
                              <span>Configure</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(assistant);
                                setShowActions(null);
                              }}
                              onMouseEnter={() => setHoveredMenuItem(`${assistant.id}-edit`)}
                              onMouseLeave={() => setHoveredMenuItem(null)}
                              className="w-full px-2 py-1.5 text-left flex items-center gap-2 text-sm font-medium transition-colors duration-200 rounded-md"
                              style={{
                                background: hoveredMenuItem === `${assistant.id}-edit` 
                                  ? 'rgba(19, 245, 132, 0.2)' 
                                  : 'rgba(255, 255, 255, 0.05)',
                                color: hoveredMenuItem === `${assistant.id}-edit` 
                                  ? '#13F584' 
                                  : '#FFFFFF'
                              }}
                            >
                              <Edit size={20} />
                              <span>Edit Assistant</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(assistant.id);
                                setShowActions(null);
                              }}
                              onMouseEnter={() => setHoveredMenuItem(`${assistant.id}-delete`)}
                              onMouseLeave={() => setHoveredMenuItem(null)}
                              className="w-full px-2 py-1.5 text-left flex items-center gap-2 text-sm font-medium transition-colors duration-200 rounded-md"
                              style={{
                                background: hoveredMenuItem === `${assistant.id}-delete` 
                                  ? 'rgba(19, 245, 132, 0.2)' 
                                  : 'rgba(255, 255, 255, 0.05)',
                                color: hoveredMenuItem === `${assistant.id}-delete` 
                                  ? '#13F584' 
                                  : '#FFFFFF'
                              }}
                            >
                              <Trash2 size={20} />
                              <span>Delete</span>
                            </button>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {assistant.business_meta?.operating_hours && (
                          <div>
                            <div className="text-xs text-white/60 mb-0.5">Hours</div>
                            <div className="text-sm text-white/90 flex items-center">
                              <Clock size={12} className="mr-2 text-white/60" />
                              {assistant.business_meta.operating_hours}
                            </div>
                          </div>
                        )}
                        {assistant.business_meta?.address && (
                          <div>
                            <div className="text-xs text-white/60 mb-0.5">Location</div>
                            <div className="text-sm text-white/90 flex items-center">
                              <MapPin size={12} className="mr-2 text-white/60" />
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
                        <Calendar size={12} className="mr-2" />
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
                              ? 'bg-emerald-400/30 border-emerald-400/40'
                              : 'bg-white/10 border-white/15 hover:bg-white/15'
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full transition ${assistantId === assistant.id ? 'translate-x-6 bg-emerald-300' : 'translate-x-1 bg-white/60'
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
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setDeleteModal({ open: false, assistantId: null, assistantName: '' })} 
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
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Assistant</h3>
                  <p className="text-xs text-gray-400">This action cannot be undone</p>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <p className="text-sm text-gray-300">
                  Are you sure you want to delete this assistant?
                </p>
                {deleteModal.assistantName && (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <p className="text-xs text-gray-400 mb-1">Assistant Name:</p>
                    <p className="text-sm text-white font-medium">"{deleteModal.assistantName}"</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center gap-2.5 pt-4">
                <button
                  onClick={() => setDeleteModal({ open: false, assistantId: null, assistantName: '' })}
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