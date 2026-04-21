import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import lostFoundApi from '../api/lostFoundApi';
import { useEffect, useState, useCallback } from 'react';
import { uploadUrl } from '../utils/uploadUrl';
import { FaSearch, FaBoxOpen } from 'react-icons/fa';
import ReportFoundModal from '../components/common/ReportFoundModal';
import _ from 'lodash';

export default function PublicLostFound() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchItems = async (query = '') => {
    try {
      setLoading(true);
      const data = await lostFoundApi.listPublic({ limit: 50, search: query });
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load public lost & found items', err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    _.debounce((query) => {
      fetchItems(query);
    }, 500),
    []
  );

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  return (
    <DashboardLayout
      title="Lost & Found"
      breadcrumbs={[
        { label: 'Home', path: '/home' },
        { label: 'Lost & Found' }
      ]}
      showPageHeader={true}
    >
      <div className="min-h-screen bg-slate-50/50 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                Lost & <span className="text-blue-600 font-extrabold">Found</span>
              </h1>
              <p className="text-lg text-slate-600 font-medium">
                Helping the AAU community recover lost belongings. Search or report items found across all campuses.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full lg:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm group-hover:border-slate-300"
              />
            </div>
          </div>

          {loading && searchQuery === '' ? (
            <div className="space-y-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-50 h-40 rounded-3xl border border-slate-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-slate-200/60 rounded-3xl shadow-sm">
              <FaBoxOpen className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No items found</h3>
              <p className="text-slate-500 max-w-md">
                {searchQuery ? `No results for "${searchQuery}". Try a different keyword.` : "No lost or found items have been posted yet."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {items.map((item) => (
                <article
                  key={item._id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row"
                >
                  {item.image?.path && (
                    <div className="w-full md:w-64 h-48 md:h-auto bg-slate-100 flex-shrink-0">
                      <img
                        src={uploadUrl(item.image.path)}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          item.type === 'lost' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {item.date ? new Date(item.date).toLocaleDateString() : 'Date N/A'}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mb-2">
                        {item.itemName || 'Unnamed Item'}
                      </h2>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4 bg-slate-50 p-2 rounded-xl inline-flex">
                        <FaSearch className="w-3 h-3 text-blue-500" />
                        <span>Located: {item.location || 'Location not specified'}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 md:line-clamp-none">
                        {item.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      {item.type === 'lost' && item.status === 'Open' ? (
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowReportModal(true);
                          }}
                          className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 active:scale-95"
                        >
                          <FaSearch className="w-3 h-3" />
                          <span>I Found This</span>
                        </button>
                      ) : item.status === 'ReportedFound' ? (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                            Reported Found
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {showReportModal && selectedItem && (
        <ReportFoundModal
          item={selectedItem}
          onClose={() => {
            setShowReportModal(false);
            setSelectedItem(null);
          }}
          onSuccess={fetchItems}
        />
      )}
    </DashboardLayout>
  );
}

