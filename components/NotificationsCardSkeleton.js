"use client";

export default function NotificationsCardSkeleton() {
  return (
    
    <div className="flex items-center justify-center w-full animate-pulse">
        
      <div
        className="relative flex flex-row items-center justify-between w-full"
        style={{
          height: "76px",
          padding: "16px",
          gap: "24px",
          borderBottom: "1px dashed rgba(145,158,171,0.2)",
          background: "transparent",
          boxSizing: "border-box",
        }}
      >
        
        {/* 🩶 Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-gray-500/40 shrink-0" />

        {/* 🩶 Text placeholders */}
        <div className="flex flex-row items-center justify-between flex-1 min-w-0">
          <div className="flex flex-col items-start gap-1 min-w-0">
            {/* Title */}
            <div className="w-40 h-3 bg-gray-500/40 rounded" />
            {/* Date + type */}
            <div className="w-28 h-2 bg-gray-500/30 rounded" />
          </div>

          {/* Blue dot placeholder (unread indicator spot) */}
          <div className="w-2.5 h-2.5 rounded-full bg-gray-500/30 flex-shrink-0 mr-2" />
        </div>
      </div>
    </div>
  );
}
