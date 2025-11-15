// components/textflow/components/TriggerManager.js (NEW)
// Combines Credentials and Trigger Logs in one tabbed interface
import React, { useState } from "react";
import { X, Key, Activity } from "lucide-react";
import CredentialsPanel from "./CredentialsPanel";
import TriggerLogsPanel from "./TriggerLogsPanel";

export default function TriggerManager({ assistantId, onClose }) {
  const [activeTab, setActiveTab] = useState("credentials");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div 
        className="relative rounded-3xl w-full max-w-4xl h-[80vh] max-h-[80vh] shadow-2xl flex flex-col overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Trigger Management</h2>
            <p className="text-sm text-gray-200 mt-1">Manage credentials and monitor trigger activity</p>
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
        <div className="px-6 py-3 border-b border-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("credentials")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "credentials"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                  : "text-gray-200 hover:text-gray-100"
              }`}
              style={activeTab !== "credentials" ? {
                background: 'rgba(255, 255, 255, 0.08)'
              } : {}}
            >
              <Key className="w-4 h-4" />
              Credentials
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "logs"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                  : "text-gray-200 hover:text-gray-100"
              }`}
              style={activeTab !== "logs" ? {
                background: 'rgba(255, 255, 255, 0.08)'
              } : {}}
            >
              <Activity className="w-4 h-4" />
              Trigger Logs
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          {activeTab === "credentials" && (
            <CredentialsPanel assistantId={assistantId} />
          )}
          {activeTab === "logs" && (
            <TriggerLogsPanel assistantId={assistantId} />
          )}
        </div>
      </div>
    </div>
  );
}