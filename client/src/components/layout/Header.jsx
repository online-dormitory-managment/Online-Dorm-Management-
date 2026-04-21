import { Link, useLocation } from 'react-router-dom';
import BuildingIcon from '../common/BuildingIcon';
import UserIcon from '../common/UserIcon';
import logoImg from '../../assets/logo/logo.png';

export default function Header() {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/housing', label: 'Housing' },
    { path: '/requests', label: 'Requests' },
    { path: '/profile', label: 'Profile' },
  ];

  return (
    <header className="bg-primary-light border-b border-primary-light">
      {/* Top Header */}
      <div className="px-2 py-4 flex justify-between items-center">
        <div className="flex items-center gap-0">
          <img src={logoImg} alt="AAU Logo" className="h-12 w-auto object-contain" />
          <span className="text-slate-800 font-bold text-lg">
            Dormitory Management System
          </span>
        </div>
        
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`font-semibold transition-colors ${
                location.pathname === item.path || 
                (item.path === '/requests' && location.pathname.includes('/placement-request'))
                  ? 'text-primary'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center ml-2 border-2 border-slate-300">
            <UserIcon className="w-6 h-6 text-slate-600" />
          </div>
        </nav>
      </div>
    </header>
  );
}

