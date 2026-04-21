import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          © <span className="text-secondary font-bold">{new Date().getFullYear()}</span> Addis Ababa University • Online Dormitory Management System
        </p>
        <div className="flex items-center gap-3 text-xs">
          <Link to="/privacy" className="text-slate-500 hover:text-primary-dark">
            Privacy
          </Link>
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <Link to="/terms" className="text-slate-500 hover:text-primary-dark">
            Terms
          </Link>
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <Link to="/contact" className="text-slate-500 hover:text-primary-dark">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}

