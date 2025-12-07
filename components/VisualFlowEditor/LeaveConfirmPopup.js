"use client";

import { useState } from "react";

export default function LeaveConfirmPopup({ onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);

  return (
    <div
  className="relative flex flex-col items-center p-6 sm:px-6
             bg-white/5 border border-[rgba(80,80,80,0.24)]
             backdrop-blur-[37px] rounded-[16px]
             w-[90vw] max-w-[420px] min-h-[180px] text-center"
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
  className="w-[100px] h-[40px] px-3 py-0 flex items-center justify-center gap-2
             text-[#FFC864] bg-[rgba(255,200,100,0.10)] rounded-lg font-bold text-sm
             transition disabled:opacity-50"
>
  {loading ? "Leaving..." : "Leave"}
</button>


        <button
  onClick={onClose}
  className="w-[100px] h-[40px] px-3 py-0 flex items-center justify-center
             text-[#9EFBCD] bg-[rgba(19,245,132,0.08)] rounded-lg font-bold text-sm
             transition hover:scale-[1.02]"
>
  Stay
</button>

      </div>
    </div>
  );
}
