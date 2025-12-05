"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link"; // Changed from router.push to Link for consistency with target design
import { usePathname } from "next/navigation"; // Changed from useRouter to usePathname for simplicity
import Image from "next/image";
import { useSidebar } from "../lib/sidebarContext"; // Keeping this, but adapting collapse logic
// Assuming you add the CSS below to a file named LeftSidebar.css

const LeftSidebar = ({ mobileOpen, setMobileOpen }) => {
  const pathname = usePathname(); // Changed from router.pathname
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [activeRoute, setActiveRoute] = useState(pathname);

  const glowRightRef = useRef(null);
  const glowLeftRef = useRef(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
  const timer = setTimeout(() => {
    const activeItem = document.querySelector(".menu-subitem.active");
    if (!activeItem) return;

    const rect = activeItem.getBoundingClientRect();
    const sidebar = activeItem.closest(".sidebar");
    if (!sidebar) return;

    const sidebarRect = sidebar.getBoundingClientRect();

    if (glowRightRef.current)
      glowRightRef.current.style.top = rect.top - sidebarRect.top + "px";

    if (glowLeftRef.current)
      glowLeftRef.current.style.top = rect.top - sidebarRect.top + "px";
  }, 50); // slight delay so layout settles

  return () => clearTimeout(timer);
}, [mobileOpen, activeRoute]);

  

  useEffect(() => {
    const closeOnEsc = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", closeOnEsc);
    return () => document.removeEventListener("keydown", closeOnEsc);
  }, []);


  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load collapse state from localStorage (matching target)
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, [setIsCollapsed]);

  // Save collapse state on change
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => setActiveRoute(pathname), [pathname]);

  // Helper: determine active class
  const getClass = (path, baseClass = "menu-subitem") =>
    activeRoute === path ? `${baseClass} active` : baseClass;

  // Helper: get active/inactive icon (matching target)
  const getIcon = (base, isActive) => {
    if (!isActive) return base;
    const parts = base.split(".");
    return `${parts[0]}g.${parts[1]}`; // e.g. /voice.svg → /voiceg.svg (assuming you have active versions)
  };

  // Update glow position (matching target)
  useEffect(() => {
    const moveGlow = () => {
      const activeItem = document.querySelector(".menu-item.active, .menu-subitem.active");
      if (!activeItem) return;
      const sidebar = activeItem.closest(".sidebar");
      if (!sidebar) return;

      const rect = activeItem.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();

      if (glowRightRef.current) glowRightRef.current.style.top = rect.top - sidebarRect.top + "px";
      if (glowLeftRef.current) glowLeftRef.current.style.top = rect.top - sidebarRect.top + "px";
    };
    moveGlow();
  }, [activeRoute]);

  // Toggle collapse (matching target)
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  // Handle navigation (adapted for Link)
  const handleNavigation = (path, onClick) => {
    if (onClick) onClick();
    // Using Link instead of router.push
  };

  // Menu groups with labels (matching target structure)
  const menuBlocks = [
    {
      label: "Menu",
      items: [
        { image: "/images/voice.svg", label: "Home", path: "/" },
        { image: "/images/chat.svg", label: "Assistants", path: "/assistants" },
        { image: "/images/voice.svg", label: "Voice Agent", path: "/voice" },
        { image: "/images/chatbot.svg", label: "Chat Agent", path: "/chatbot" },
      ],
    },
    {
      label: "Settings",
      items: [
        { image: "/images/bill.svg", label: "Notification", path: "/notification" },
        { image: "/images/setting.svg", label: "Setting", path: "/setting" },
        {
          image: "/images/logout.svg",
          label: "Logout",
          path: "/login",
          onClick: () => {
            localStorage.removeItem("access_token");
          },
        },
      ],
    },
  ];

  // Don't render on mobile unless open (assuming isMobileOpen prop or similar; for now, keeping simple)
  // Note: Target has mobile logic, but original doesn't. Adding basic mobile check.
  if (isMobile) {
  return (
    <>
      {/* BACKDROP */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR DRAWER */}
      <aside
        className={`sidebar mobile ${mobileOpen ? "open" : ""}`}
      >
        <button
          className="collapse-btn "
          onClick={() => {
            if (isMobile) {
              setMobileOpen(false);   // close menu
            } else {
              setIsCollapsed(!isCollapsed); // collapse desktop
            }
          }}
        >
          {/* Your same icon here */}
          <img
            src="/images/ic-eva_arrow-ios-back-fill.svg"
            alt="close sidebar"
          />
        </button>

  
        {/* SAME MENU CONTENT */}
        <nav className="menu">
          
          {menuBlocks.map((block) => (
            <div key={block.label} className="menu-block">
              <div className="menu-label">{block.label}</div>

              {block.items.map((item) => {
                const active =
                  item.path === "/"
                    ? activeRoute === item.path
                    : activeRoute.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`menu-subitem ${active ? "active" : ""}`}
                    onClick={() => {
                      handleNavigation(item.path, item.onClick);
                      setMobileOpen(false); // auto-close
                    }}
                  >
                    <Image
                      src={getIcon(item.image, active)}
                      alt={item.label}
                      width={24}
                      height={24}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
         {/* Glow effects (same as desktop) */}
          <div className="sidebar-glow" ref={glowRightRef}></div>
          <div className="sidebar-glow-left" ref={glowLeftRef}></div>
      </aside>

 
    </>
  );
}


  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      
      {/* Collapse button (matching target) */}
      <button className={`collapse-btn ${isCollapsed ? "collapsed" : ""}`} onClick={toggleCollapse}>
        <img
          src={isCollapsed ? "/images/ic-eva_arrow-ios-forward-fill.svg" : "/images/ic-eva_arrow-ios-back-fill.svg"}
          alt="Toggle sidebar"
        />
      </button>

      <nav className="menu">
        {menuBlocks.map((block) => (
          <div key={block.label} className="menu-block">
            <div className="menu-label">{block.label}</div>
            {block.items.map((item) => {
              // Updated active check: Exact match for root "/", startsWith for others (handles sub-routes like /assistants/id)
              const active = item.path === "/" 
                ? activeRoute === item.path 
                : activeRoute.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`menu-subitem ${active ? 'active' : ''}`}  // Fixed: Use the 'active' variable for class (instead of getClass)
                  onClick={() => handleNavigation(item.path, item.onClick)}
                >
                  <Image
                    src={getIcon(item.image, active)}
                    alt={item.label}
                    width={24}
                    height={24}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Glow effects (matching target) */}
      <div className="sidebar-glow" ref={glowRightRef}></div>
      <div className="sidebar-glow-left" ref={glowLeftRef}></div>
    </aside>
  );
};

export default LeftSidebar;
