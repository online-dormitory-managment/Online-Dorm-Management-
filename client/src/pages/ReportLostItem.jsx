import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentApi from '../api/studentApi';
import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import {
  FaImage,
  FaSearch,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaChevronRight,
  FaBoxes,
  FaMicrochip,
  FaTshirt,
  FaGem,
  FaBook,
  FaKey,
  FaFileAlt,
  FaEllipsisH,
  FaTrash,
  FaCheckCircle
} from 'react-icons/fa';
import lostFoundApi from '../api/lostFoundApi';
import toast from 'react-hot-toast';

export default function ReportLostItem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    description: '',
    lastSeenLocation: '',
    dateLost: '',
    contactInfo: 'Hilina Girma - hilina.girma@example.com', // Auto-filled in real app
    image: null
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentApi.getDashboard();
        if (res.success && res.student) {
          setFormData(prev => ({
            ...prev,
            contactInfo: `${res.student.name} - ${res.student.studentId}`
          }));
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, []);

  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData(prev => ({
        ...prev,
        image: e.dataTransfer.files[0]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting lost report:', formData);
    if (!formData.category) {
      return toast.error('Please select a category.');
    }
    const loadingToast = toast.loading('Posting your report...');
    try {
      const payload = {
        type: 'lost',
        itemName: formData.itemName,
        category: formData.category,
        description: formData.description || '',
        location: formData.lastSeenLocation || 'Unknown',
        date: formData.dateLost || new Date().toISOString().slice(0, 10),
        contactInfo: formData.contactInfo,
        image: formData.image
      };
      console.log('API Payload:', payload);
      await lostFoundApi.create(payload);
      toast.dismiss(loadingToast);
      toast.success('Your report has been posted successfully!');
      setTimeout(() => navigate('/lost-found-dashboard'), 1500);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Post report error:', error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to post report.';
      toast.error(msg);
    }
  };

  const categories = [
    { id: 'electronics', label: 'Electronics', icon: FaMicrochip, color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 'clothing', label: 'Clothing', icon: FaTshirt, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'accessories', label: 'Accessories', icon: FaGem, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'books', label: 'Books', icon: FaBook, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'keys', label: 'Keys', icon: FaKey, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'documents', label: 'Documents', icon: FaFileAlt, color: 'text-slate-600', bg: 'bg-slate-50' },
    { id: 'other', label: 'Other', icon: FaEllipsisH, color: 'text-slate-400', bg: 'bg-slate-50' }
  ];

  return (
    <DashboardLayout
      title="Report a Lost Item"
      breadcrumbs={[
        { label: 'Lost & Found', path: '/lost-found' },
        { label: 'Report Lost Item' }
      ]}
      showPageHeader={false}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Info & Tips */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-900 shadow-[8px_8px_0px_#f8fafc] hover:shadow-[12px_12px_0px_#f1f5f9] transition-all">
              <FaSearch className="w-12 h-12 mb-6 text-indigo-600" />
              <h2 className="text-3xl font-black mb-3 text-slate-900 tracking-tight">Help Us Find It</h2>
              <p className="text-slate-600 mb-8 font-medium leading-relaxed">
                Provide precise details to help us reunite you with your item faster.
              </p>

              <div className="space-y-5">
                {[
                  { icon: FaImage, text: 'Clear, well-lit photos' },
                  { icon: FaMapMarkerAlt, text: 'Precise locations' },
                  { icon: FaCalendarAlt, text: 'Accurate date & time' }
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <tip.icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200">
              <h3 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-widest">
                Common Types
              </h3>
              <div className="flex flex-wrap gap-3">
                {categories.map(cat => (
                  <span key={cat.id} className={`px-4 py-2 rounded-full border-2 ${formData.category === cat.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'} text-[10px] font-black uppercase tracking-widest transition-colors`}>
                    {cat.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: The Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden">
              <div className="p-8 sm:p-12 border-b-2 border-slate-100">
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-[-0.04em] mb-3">Item Details</h1>
                <p className="text-base text-slate-500 font-medium max-w-xl">Don't leave anything out. Color, brand, or unique marks make a huge difference.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-12">
                {/* Basic Details */}
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 tracking-tight">What did you lose?</label>
                    <input
                      type="text"
                      value={formData.itemName}
                      onChange={(e) => handleInputChange('itemName', e.target.value)}
                      placeholder="e.g. Silver iPhone 13 Pro Max"
                      className="w-full px-6 py-5 rounded-[1.5rem] bg-slate-50 border-2 border-slate-200 focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-400 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 tracking-tight">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleInputChange('category', cat.id)}
                          className={`flex flex-col items-center justify-center p-6 rounded-[1.5rem] border-2 transition-all gap-4 ${formData.category === cat.id
                            ? `border-slate-900 bg-slate-900 text-white`
                            : `border-slate-200 bg-slate-50 hover:border-slate-400 text-slate-600`
                            }`}
                        >
                          <cat.icon className="w-6 h-6" />
                          <span className={`text-[11px] font-black uppercase tracking-widest`}>
                            {cat.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 tracking-tight block">Where was it last seen?</label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={formData.lastSeenLocation}
                        onChange={(e) => handleInputChange('lastSeenLocation', e.target.value)}
                        placeholder="e.g. Library, Room 202"
                        className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-slate-50 border-2 border-slate-200 focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-400 text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 tracking-tight block">When was it lost?</label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={formData.dateLost}
                        onChange={(e) => handleInputChange('dateLost', e.target.value)}
                        className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-slate-50 border-2 border-slate-200 focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 font-bold text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Long Description */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-900 tracking-tight">Additional Information</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    placeholder="Provide details like brand, color, size, case type, unique identifiers..."
                    className="w-full px-6 py-5 rounded-[1.5rem] bg-slate-50 border-2 border-slate-200 focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400 text-base resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-900 tracking-tight">Upload Photo</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-[1.5rem] p-12 text-center transition-all ${dragActive
                      ? 'border-slate-900 bg-slate-50'
                      : formData.image ? 'border-slate-300 bg-slate-50' : 'border-slate-300 bg-white hover:border-slate-500'
                      }`}
                  >
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {!formData.image ? (
                      <label htmlFor="image-upload" className="cursor-pointer group block">
                        <div className="flex flex-col items-center gap-4">
                          <FaImage className="w-10 h-10 text-slate-400 group-hover:text-slate-600 transition-colors" />
                          <div>
                            <p className="font-bold text-slate-900 text-lg group-hover:underline">Choose a file</p>
                            <p className="text-sm text-slate-500 font-medium">or drag it here</p>
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative group/preview w-full max-w-sm mx-auto aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200">
                          <img
                            src={URL.createObjectURL(formData.image)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl border border-slate-200 max-w-sm w-full shadow-[4px_4px_0px_#f1f5f9]">
                          <FaImage className="w-5 h-5 text-slate-500 shrink-0" />
                          <span className="text-sm font-bold text-slate-700 truncate flex-1 text-left">{formData.image.name}</span>
                          <button
                            type="button"
                            onClick={() => handleInputChange('image', null)}
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors shrink-0"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submitter Info */}
                <div className="bg-slate-900 rounded-[1.5rem] p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reporting Securely As</p>
                    <p className="font-black text-white text-base tracking-tight">{formData.contactInfo}</p>
                  </div>
                  <div className="shrink-0 group">
                    <span className="inline-flex items-center gap-2 text-[10px] font-black text-slate-900 bg-white border-2 border-white px-4 py-2 rounded-full uppercase tracking-widest">
                      <FaCheckCircle className="w-3 h-3 text-emerald-500" />
                      Verified
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-8">
                  <button
                    type="button"
                    onClick={() => navigate('/lost-found')}
                    className="w-full sm:w-auto px-8 py-4 text-slate-500 hover:text-slate-900 font-black text-sm tracking-tight transition-colors uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-12 py-4 rounded-full bg-slate-900 hover:bg-indigo-600 text-white font-black hover:-translate-y-1 transition-all"
                  >
                    <span className="uppercase tracking-widest text-sm">Post Report</span>
                    <FaChevronRight className="w-3 h-3" />
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
