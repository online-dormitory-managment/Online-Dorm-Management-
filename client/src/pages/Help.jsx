import { Link } from 'react-router-dom';
import HelpContent from '../components/common/HelpContent';
import logoImg from '../assets/logo/logo.png';
import { FaArrowLeft } from 'react-icons/fa';

export default function Help() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple Public Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold"
            >
              <FaArrowLeft className="w-3 h-3" />
              Back
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="AAU Logo" className="h-10 w-auto object-contain" />
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
          <Link
            to="/login"
            className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            Log in
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <HelpContent />
        </div>
      </div>
    </div>
  );
}
