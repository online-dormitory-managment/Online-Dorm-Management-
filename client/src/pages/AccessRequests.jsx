import { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaCalendarPlus, FaStore, FaClock, FaUser, FaInfoCircle } from 'react-icons/fa';
import roleApplicationApi from '../api/roleApplicationApi';
import { uploadUrl } from '../utils/uploadUrl';

export default function AccessRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await roleApplicationApi.list();
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch requests failed:', err);
      setError('Failed to load access requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status) => {
    if (!selectedApp) return;
    try {
      await roleApplicationApi.review(selectedApp._id, status, reviewNote);
      setRequests(requests.map(r => r._id === selectedApp._id ? { ...r, status } : r));
      setSelectedApp(null);
      setReviewNote('');
    } catch (err) {
      alert(err.response?.data?.message || 'Review failed');
    }
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Loading access requests...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">⚠️</div>
        <p className="text-gray-800 mb-4">{error}</p>
        <button onClick={fetchRequests} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Role Access Requests</h1>
        <p className="text-gray-500">Approve or reject requests for special permissions (Event Poster & Vendors).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table View */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User / Request</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Campus</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(requests || []).map(req => (
                  <tr key={req._id} className={`hover:bg-gray-50 transition cursor-pointer ${selectedApp?._id === req._id ? 'bg-blue-50/50' : ''}`} onClick={() => setSelectedApp(req)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${req.type === 'EventPoster' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {req.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{req.name}</p>
                          <p className="text-xs text-gray-500">{req.user?.userID || req.studentID}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {req.type === 'EventPoster' ? <FaCalendarPlus className="text-rose-500" /> : <FaStore className="text-emerald-500" />}
                        <span className="text-sm font-medium text-gray-700">{req.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.campus}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        req.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                        req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-white rounded-lg transition text-gray-400 hover:text-blue-600">
                        <FaInfoCircle />
                      </button>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">No pending access requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-fit">
          {selectedApp ? (
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaUser className="text-blue-600" /> Request Details
              </h2>
              
              <div className="space-y-4 mb-8">
                <DetailRow label="Name" value={selectedApp.name} />
                <DetailRow label="Request For" value={selectedApp.type} />
                <DetailRow label="Campus" value={selectedApp.campus} />
                
                {selectedApp.type === 'EventPoster' ? (
                  <>
                    <DetailRow label="Department" value={selectedApp.department} />
                    <DetailRow label="Club Name" value={selectedApp.clubName} />
                    <DetailRow label="Dorm Info" value={selectedApp.dormNumber} />
                  </>
                ) : (
                  <>
                    <DetailRow label="Fayda ID" value={selectedApp.fayda} />
                  </>
                )}

                {selectedApp.documentPath && (
                  <div className="py-2">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Verification Document</p>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-2 overflow-hidden mb-2 group">
                      {selectedApp.documentPath.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img 
                          src={uploadUrl(selectedApp.documentPath)} 
                          alt="Verification" 
                          className="w-full h-auto max-h-[300px] object-contain rounded-xl cursor-zoom-in group-hover:scale-[1.02] transition-transform duration-300"
                          onClick={() => window.open(uploadUrl(selectedApp.documentPath), '_blank')}
                        />
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500 mb-2">Non-image document (PDF)</p>
                        </div>
                      )}
                    </div>
                    <a 
                      href={uploadUrl(selectedApp.documentPath)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-sm text-blue-600 font-bold hover:underline flex items-center justify-center gap-1 bg-blue-50 py-2 rounded-xl"
                    >
                      View Original Full File
                    </a>
                  </div>
                )}
              </div>

              {selectedApp.status === 'Pending' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Review Note (Optional)</label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="e.g. Approved based on verified documents"
                      className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleReview('Rejected')}
                      className="py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition flex items-center justify-center gap-2"
                    >
                      <FaTimes /> Reject
                    </button>
                    <button
                      onClick={() => handleReview('Approved')}
                      className="py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <FaCheck /> Approve
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-700 mb-1">This request was already {selectedApp.status.toLowerCase()}.</p>
                  <p className="text-xs text-gray-500">Reviewed at: {new Date(selectedApp.reviewedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaClock className="text-4xl text-gray-100 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Select a request from the list to view details and approve access.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-gray-50 pb-2">
      <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
    </div>
  );
}
