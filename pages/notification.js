"use client";

import { useSidebar } from '../lib/sidebarContext';
import LeftSidebar from '../components/LeftSidebar';
import NotificationsGrid from '../components/NotificationsGrid'; // Import the grid

const NotificationsPage = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="fixed inset-0 bg-[#141A21] overflow-y-auto flex">
      {/* Sidebar */}
      <LeftSidebar />

      {/* Main Content - Updated to center the grid vertically and horizontally */}
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-48'} flex items-center justify-center`}>
        {/* Notifications Grid */}
        <div className="px-6 py-8 w-full max-w-6xl">
          <NotificationsGrid />
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
