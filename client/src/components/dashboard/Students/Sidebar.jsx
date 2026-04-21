import { Link, useLocation } from 'react-router-dom';
import { 
  FaBuilding, 
  FaBell, 
  FaUser,
  FaWrench,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSignOutAlt
} from 'react-icons/fa';
import BuildingIcon from '../../common/BuildingIcon';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FaBuilding },
  { path: '/notices', label: 'Notices', icon: FaBell, hasNotification: true },
  { path: '/maintenance', label: 'Maintenance', icon: FaWrench },
  { path: '/complaints', label: 'Complaints', icon: FaExclamationTriangle },
  { path: '/exit-clearance', label: 'Exit Clearance', icon: FaCheckCircle },
  { path: '/lost-found', label: 'Lost & Found', icon: FaBuilding },
  { path: '/profile', label: 'Profile', icon: FaUser },
  { path: '/logout', label: 'Logout', icon: FaSignOutAlt }
];

export default function Sidebar({ activePath = '/dashboard' }) {
  const location = useLocation();
  
  // Determine if a path is active
  const isActive = (path) => {
    const currentPath = location.pathname;
    if (path === '/dashboard') {
      return currentPath === '/dashboard' || currentPath === '/room-details';
    }
    return currentPath === path;
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BuildingIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-slate-800 font-bold text-lg">Dormitory</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          // Handle logout separately
          if (item.path === '/logout') {
            return (
              <button
                key={item.path}
                onClick={() => {
                  // Handle logout logic here
                  console.log('Logout clicked');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.hasNotification && !active && (
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <FaUser className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 truncate">Hilina Girma</p>
            <p className="text-xs text-slate-500">Student • Room 304</p>
          </div>
        </div>
      </div>
    </aside>
  );
}