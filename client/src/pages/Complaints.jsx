import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import {
  FaPaperclip,
  FaLock,
  FaExclamationTriangle,
  FaShieldAlt,
  FaInfoCircle,
  FaCheckCircle,
  FaHeadset,
  FaChevronRight,
  FaTrash,
  FaClock
} from 'react-icons/fa';
import FileUpload from '../components/common/FileUpload';
import complaintApi from '../api/complaintApi';
import toast from 'react-hot-toast';

export default function Complaints() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    issueCategory: '',
    description: '',
    confidential: false,
  });
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileSelect = (file) => {
    setAttachment(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const categoryMap = {
        roommate: 'Roommate Conflict',
        noise: 'Noise Disturbance',
        harassment: 'Harassment/Bullying',
        safety: 'Theft/Security',
        staff: 'Administrative Issue',
        other: 'Other',
      };

      const loadingToast = toast.loading('Submitting your report...');

      await complaintApi.submit({
        category: categoryMap[formData.issueCategory] || 'Other',
        title: categoryMap[formData.issueCategory] || 'Complaint',
        description: formData.description,
        priority: 'medium',
        isAnonymous: !!formData.confidential,
        attachment,
      });

      toast.dismiss(loadingToast);
      toast.success('Your complaint has been submitted securely.');
      navigate('/student-portal');
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit complaint. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Submit a Complaint"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Submit a Complaint' }
      ]}
      showPageHeader={false}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Information & Guidelines */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-900 shadow-[8px_8px_0px_#f8fafc] hover:shadow-[12px_12px_0px_#f1f5f9] transition-all">
              <FaShieldAlt className="w-12 h-12 mb-6 text-rose-600" />
              <h2 className="text-3xl font-black mb-3 text-slate-900 tracking-tight">Safe & Secure</h2>
              <p className="text-slate-600 mb-8 font-medium leading-relaxed">
                Your safety is our top priority. Every report is handled carefully and confidentially.
              </p>

              <div className="space-y-5">
                {[
                  { icon: FaLock, text: 'Anonymous option' },
                  { icon: FaCheckCircle, text: 'Encrypted data' },
                  { icon: FaClock, text: '24/7 Response team' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-rose-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200">
              <h3 className="text-xs font-black text-rose-600 mb-3 uppercase tracking-widest flex items-center gap-2">
                <FaHeadset className="w-3 h-3" /> Emergency Help?
              </h3>
              <p className="text-slate-500 mb-6 font-medium text-xs leading-relaxed">
                If you are in immediate danger, contact campus security instantly.
              </p>
              <a
                href="tel:+251911000000"
                className="block w-full py-4 text-center rounded-[1.5rem] font-black text-slate-900 transition-all border-2 border-slate-300 hover:border-slate-900 hover:bg-white"
              >
                CALL +251-911-00-00
              </a>
            </div>
          </div>

          {/* Right Column: The Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden">
              <div className="p-8 sm:p-12 border-b-2 border-slate-100">
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-[-0.04em] mb-3">Report an Issue</h1>
                <p className="text-base text-slate-500 font-medium max-w-xl">Please provide details to help us resolve the matter effectively and carefully.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-12">
                {/* Category Selection */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-900 tracking-tight">
                    What's the nature of your concern?
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
                      <option value="roommate">🤝 Roommate Conflict</option>
                      <option value="noise">🔊 Noise Disturbance</option>
                      <option value="harassment">🚫 Harassment / Bullying</option>
                      <option value="safety">🛡️ Safety Concern</option>
                      <option value="staff">👤 Staff Conduct</option>
                      <option value="other">📄 Other Issue</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <FaChevronRight className="rotate-90 w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Description input */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-black text-slate-900 tracking-tight">
                      Detailed Description
                    </label>
                    <span className="text-xs font-black text-slate-400">
                      <span className={formData.description.length > 1800 ? "text-rose-500" : ""}>{formData.description.length}</span> / 2000
                    </span>
                  </div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us what happened... include dates, names, and specific details."
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400 text-base resize-none"
                    required
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-900 tracking-tight">
                    Evidence or Attachments
                  </label>
                  <div className="bg-slate-50 rounded-[1.5rem] p-4 border-2 border-dashed border-slate-200 hover:border-slate-500 transition-colors">
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      accept="image/*,application/pdf"
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

                {/* Options & Submit */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t-2 border-slate-100">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, confidential: !p.confidential }))}
                    className={`flex items-center gap-3 px-6 py-4 rounded-full font-black text-[11px] uppercase tracking-widest transition-all border-2 ${formData.confidential
                      ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    <FaLock />
                    {formData.confidential ? 'Anonymous: ON' : 'Make Anonymous'}
                  </button>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="flex-1 sm:flex-none px-6 py-4 text-slate-500 hover:text-slate-900 font-black text-sm transition-colors tracking-tight uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.issueCategory}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-12 py-4 rounded-full bg-slate-900 hover:bg-black text-white font-black hover:-translate-y-1 transition-all focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-30 disabled:hover:translate-y-0"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="uppercase tracking-widest text-sm">Submit Report</span>
                          <FaChevronRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
