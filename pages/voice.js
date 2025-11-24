"use client";

import { useSidebar } from '../lib/sidebarContext';
import LeftSidebar from '../components/LeftSidebar';
import VoiceAgent from "../components/VoiceAgent";

const OrderPage = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-0 h-auto bg-[#141A21] text-white">
      {/* Sidebar */}
      <LeftSidebar />

      {/* Main Content - Updated to center the grid vertically and horizontally */}
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-14' : 'ml-20'} flex items-start justify-center py-2`}>


        {/* Notifications Grid */}
     <div className="px-2 pt-2 pb-2 w-full">
  <VoiceAgent />
</div>

      </div>
    </div>
  );
};

export default OrderPage;
