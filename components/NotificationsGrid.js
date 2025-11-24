"use client";

import { useState, useEffect, useMemo } from "react";
import NotificationsCard from "./NotificationsCard";
import { createPortal } from "react-dom"; // For centered modal popup
import NotificationsCardSkeleton from "./NotificationsCardSkeleton";

// Mock data for notifications
const mockNotifications = [
  {
    id: "1",
    title: "Welcome to the platform!",
    type: "info",
    message: "Thank you for joining. Explore your dashboard.",
    read: false,
    created_at: "2023-10-01T10:00:00Z",
    user_id: "user123",
  },
  {
    id: "2",
    title: "New feature available",
    type: "update",
    message: "Check out the new chat tools in your settings.",
    read: true,
    created_at: "2023-09-28T14:30:00Z",
    user_id: "user456",
  },
  {
    id: "3",
    title: "Account verification required",
    type: "alert",
    message: "Please verify your email to continue.",
    read: false,
    created_at: "2023-09-25T09:15:00Z",
    user_id: "user789",
  },
  {
    id: "4",
    title: "Weekly summary",
    type: "report",
    message: "Your weekly activity report is ready.",
    read: true,
    created_at: "2023-09-20T16:45:00Z",
    user_id: "user101",
  },
  {
    id: "5",
    title: "Password changed",
    type: "security",
    message: "Your password was successfully updated.",
    read: false,
    created_at: "2023-09-18T11:20:00Z",
    user_id: "user202",
  },
  {
    id: "6",
    title: "Friend request",
    type: "social",
    message: "John Doe sent you a friend request.",
    read: true,
    created_at: "2023-09-15T08:00:00Z",
    user_id: "user303",
  },
  {
    id: "7",
    title: "System maintenance",
    type: "maintenance",
    message: "Scheduled maintenance on Oct 5th.",
    read: false,
    created_at: "2023-09-12T13:10:00Z",
    user_id: "user404",
  },
  {
    id: "8",
    title: "Payment received",
    type: "payment",
    message: "Your payment of $50 has been processed.",
    read: true,
    created_at: "2023-09-10T17:30:00Z",
    user_id: "user505",
  },
  {
    id: "9",
    title: "New message",
    type: "message",
    message: "You have a new message from support.",
    read: false,
    created_at: "2023-09-08T12:00:00Z",
    user_id: "user606",
  },
  {
    id: "10",
    title: "Profile updated",
    type: "profile",
    message: "Your profile picture has been updated.",
    read: true,
    created_at: "2023-09-05T15:45:00Z",
    user_id: "user707",
  },
];

export default function NotificationsGrid() {
  // Local state for mock data
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulate loading mock data
  useEffect(() => {
    const loadMockData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setNotifications(mockNotifications);
      } catch (err) {
        setError(err.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };
    loadMockData();
  }, []);

  // Mock functions to update local state
  const markAsRead = async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const refetch = async () => {
    setLoading(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
    setNotifications(mockNotifications);
    setLoading(false);
  };

  // Filters: Only read/unread (top clickable labels – no search/multi-select)
  const [selectedReadStatus, setSelectedReadStatus] = useState(""); // "" = All, "read" = read only, "unread" = unread only

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Popup state (for card click)
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  /** 🧠 Client-side filtering (by read status only – top labels) */
  const filteredData = useMemo(() => {
    let filtered = notifications || [];

    // Filter by selected read status ("" = all)
    if (selectedReadStatus === "read") {
      filtered = filtered.filter((item) => item.read === true);
    } else if (selectedReadStatus === "unread") {
      filtered = filtered.filter((item) => item.read === false);
    }

    return filtered;
  }, [notifications, selectedReadStatus]);

  /** Counts for stats (from full notifications – accurate even if filtered) */
  const totalCount = notifications.length;
  const readCount = notifications.filter((n) => n.read === true).length;
  const unreadCount = notifications.filter((n) => n.read === false).length;

  /** Pagination */
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedReadStatus]);

  /** Popup handlers (card click opens modal) */
  const handleOpenPopup = (notification) => {
    setSelectedNotification(notification);
    setIsPopupOpen(true);
  };

  const handleMarkAsReadInPopup = async () => {
    if (!selectedNotification?.id) return;
    try {
      await markAsRead(selectedNotification.id);
      setIsPopupOpen(false); // Close popup after mark
      refetch(); // Refresh grid
    } catch (err) {
      if (err instanceof Error) console.error("Mark as read failed:", err.message);
      else console.error("Mark as read failed:", err);
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedNotification(null);
  };

  // Escape key close for popup
  useEffect(() => {
    if (!isPopupOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") handleClosePopup();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isPopupOpen]);

  /** Mark All as Read (footer button) */
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      refetch(); // Refresh grid
    } catch (err) {
      if (err instanceof Error) console.error("Mark all failed:", err.message);
      else console.error("Mark all failed:", err);
    }
  };

  /** Pagination Controls */
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToLastPage = () => setCurrentPage(totalPages);

  /** Loading/Error States */
  if (loading)
    return (
      <div
        className="flex flex-col items-center justify-start mx-auto w-full max-w-[75rem] px-4 sm:px-0"
        style={{
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: "10px",
          border: "1px solid rgba(80,80,80,0.24)",
          boxShadow: "inset 0 0 7px rgba(255,255,255,0.16)",
          backdropFilter: "blur(12px)",
          overflow: "hidden",
        }}
      >
        <label className="self-start text-white font-semibold px-2 mb-2 mt-2 ml-1 py-1 text-xl">
          Notifications
        </label>
        <div className="w-full max-w-[74rem] h-[56px]   rounded-xl flex items-center justify-between px-2 mb-1 mt-1 gap-2">
          {[{ label: "All" }, { label: "Unread" }, { label: "Archived" }].map(
            (item) => (
              <div
                key={item.label}
                className="flex-1 h-[40px] rounded-xl bg-white/[0.08] animate-pulse"
              />
            )
          )}
        </div>

        {/* Skeleton notification cards */}
        <div className="flex flex-col w-full items-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <NotificationsCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center py-10 text-red-500">
        Error: {error}
      </div>
    );

  if (!notifications || notifications.length === 0)
    return (
      <div className="flex justify-center py-10 text-gray-400">
        No notifications available.
      </div>
    );

  /** Render UI */
  return (
    <>
      <div
        className="flex flex-col items-center justify-start mx-auto w-full max-w-[75rem] px-2 sm:px-2 md:px-2 py-1"
        style={{
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: "10px",
          border: "1px solid rgba(80,80,80,0.24)",
          boxShadow: "inset 0 0 7px rgba(255,255,255,0.16)",
          backdropFilter: "blur(12px)",
          overflow: "hidden",
        }}
      >
        <label className="self-start text-white font-semibold mb-1 mt-2 ml-1 text-xl">
          Notifications
        </label>
 
        {/* 🧠 Stats Summary Box */}
        <div className="w-full max-w-[74rem] h-[56px]  rounded-xl flex items-center justify-between px-2 mb-1 mt-1 gap-2">
          {[
            { label: "All", status: "", color: "#9CA3AF", count: totalCount },
            {
              label: "Unread",
              status: "unread",
              color: "rgba(0, 184, 217, 0.16)",
              count: unreadCount,
            },
            {
              label: "Archived",
              status: "read",
              color: "rgba(34, 197, 94, 0.16)",
              count: readCount,
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setSelectedReadStatus(item.status)}
              className={`flex-1 h-[40px] flex items-center justify-center gap-2 rounded-xl transition-all duration-200
                ${selectedReadStatus === item.status
                  ? "bg-white/[0.15] border border-white/20 text-white scale-[1.02]"
                  : "bg-transparent text-white/70 hover:bg-white/[0.05] hover:text-white"
                }`}
            >
              <span className="text-sm font-medium">{item.label}</span>
              <div
                className="w-6 h-6 flex items-center justify-center rounded-md text-white text-xs font-semibold shadow-sm"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 6px ${item.color}80`,
                }}
              >
                {item.count}
              </div>
            </button>
          ))}
        </div>

        {/* Cards Container (max 6 visible + frosted scrollbar) */}
        <div className="notifications-scroll flex flex-col w-full items-center overflow-y-auto custom-scrollbar">
          {filteredData.length === 0 ? (
            <p className="text-gray-400 py-10 text-center text-sm">
              No notifications found for &quot;{selectedReadStatus || "All"}&quot; status.
            </p>
          ) : (
            filteredData.map((notification) => (
              <NotificationsCard
                key={notification.id}
                type={notification.type}
                id={notification.id}
                title={notification.title}
                message={notification.message}
                read={notification.read}
                created_at={notification.created_at}
                user_id={notification.user_id}
                onOpenPopup={() => handleOpenPopup(notification)}
              />
            ))
          )}
        </div>

        <style jsx>{`
          .notifications-scroll {
            max-height: calc(6 * 76px);
            padding-right: 6px;
            scroll-behavior: smooth;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.25);
            border-radius: 16px;
            transition: background 0.3s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>
      </div>

      {/* Popup Modal */}
      {isPopupOpen && selectedNotification && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="relative flex flex-col items-start p-[0_0_24px] gap-1.5 bg-white/5 border border-[rgba(80,80,80,0.24)]
                       shadow-[inset_0_0_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px] overflow-y-auto w-full max-w-[29rem] h-auto max-h-[20rem]"
          >
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition-colors"
              aria-label="Close notification details"
            >
              ×
            </button>

            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 mt-4 ml-6">
              {selectedNotification.title || "Notification Details"}
            </h2>

            <div className="flex flex-col gap-2 w-[90%] mt-4 mx-auto overflow-y-auto max-h-[180px]">
              <label className="text-white text-sm">Message</label>
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap bg-transparent border border-[#918AAB26] rounded p-3">
                {selectedNotification.message || "No message available."}
              </p>
            </div>

            {!selectedNotification.read && (
              <button
                onClick={handleMarkAsReadInPopup}
                disabled={loading}
                className="mt-4 w-[90%] h-9 rounded-full bg-white/5 border border-white/10 shadow-[inset_0_0_4px_rgba(119,237,139,0.25)]
                           backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition-all hover:scale-[1.02] mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "..." : "Mark as Read"}
              </button>
            )}

            {selectedNotification.read && (
              <p className="text-center text-green-400 text-sm mt-4 mx-auto w-[90%]">
                ✓ Already read
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
