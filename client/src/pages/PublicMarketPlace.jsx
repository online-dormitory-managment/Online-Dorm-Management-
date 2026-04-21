import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import marketplaceApi from '../api/marketplaceApi';
import orderApi from '../api/orderApi';
import authApi from '../api/authApi';
import { useEffect, useState, useCallback } from 'react';
import { uploadUrl } from '../utils/uploadUrl';
import { FaShoppingCart, FaTruck, FaBoxOpen, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
import _ from 'lodash';

export default function PublicMarketPlace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = async (query = '') => {
    try {
      setLoading(true);
      const data = await marketplaceApi.listPublic({ limit: 50, search: query });
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
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

  const handleOrder = async (m) => {
    if (!authApi.isAuthenticated()) {
      toast.error('Please login to place an order');
      return;
    }
    try {
      await orderApi.place(m._id);
      toast.success(`Order placed! Delivery in ${m.deliveryTime || '10 minutes'}. Payment on delivery.`);
      fetchItems(searchQuery);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Order failed');
    }
  };

  return (
    <DashboardLayout
      title="Campus Shop"
      breadcrumbs={[
        { label: 'Home', path: '/home' },
        { label: 'Campus Shop' },
      ]}
      showPageHeader={false}
    >
      <div className="min-h-screen bg-white relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                Campus <span className="text-red-600 font-extrabold">Shop</span>
              </h1>
              <p className="text-lg text-slate-600 mb-4 font-medium">
                Browse products from verified campus vendors. Order and pay on delivery.
              </p>
              <div className="inline-flex items-center gap-3 px-5 py-3.5 bg-blue-50 border border-blue-100 shadow-sm rounded-2xl text-blue-700">
                <FaTruck className="w-4 h-4" />
                <span className="text-sm font-medium">All orders are paid on delivery — no upfront payment needed!</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full lg:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="text-slate-400 group-focus-within:text-red-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-sm group-hover:border-slate-300"
              />
            </div>
          </div>

          {loading && searchQuery === '' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-slate-50 h-[400px] rounded-3xl border border-slate-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-slate-200/60 rounded-3xl shadow-sm">
              <FaBoxOpen className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
              <p className="text-slate-500 max-w-md">
                {searchQuery ? `No results for "${searchQuery}". Try a different keyword.` : "Check back later for new items from campus vendors."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((m) => (
                <article
                  key={m._id}
                  className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {m.image?.path ? (
                      <img src={uploadUrl(m.image.path)} alt={m.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                        <FaBoxOpen className="w-10 h-10 opacity-30" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur text-xs font-bold text-red-700 uppercase tracking-wider rounded-lg shadow-sm">
                      {m.category}
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur text-xs font-bold text-slate-600 rounded-lg shadow-sm">
                      Stock: {m.stock ?? 0}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="text-base font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-red-600 transition-colors">{m.title}</h2>
                    <p className="text-2xl font-black text-red-600 mb-2 tracking-tight">
                      {m.price} <span className="text-sm font-semibold text-red-600/70">{m.currency || 'ETB'}</span>
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3 flex-grow">{m.description}</p>
                    
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                      <FaTruck className="w-3 h-3" />
                      <span>Delivery: {m.deliveryTime || '10 minutes'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3">💳 Payment on delivery</p>
                    
                    <button
                      disabled={!m.stock || m.stock <= 0}
                      onClick={() => handleOrder(m)}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <FaShoppingCart className="w-4 h-4" />
                      {(!m.stock || m.stock <= 0) ? 'Out of Stock' : 'Order Now'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

