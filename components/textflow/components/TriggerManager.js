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
}) {
  const [activeTab, setActiveTab] = useState("credentials");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />

      <div
        className="relative rounded-3xl w-full max-w-xl h-[50vh] max-h-[50vh] shadow-2xl flex flex-col overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <div className="px-6 py-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white/90">Trigger Management</h2>
            <p className="text-[11px] text-white/50">Manage credentials & monitor trigger activity</p>
          </div>
          <button
            onClick={onOpenCreateCredential}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all text-center flex items-center gap-1.5"
            style={{
              color: "#9EFBCD",
              background: "rgba(19, 245, 132, 0.08)",
            }}
          >
            New Credential
          </button>
        </div>

        <div className="px-6 pb-2 mb-2 flex gap-1">
          <button
            onClick={() => setActiveTab("credentials")}
            className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeTab === "credentials"
                ? "bg-[rgba(19,245,132,0.08)] text-[#9EFBCD]"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            <Key className="w-2.5 h-2.5 opacity-80" />
            Credentials
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeTab === "logs"
                ? "bg-[rgba(19,245,132,0.08)] text-[#9EFBCD]"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            <Activity className="w-2.5 h-2.5 opacity-80" />
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