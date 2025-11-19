"use client";

import Image from "next/image";
import { Bell } from "lucide-react";

export default function NotificationsCard({
  id,
  title,
  message,
  read,
  type,
  created_at,
  user_id,
  onOpenPopup,
}) {
  const truncateId = (userId, maxLength = 8) => {
    if (!userId) return "Unknown";
    return userId.length > maxLength ? `${userId.slice(0, maxLength)}...` : userId;
  };

  const handleCardClick = (e) => {
    e.preventDefault();
    onOpenPopup({
      id,
      title,
      message,
      read,
      created_at,
      user_id,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div
      className="flex items-center justify-center w-full cursor-pointer transition-all hover:bg-white/[0.08] hover:opacity-90"
      onClick={handleCardClick}
    >
      <div
        className="relative flex flex-row items-center justify-between w-full"
        style={{
          height: "76px",
          padding: "16px",
          gap: "24px",
          borderBottom: "1px dashed rgba(145,158,171,0.2)",
          background: "transparent", // Transparent background
          boxSizing: "border-box",
        }}
      >
        {/* ✅ Bell Icon */}
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-white" />
        </div>

        {/* ✅ Main Content */}
        <div className="flex flex-row items-center justify-between flex-1 min-w-0">
          {/* Left side (title + info) */}
          <div className="flex flex-col items-start gap-1 min-w-0">
            <span
              className={`text-white text-[12px] font-['Public Sans'] leading-[18px] truncate font-semibold ${
                !read ? "text-blue-300" : ""
              }`}
            >
              {title || "No title"}
            </span>

            <span className="flex items-center text-[10px] text-[rgba(204,204,204,0.5)] leading-[14px] font-['Public Sans']">
              <span className="truncate">{formatDate(created_at)}</span>
              <span className="mx-1">•</span>
              <span className="truncate">{type}</span>
            </span>
          </div>

          {/* ✅ Blue dot at end if unread */}
          {!read && (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mr-2" />
          )}
        </div>
      </div>
    </div>
  );
}
