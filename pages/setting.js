"use client";

import { useSidebar } from '../lib/sidebarContext';
import LeftSidebar from '../components/LeftSidebar';
import Settings from '../components/setting'; // Import the grid

const settingPage = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="fixed inset-0 bg-[#141A21] overflow-y-auto flex">
      {/* Sidebar */}
      <LeftSidebar />

      {/* Main Content - Updated to center the grid vertically and horizontally */}
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-48'} flex items-start justify-center `}>

        {/* Notifications Grid */}
        <div className=" w-full max-w-6xl">
          <Settings />
        </div>
      </div>
    </div>
  );
};

export default settingPage;
