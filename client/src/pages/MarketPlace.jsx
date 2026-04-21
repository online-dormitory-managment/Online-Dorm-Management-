import { Link } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import marketplaceApi from '../api/marketplaceApi';
import authApi from '../api/authApi';
import { useEffect, useState } from 'react';
import { uploadUrl } from '../utils/uploadUrl';

export default function MarketPlace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await marketplaceApi.listPublic({ limit: 40 });
        setItems(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardLayout
      title="Market Place"
      breadcrumbs={[
        { label: 'Dashboard', path: '/student-portal' },
        { label: 'Market Place' },
      ]}
      showPageHeader={false}
    >
      <div className="min-h-screen bg-slate-50 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Marketplace</span>
              </h1>
              <p className="text-lg text-slate-600">
                A community-driven marketplace to buy, sell, and trade essential dorm items.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {authApi.getCurrentUser()?.role === 'MarketPoster' ? (
                <Link
                  to="/seller/dashboard"
                  className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white transition-all duration-300 bg-slate-900 rounded-2xl hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-500/30 hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Vendor Dashboard
                  </span>
                </Link>
              ) : (
                <div className="bg-white/60 backdrop-blur-sm border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                   </div>
                   <p className="text-xs font-semibold text-emerald-800 leading-tight">
                     Authorized University Vendors Only.<br/>
                     <span className="text-emerald-600 font-normal">Student selling is restricted to external legal sellers.</span>
                   </p>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white/60 h-80 rounded-3xl border border-slate-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="inline-flex items-center gap-3 px-5 py-3.5 bg-white/80 backdrop-blur border border-blue-100 shadow-sm rounded-2xl text-blue-700">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Marketplace posting is exclusive to authorized university vendors.</span>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((m) => (
                <div
                  key={m._id}
                  className="group relative bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {m.image?.path ? (
                      <img 
                        src={uploadUrl(m.image.path)} 
                        alt={m.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <svg className="w-10 h-10 mb-2 opacity-30 cursor-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-white/90 backdrop-blur text-xs font-bold text-emerald-700 uppercase tracking-wider rounded-lg shadow-sm">
                        {m.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1 relative bg-white">
                    <h2 className="text-xl font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">{m.title}</h2>
                    <p className="text-2xl font-black text-emerald-600 mb-4 tracking-tight">
                      {m.price} <span className="text-sm font-semibold text-emerald-600/70">{m.currency || 'ETB'}</span>
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2 mt-auto">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
