import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items }) {
  return (
    <nav className="px-6 py-3 bg-white border-b border-slate-200">
      <div className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-slate-400">/</span>}
            {item.path ? (
              <Link
                to={item.path}
                className="text-slate-600 hover:text-slate-800 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-800 font-semibold">{item.label}</span>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

