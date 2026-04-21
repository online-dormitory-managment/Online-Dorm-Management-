import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import marketplaceApi from '../api/marketplaceApi';
import orderApi from '../api/orderApi';
import authApi from '../api/authApi';
import toast from 'react-hot-toast';
import { uploadUrl } from '../utils/uploadUrl';
import {
  FaStore,
  FaTrash,
  FaTag,
  FaPlus,
  FaBoxOpen,
  FaCheckCircle,
  FaSignOutAlt,
  FaChartBar,
  FaImage,
  FaSync,
  FaShoppingBag,
  FaClipboardList,
  FaTruck,
  FaTimes,
  FaCheck,
} from 'react-icons/fa';

const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Food & Beverages', 'Health & Beauty', 'Stationery', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  category: 'Other',
  condition: 'New',
  contactHint: '',
  stock: '1',
  deliveryTime: '10 minutes',
  image: null,
};

export default function VendorDashboard() {
  const navigate = useNavigate();
  const user = authApi.getCurrentUser();
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!user || (user.role !== 'Vendor' && user.role !== 'CampusAdmin' && user.role !== 'SuperAdmin')) {
      navigate('/login');
    }
  }, []);

  const load = async () => {
    try {
      const [data, orderData] = await Promise.all([
        marketplaceApi.mine(),
        orderApi.vendorOrders(),
      ]);
      setItems(data || []);
      setOrders(orderData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await marketplaceApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price,
        category: form.category,
        condition: form.condition,
        contactHint: form.contactHint.trim(),
        stock: form.stock,
        deliveryTime: form.deliveryTime.trim(),
        image: form.image,
      });
      toast.success('Product published!');
      setForm(EMPTY_FORM);
      setActiveSection('listings');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to publish');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestock = async (id) => {
    try { await marketplaceApi.restock(id); toast.success('Restocked!'); load(); } catch { toast.error('Failed'); }
  };
  const handleMarkSold = async (id) => {
    try { await marketplaceApi.markSold(id); toast.success('Marked sold'); load(); } catch { toast.error('Failed'); }
  };
  const handleRemove = async (id) => {
    if (!window.confirm('Remove?')) return;
    try { await marketplaceApi.remove(id); toast.success('Removed'); load(); } catch { toast.error('Failed'); }
  };
  const handleAcceptOrder = async (id) => {
    try { await orderApi.accept(id); toast.success('Order accepted — student notified!'); load(); } catch { toast.error('Failed'); }
  };
  const handleCancelOrder = async (id) => {
    if (!window.confirm('Cancel this order? Stock will be restored.')) return;
    try { await orderApi.cancel(id); toast.success('Order cancelled'); load(); } catch { toast.error('Failed'); }
  };

  const handleLogout = () => { authApi.logout(); navigate('/login'); };

  const activeCount = items.filter(i => i.status === 'Active').length;
  const soldCount = items.filter(i => i.status === 'Sold').length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const totalRevenue = orders.filter(o => o.status === 'Accepted' || o.status === 'Delivered').reduce((s, o) => s + o.totalPrice, 0);

  const statusBadge = (s) => {
    if (s === 'Active') return 'bg-blue-100 text-blue-700';
    if (s === 'Sold') return 'bg-red-100 text-red-700';
    if (s === 'Pending') return 'bg-amber-100 text-amber-700';
    if (s === 'Accepted') return 'bg-blue-100 text-blue-700';
    if (s === 'Delivered') return 'bg-sky-100 text-sky-700';
    if (s === 'Cancelled') return 'bg-rose-100 text-rose-600';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <FaStore className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-900 font-bold text-sm">Vendor Portal</p>
              <p className="text-xs text-slate-500">{user?.name || 'My Shop'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: FaChartBar },
            { id: 'add', label: 'Add Product', icon: FaPlus },
            { id: 'listings', label: 'My Listings', icon: FaBoxOpen },
            { id: 'orders', label: 'Orders', icon: FaClipboardList, badge: pendingOrders },
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                activeSection === id ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeSection === id ? 'bg-white text-red-700' : 'bg-amber-500 text-white'
                }`}>{badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">
            <FaSignOutAlt className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {activeSection === 'overview' && 'Dashboard Overview'}
              {activeSection === 'add' && 'Add New Product'}
              {activeSection === 'listings' && 'My Listings'}
              {activeSection === 'orders' && 'Incoming Orders'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Campus Vendor Portal</p>
          </div>
          <button onClick={() => setActiveSection('add')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
            <FaPlus className="w-3 h-3" /> New Product
          </button>
        </header>

        <div className="p-8">
          {/* OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Active Listings', value: activeCount, icon: FaCheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                  { label: 'Sold Out', value: soldCount, icon: FaShoppingBag, color: 'text-red-600 bg-red-50 border-red-100' },
                  { label: 'Pending Orders', value: pendingOrders, icon: FaClipboardList, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                  { label: 'Revenue (ETB)', value: totalRevenue.toLocaleString(), icon: FaTag, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className={`rounded-2xl border p-5 flex items-center gap-4 ${color}`}>
                    <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{value}</p>
                      <p className="text-xs font-semibold text-slate-500">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              {orders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900">Latest Orders</h2>
                    <button onClick={() => setActiveSection('orders')} className="text-xs text-blue-600 font-medium hover:text-blue-800">View all →</button>
                  </div>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map(o => (
                      <div key={o._id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          {o.listing?.image?.path ? (
                            <img src={uploadUrl(o.listing.image.path)} alt="" className="w-full h-full object-cover" />
                          ) : <div className="w-full h-full flex items-center justify-center text-slate-300"><FaImage className="w-4 h-4" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{o.listing?.title}</p>
                          <p className="text-xs text-slate-500">by {o.buyer?.name || o.buyer?.userID} · {o.quantity}x · {o.totalPrice} ETB</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${statusBadge(o.status)}`}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADD PRODUCT */}
          {activeSection === 'add' && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
                  <FaTag className="text-red-600" /> Product Details
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Product Name *</label>
                    <input required className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="e.g. Engineering Textbook Vol. 2" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Price (ETB) *</label>
                      <input type="number" min="0" step="0.01" required className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                        value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Stock Quantity *</label>
                      <input type="number" min="1" required className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                        value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Delivery Time</label>
                      <select className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                        value={form.deliveryTime} onChange={(e) => setForm(f => ({ ...f, deliveryTime: e.target.value }))}>
                        {['10 minutes', '15 minutes', '20 minutes'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Category</label>
                      <select className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                        value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Condition</label>
                      <select className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                        value={form.condition} onChange={(e) => setForm(f => ({ ...f, condition: e.target.value }))}>
                        {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Contact (e.g. @telegram)</label>
                    <input className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                      value={form.contactHint} onChange={(e) => setForm(f => ({ ...f, contactHint: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                    <textarea rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                      value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Product Photo</label>
                    <input type="file" accept="image/*" className="mt-1 w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                      onChange={(e) => setForm(f => ({ ...f, image: e.target.files?.[0] || null }))} />
                    {form.image && (
                      <div className="mt-3 w-32 h-32 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                        <img src={URL.createObjectURL(form.image)} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={submitting} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50">
                      <FaShoppingBag /> {submitting ? 'Publishing...' : 'Publish Product'}
                    </button>
                    <button type="button" onClick={() => setForm(EMPTY_FORM)} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200">Clear</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* LISTINGS */}
          {activeSection === 'listings' && (
            <div className="space-y-4">
              {loading ? <p className="text-slate-400 text-sm">Loading...</p>
              : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center bg-white">
                  <FaBoxOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No products yet</p>
                  <button onClick={() => setActiveSection('add')} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Add first product</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((it) => (
                    <div key={it._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group">
                      <div className="h-40 bg-slate-100 relative">
                        {it.image?.path ? <img src={uploadUrl(it.image.path)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center text-slate-300"><FaImage className="w-10 h-10 opacity-30" /></div>}
                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold ${statusBadge(it.status)}`}>{it.status}</span>
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/90 text-slate-700">Stock: {it.stock ?? 0}</span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="font-bold text-slate-900 line-clamp-2">{it.title}</p>
                        <p className="text-red-600 font-bold text-sm mt-1">{it.price} {it.currency || 'ETB'}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 mb-1">{it.category} · {it.condition}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1"><FaTruck className="w-3 h-3" /> {it.deliveryTime || '10 minutes'}</p>
                        <div className="mt-auto flex gap-2 flex-wrap pt-3">
                          {(it.status === 'Sold' || it.status === 'Removed') && (
                            <button onClick={() => handleRestock(it._id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100">
                              <FaSync className="w-3 h-3" /> Restock
                            </button>
                          )}
                          {it.status === 'Active' && (
                            <button onClick={() => handleMarkSold(it._id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100">
                              <FaCheckCircle className="w-3 h-3" /> Mark Sold
                            </button>
                          )}
                          <button onClick={() => handleRemove(it._id)} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100">
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ORDERS */}
          {activeSection === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center bg-white">
                  <FaClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No orders yet</p>
                </div>
              ) : (
                orders.map(o => (
                  <div key={o._id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      {o.listing?.image?.path ? (
                        <img src={uploadUrl(o.listing.image.path)} alt="" className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-slate-300"><FaImage className="w-5 h-5" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{o.listing?.title}</p>
                      <p className="text-xs text-slate-500 mt-1">Buyer: <span className="font-semibold">{o.buyer?.name || o.buyer?.userID}</span></p>
                      <p className="text-xs text-slate-500">Qty: {o.quantity} · Total: <span className="font-bold text-red-600">{o.totalPrice} ETB</span></p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><FaTruck className="w-3 h-3" /> {o.deliveryTime}</p>
                      {o.note && <p className="text-xs text-slate-400 italic mt-1">"{o.note}"</p>}
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(o.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${statusBadge(o.status)}`}>{o.status}</span>
                      {o.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAcceptOrder(o._id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
                            <FaCheck className="w-3 h-3" /> Accept
                          </button>
                          <button onClick={() => handleCancelOrder(o._id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-600 text-xs font-semibold hover:bg-rose-200">
                            <FaTimes className="w-3 h-3" /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
