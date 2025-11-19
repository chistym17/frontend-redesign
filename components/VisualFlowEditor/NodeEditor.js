// NodeEditor.js - Production-grade minimal design
import React, { useState, useEffect } from 'react';
import FunctionMultiSelect from '../FunctionMultiSelect';

export default function NodeEditor({ node, assistantId, onUpdate, toolsRefreshTrigger = 0 }) {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    prompt: '',
    functions: [],
    respond_immediately: true,
  });
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (node?.data) {
      setFormData({
        id: node.data.id || '',
        title: node.data.title || '',
        prompt: node.data.prompt || '',
        functions: node.data.functions || [],
        respond_immediately: node.data.respond_immediately !== false,
      });
    }
  }, [node]);

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center bg-[#141A21]">
        <p className="text-sm text-white/60">Select a node to configure</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'prompt', label: 'Prompt' },
    { id: 'functions', label: 'Function' },
    { id: 'behavior', label: 'Behavior' },
  ];

  return (
    <div 
      className="h-full flex flex-col bg-[#141A21] text-white"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '1.5px solid',
        borderImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 51%, rgba(255, 255, 255, 0) 76%, rgba(255, 255, 255, 0.1) 100%) 1'
      }}
    >
      {/* Tabs Container - Compact */}
      <div className="px-3 py-1.5">
        <div 
          className="rounded-2xl p-1"
   
        >
          <div className="flex items-center justify-between gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-1.5 text-[10px] font-medium transition-colors relative uppercase ${
                  activeTab === tab.id
                    ? 'text-[#13F584]'
                    : 'text-white/60 hover:text-white/80'
                }`}
                style={
                  activeTab === tab.id
                    ? {
                        borderBottom: '2px solid #13F584'
                      }
                    : {}
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* General Tab - Compact */}
        {activeTab === 'general' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-white/60 uppercase">
                Node ID
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white/4 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#13F584] focus:outline-none focus:ring-1 focus:ring-[#13F584]/50 transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.00)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                placeholder="menu_handler"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-white/60 uppercase">
                Display Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white/4 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#13F584] focus:outline-none focus:ring-1 focus:ring-[#13F584]/50 transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.00)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                placeholder="Menu Handler"
              />
            </div>
          </div>
        )}

        {/* Prompt Tab */}
        {activeTab === 'prompt' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-semibold text-white/60 uppercase">
                System Prompt
              </label>
              <span className="text-[10px] text-white/60">
                {formData.prompt.length} chars
              </span>
            </div>
            <textarea
              value={formData.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              rows={16}
              className="w-full px-2.5 py-2 bg-white/4 border border-white/20 rounded-lg text-xs text-white placeholder-white/50 focus:border-[#13F584] focus:outline-none focus:ring-1 focus:ring-[#13F584]/50 transition-all font-mono leading-relaxed resize-none"
              style={{
                background: 'rgba(255, 255, 255, 0.00)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
              placeholder="Define the AI's behavior, instructions, and context for this node..."
            />
            <div className="flex items-start gap-1.5 p-2 bg-white/4 border border-white/20 rounded-lg text-[10px] text-white/60">
              <svg className="w-3 h-3 text-[#13F584] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="space-y-0.5">
                <p>Be specific about expected behavior and tone</p>
                <p>Reference available functions when relevant</p>
                <p>Include examples for complex scenarios</p>
              </div>
            </div>
          </div>
        )}

        {/* Functions Tab */}
        {activeTab === 'functions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-semibold text-white/60 uppercase">
                Available Functions
              </label>
              <span className="text-[10px] text-white/60">
                {formData.functions.length} selected
              </span>
            </div>
            
          
              <div className="flex justify-center">
              <FunctionMultiSelect
                assistantId={assistantId}
                value={formData.functions}
                onChange={(functions) => handleChange('functions', functions)}
                className="!bg-transparent !border-0"
                refreshTrigger={toolsRefreshTrigger}
              />
            </div>

            <div className="flex items-start gap-1.5 p-2 bg-white/4 border border-white/20 rounded-lg text-[10px] text-white/60">
              <svg className="w-3 h-3 text-[#13F584] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Functions enable the AI to perform actions and retrieve data during conversations</p>
            </div>
          </div>
        )}

        {/* Behavior Tab */}
        {activeTab === 'behavior' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-white/60 uppercase">
                Response Mode
              </label>
              
              <label className={`flex items-start p-2.5 border rounded-lg cursor-pointer transition-all ${
                formData.respond_immediately === true
                  ? 'bg-[#13F584]/5 border-[#13F584]/50'
                  : 'bg-white/4 border-white/20 hover:border-white/30'
              }`}
              style={formData.respond_immediately !== true ? {
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              } : {}}
              >
                <input
                  type="radio"
                  name="respond_immediately"
                  checked={formData.respond_immediately === true}
                  onChange={() => handleChange('respond_immediately', true)}
                  className="mt-0.5 mr-2 text-[#13F584] bg-white/4 border-white/20 focus:ring-[#13F584]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-medium text-white">Immediate Response</span>
                    <span className="px-1.5 py-0.5 bg-[#13F584]/16 text-[#9EFBCD] text-[10px] rounded border border-[#13F584]/20">
                      Fast
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60">
                    Respond immediately after function execution for faster interactions
                  </p>
                </div>
              </label>
              
              <label className={`flex items-start p-2.5 border rounded-lg cursor-pointer transition-all ${
                formData.respond_immediately === false
                  ? 'bg-[#13F584]/5 border-[#13F584]/50'
                  : 'bg-white/4 border-white/20 hover:border-white/30'
              }`}
              style={formData.respond_immediately !== false ? {
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              } : {}}
              >
                <input
                  type="radio"
                  name="respond_immediately"
                  checked={formData.respond_immediately === false}
                  onChange={() => handleChange('respond_immediately', false)}
                  className="mt-0.5 mr-2 text-[#13F584] bg-white/4 border-white/20 focus:ring-[#13F584]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-medium text-white">Wait for Results</span>
                    <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded border border-amber-500/20">
                      Accurate
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60">
                    Wait for function results before responding for data accuracy
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-start gap-1.5 p-2 bg-white/4 border border-white/20 rounded-lg text-[10px] text-white/60">
              <svg className="w-3 h-3 text-[#13F584] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                Use immediate mode for conversational flows. Use wait mode for operations requiring data accuracy.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}