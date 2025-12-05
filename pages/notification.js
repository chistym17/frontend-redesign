"use client";
import React, { useState, useEffect } from "react"; 
import { useSidebar } from '../lib/sidebarContext';
import LeftSidebar from '../components/LeftSidebar';
import NotificationsGrid from '../components/NotificationsGrid'; // Import the grid

const NotificationsPage = () => {
  const { isCollapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth <= 768);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#141A21] overflow-y-auto flex">
      {/* Sidebar */}
      <LeftSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content - Updated to center the grid vertically and horizontally */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isMobile ? 'ml-0' : isCollapsed ? 'ml-16' : 'ml-48'
        }`}
      >
                
        {/* Notifications Grid */}
        <div className="max-w-7xl mx-auto px-6 py-2">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-12 ">
             {isMobile && !mobileOpen && (
                <button
                  className="mobile-menu-btn"
                  onClick={() => setMobileOpen(true)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.8 13.1999H1.2C0.881741 13.1999 0.576516 13.0734 0.351472 12.8484C0.126428 12.6234 0 12.3181 0 11.9999C0 11.6816 0.126428 11.3764 0.351472 11.1514C0.576516 10.9263 0.881741 10.7999 1.2 10.7999H22.8C23.1182 10.7999 23.4235 10.9263 23.6485 11.1514C23.8735 11.3764 24 11.6816 24 11.9999C24 12.3181 23.8735 12.6234 23.6485 12.8484C23.4235 13.0734 23.1182 13.1999 22.8 13.1999ZM22.8 4.7999H1.2C0.881741 4.7999 0.576516 4.67347 0.351472 4.44843C0.126428 4.22339 0 3.91817 0 3.5999C0 3.28164 0.126428 2.97642 0.351472 2.75137C0.576516 2.52633 0.881741 2.3999 1.2 2.3999H22.8C23.1182 2.3999 23.4235 2.52633 23.6485 2.75137C23.8735 2.97642 24 3.28164 24 3.5999C24 3.91817 23.8735 4.22339 23.6485 4.44843C23.4235 4.67347 23.1182 4.7999 22.8 4.7999ZM22.8 21.5999H1.2C0.881741 21.5999 0.576516 21.4734 0.351472 21.2484C0.126428 21.0234 0 20.7181 0 20.3999C0 20.0817 0.126428 19.7764 0.351472 19.5514C0.576516 19.3264 0.881741 19.1999 1.2 19.1999H22.8C23.1182 19.1999 23.4235 19.3264 23.6485 19.5514C23.8735 19.7764 24 20.0817 24 20.3999C24 20.7181 23.8735 21.0234 23.6485 21.2484C23.4235 21.4734 23.1182 21.5999 22.8 21.5999Z" fill="white"/>
                  </svg>
                </button>
              )}

                </div>
    
          <NotificationsGrid />
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
