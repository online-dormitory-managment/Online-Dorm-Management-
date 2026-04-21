import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import {
  FaWrench,
  FaPaperclip,
  FaTools,
  FaLightbulb,
  FaClock,
  FaClipboardList,
  FaChevronRight,
  FaTrash
} from 'react-icons/fa';
import FileUpload from '../components/common/FileUpload';
import maintenanceApi from '../api/maintenanceApi';
import toast from 'react-hot-toast';

export default function MaintenanceRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    issueCategory: '',
    location: '',
    urgency: 'Low',
    description: '',
  });
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUrgencyChange = (value) => {
    setFormData((prev) => ({ ...prev, urgency: value }));
  };

  const handleFileSelect = (file) => {
    setAttachment(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const loadingToast = toast.loading('Sending maintenance request...');

    try {
      await maintenanceApi.submit({
        ...formData,
        attachment
      });
      toast.dismiss(loadingToast);
      toast.success('Maintenance request submitted! A technician will review it soon.');
      navigate('/student-portal');
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit request. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Maintenance Request"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Maintenance Request' }
      ]}
      showPageHeader={false}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Guidelines & Process */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-900 shadow-[8px_8px_0px_#f8fafc] hover:shadow-[12px_12px_0px_#f1f5f9] transition-all">
              <FaTools className="w-12 h-12 mb-6 text-emerald-600" />
              <h2 className="text-3xl font-black mb-3 text-slate-900 tracking-tight">Fixing Fast</h2>
              <p className="text-slate-600 mb-8 font-medium leading-relaxed">
                Our facilities team is dedicated to keeping your dormitory safe. Help us by providing accurate details.
              </p>

              <div className="space-y-5">
                {[
                  { icon: FaClock, text: 'Quick response' },
                  { icon: FaLightbulb, text: 'Certified technicians' },
                  { icon: FaClipboardList, text: 'Real-time updates' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Standard Timelines */}
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200">
              <h3 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                <FaClock className="text-slate-400 w-3 h-3" />
                Response Time
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-1.5 rounded-full bg-slate-900"></div>
                  <div>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">High Priority</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">Immediate handling (leaks, power).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 rounded-full bg-slate-400"></div>
                  <div>
                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Medium Priority</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">24-48 hours (furniture, appliances).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 rounded-full bg-slate-200"></div>
                  <div>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Low Priority</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">3-5 days (cosmetic requests).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: The Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden">
              <div className="p-8 sm:p-12 border-b-2 border-slate-100">
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-[-0.04em] mb-3">Service Request</h1>
                <p className="text-base text-slate-500 font-medium max-w-xl">Describe the issue and our team will be there to help as soon as possible.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-12">
                {/* Category & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 tracking-tight">
                      Issue Category
                    </label>
                    <div className="relative">
                      <select
                        name="issueCategory"
                        value={formData.issueCategory}
                        onChange={handleChange}
                        className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 font-bold appearance-none text-base cursor-pointer"
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="plumbing">🚰 Plumbing</option>
                        <option value="electrical">⚡ Electrical</option>
                        <option value="furniture">🪑 Furniture</option>
                        <option value="cleaning">🧹 Cleaning</option>
                        <option value="appliance">🧊 Appliance</option>
                        <option value="other">📦 Other</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FaChevronRight className="rotate-90 w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 tracking-tight">
                      Dorm Number / Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Block A, Room 302"
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-400 text-base"
                      required
                    />
                  </div>
                </div>

                {/* Urgency Selection */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-900 tracking-tight">
                    How urgent is this?
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {['Low', 'Medium', 'High'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handleUrgencyChange(level)}
                        className={`py-5 px-4 rounded-[1.5rem] font-black text-xs sm:text-sm tracking-widest transition-all border-2 ${formData.urgency === level
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400'
                          }`}
                      >
                        {level.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-900 tracking-tight">
                    Describe the Problem
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Provide specific details about the issue..."
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400 text-base resize-none"
                    required
                  />
                </div>

                {/* Attachments */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-900 tracking-tight">
                    Photos of the issue
                  </label>
                  <div className="bg-slate-50 rounded-[1.5rem] p-4 border-2 border-dashed border-slate-200 hover:border-slate-500 transition-colors">
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      accept="image/*"
                    />
                    {attachment && (
                      <div className="mt-4 px-5 py-4 bg-white rounded-xl shadow-[4px_4px_0px_#f1f5f9] border border-slate-200 flex flex-col gap-5">
                        {attachment.type.startsWith('image/') && (
                          <div className="relative w-full max-w-sm mx-auto aspect-video rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-200">
                            <img
                              src={URL.createObjectURL(attachment)}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <FaPaperclip className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{attachment.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{(attachment.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAttachment(null)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shrink-0"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-8 border-t-2 border-slate-100">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto px-8 py-4 text-slate-500 hover:text-slate-900 font-black text-sm tracking-tight transition-colors uppercase"
                  >
                    Discard Draft
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.issueCategory}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-12 py-4 rounded-full bg-slate-900 hover:bg-emerald-600 text-white font-black hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="uppercase tracking-widest text-sm">Submit Request</span>
                        <FaChevronRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
