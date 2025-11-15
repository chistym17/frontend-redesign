import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AssistantTabs from '../../components/AssistantTabs';
import QnAList from '../../components/QnAList';
import QnAEditor from '../../components/QnAEditor';
import ToolsList from '../../components/ToolsList';
import ToolEditor from '../../components/ToolEditor';
import { API_ENDPOINTS } from '../../config/api';

const AssistantDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [assistant, setAssistant] = useState(null);
  const [activeTab, setActiveTab] = useState('qa');
  const [showQaForm, setShowQaForm] = useState(false);
  const [editingQa, setEditingQa] = useState(null);
  const [showToolForm, setShowToolForm] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [toolsReloadKey, setToolsReloadKey] = useState(0);

  useEffect(() => {
    if (!router.isReady || !id) return;
    const load = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.ASSISTANT(id));
        if (res.ok) {
          const data = await res.json();
          setAssistant(data);
        }
      } catch (e) {
        // noop
      }
    };
    load();
  }, [router.isReady, id]);

  const onTabChange = (key) => setActiveTab(key);

  const onQaSaved = () => {
    setShowQaForm(false);
    setEditingQa(null);
  };

  const onToolSaved = (updatedTool = null) => {
    // If we have an updated tool (from verification), close the form
    if (updatedTool) {
      setShowToolForm(false);
      setEditingTool(null);
      // Trigger tools list reload
      setToolsReloadKey(prev => prev + 1);
    } else {
      // Regular save - just close the form
      setShowToolForm(false);
      setEditingTool(null);
      // Trigger tools list reload
      setToolsReloadKey(prev => prev + 1);
    }
  };

  if (!router.isReady || !id || !assistant) {
    return (
      <div className="min-h-screen bg-[#141A21] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141A21]">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{assistant.name}</h1>
              <p className="text-white/70 mt-1">{assistant.description}</p>
            </div>
            <button 
              onClick={() => router.push('/assistants')} 
              className="px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            >
              Back to list
            </button>
          </div>
        </div>

        {/* Tabs */}
        <AssistantTabs initial={activeTab} onChange={onTabChange} />

        {/* Content */}
        {activeTab === 'qa' ? (
          showQaForm ? (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6">
              <QnAEditor assistantId={id} qa={editingQa} onSave={onQaSaved} onCancel={() => { setShowQaForm(false); setEditingQa(null); }} />
            </div>
          ) : (
            <QnAList assistantId={id} onEdit={(qa) => { setEditingQa(qa); setShowQaForm(true); }} />
          )
        ) : activeTab === 'tools' ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6">
            {showToolForm ? (
              <ToolEditor assistantId={id} tool={editingTool} onSaved={onToolSaved} onCancel={() => { setShowToolForm(false); setEditingTool(null); }} />
            ) : (
              <ToolsList
                key={toolsReloadKey}
                assistantId={id}
                onAdd={() => setShowToolForm(true)}
                onEdit={(tool) => { setEditingTool(tool); setShowToolForm(true); }}
              />
            )}
          </div>
        ) : activeTab === 'flows' ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6">
            <div className="py-8">
              {/* Header Section */}
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-3">Flow Editors</h2>
                <p className="text-white/60 max-w-2xl mx-auto">
                  Choose your preferred flow editor to create and manage conversation flows for your assistant.
                </p>
              </div>
              
              {/* Cards Container */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-[22px] max-w-4xl mx-auto">
                {/* Text Flow Editor Card */}
                <div className="relative w-full sm:w-[308px] rounded-[13px] overflow-hidden" style={{
                  background: 'linear-gradient(137deg, rgba(255, 171, 0, 1) 0%, rgba(255, 255, 255, 0) 16%, rgba(255, 255, 255, 0) 85%, rgba(255, 171, 0, 1) 100%)',
                  padding: '1px'
                }}>
                  <div className="relative bg-[#141A21] rounded-[13px] h-full">
                    <div className="relative bg-gradient-to-br from-[rgba(255,171,0,0.08)] via-[rgba(255,171,0,0.08)] to-[rgba(255,171,0,1)] backdrop-blur-[50px] rounded-[16px] p-4 flex flex-col gap-[22px]">
                      {/* Header */}
                      <div className="flex items-center gap-4">
                        <h3 className="text-sm font-semibold text-white/60">Open Text Flow Editor</h3>
                      </div>
                      
                      {/* Illustration */}
                      <div className="w-full h-[122px] rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                          src="/images/text-flow-editor-illustration.svg" 
                          alt="Text Flow Editor" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      {/* Buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => router.push(`/assistants/${id}/text-flows`)}
                          className="px-2 py-1.5 bg-[rgba(255,171,0,0.08)] border border-[rgba(255,171,0,0.3)] text-[#FFD666] rounded text-[13px] font-bold hover:bg-[rgba(255,171,0,0.15)] transition-colors"
                        >
                          Open
                        </button>
                        <button className="px-2 py-1.5 bg-white/[0.08] border border-white/10 text-white/60 rounded text-[13px] font-bold hover:bg-white/[0.12] transition-colors">
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
                    <div className="relative bg-gradient-to-br from-[rgba(255,86,48,0.08)] via-[rgba(255,86,48,0.08)] to-[rgba(255,86,48,1)] backdrop-blur-[50px] rounded-[16px] p-4 h-full flex flex-col justify-between gap-[9px]">
                      {/* Header */}
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
                          onClick={() => router.push(`/assistants/${id}/visual-flows`)}
                          className="px-2 py-1.5 bg-[rgba(255,86,48,0.08)] border border-[rgba(255,86,48,0.3)] text-[#FFAC82] rounded text-[13px] font-bold hover:bg-[rgba(255,86,48,0.15)] transition-colors"
                        >
                          Open
                        </button>
                        <button className="px-2 py-1.5 bg-white/[0.08] border border-white/10 text-white/60 rounded text-[13px] font-bold hover:bg-white/[0.12] transition-colors">
                          Documents
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AssistantDetailsPage; 