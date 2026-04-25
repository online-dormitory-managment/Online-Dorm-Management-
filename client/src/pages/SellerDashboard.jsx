import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBox, 
  FaPlus, 
  FaStore, 
  FaSignOutAlt, 
  FaRedo, 
  FaCheckCircle, 
  FaTimesCircle,
  FaChevronRight
} from 'react-icons/fa';
import marketplaceApi from '../api/marketplaceApi';
import authApi from '../api/authApi';
import { uploadUrl } from '../utils/uploadUrl';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser || currentUser.role !== 'MarketPoster') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const res = await marketplaceApi.mine();
      if (res.success) {
        setListings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  const handleRestack = async (id) => {
    try {
      await marketplaceApi.restack(id);
      fetchMyListings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSold = async (id) => {
    try {
      await marketplaceApi.markSold(id);
      fetchMyListings();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FaStore className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight uppercase tracking-wider">Vendor</h1>
              <p className="text-[10px] text-slate-400">Inventory Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-900/20 font-medium transition-all">
            <FaBox className="w-4 h-4" />
            My Products
          </button>
          {/* Future tabs can go here */}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium"
          >
            <FaSignOutAlt className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 capitalize">Welcome back, {user?.name?.split(' ')[0]}</h2>
            <p className="text-slate-500 mt-1">Manage your storefront inventory and sales.</p>
          </div>
          <button 
            onClick={() => navigate('/marketplace/create')}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <FaPlus className="w-3 h-3" />
            Add New Product
          </button>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Products</p>
            <p className="text-3xl font-bold text-slate-900">{listings.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Active Now</p>
            <p className="text-3xl font-bold text-slate-900">{listings.filter(l => l.status === 'Active').length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Items Sold</p>
            <p className="text-3xl font-bold text-slate-900">{listings.filter(l => l.status === 'Sold').length}</p>
          </div>
        </section>

        {/* Inventory List */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Product List</h3>
            <button onClick={fetchMyListings} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <FaRedo className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-400">Loading inventory...</div>
            ) : listings.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBox className="text-slate-300 text-2xl" />
                </div>
                <h4 className="font-bold text-slate-900">No products yet</h4>
                <p className="text-slate-500 text-sm mt-1">Start by adding your first item to the marketplace.</p>
              </div>
            ) : (
              listings.map((item) => (
                <div key={item._id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex-shrink-0">
                    {item.image?.path ? (
                      <img src={uploadUrl(item.image.path)} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FaBox />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'Sold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{item.description || 'No description provided.'}</p>
                    <div className="flex items-center gap-4 mt-2">
                       <p className="text-sm font-bold text-slate-900">{item.price} {item.currency}</p>
                       <p className="text-xs text-slate-400">• {item.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.status !== 'Active' ? (
                      <button 
                        onClick={() => handleRestack(item._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                      >
                        <FaRedo className="w-3 h-3" />
                        Restack
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleMarkSold(item._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        <FaCheckCircle className="w-3 h-3" />
                        Mark as Sold
                      </button>
                    )}
                    <button 
                      className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
                      onClick={() => navigate(`/marketplace/edit/${item._id}`)}
                    >
                      <FaChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
