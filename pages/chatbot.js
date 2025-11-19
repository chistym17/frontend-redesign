"use client";

import { useSidebar } from '../lib/sidebarContext';
import LeftSidebar from '../components/LeftSidebar';
import ChatInterface from "../components/ChatInterface";

const ChatbotPage = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-0 h-auto bg-[#141A21] text-white">
      {/* Sidebar */}
      <LeftSidebar />

      {/* Main Content - Updated to center the grid vertically and horizontally */}
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-48'} flex items-center justify-center`}>
        {/* Notifications Grid */}
     <div className="px-2 pt-2 pb-2 w-full max-w-6xl ">
  <ChatInterface />
</div>

      </div>
    </div>
  );
};

export default ChatbotPage;
