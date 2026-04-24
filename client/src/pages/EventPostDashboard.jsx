import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import eventApi from '../api/eventApi';
import authApi from '../api/authApi';
import toast from 'react-hot-toast';
import {
  FaCalendarAlt,
  FaTrash,
  FaPlus,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaEdit,
  FaTimes,
  FaBullhorn,
  FaMagic,
  FaInfoCircle,
  FaChevronRight,
  FaImage,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { uploadUrl } from '../utils/uploadUrl';

export default function EventPostDashboard() {
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const role = user?.role || 'Student';
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    category: 'Other',
    eventPosterID: '',
    registrationLink: '',
    image: null,
  });

  const load = async () => {
    try {
      const data = await eventApi.mine();
      setMine(data || []);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Could not load your events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({
      title: '',
      date: '',
      time: '',
      location: '',
      description: '',
      category: 'Other',
      eventPosterID: '',
      registrationLink: '',
      image: null,
    });
    setEditingId(null);
  };

  const handleEdit = (ev) => {
    setForm({
      title: ev.title || '',
      date: ev.date ? ev.date.split('T')[0] : '',
      time: ev.time || '',
      location: ev.location || '',
      description: ev.description || '',
      category: ev.category || 'Other',
      eventPosterID: ev.eventPosterID || '',
      registrationLink: ev.registrationLink || '',
      image: ev.image || null,
    });
    setEditingId(ev._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        date: form.date,
        time: form.time.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        category: form.category,
        eventPosterID: form.eventPosterID.trim(),
        registrationLink: form.registrationLink.trim(),
        image: form.image,
      };

      if (editingId) {
        await eventApi.update(editingId, payload);
        toast.success('Event updated');
      } else {
        await eventApi.create(payload);
        toast.success('Event posted');
      }
      resetForm();
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to post event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await eventApi.delete(id);
      toast.success('Event removed');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <DashboardLayout
      title="Post Campus Event"
      breadcrumbs={[
        { label: 'Dashboard', path: '/student-portal' },
        { label: 'Events', path: '/events-dashboard' },
        { label: 'Post Event' },
      ]}
      showPageHeader={false}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Guidelines & Status */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-900 shadow-[8px_8px_0px_#f8fafc] hover:shadow-[12px_12px_0px_#f1f5f9] transition-all">
              <FaBullhorn className="w-12 h-12 mb-6 text-blue-600" />
              <h2 className="text-3xl font-black mb-3 text-slate-900 tracking-tight">Boost Your Voice</h2>
              <p className="text-slate-600 mb-8 font-medium leading-relaxed">
                Connect with the campus community. Share your events, meetings, and social gatherings instantly.
              </p>

              <div className="space-y-6">
                {[
                  { icon: FaMagic, text: 'Clean visuals', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                  { icon: FaCalendarAlt, text: 'Real-time updates', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { icon: FaCheckCircle, text: 'Admin verified', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${item.bg} border ${item.border} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Tips */}
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200">
              <h3 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                <FaInfoCircle className="text-slate-400 w-3 h-3" />
                Pro Tips
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-1.5 rounded-full bg-blue-600"></div>
                  <div>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">High Quality Images</p>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">Bright, clear posters get 3x more engagement from the campus community.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 rounded-full bg-slate-300"></div>
                  <div>
                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-none">Precise Location</p>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">Specify building, block, and room clearly to avoid navigation issues.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: The Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden">
              <div className="p-8 sm:p-12 border-b-2 border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-4 mb-3">
                  <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest">
                    {editingId ? 'Updating' : 'Live Post'}
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-[-0.04em] mb-4">
                  {editingId ? 'Edit Event' : 'Publish Event'}
                </h1>
                <p className="text-base text-slate-500 font-medium max-w-xl">
                  {editingId ? 'Apply changes to your existing campus event post.' : 'Reach the entire student body with one click.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-12">
                {/* Title & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 md:col-span-2">
                    <label className="text-sm font-black text-slate-900 tracking-tight">Event Title</label>
                    <input
                      required
                      placeholder="e.g. Annual Tech Symposium"
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-400 text-base"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 tracking-tight">Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold text-base cursor-pointer"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 tracking-tight">Time</label>
                    <input
                      required
                      placeholder="2:00 PM - 5:00 PM"
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-400 text-base"
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 tracking-tight">Location</label>
                    <input
                      required
                      placeholder="Main Hall, Block B"
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-400 text-base"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 tracking-tight">Category</label>
                    <div className="relative">
                      <select
                        className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold appearance-none text-base cursor-pointer"
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      >
                        {['Academic', 'Social', 'Meeting', 'Sports', 'Other'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FaChevronRight className="rotate-90 w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Poster Image */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-900 tracking-tight">Event Poster Image</label>
                  <div className="bg-slate-50 rounded-[1.5rem] p-6 border-2 border-dashed border-slate-200 hover:border-blue-600 transition-colors group">
                    <div className="flex flex-col items-center justify-center py-4">
                      <FaImage className="w-10 h-10 text-slate-300 group-hover:text-blue-600 transition-colors mb-3" />
                      <input
                        type="file"
                        accept="image/*"
                        className="text-sm font-bold text-slate-600 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-[11px] file:font-black file:uppercase file:tracking-widest file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        onChange={(e) => setForm((f) => ({ ...f, image: e.target.files?.[0] || null }))}
                      />
                    </div>
                    {form.image && (
                      <div className="mt-6 w-full max-w-sm mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                        <img
                          src={form.image instanceof File ? URL.createObjectURL(form.image) : uploadUrl(form.image.path)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-900 tracking-tight">Description</label>
                  <textarea
                    rows={5}
                    placeholder="Provide details about the agenda, speakers, and why students should attend..."
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400 text-base resize-none"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>

                {/* Registration Link */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FaExternalLinkAlt className="w-3 h-3 text-blue-500" />
                    Registration Link
                    <span className="text-[10px] font-bold text-slate-400 uppercase">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://forms.google.com/..."
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-400 text-base"
                    value={form.registrationLink}
                    onChange={(e) => setForm((f) => ({ ...f, registrationLink: e.target.value }))}
                  />
                  <p className="text-[11px] text-slate-400 font-medium">Add a Google Form or external link where attendees can register. A "Register Here" button will appear on your event.</p>
                </div>

                {/* Verification ID Section */}
                {['Student', 'Vendor'].includes(role) && (
                  <div className="p-10 bg-amber-50 rounded-[2rem] border-2 border-amber-200 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <FaCheckCircle className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-amber-900 tracking-tight">Poster ID Verification</h4>
                        <p className="text-sm text-amber-700 font-medium">Approval is required for campus-wide visibility.</p>
                      </div>
                    </div>
                    <input
                      required
                      placeholder="EVT-XXXXX"
                      className="w-full px-8 py-5 bg-white border-2 border-amber-300 rounded-[1.5rem] focus:outline-none focus:border-amber-600 transition-all text-slate-900 font-black shadow-sm placeholder:text-amber-200 text-lg text-center tracking-widest"
                      value={form.eventPosterID}
                      onChange={(e) => setForm((f) => ({ ...f, eventPosterID: e.target.value }))}
                    />
                  </div>
                )}

                {role === 'EventPoster' && (
                  <div className="p-8 bg-blue-50 rounded-[2rem] border-2 border-blue-200 flex items-start gap-4">
                    <FaCheckCircle className="w-6 h-6 text-blue-600 mt-1 shrink-0" />
                    <div>
                      <h4 className="text-lg font-black text-blue-900 tracking-tight">Verified Organizer</h4>
                      <p className="text-sm text-blue-700 font-medium leading-relaxed">
                        Your account is verified. Events will be published immediately to the student community.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-10 border-t-2 border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-8 py-5 text-slate-500 hover:text-slate-900 font-black text-sm tracking-tight transition-colors uppercase"
                  >
                    Clear Changes
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-4 px-12 py-5 rounded-full bg-slate-900 hover:bg-blue-600 text-white font-black hover:-translate-y-1 transition-all disabled:opacity-30 disabled:hover:translate-y-0 shadow-xl shadow-slate-900/10 hover:shadow-blue-600/30"
                  >
                    {submitting ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="uppercase tracking-widest text-sm">{editingId ? 'Update Event' : 'Launch Event'}</span>
                        <FaChevronRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Your Posted Events List */}
        <div className="mt-20">
          <div className="bg-white rounded-[2rem] border-2 border-slate-900 shadow-[8px_8px_0px_#f8fafc] overflow-hidden">
            <div className="p-8 sm:p-10 border-b-2 border-slate-900 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Your Posted Events</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Manage and track your activity</p>
              </div>
              <Link to="/events-dashboard" className="hidden sm:flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">
                Browse Public Feed <FaChevronRight className="w-2.5 h-2.5" />
              </Link>
            </div>

            <div className="p-4 sm:p-8">
              {loading ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 font-bold text-sm tracking-tight">Synchronizing events...</p>
                </div>
              ) : mine.length === 0 ? (
                <div className="py-20 text-center max-w-sm mx-auto">
                  <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                    <FaCalendarAlt className="text-slate-200 w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No Social Footprint yet</h3>
                  <p className="text-sm font-medium text-slate-500">Events you publish will appear here for management and tracking.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mine.map((ev) => (
                    <div
                      key={ev._id}
                      className="group bg-white border-2 border-slate-100 rounded-[2rem] p-6 hover:border-slate-900 hover:shadow-[8px_8px_0px_#f8fafc] transition-all"
                    >
                      <div className="flex gap-6 items-start">
                        <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border-2 border-slate-100 group-hover:border-slate-900 transition-colors">
                          {ev.image?.path ? (
                            <img src={uploadUrl(ev.image.path)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                              <FaImage className="text-slate-200 w-6 h-6 mb-1" />
                              <span className="text-[8px] font-black uppercase text-slate-300">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex h-full flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest">
                                  {ev.category}
                                </span>
                              </div>
                              <h4 className="text-lg font-black text-slate-900 truncate leading-tight mb-2 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                {ev.title}
                              </h4>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-slate-400">
                                  <FaClock className="w-3 h-3 shrink-0" />
                                  <p className="text-[10px] font-bold truncate uppercase tracking-tight">{ev.time}</p>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                  <FaMapMarkerAlt className="w-3 h-3 shrink-0" />
                                  <p className="text-[10px] font-bold truncate uppercase tracking-tight">{ev.location}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4 mt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(ev)}
                                className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5"
                              >
                                <FaEdit className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(ev._id)}
                                className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest flex items-center gap-1.5"
                              >
                                <FaTrash className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
