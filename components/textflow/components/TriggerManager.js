// components/textflow/components/TriggerManager.js (NEW)
// Combines Credentials and Trigger Logs in one tabbed interface
import React, { useState } from "react";
import { Key, Activity } from "lucide-react";
import CredentialsPanel from "./CredentialsPanel";
import TriggerLogsPanel from "./TriggerLogsPanel";

export default function TriggerManager({
  assistantId,
  onClose,
  onOpenCreateCredential,
  credentialsRefreshKey = 0,
  bottomOffset = 140,
}) {
  const [activeTab, setActiveTab] = useState("credentials");

  return (
    <div
    className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none px-4 sm:px-0"
    style={{ paddingBottom: bottomOffset }}
    >
      <div
        className="absolute inset-0 bg-transparent pointer-events-auto"
        onClick={onClose}
      />

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
        <div className="px-6 py-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white/90">Trigger Management</h2>
            <p className="text-sm text-white/50">Manage credentials & monitor trigger activity</p>
          </div>
          <button
            onClick={onOpenCreateCredential}
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
                <span className="hidden sm:inline text-sm font-semibold">New Credential</span>
            </button>
         
        </div>

        <div className="px-6 pb-2 mb-2 flex gap-1">
          <button
            onClick={() => setActiveTab("credentials")}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "credentials"
                ? "bg-[rgba(19,245,132,0.08)] text-[#9EFBCD]"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            <Key className="w-4 h-4 opacity-80" />
            Credentials
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "bg-[rgba(19,245,132,0.08)] text-[#9EFBCD]"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            <Activity className="w-4 h-4 opacity-80" />
            Trigger Logs
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6 template-scroll">
          {activeTab === "credentials" && (
            <CredentialsPanel assistantId={assistantId} refreshKey={credentialsRefreshKey} />
          )}
          {activeTab === "logs" && <TriggerLogsPanel assistantId={assistantId} />}
        </div>
      </div>
    </div>
  );
}