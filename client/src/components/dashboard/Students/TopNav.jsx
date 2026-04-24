import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import authApi from '../../../api/authApi';
import notificationApi from '../../../api/notificationApi';
import dormApi from '../../../api/dormApi';
import { useTheme } from '../../../context/ThemeContext';

import {
  FaBuilding,
  FaBell,
  FaUser,
  FaWrench,
  FaExclamationTriangle,
  FaSignOutAlt,
  FaCheckCircle,
  FaChevronDown,
  FaHome,
  FaCalendarAlt,
  FaSearch,
  FaCog,
  FaQuestionCircle,
  FaExclamationCircle,
  FaBox,
  FaBars,
  FaStore,

  FaCalendarPlus,
  FaCheck,
  FaTrash,
  FaEllipsisH,
  FaInfoCircle
} from 'react-icons/fa';
import logoImg from '../../../assets/logo/logo.png';


// Constants
const NOTICE_CATEGORIES = [
  { 
    id: 'all', 
    label: 'All Notices', 
    icon: FaBell, 
    color: 'bg-blue-500',
    description: 'View all notices and announcements'
  },
  { 
    id: 'urgent', 
    label: 'Urgent', 
    icon: FaExclamationCircle, 
    color: 'bg-rose-500',
    description: 'Critical updates and urgent messages'
  },
  { 
    id: 'events', 
    label: 'Events', 
    icon: FaCalendarAlt, 
    color: 'bg-violet-500',
    description: 'Upcoming activities and campus events'
  },
  { 
    id: 'lost-found', 
    label: 'Lost & Found', 
    icon: FaBox, 
    color: 'bg-emerald-500',
    description: 'Report lost items or claim found ones'
  },
  { 
    id: 'marketplace', 
    label: 'Marketplace', 
    icon: FaStore, 
    color: 'bg-red-500',
    description: 'Browse and order campus products'
  },
];

// Removed static MENU_ITEMS to allow dynamic filtering inside the component

// USER_MENU_ITEMS is now dynamic inside the component

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = authApi.getCurrentUser();
  const role = user?.role || 'Student';

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FaHome,
      path: '/student-portal',
    },
    {
      id: 'notices',
      label: 'Notices',
      icon: FaBell,
      categories: NOTICE_CATEGORIES,
      badge: 'notification'
    },
    {
      id: 'services',
      label: 'Services',
      icon: FaWrench,
      submenu: [
        { label: 'Maintenance', path: '/maintenance', icon: FaWrench, color: 'text-amber-600' },
        { label: 'Complaints', path: '/complaints', icon: FaExclamationTriangle, color: 'text-rose-600' },
        { label: 'Exit Clearance', path: '/exit-clearance', icon: FaCheckCircle, color: 'text-emerald-600' },
        { label: 'Lost & Found', path: '/report-lost-item', icon: FaBox, color: 'text-purple-600' },
        // Restricted to EventPoster or Admin (The event is a student)
        ...((['EventPoster', 'CampusAdmin', 'SuperAdmin'].includes(role)) ? [
          { label: 'Post event', path: '/events-post', icon: FaCalendarPlus, color: 'text-violet-600' }
        ] : []),
        // Restricted to Vendor or Admin (Marketplace seller is legal vendor)
        ...((['Vendor', 'CampusAdmin', 'SuperAdmin'].includes(role)) ? [
          { label: 'Sell on marketplace', path: '/marketplace-post', icon: FaStore, color: 'text-teal-600' }
        ] : []),
      ]
    },
    {
      id: 'dormitory',
      label: 'My Dorm',
      path: '/room-details',
      icon: FaBuilding,
    }
  ];
  
  // State
  const [activeMenu, setActiveMenu] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);
  const prevUnreadCount = useRef(0);
  const pollingInterval = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (isFirstLoad = false) => {
    try {
      const res = await notificationApi.my();
      if (res.success) {
        const newUnread = res.data.filter(n => !n.read).length;

        if (!isFirstLoad && newUnread > prevUnreadCount.current) {
          const latest = res.data.find(n => !n.read);
          if (latest) {
            toast.success(latest.title, {
              icon: '🔔',
              duration: 4000,
              position: 'top-right',
              style: {
                borderRadius: '10px',
                background: '#1e293b',
                color: '#fff',
                fontSize: '14px',
              },
            });
          }
        }

        setNotifications(res.data);
        setUnreadCount(newUnread);
        prevUnreadCount.current = newUnread;
      }
    } catch (err) {
      const msg = err?.message || '';
      // Avoid spamming console when backend is offline during development
      if (msg.includes('Network Error') || msg.includes('ERR_CONNECTION_REFUSED')) {
        return;
      }
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications(true);
    pollingInterval.current = setInterval(() => fetchNotifications(false), 30000);
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [fetchNotifications]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handlers
  const handleMarkRead = async (e, id) => {
    if (e) e.stopPropagation();
    
    // Optimistic Update
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationApi.markRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      fetchNotifications(); // Revert on failure
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    
    // Find before removing for count update
    const notifToDelete = notifications.find(n => n._id === id);
    
    // Optimistic Update
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (notifToDelete && !notifToDelete.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await notificationApi.delete(id);
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      toast.error('Failed to delete notification');
      fetchNotifications(); // Revert
    }
  };

  const handleResetApplication = async () => {
    if (!window.confirm('WARNING: This will delete your current dorm application and room assignment for testing purposes. Continue?')) return;
    
    try {
      const res = await dormApi.resetMyApplication();
      if (res.success) {
        toast.success(res.message);
        navigate('/student-portal');
        window.location.reload(); // Refresh to clear states
      }
    } catch (err) {
      toast.error(err.message || 'Reset failed');
    }
  };

  const userMenuItems = [
    { label: 'My Profile', path: '/profile', icon: FaUser, color: 'text-slate-600' },
    { label: 'Settings', path: '/settings', icon: FaCog, color: 'text-slate-600' },
    ...((role === 'Student' || role === 'Vendor') && role !== 'EventPoster' ? [
      { label: 'Apply Event Access', path: '/apply-event-poster', icon: FaCalendarPlus, color: 'text-blue-600', divider: true }
    ] : []),
    { label: 'Reset Placement (Test)', action: handleResetApplication, icon: FaTrash, color: 'text-amber-600', developerOnly: true },
    { label: 'Logout', path: '/logout', icon: FaSignOutAlt, color: 'text-rose-600', divider: true }
  ];

  const handleMenuClick = (item) => {
    if (item.path) {
      navigate(item.path);
      setActiveMenu(null);
    } else {
      setActiveMenu(activeMenu === item.id ? null : item.id);
    }
    setIsMobileMenuOpen(false);
  };

  const handleSubmenuClick = (path) => {
    navigate(path);
    setActiveMenu(null);
    setIsMobileMenuOpen(false);
  };

  const handleNoticeCategoryClick = (categoryId) => {
    if (categoryId === 'events') {
      navigate('/events-dashboard');
    } else if (categoryId === 'marketplace') {
      navigate('/marketplace');
    } else if (categoryId === 'lost-found') {
      navigate('/lost-found-dashboard');
    } else {
      navigate(`/notices?category=${categoryId}`);
    }
    setActiveMenu(null);
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  // Utility functions
  const isActive = (path) => location.pathname === path;
  const currentCategory = searchParams.get('category') || 'all';

  // Format time
  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <nav className="glass-effect backdrop-blur-md sticky top-0 z-50 transition-all duration-300">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <FaBars className="w-5 h-5" />
            </button>
            
            <Link to="/student-portal" className="flex items-center gap-0">
              <img src={logoImg} alt="AAU Logo" className="h-12 w-auto object-contain" />
              <div className="hidden sm:block">
                <span className="block text-slate-900 font-bold text-sm leading-tight">
                  AAU Dormitory
                </span>
                <span className="block text-slate-500 text-xs leading-tight">
                  Management System
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div ref={menuRef} className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = item.path 
                ? isActive(item.path)
                : item.submenu?.some(sub => isActive(sub.path)) ||
                  (item.id === 'notices' && location.pathname.startsWith('/notices'));
              const isOpen = activeMenu === item.id;

              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => handleMenuClick(item)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200 relative group
                      ${isItemActive 
                        ? 'text-blue-700 bg-blue-50' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {(item.submenu || item.categories) && (
                      <FaChevronDown className={`
                        w-3 h-3 transition-transform duration-200
                        ${isOpen ? 'rotate-180' : ''}
                      `} />
                    )}
                    
                    {/* Notification Badge */}
                    {item.id === 'notices' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isOpen && (item.submenu || item.categories) && (
                    <div className="absolute top-full left-0 mt-2 w-64 glass-effect rounded-xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">

                      
                      {/* Categories */}
                      {item.categories && (
                        <>
                          <div className="px-4 py-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Browse by Category
                            </p>
                          </div>
                          {item.categories.map((category) => {
                            const CategoryIcon = category.icon;
                            const isCategoryActive = currentCategory === category.id;

                            return (
                              <button
                                key={category.id}
                                onClick={() => handleNoticeCategoryClick(category.id)}
                                className={`
                                  flex items-center gap-3 w-full px-4 py-3 text-sm
                                  transition-colors hover:bg-slate-50
                                  ${isCategoryActive ? 'bg-blue-50' : ''}
                                `}
                              >
                                <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center text-white`}>
                                  <CategoryIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-slate-900">{category.label}</p>
                                  <p className="text-xs text-slate-500 line-clamp-1">
                                    {category.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </>
                      )}

                      {/* Submenu */}
                      {item.submenu && (
                        <div className="py-1">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <button
                                key={subItem.path}
                                onClick={() => handleSubmenuClick(subItem.path)}
                                className={`
                                  flex items-center gap-3 w-full px-4 py-3 text-sm
                                  transition-colors hover:bg-slate-50
                                  ${isActive(subItem.path) ? 'bg-blue-50' : ''}
                                `}
                              >
                                <SubIcon className={`w-4 h-4 ${subItem.color || 'text-slate-400'}`} />
                                <span className="text-slate-700">{subItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'notifications' ? null : 'notifications')}
                className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FaBell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {activeMenu === 'notifications' && (
                <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 glass-effect rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">

                  {/* Header */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">Notifications</h3>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
                          {unreadCount} new
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={async () => {
                            if (!window.confirm('Delete all notifications?')) return;
                            try {
                              await notificationApi.clearAll();
                              setNotifications([]);
                              setUnreadCount(0);
                              toast.success('All cleared');
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
                        >
                          Clear all
                        </button>
                        {unreadCount > 0 && (
                          <button
                            onClick={async () => {
                              try {
                                await notificationApi.markAllRead();
                                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                setUnreadCount(0);
                                toast.success('All marked as read');
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FaBell className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">No notifications</p>
                        <p className="text-xs text-slate-500 mt-1">We'll notify you when something arrives</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div
                          key={notif._id}
                          className={`
                            w-full p-4 border-b border-slate-100 last:border-0 relative group/notif
                            ${!notif.read ? 'bg-blue-50/50' : 'bg-white'}
                          `}
                        >
                          <div className="flex gap-3">
                            <div 
                              onClick={(e) => !notif.read && handleMarkRead(e, notif._id)}
                              className={`
                                w-10 h-10 rounded-lg flex items-center justify-center shrink-0 cursor-pointer
                                ${notif.type === 'ExitClearance' ? 'bg-amber-100 text-amber-600' : ''}
                                ${notif.type === 'Complaint' ? 'bg-rose-100 text-rose-600' : ''}
                                ${notif.type === 'Maintenance' ? 'bg-orange-100 text-orange-600' : ''}
                                ${!notif.type ? 'bg-slate-100 text-slate-600' : ''}
                              `}
                            >
                              {notif.type === 'ExitClearance' ? <FaCheckCircle className="w-5 h-5" /> :
                               notif.type === 'Complaint' ? <FaExclamationTriangle className="w-5 h-5" /> :
                               notif.type === 'Maintenance' ? <FaWrench className="w-5 h-5" /> :
                               <FaBell className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {notif.title}
                                </p>
                                <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                                  {formatTime(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                                {notif.message}
                              </p>
                              
                              {/* Quick Actions */}
                              <div className="flex items-center gap-2 mt-3 sm:opacity-0 sm:group-hover/notif:opacity-100 transition-all transform translate-y-1 group-hover/notif:translate-y-0">
                                {!notif.read && (
                                  <button
                                    onClick={(e) => handleMarkRead(e, notif._id)}
                                    className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-md shadow-blue-100"
                                  >
                                    <FaCheck className="w-2.5 h-2.5" /> Mark Read
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleDeleteNotification(e, notif._id)}
                                  className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                  <FaTrash className="w-2.5 h-2.5" /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                      <button
                        onClick={() => {
                          navigate('/notices');
                          setActiveMenu(null);
                        }}
                        className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-center"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                  {authApi.getCurrentUser()?.name?.charAt(0) || 'S'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-slate-900">
                    {authApi.getCurrentUser()?.name || 'Student'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {authApi.getCurrentUser()?.userId || 'ID: Unknown'}
                  </p>
                </div>
                <FaChevronDown className={`
                  w-3 h-3 text-slate-400 transition-transform duration-200
                  ${isUserMenuOpen ? 'rotate-180' : ''}
                `} />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 glass-effect rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-3 duration-300">

                  {userMenuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.path}>
                        {item.divider && index > 0 && (
                          <div className="my-1 border-t border-slate-100" />
                        )}
                        <Link
                          to={item.path || '#'}
                          onClick={(e) => {
                            if (item.action) {
                              e.preventDefault();
                              item.action();
                            } else if (item.label === 'Logout') {
                              handleLogout();
                            }
                          }}
                          className={`
                            flex items-center gap-3 px-4 py-3 text-sm
                            transition-colors hover:bg-slate-50
                            ${item.color}
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = item.path 
                  ? isActive(item.path)
                  : item.submenu?.some(sub => isActive(sub.path));

                return (
                  <div key={item.id}>
                    <button
                      onClick={() => handleMenuClick(item)}
                      className={`
                        flex items-center justify-between w-full px-4 py-3
                        text-sm font-medium rounded-lg
                        ${isItemActive 
                          ? 'text-blue-700 bg-blue-50' 
                          : 'text-slate-600 hover:bg-slate-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {(item.submenu || item.categories) && (
                        <FaChevronDown className={`
                          w-4 h-4 transition-transform
                          ${activeMenu === item.id ? 'rotate-180' : ''}
                        `} />
                      )}
                    </button>

                    {/* Mobile Submenu */}
                    {activeMenu === item.id && item.submenu && (
                      <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-200 space-y-1">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <button
                              key={subItem.path}
                              onClick={() => handleSubmenuClick(subItem.path)}
                              className={`
                                flex items-center gap-3 w-full px-4 py-3 text-sm
                                rounded-lg transition-colors
                                ${isActive(subItem.path) 
                                  ? 'text-blue-700 bg-blue-50' 
                                  : 'text-slate-600 hover:bg-slate-50'
                                }
                              `}
                            >
                              <SubIcon className={`w-4 h-4 ${subItem.color || 'text-slate-400'}`} />
                              <span>{subItem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Mobile Categories */}
                    {activeMenu === item.id && item.categories && (
                      <div className="mt-2 grid grid-cols-2 gap-2 p-2">
                        {item.categories.map((category) => {
                          const CategoryIcon = category.icon;
                          return (
                            <button
                              key={category.id}
                              onClick={() => handleNoticeCategoryClick(category.id)}
                              className={`
                                flex flex-col items-center p-3 rounded-lg
                                transition-colors
                                ${currentCategory === category.id
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-slate-600 hover:bg-slate-50'
                                }
                              `}
                            >
                              <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center text-white mb-2`}>
                                <CategoryIcon className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-medium text-center">{category.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}