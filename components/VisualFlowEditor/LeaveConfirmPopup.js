"use client";

import { useState } from "react";

export default function LeaveConfirmPopup({ onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center p-6 gap-4
                 bg-white/5 border border-[rgba(80,80,80,0.24)]
               
                 backdrop-blur-[37px] rounded-[16px]
                 w-[420px] min-h-[180px] text-center"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center
                   rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition"
      >
        ×
      </button>

      <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-yellow-400">
        Unsaved Changes
      </h1>

      <p className="text-gray-300 text-sm max-w-[320px]">
        You have <span className="text-yellow-300 font-semibold">unsaved changes</span>.  
        Are you sure you want to leave this page?
      </p>

      <div className="flex gap-4 mt-4">
        <button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            await onConfirm();
          }}
          className="relative w-[150px] h-[35px] rounded-full bg-white/[0.05] border border-white/10 
                     shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white 
                     font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden mt-2"
        >
          <span className="absolute inset-0 rounded-full 
                           bg-[radial-gradient(circle,rgba(255,200,100,0.5)_0%,transparent_70%)] blur-md" />
          <span className="relative z-10">
            {loading ? "Leaving..." : "Leave"}
          </span>
        </button>

        <button
          onClick={onClose}
          className="relative w-[150px] h-[35px] rounded-full bg-white/[0.05] border border-white/10 
                     shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white 
                     font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden mt-2"
        >
          <span className="absolute inset-0 rounded-full 
                           bg-[radial-gradient(circle,rgba(99,175,255,0.5)_0%,transparent_70%)] blur-md" />
          <span className="relative z-10">Stay</span>
        </button>
      </div>
    </div>
  );
}
