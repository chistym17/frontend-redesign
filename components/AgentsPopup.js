import React from 'react';
import { Search } from 'lucide-react';

const AgentsPopup = ({
  open,
  onClose,
  assistants,
  loadingAssistant,
  assistantSearch,
  setAssistantSearch,
  assistantId,
  handleAssistantChange,
  startNewSession,
  isLoadingSession,
  isConnected,  
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ WebkitBackdropFilter: "blur(16px)" }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[400px] max-h-[95vh] flex flex-col p-6 gap-5 isolate rounded-3xl overflow-y-auto overflow-x-hidden custom-scrollbar"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(80, 80, 80, 0.24)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between relative mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Agent List</h3>
            <p className="text-sm text-white/50 mt-1">Select an assistant to start the chat</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition"
          >
            ×
          </button>
        </div>

        {/* New Session Button */}
        {(isConnected || isLoadingSession) && (
            <button
                type="button"
                onClick={startNewSession}
                disabled={isLoadingSession}
                className="mb-3 inline-flex items-center justify-center rounded-[8px] bg-[rgba(19,245,132,0.08)] px-4 py-2.5 text-[11px] font-medium text-[#9EFBCD] transition-all duration-200 hover:bg-[rgba(19,245,132,0.14)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                New Session
            </button>
            )}


        {/* Search */}
        <div className="relative mb-4">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            size={20}
          />
          <input
            value={assistantSearch}
            onChange={(e) => setAssistantSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full rounded-[10px] border-2 border-[rgba(145,158,171,0.2)] bg-transparent py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/40 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            disabled={loadingAssistant}
          />
        </div>

        {/* Assistant List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loadingAssistant ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-16 animate-pulse rounded-2xl bg-white/5"
                  style={{ animationDelay: `${idx * 80}ms` }}
                />
              ))}
            </div>
          ) : assistants.length ? (
            assistants.map((assistant) => {
              const isActive = assistantId === assistant.id;
              const rawName = assistant.name || "Untitled Assistant";
              const displayName =
                rawName.length > 20 ? `${rawName.slice(0, 20)}...` : rawName;
              return (
                <button
                  key={assistant.id}
                  onClick={() => handleAssistantChange(assistant.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left ${
                    isActive ? "bg-white/5 hover:bg-white/10" : "bg-transparent hover:bg-white/10"
                  }`}
                >
                  <span className="text-base text-white truncate">{displayName}</span>
                  {isActive && <div className="h-5 w-5 rounded-full border-4 border-[#13F584]" />}
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-12 text-center text-sm text-white/50">
              No assistants found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentsPopup;
