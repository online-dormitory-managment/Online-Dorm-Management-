import { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/Students/DashboardLayout';

import {
  FaGraduationCap,
  FaBuilding,
  FaBox,
  FaLock,
  FaTrash,
  FaPlus,
  FaSpinner,
  FaCheckCircle,
  FaInfoCircle,
  FaDoorOpen,
  FaChevronRight,
  FaTimesCircle,
  FaFile,
  FaHistory
} from 'react-icons/fa';
import studentApi from '../api/studentApi';
import exitClearanceApi from '../api/exitClearanceApi';
import toast from 'react-hot-toast';

export default function ExitClearance() {


  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    studentName: '',
    institutionalId: '',
    blockName: '',
    dormNumber: '',
    yearOfStudy: '',
    items: [
      { id: 1, description: '', quantity: '' }
    ]
  });
  const [myRequests, setMyRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterRange, setFilterRange] = useState('all'); // 'all', 'week', 'month'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, requestsRes] = await Promise.all([
          studentApi.getDashboard(),
          exitClearanceApi.myRequests()
        ]);

        if (profileRes.success) {
          setFormData(prev => ({
            ...prev,
            studentName: profileRes.student.name,
            institutionalId: profileRes.student.studentId,
            blockName: profileRes.student.block || '',
            dormNumber: profileRes.student.roomNumber || '',
            yearOfStudy: profileRes.student.yearOfStudy || ''
          }));
        }
        setMyRequests(requestsRes || []);
        if (requestsRes && requestsRes.length > 0) {
          setSelectedRequest(requestsRes[0]);
        } else {
          setShowForm(true);
        }
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: '', quantity: '' }]
    }));
  };

  const removeItem = (id) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validItems = formData.items
      .filter(item => item.description.trim() !== '')
      .map(item => ({
        name: item.description,
        quantity: parseInt(item.quantity) || 1
      }));

    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      const loadingToast = toast.loading(editMode ? 'Updating request...' : 'Submitting clearance request...');
      
      if (editMode) {
        await exitClearanceApi.update(editId, validItems);
        toast.dismiss(loadingToast);
        toast.success('Exit clearance updated successfully!');
      } else {
        await exitClearanceApi.request(validItems);
        toast.dismiss(loadingToast);
        toast.success('Exit clearance request submitted successfully!');
      }

      const updatedRequests = await exitClearanceApi.myRequests();
      setMyRequests(updatedRequests);
      
      if (editMode) {
        setSelectedRequest(updatedRequests.find(r => r._id === editId));
      } else {
        setSelectedRequest(updatedRequests[0]);
      }
      
      setShowForm(false);
      setEditMode(false);
      setEditId(null);
    } catch {
      toast.error(editMode ? 'Failed to update request' : 'Failed to submit request');
    }
  };

  const handleEdit = () => {
    if (!selectedRequest || selectedRequest.status !== 'Pending') return;
    
    setEditMode(true);
    setEditId(selectedRequest._id);
    setFormData(prev => ({
      ...prev,
      items: selectedRequest.items.map((it, index) => ({
        id: index + 1,
        description: it.name,
        quantity: it.quantity
      }))
    }));
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!selectedRequest || selectedRequest.status !== 'Pending') return;
    
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    try {
      const loadingToast = toast.loading('Cancelling request...');
      await exitClearanceApi.delete(selectedRequest._id);
      toast.dismiss(loadingToast);
      toast.success('Request cancelled successfully');
      
      const updatedRequests = await exitClearanceApi.myRequests();
      setMyRequests(updatedRequests);
      setSelectedRequest(updatedRequests[0] || null);
      if (updatedRequests.length === 0) setShowForm(true);
    } catch {
      toast.error('Failed to cancel request');
    }
  };

  const startNewRequest = () => {
    setEditMode(false);
    setEditId(null);
    setFormData(prev => ({
      ...prev,
      items: [{ id: 1, description: '', quantity: '' }]
    }));
    setShowForm(true);
  };

  const getFilteredRequests = () => {
    if (filterRange === 'all') return myRequests;
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return myRequests.filter(req => {
      const reqDate = new Date(req.createdAt);
      if (filterRange === 'week') return reqDate >= oneWeekAgo;
      if (filterRange === 'month') return reqDate >= oneMonthAgo;
      return true;
    });
  };

  const filteredRequests = getFilteredRequests();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Exit Clearance"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Exit Clearance' }
      ]}
      showPageHeader={true}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dormitory Clearance</h1>
            <p className="text-slate-500 font-medium">Manage your exit approvals and digital stamps.</p>
          </div>
          {!showForm && (
            <button
              onClick={startNewRequest}
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" /> New Request
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {!showForm && myRequests.length > 0 ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">My Applications</h2>
                  </div>
                  <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                    {['all', 'week', 'month'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setFilterRange(range)}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filterRange === range ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                  {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                    <button
                      key={req._id}
                      onClick={() => setSelectedRequest(req)}
                      className={`w-full p-6 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group ${selectedRequest?._id === req._id ? 'bg-blue-50/50' : ''}`}
                    >
                      <div>
                        <p className={`font-black text-sm mb-1 ${selectedRequest?._id === req._id ? 'text-blue-600' : 'text-slate-900'}`}>
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            req.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {req.status}
                        </span>
                      </div>
                      <FaChevronRight className={`w-3 h-3 transition-transform ${selectedRequest?._id === req._id ? 'text-blue-400 translate-x-1' : 'text-slate-300'}`} />
                    </button>
                  )) : (
                    <div className="p-12 text-center">
                       <p className="text-[10px] font-bold text-slate-400 uppercase">No records in this range</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-200">
                <FaDoorOpen className="w-12 h-12 mb-6 text-blue-400" />
                <h2 className="text-2xl font-black mb-4 tracking-tight">Move Out Ready?</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  Before you leave, ensure all your belongings are accounted for and the room is in its original condition.
                </p>
                <div className="space-y-6">
                  {[
                    { title: 'Personal Info', desc: 'Verify your ID and room details.', icon: FaGraduationCap },
                    { title: 'Inventory', desc: 'List items you are taking with you.', icon: FaBox },
                    { title: 'Inspection', desc: 'A proctor will visit for a final check.', icon: FaCheckCircle }
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 shrink-0 rounded-2xl bg-white/10 flex items-center justify-center font-black">
                        <step.icon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{step.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 flex gap-4">
              <FaInfoCircle className="text-blue-600 shrink-0 mt-1" />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Note: Clearance is required for all students moving out permanently or for long breaks. Unreturned keys or room damage may result in fines.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            {showForm ? (
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100 overflow-hidden">
                <div className="p-8 sm:p-12 border-b border-slate-50 flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                        {editMode ? 'Edit Application' : 'Clearance Application'}
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">
                        {editMode ? 'Update your move-out documentation details.' : 'Complete your move-out documentation below.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {myRequests.length > 0 && (
                      <button 
                        onClick={() => { setShowForm(false); setEditMode(false); }} 
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        <FaHistory className="w-3 h-3" /> View History
                      </button>
                    )}
                    {myRequests.length > 0 && (
                      <button onClick={() => { setShowForm(false); setEditMode(false); }} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest">Cancel</button>
                    )}
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">STUDENT NAME</label>
                      <input type="text" value={formData.studentName} readOnly className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 text-slate-600 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">INSTITUTIONAL ID</label>
                      <input type="text" value={formData.institutionalId} readOnly className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 text-slate-600 font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">BLOCK</label>
                      <input type="text" value={formData.blockName} onChange={(e) => handleInputChange('blockName', e.target.value)} placeholder="Block" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">ROOM</label>
                      <input type="text" value={formData.dormNumber} onChange={(e) => handleInputChange('dormNumber', e.target.value)} placeholder="Room" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">YEAR</label>
                      <select value={formData.yearOfStudy} onChange={(e) => handleInputChange('yearOfStudy', e.target.value)} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100" >
                        <option value="">Year</option>
                        {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm">Items Leaving With You</h2>
                      <button type="button" onClick={addItem} className="text-blue-600 font-black text-xs uppercase">+ Add Item</button>
                    </div>
                    <div className="space-y-4">
                      {formData.items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <input type="text" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} placeholder="Item Description" className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none" />
                          <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} placeholder="Qty" className="w-20 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none" />
                          {formData.items.length > 1 && (
                            <button type="button" onClick={() => removeItem(item.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors"><FaTrash /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-6 border-t border-slate-50">
                    <button type="submit" className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                      {editMode ? 'UPDATE CLEARANCE' : 'SUBMIT CLEARANCE'}
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedRequest ? (
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 sm:p-12 border-b border-slate-50">
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedRequest.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        selectedRequest.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {selectedRequest.status}
                    </span>
                    {selectedRequest.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={handleEdit}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={handleDelete}
                          className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2">Application Details</h1>
                  <p className="text-slate-500 font-medium">Submitted on {new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="p-8 sm:p-12 space-y-10">
                  {selectedRequest.status === 'Approved' && selectedRequest.qrCode && (
                    <div className="relative overflow-hidden glass-effect rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl animate-fade-in">
                      {/* Premium Background Decoration */}
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

                      <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                        {/* Digital Pass Ticket Section */}
                        <div className="shrink-0 flex flex-col items-center">
                          <div className="relative p-6 bg-white rounded-3xl shadow-2xl border-2 border-slate-100 flex flex-col items-center group transition-transform hover:scale-[1.02]">
                            {/* Decorative notches for ticket look */}
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100"></div>
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100"></div>

                            <img src={selectedRequest.qrCode} alt="Clearance QR Code" className="w-56 h-56 mb-4 filter contrast-125" />
                            
                            <div className="w-full pt-4 border-t border-dashed border-slate-200 text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Official Student ID</p>
                              <p className="text-xl font-black text-slate-900 tracking-tight">{formData.institutionalId}</p>
                              <p className="text-xs font-bold text-blue-600 mt-1 uppercase tracking-widest">{formData.studentName}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Authorization</span>
                          </div>
                        </div>

                        <div className="flex-1 space-y-6">
                          <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50/50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100/50">
                               <FaCheckCircle className="w-3 h-3" /> Security Clearance Granted
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">University Exit Authorization Pass</h2>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                              This digital credential serves as formal proof of clearance for dormitory exit.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="glass-effect p-4 rounded-2xl border border-slate-100/30 flex flex-col">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                               <span className="text-xs font-black text-emerald-600 uppercase">Verified Active</span>
                             </div>
                             <div className="glass-effect p-4 rounded-2xl border border-slate-100/30 flex flex-col">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass ID</span>
                               <span className="text-xs font-black text-slate-900 uppercase">#{selectedRequest._id?.slice(-8).toUpperCase()}</span>
                             </div>
                          </div>

                          <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/20">
                            <p className="text-[10px] text-blue-800 font-bold leading-relaxed">
                              Instructions: Present this QR code and your physical university ID to security at the gate for final verification.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {selectedRequest.status === 'Rejected' && (
                    <div className="bg-rose-50 rounded-3xl p-8 border border-rose-100">
                      <h3 className="text-rose-900 font-black mb-2 flex items-center gap-2">
                        <FaTimesCircle className="text-rose-600" /> Rejection Reason
                      </h3>
                      <p className="text-rose-700 text-sm italic">&quot;{selectedRequest.rejectionReason || 'No reason provided.'}&quot;</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resident Information</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-sm text-slate-500">Name</span>
                          <span className="text-sm font-bold text-slate-900">{formData.studentName}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-sm text-slate-500">ID</span>
                          <span className="text-sm font-bold text-slate-900">{formData.institutionalId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Inventory List</h3>
                      <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                        <ul className="space-y-3">
                          {selectedRequest.items.map((it, i) => (
                            <li key={i} className="flex justify-between text-sm font-bold text-slate-700">
                              <span>{it.name}</span>
                              <span className="text-blue-600">x{it.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaFile className="text-slate-300 w-8 h-8" />
                </div>
                <h3 className="font-black text-slate-900 mb-2">No Applications Found</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mb-8">You haven&apos;t submitted any exit clearance requests yet.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
                >
                  Start First Application
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
