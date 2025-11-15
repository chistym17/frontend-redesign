import React from 'react';
import { useRouter } from 'next/router';
import { useSidebar } from '../lib/sidebarContext';
import {
    Home,
    Building2,
    MessageSquare,
    AudioLines,
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const LeftSidebar = () => {
    const router = useRouter();
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const [activeRoute, setActiveRoute] = React.useState(router.pathname);

    React.useEffect(() => {
        setActiveRoute(router.pathname);
    }, [router.pathname]);

    const handleNavigation = (path) => {
        router.push(path);
    };

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Building2, label: 'Assistants', path: '/assistants' },
        { icon: MessageSquare, label: 'Chat', path: '/chatbot' },
        { icon: AudioLines, label: 'Voice', path: '/voice' },
    ];

    const bottomItems = [
        {
            icon: LogOut, label: 'Logout', path: '/login', onClick: () => {
                localStorage.removeItem('access_token');
                router.push('/login');
            }
        },
    ];

    const isActive = (path) => {
        if (path === '/') {
            return activeRoute === '/' || activeRoute === '/index';
        }
        return activeRoute.startsWith(path);
    };

    return (
        <div className={`fixed left-0 top-0 h-full bg-white/[0.05] backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex flex-col ${isCollapsed ? 'w-16' : 'w-48'
            }`}>
            {/* Top Section */}
            <div className="flex-1 flex flex-col py-4">
                {/* Logo/Home Button */}
                <div className={isCollapsed ? 'px-2' : 'px-4 mb-6'}>
                    <button
                        onClick={() => handleNavigation('/')}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors ${isActive('/')
                                ? 'bg-emerald-500/20 border border-emerald-400/40'
                                : 'hover:bg-white/5'
                            }`}
                    >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isActive('/') ? 'bg-emerald-400/30' : 'bg-white/5'
                            }`}>
                            <Home size={18} className={isActive('/') ? 'text-emerald-300' : 'text-white/70'} />
                        </div>
                        {!isCollapsed && (
                            <span className={`text-sm font-medium ${isActive('/') ? 'text-emerald-300' : 'text-white/70'
                                }`}>
                                Home
                            </span>
                        )}
                    </button>
                </div>

                {/* Navigation Items */}
                <div className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} space-y-2`}>
                    {navItems.slice(1).map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigation(item.path)}
                                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors ${active
                                        ? 'bg-emerald-500/20 border border-emerald-400/40'
                                        : 'hover:bg-white/5'
                                    }`}
                                title={isCollapsed ? item.label : ''}
                            >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-emerald-400/30' : 'bg-white/5'
                                    }`}>
                                    <Icon size={18} className={active ? 'text-emerald-300' : 'text-white/70'} />
                                </div>
                                {!isCollapsed && (
                                    <span className={`text-sm font-medium ${active ? 'text-emerald-300' : 'text-white/70'
                                        }`}>
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Section */}
            <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-4 border-t border-white/10 space-y-2`}>
                {bottomItems.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <button
                            key={index}
                            onClick={item.onClick || (() => handleNavigation(item.path))}
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors hover:bg-white/5 text-white/70 hover:text-white`}
                            title={isCollapsed ? item.label : ''}
                        >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
                                <Icon size={18} />
                            </div>
                            {!isCollapsed && (
                                <span className="text-sm font-medium">{item.label}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Collapse Toggle - Floating in Middle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/20 hover:bg-white/12 transition-all duration-200 text-white/70 hover:text-white shadow-lg z-50"
                style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)'
                }}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
        </div>
    );
};

export default LeftSidebar;

