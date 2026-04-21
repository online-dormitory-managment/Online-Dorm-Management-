import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaArrowLeft, FaCheckCircle, FaFileUpload } from 'react-icons/fa';
import authApi from '../api/authApi';
import roleApplicationApi from '../api/roleApplicationApi';

export default function VendorRegistration() {
  const navigate = useNavigate();
  const user = authApi.getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    fayda: '',
    campus: user?.campus || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('type', 'Vendor');
    data.append('name', formData.name);
    data.append('fayda', formData.fayda);
    data.append('campus', formData.campus);
    if (file) data.append('document', file);

    try {
      await roleApplicationApi.submit(data);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit registration.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border-t-8 border-emerald-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-4xl text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Sent!</h2>
          <p className="text-gray-600 mb-8">
            Your vendor registration has been submitted. Our team will review your Fayda ID and documents.
            You will be notified once your marketplace access is active.
          </p>
          <button
            onClick={() => navigate(user ? '/student-portal' : '/login')}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-xl mx-auto w-full px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition mb-6"
        >
          <FaArrowLeft /> Back
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 border-emerald-500">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <FaStore className="text-2xl" />
              </div>
              <h1 className="text-2xl font-bold">Vendor Registration</h1>
            </div>
            <p className="opacity-90">Become a verified seller on the Campus Marketplace.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Business/Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Fayda ID Number</label>
                <input
                  type="text"
                  name="fayda"
                  value={formData.fayda}
                  onChange={handleChange}
                  required
                  placeholder="Enter your 10-digit Fayda ID"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Primary Campus</label>
                <select
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                >
                  <option value="Main Campus">Main Campus</option>
                  <option value="FBE Campus">FBE Campus</option>
                  <option value="5 Kilo Campus">5 Kilo Campus</option>
                  <option value="6 Kilo Campus">6 Kilo Campus</option>
                  <option value="Lideta Campus">Lideta Campus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Business License / ID Document</label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-6 hover:border-emerald-500 transition-colors bg-gray-50 group">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <FaFileUpload className="text-3xl text-gray-300 group-hover:text-emerald-500 mx-auto mb-2 transition-colors" />
                    <p className="text-sm font-medium text-gray-600">
                      {file ? file.name : "Click to upload document (PDF or Image)"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition flex items-center justify-center gap-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Submit Registration</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
