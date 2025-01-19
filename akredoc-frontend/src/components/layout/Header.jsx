import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Bell, ChevronDown, Menu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import TabButton from '../ui/TabButton';
import NotificationsMenu from '../ui/NotificationsMenu';
import Calendar from '../ui/Calendar';

const Header = ({
    activeTab,
    setActiveTab,
    userProfile,
    onLogout,
    notifications = []
}) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const headerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (headerRef.current && !headerRef.current.contains(event.target)) {
                setShowNotifications(false);
                setShowProfileMenu(false);
                setShowMobileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setShowNotifications(false);
                setShowProfileMenu(false);
                setShowMobileMenu(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const showTabs = ['/dashboard', '/statistics', '/log-aktivitas', '/manajemen-dokumen', '/ppepp'].includes(location.pathname);

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        const routes = {
            documents: '/dashboard',
            statistics: '/statistics'
        };
        navigate(routes[tab] || '/dashboard');
        setShowMobileMenu(false);
    }, [setActiveTab, navigate]);

    const toggleNotifications = useCallback(() => {
        setShowNotifications(prev => !prev);
        setShowProfileMenu(false);
        setShowMobileMenu(false);
    }, []);

    const toggleProfileMenu = useCallback(() => {
        setShowProfileMenu(prev => !prev);
        setShowNotifications(false);
        setShowMobileMenu(false);
    }, []);

    const toggleMobileMenu = useCallback(() => {
        setShowMobileMenu(prev => !prev);
        setShowNotifications(false);
        setShowProfileMenu(false);
    }, []);

    return (
        <header
            ref={headerRef}
            className="sticky top-0 z-50 w-full bg-white/80 border-b border-gray-200 backdrop-blur-lg shadow-sm"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    {/* Logo and Navigation */}
                    <div className="flex items-center gap-4 sm:gap-8">
                        <Link
                            to="/dashboard"
                            className="group transition-transform duration-200 hover:scale-105 focus:outline-none"
                        >
                            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                                AkreDoc
                            </h1>
                            <span className="block text-xs sm:text-sm bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent font-medium">
                                TIUY
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        {showTabs && (
                            <nav className="hidden md:flex items-center gap-2">
                                {["documents", "statistics"].map((tab) => (
                                    <TabButton
                                        key={tab}
                                        tab={tab}
                                        activeTab={activeTab}
                                        onClick={() => handleTabChange(tab)}
                                        className="focus:outline-none"
                                    />
                                ))}
                            </nav>
                        )}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2 sm:gap-6">
                        {/* Current Date */}
                        <div className="hidden md:block">
                            <Calendar />
                        </div>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={toggleNotifications}
                                className="group p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none"
                                aria-label="Notifications"
                                aria-expanded={showNotifications}
                            >
                                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 group-hover:text-emerald-600 transition-colors" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                                )}
                            </button>
                            <NotificationsMenu
                                show={showNotifications}
                                setShow={setShowNotifications}
                                notifications={notifications}
                            />
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="md:hidden p-1.5 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                            aria-label="Menu"
                            aria-expanded={showMobileMenu}
                        >
                            <Menu className="h-5 w-5 text-gray-700" />
                        </button>

                        {/* Desktop Profile Menu */}
                        <div className="relative hidden md:block">
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                                        {userProfile?.name || 'Tamu'}
                                    </p>
                                    <p className="text-xs text-gray-600 line-clamp-1">
                                        {userProfile?.role || 'Memuat...'}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleProfileMenu}
                                    className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                                    aria-label="User menu"
                                    aria-expanded={showProfileMenu}
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <span className="text-sm font-medium text-emerald-700">
                                            {userProfile?.name?.charAt(0) || 'G'}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-600" />
                                </button>
                            </div>
                            {/* Desktop Profile Menu Dropdown */}
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 z-50 border border-gray-100">
                                    <div className="py-3">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="font-medium text-sm text-gray-800">
                                                {userProfile?.name || "Tamu"}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {userProfile?.role || "Memuat..."}
                                            </p>
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            Pengaturan Profil
                                        </Link>
                                        <button
                                            onClick={onLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            Keluar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className="md:hidden border-t border-gray-200 py-2">
                        {/* Mobile Navigation */}
                        {showTabs && (
                            <nav className="flex flex-col gap-1 mb-2">
                                {["documents", "statistics"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => handleTabChange(tab)}
                                        className={`w-full text-left px-4 py-2 text-sm ${activeTab === tab
                                            ? 'bg-emerald-50 text-emerald-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            } transition-colors duration-200`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </nav>
                        )}

                        {/* Mobile Profile Info */}
                        <div className="px-4 py-2 border-t border-gray-200">
                            <p className="font-medium text-sm text-gray-800">
                                {userProfile?.name || "Tamu"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {userProfile?.role || "Memuat..."}
                            </p>
                            <div className="mt-2 flex flex-col gap-1">
                                <Link
                                    to="/profile"
                                    className="block py-2 text-sm text-gray-700 hover:text-emerald-600 transition-colors duration-200"
                                >
                                    Pengaturan Profil
                                </Link>
                                <button
                                    onClick={onLogout}
                                    className="w-full text-left py-2 text-sm text-gray-700 hover:text-emerald-600 transition-colors duration-200"
                                >
                                    Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;