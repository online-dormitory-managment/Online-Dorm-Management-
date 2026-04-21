import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarPlus, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import studentDimage from "../assets/Student_Dashboard/studentdashboard.png";
import authApi from '../api/authApi';
import roleApplicationApi from '../api/roleApplicationApi';
import studentApi from '../api/studentApi';

export default function EventPosterRequest() {
  const navigate = useNavigate();
  const user = authApi.getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    studentID: user?.userId || '',
    department: '',
    dormNumber: '',
    campus: '',
    clubName: ''
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    // Cleanup preview URL
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await studentApi.getDashboard();
        if (response.success && response.student) {
          setFormData(prev => ({
            ...prev,
            department: response.student.department || '',
            dormNumber: `${response.student.dormitory || ''} - ${response.student.roomNumber || ''}`,
            campus: response.student.campus || ''
          }));
        }
      } catch (err) {
        console.error('Failed to pre-fill profile data:', err);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    if (e.target.name === 'document') {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (selectedFile && selectedFile.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        setPreview(null);
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload your club authorization document.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('document', file);
      data.append('type', 'EventPoster');

      await roleApplicationApi.submit(data);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-4xl text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-8">
            Your request to become an Event Poster has been sent to the Campus Admin for review.
            You will receive access once approved.
          </p>
          <button
            onClick={() => navigate('/student-portal')}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-6"
        >
          <FaArrowLeft /> Back
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
            {/* Background Illustration */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 opacity-20 pointer-events-none">
              <img src={studentDimage} alt="" className="w-full h-full object-contain brightness-0 invert" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <FaCalendarPlus className="text-2xl" />
                </div>
                <h1 className="text-2xl font-bold">Event Poster Access</h1>
              </div>
              <p className="opacity-90">Register your club or organization to share campus events.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Student ID</label>
                <input
                  type="text"
                  name="studentID"
                  value={formData.studentID}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Software Engineering"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dorm Number / Block</label>
                <input
                  type="text"
                  name="dormNumber"
                  value={formData.dormNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Block 4, Room 201"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Campus</label>
                <input
                  type="text"
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Club / Organization Name</label>
                <input
                  type="text"
                  name="clubName"
                  value={formData.clubName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Red Cross Club"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Club Authorization Document (PDF/JPG)</label>
                {!preview ? (
                  <div className="relative group">
                    <input
                      type="file"
                      name="document"
                      onChange={handleChange}
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition group-hover:border-blue-400 cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">Upload proof that you are allowed to be a club at this campus</p>
                  </div>
                ) : (
                  <div className="relative bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center">
                    <div className="w-full h-48 rounded-xl overflow-hidden border border-gray-200 mb-3 bg-white">
                      <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center gap-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Submit Access Request</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
