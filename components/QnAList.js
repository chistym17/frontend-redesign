import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MessageSquare, Tag, Zap, Settings, GitBranch, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { useSidebar } from '../lib/sidebarContext';
import { useRouter } from 'next/router';
import LeftSidebar from './LeftSidebar';
import QnAModal from './QnAModal';
import ToolsList from './ToolsList';
import ToolEditor from './ToolEditor';
import Image from "next/image";

const QnAList = ({ assistantId, onEdit }) => {
  const [qaEntries, setQaEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('qa');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQa, setEditingQa] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showToolEditor, setShowToolEditor] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [toolsReloadKey, setToolsReloadKey] = useState(0);
  const { isCollapsed } = useSidebar();
  const router = useRouter();

  useEffect(() => {
    fetchQaEntries();
  }, [assistantId]);

  const fetchQaEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.QA_LIST(assistantId));
      if (!response.ok) {
        throw new Error('Failed to fetch Q&A entries');
      }
      const data = await response.json();
      setQaEntries(data);
    } catch (error) {
      console.error('Error fetching Q&A entries:', error);
      setError('Failed to load Q&A entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (qaId) => {
    if (!confirm('Are you sure you want to delete this Q&A entry?')) {
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.QA_DELETE(assistantId, qaId), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete Q&A entry');
      }

      setQaEntries(prev => prev.filter(qa => qa.id !== qaId));
    } catch (error) {
      console.error('Error deleting Q&A entry:', error);
      alert('Failed to delete Q&A entry. Please try again.');
    }
  };

  const handleOpenModal = (qa = null) => {
    setEditingQa(qa);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQa(null);
  };

  const handleSave = () => {
    fetchQaEntries(); // Refresh the list after saving
    // Modal handles its own closing, no need to call onEdit callback
  };

  const handleAddTool = () => {
    setEditingTool(null);
    setShowToolEditor(true);
  };

  const handleEditTool = (tool) => {
    setEditingTool(tool);
    setShowToolEditor(true);
  };

  const handleToolSaved = () => {
    setShowToolEditor(false);
    setEditingTool(null);
  };

  const tabs = [
    { key: 'qa', label: 'Q&A', icon: MessageSquare },
    { key: 'tools', label: 'Tools', icon: Settings },
    { key: 'flows', label: 'Visual Flows', icon: GitBranch },
  ];

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
            <MessageSquare className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Oops! Something went wrong</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchQaEntries}
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
              {/* Tabs first */}
            <div className="mb-6">
              <nav className="flex space-x-2">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`
                        flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${isActive ? 'bg-emerald-500/10 text-emerald-200' : 'text-white/60 hover:text-white/80 hover:bg-white/10'}
                      `}
                      
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>


              {/* Header + Add button under tabs */}
              <div className="flex justify-between items-center mb-6">
                {activeTab === 'qa' && (
                  <>
                    <h1 className="text-2xl font-bold text-white flex flex-col gap-1">
                      {/* First line with icon */}
                      <span className="flex items-center gap-2">
                        Question & Answer
                      </span>

                      {/* Second line: additional info */}
                      <span className="text-white/60 text-base font-normal">
                        Explore detailed answers and practical solutions to all your queries in one convenient place.

                      </span>
                    </h1>

                    <button
                      onClick={() => handleOpenModal(null)}
                      className="group inline-flex items-center gap-2 px-4 py-2 border border-emerald-400/50 text-emerald-300 rounded-lg hover:bg-emerald-400/10 transition-colors"
                       style={{
                        color: "#13F584",
                        border: "1px solid #13F584"
                      }}
                    >
                      <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                      Add Q&A
                    </button>
                  </>
                )}

                {activeTab === 'tools' && (
                  <>
                    <h1 className="text-2xl font-bold text-white flex flex-col gap-1">
                      {/* First line with icon */}
                      <span className="flex items-center gap-2">
                        Tools
                      </span>

                      {/* Second line: additional info */}
                      <span className="text-white/60 text-base font-normal">
                        Discover a variety of efficient tools designed to streamline tasks and boost your productivity.
                      </span>
                    </h1>
                    {!showToolEditor && (
                      <button
                        onClick={handleAddTool}
                        className="group inline-flex items-center gap-2 px-4 py-2 border border-emerald-400/50 text-emerald-300 rounded-lg hover:bg-emerald-400/10 transition-colors"
                      >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        Add Tool
                      </button>
                    )}
                  </>
                )}

                {activeTab === 'flows' && (
                  <h1 className="text-2xl font-bold text-white flex flex-col gap-1">
                      {/* First line with icon */}
                      <span className="flex items-center gap-2">
                        Visual Flows
                      </span>

                      {/* Second line: additional info */}
                      <span className="text-white/60 text-base font-normal">
                        Choose your preferred flow editor to create and manage conversation flows for your assistant.
                      </span>
                    </h1>
                )}
              </div>
            </div>


          {/* Content */}
          {activeTab === 'qa' && (
            <>
              {qaEntries.length === 0 ? (
                <div className="text-center py-20 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="relative mb-8">
                    <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <MessageSquare size={48} className="text-white/70" />
                    </div>
                
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">No Q&A entries yet</h3>
                  <p className="text-white/60 mb-8 max-w-md mx-auto">
                    Add Q&A pairs to help your AI assistant answer common questions.
                  </p>
                  <button
                    onClick={() => handleOpenModal(null)}
                    className="group inline-flex items-center gap-2 px-6 py-3 border border-emerald-400/50 text-emerald-300 rounded-lg hover:bg-emerald-400/10 transition-colors"
                  >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    Add Your First Q&A
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl mx-auto">
                  {qaEntries.slice(0, showAll ? qaEntries.length : 4).map((qa, index) => (
                    <div
                      key={qa.id}
                      className="group relative bg-white/5 backdrop-blur-xl rounded-2xl hover:border-white/20 transition-all duration-500 overflow-hidden animate-fade-in-up p-6 w-full md:w-[744px]"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Top Divider */}
                      

                      {/* Header with Actions */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors duration-300">
                            {qa.question}
                          </h4>
                        </div>

                        {/* Action Buttons - Top Right */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleOpenModal(qa)}
                            className="rounded-full hover:bg-white/10 transition-colors"
                            title="Edit"
                          >
                            <Image
                              src="/images/editbutton.svg"   // your image path
                              alt="Edit"
                              width={36}
                              height={36}
                              className="object-contain"
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(qa.id)}
                            className="rounded-full hover:bg-white/10 transition-colors"
                            title="Delete"
                          >
                            <Image
                              src="/images/trashbutton.svg"   // your image path
                              alt="Delete"
                              width={36}
                              height={36}
                              className="object-contain"
                            />
                          </button>
                        </div>
                      </div>

                      {/* Answer Section */}
                      <div className="mb-4">
                        <p className="text-sm text-white/70 leading-relaxed">
                          {qa.answer.length > 200 ? qa.answer.slice(0, 300) + '...' : qa.answer}
                        </p>
                      </div>

                      {/* Info Section - Only Category */}
                      {qa.category && (
                        <div className="flex items-center pt-4  border-white/10">
                          <div className="flex items-center gap-2">
                            
                            <span className="w-[60px] h-[22px] text-sm leading-[22px] text-white/50">Category:</span>
                            <div className=" bg-white/5 rounded-lg flex items-center justify-center border border-white/10 px-2 py-1">
                              <span className="text-sm text-white/70">{qa.category}</span>
                            </div>
                            
                          </div>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>
                    </div>
                  ))}

                  {/* Show More/Less Button */}
                  {qaEntries.length > 4 && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setShowAll(!showAll)}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors"
                      >
                        {showAll ? (
                          <>
                            <ChevronUp size={16} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            Show More ({qaEntries.length - 4} more)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'tools' && (
            <>
              {showToolEditor ? (
                // {showToolEditor ? (
              <div className="max-w-6xl mx-auto">
                <ToolEditor
                  assistantId={assistantId}
                  tool={editingTool}
                  isOpen={showToolEditor}  // <-- Add this line
                  onCancel={() => {
                    setShowToolEditor(false);
                    setEditingTool(null);
                  }}
                  onSaved={(updatedTool) => {
                    setShowToolEditor(false);
                    setEditingTool(null);
                    // Trigger ToolsList reload
                    setToolsReloadKey(prev => prev + 1);
                  }}
                />
              </div>
            ) : (
              <ToolsList
                key={toolsReloadKey}
                assistantId={assistantId}
                onAdd={handleAddTool}
                onEdit={handleEditTool}
              />
            )}

            </>
          )}

          {activeTab === 'flows' && (
            <div className="py-8">
       
              {/* Cards Container */}
            <div className="flex flex-col sm:flex-row items-start justify-start gap-[22px]">
                  {/* Text Flow Editor Card */}
                <div className="relative w-full sm:w-[308px] h-[250px] rounded-[13px] overflow-hidden" style={{
                  background: 'linear-gradient(137deg, rgba(255, 170, 0, 0.76) 0%, rgba(255, 255, 255, 0) 16%, rgba(255, 255, 255, 0) 85%, rgba(255, 170, 0, 0.76) 100%)',

                  padding: '1px'
                }}>
                  <div className="relative bg-[#141A21] rounded-[13px] h-full">
                    <div
                          className="w-full h-full rounded-[13px] flex flex-col items-start p-4 gap-[22px]"
                          style={{
                            background: 'linear-gradient(65.01deg, rgba(255, 171, 0, 0.016) 72.99%, rgba(255, 171, 0, 0.2) 105.54%), linear-gradient(241.66deg, rgba(255, 171, 0, 0.016) 72.3%, rgba(255, 171, 0, 0.2) 108.14%), rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(25px)',
                            borderRadius: '16px'
                          }}

                        >
                      <div className="flex items-center gap-4">
                        <h3 className="text-sm font-semibold text-white/60">Open Text Flow Editor</h3>
                      </div>

                      {/* Illustration */}
                      <div className="w-full flex-1 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src="/images/text-flow-editor-illustration.svg"
                          alt="Visual Flow Editor"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => router.push(`/assistants/${assistantId}/text-flows`)}
                          className="flex justify-center items-center px-2 py-1.5 w-[64px] min-w-[64px] h-[30px] bg-[rgba(255,171,0,0.08)] rounded-[8px] font-['Public Sans'] font-bold text-[13px] leading-[22px] text-[#FFD666] hover:bg-[rgba(255,171,0,0.15)] transition-colors"

                        >
                          Open
                        </button>
                        <button className="flex justify-center items-center px-2 py-1.5 w-[87px] min-w-[64px] h-[30px] bg-[rgba(145,158,171,0.08)] rounded-[8px] font-['Public Sans'] font-bold text-[13px] leading-[22px] text-[#FFFFFF] hover:bg-[rgba(145,158,171,0.12)] transition-colors">
                          Documents
                        </button>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Visual Flow Editor Card */}
                <div className="relative w-full sm:w-[308px] h-[250px] rounded-[13px] overflow-hidden" style={{
                  background: 'linear-gradient(137deg, rgba(255, 86, 48, 1) 0%, rgba(255, 255, 255, 0) 16%, rgba(255, 255, 255, 0) 85%, rgba(255, 86, 48, 1) 100%)',
                  padding: '1px'
                }}>
                  <div className="relative bg-[#141A21] rounded-[13px] h-full">
                    <div
                          className="w-full h-full rounded-[13px] flex flex-col items-start p-4 gap-[22px]"
                          style={{
                            background: 'linear-gradient(59.16deg, rgba(255, 86, 48, 0.016) 71.78%, rgba(255, 86, 48, 0.2) 124.92%), linear-gradient(237.57deg, rgba(255, 86, 48, 0.016) 63.01%, rgba(255, 86, 48, 0.2) 103.49%), rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(25px)',
                            borderRadius: '16px'
                          }}

                        >
                      <div className="flex items-center gap-4">
                        <h3 className="text-sm font-semibold text-white/60">Open Visual Flow Editor</h3>
                      </div>

                      {/* Illustration */}
                      <div className="w-full flex-1 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src="/images/visual-flow-editor-illustration.svg"
                          alt="Visual Flow Editor"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => router.push(`/assistants/${assistantId}/visual-flows`)}
                          className="flex justify-center items-center px-2 py-1.5 w-[64px] min-w-[64px] h-[30px] bg-[rgba(255,86,48,0.08)] rounded-[8px] font-['Public Sans'] font-bold text-[13px] leading-[22px] text-[#FFAC82] hover:bg-[rgba(255,86,48,0.08)] transition-colors"
                        >
                          Open
                        </button>
                        <button className="flex justify-center items-center px-2 py-1.5 w-[87px] min-w-[64px] h-[30px] bg-[rgba(145,158,171,0.08)] rounded-[8px] font-['Public Sans'] font-bold text-[13px] leading-[22px] text-[#FFFFFF] hover:bg-[rgba(145,158,171,0.12)] transition-colors">
                          Documents
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Q&A Modal */}
        <QnAModal
          assistantId={assistantId}
          qa={editingQa}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
        />

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
          
          .animate-reverse {
            animation-direction: reverse;
          }
        `}</style>
      </div>
    </div>
  );
};

export default QnAList; 