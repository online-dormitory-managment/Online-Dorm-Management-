import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import marketplaceApi from '../api/marketplaceApi';
import authApi from '../api/authApi';
import toast from 'react-hot-toast';
import { FaStore, FaTrash, FaTag } from 'react-icons/fa';
import { uploadUrl } from '../utils/uploadUrl';

export default function MarketplacePostDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const user = authApi.getCurrentUser();
  const role = user?.role || 'Student';
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Other',
    condition: 'Good',
    contactHint: '',
    image: null,
  });

  const load = async () => {
    try {
      const data = await marketplaceApi.mine();
      setItems(data || []);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Could not load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        image: form.image,
      });
      toast.success('Listing published');
      setForm({
        title: '',
        description: '',
        price: '',
        category: 'Other',
        condition: 'Good',
        contactHint: '',
        image: null,
      });
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to publish');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this listing?')) return;
    try {
      await marketplaceApi.remove(id);
      toast.success('Listing removed');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed');
    }
  };

  const handleSold = async (id) => {
    try {
      await marketplaceApi.markSold(id);
      toast.success('Marked as sold');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed');
    }
  };

  return (
    <DashboardLayout
      title="Marketplace — Sell & Manage"
      breadcrumbs={[
        { label: 'Dashboard', path: '/student-portal' },
        { label: 'Marketplace', path: '/marketplace' },
        { label: 'Post & manage' },
      ]}
      showPageHeader
    >
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <FaStore className="text-emerald-600" /> New listing
          </h2>
          {role === 'Vendor' && (
            <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <label className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-2 mb-1">
                <FaStore className="w-3 h-3" /> Professional Vendor Account
              </label>
              <p className="text-xs text-emerald-600">
                You are logged in as a verified campus vendor. Your listings will be featured in the student marketplace and visible on the home page.
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Title</label>
              <input
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Price (ETB)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Category</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {['Books', 'Electronics', 'Furniture', 'Clothing', 'Other'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Condition</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                  value={form.condition}
                  onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                >
                  {['New', 'Like New', 'Good', 'Fair'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 w-full text-sm"
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.files?.[0] || null }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">How to reach you (e.g. Telegram @user)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                value={form.contactHint}
                onChange={(e) => setForm((f) => ({ ...f, contactHint: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                <FaTag /> Publish listing
              </button>
            </div>
          </form>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900">Your listings</h2>
            <Link to="/marketplace" className="text-sm text-blue-600 font-medium">
              View public marketplace
            </Link>
          </div>
          {loading ? (
            <p className="text-slate-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-slate-500 text-sm">No listings yet.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <li
                  key={it._id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4"
                >
                  <div className="w-full sm:w-28 h-28 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                    {it.image?.path ? (
                      <img src={uploadUrl(it.image.path)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{it.title}</p>
                    <p className="text-emerald-700 font-bold">
                      {it.price} {it.currency || 'ETB'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {it.status} · {it.category} · {it.condition}
                    </p>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2">
                    {it.status === 'Active' && (
                      <button
                        type="button"
                        onClick={() => handleSold(it._id)}
                        className="text-sm px-3 py-1 rounded-lg bg-slate-100 text-slate-800"
                      >
                        Mark sold
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(it._id)}
                      className="inline-flex items-center gap-1 text-rose-600 text-sm"
                    >
                      <FaTrash /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
