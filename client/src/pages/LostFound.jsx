import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import {
  FaImage,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaPhoneAlt,
  FaBox,
  FaPlus,
  FaSearch
} from 'react-icons/fa';
import lostFoundApi from '../api/lostFoundApi';
import authApi from '../api/authApi';
import { uploadUrl } from '../utils/uploadUrl';
import ReportFoundModal from '../components/common/ReportFoundModal';
import { FaInfoCircle } from 'react-icons/fa';

export default function LostFound() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const [data, user] = await Promise.all([
        lostFoundApi.list(),
        Promise.resolve(authApi.getCurrentUser())
      ]);
      setItems(data || []);
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to load lost & found items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const renderImage = (item) => {
    const imagePath = item?.image?.path || null;
    const imageUrl = imagePath ? uploadUrl(imagePath) : null;
    if (!imageUrl) return (
      <div className="w-full h-40 bg-slate-100 flex items-center justify-center">
        <FaImage className="w-10 h-10 text-slate-300" />
      </div>
    );
    return (
      <img
        src={imageUrl}
        alt={item.itemName}
        className="w-full h-40 object-cover"
      />
    );
  };

  return (
    <DashboardLayout
      title="Lost & Found"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Lost & Found' }
      ]}
      showPageHeader={true}
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Lost &amp; Found</h1>
            <p className="text-sm text-slate-600">
              Browse all items reported lost or found by students. Use the button on the right to post a new item.
            </p>
          </div>
          <button
            onClick={() => navigate('/report-lost-item')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm"
          >
            <FaPlus className="w-4 h-4" />
            <span>Post Item</span>
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading items...</p>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500">
            <p className="font-semibold mb-2">No lost or found items yet.</p>
            <p>Be the first to report by clicking the &quot;Post Item&quot; button.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col"
              >
                {renderImage(item)}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        item.type === 'lost'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      <FaBox className="w-3 h-3" />
                      {item.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <FaCalendarAlt className="w-3 h-3" />
                      {item.date ? new Date(item.date).toLocaleDateString() : 'Date N/A'}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">
                    {item.itemName || 'Unnamed Item'}
                  </h2>
                  <p className="text-xs text-slate-600 mb-2 line-clamp-3">
                    {item.description || 'No description provided.'}
                  </p>
                  <div className="mt-auto space-y-1 text-xs text-slate-600">
                    {item.location && (
                      <div className="flex items-center gap-1.5">
                        <FaMapMarkerAlt className="w-3 h-3 text-blue-500" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                    {item.postedBy && (
                      <div className="flex items-center gap-1.5">
                        <FaUser className="w-3 h-3 text-slate-500" />
                        <span className="truncate">Posted by {item.postedBy}</span>
                      </div>
                    )}
                    {item.contactInfo && (
                      <div className="flex items-center gap-1.5">
                        <FaPhoneAlt className="w-3 h-3 text-emerald-500" />
                        <span className="truncate">{item.contactInfo}</span>
                      </div>
                    )}
                  </div>

                  {item.type === 'lost' && item.status === 'Open' && (
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowReportModal(true);
                      }}
                      className="mt-4 w-full py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                      <FaSearch className="w-3 h-3" />
                      <span>I Found This</span>
                    </button>
                  )}

                  {item.status === 'ReportedFound' && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          Reported as Found
                        </p>
                      </div>
                      
                      {/* Show founder details ONLY to the owner */}
                      {(currentUser?.id === item.reportedBy || currentUser?._id === item.reportedBy) && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500 text-left">
                          <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <FaInfoCircle className="w-3 h-3" /> Founder Information
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <FaMapMarkerAlt className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Placed at</p>
                                <p className="text-xs font-bold text-slate-800 break-words">{item.foundLocationDetails || 'Office'}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <FaPhoneAlt className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Contact Number</p>
                                <p className="text-xs font-bold text-slate-800">{item.finderContactNumber || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 text-[9px] text-blue-600 font-medium italic leading-tight">
                            Tip: Bring your ID to verify ownership when collecting.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showReportModal && selectedItem && (
          <ReportFoundModal
            item={selectedItem}
            onClose={() => {
              setShowReportModal(false);
              setSelectedItem(null);
            }}
            onSuccess={fetchItems}
          />
        )}
      </div>
    </DashboardLayout>
  );
}