import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FaSearch,
  FaFilter,
  FaFile,
  FaDownload,
  FaPrint,
  FaStamp,
  FaCalendarAlt,
  FaBuilding,
  FaTshirt,
  FaShoePrints,
  FaEllipsisV,
  FaEye,
  FaCheck,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPlus
} from 'react-icons/fa';
import exitClearanceApi from '../../api/exitClearanceApi';
import proctorApi from '../../api/proctorApi';
import toast from 'react-hot-toast';

const StudentExit = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [exitApplications, setExitApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'week', 'month'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [manualForm, setManualForm] = useState({
    studentId: '',
    items: [{ name: '', quantity: 1 }]
  });

  // Status filters
  const statusFilters = [
    { id: 'all', label: 'All Status' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'declined', label: 'Declined' },
  ];

  const filteredApplications = exitApplications.filter(app => {
    if (activeFilter === 'all') return true;
    return app.status === activeFilter;
  }).filter(app => {
    if (timeFilter === 'all') return true;
    const now = new Date();
    const appDate = new Date(app.submissionDate);
    if (timeFilter === 'week') return appDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (timeFilter === 'month') return appDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return true;
  }).filter(app =>
    app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.studentId.includes(searchTerm) ||
    app.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <FaCheckCircle className="text-green-500" />;
      case 'declined': return <FaTimesCircle className="text-red-500" />;
      case 'pending': return <FaClock className="text-yellow-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'declined': return 'Declined';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const location = useLocation();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await exitClearanceApi.pending();
      const data = res || [];
      const mapped = data.map((e) => {
          const studentName = e.student?.fullName || 'Student';
          const studentId = e.student?.studentID || '';
          const initials =
            studentName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0])
              .join('')
              .toUpperCase() || 'ST';
          return {
            id: e._id,
            studentInitials: initials,
            studentName,
            studentId,
            block: e.blockName || e.buildingName || 'N/A',
            dorm: e.roomNumber || 'N/A',
            submissionDate: new Date(e.createdAt).toLocaleDateString(),
            departureDate: e.departureDate
              ? new Date(e.departureDate).toLocaleDateString()
              : '—',
            status: e.status.toLowerCase(),
            items: e.items || [],
            remarks: e.rejectionReason || '',
            submittedBy: 'Student',
            lastUpdated: new Date(e.updatedAt || e.createdAt).toLocaleString(),
            approvedBy: e.proctor?.fullName || '',
            approvalDate: e.approvalDate ? new Date(e.approvalDate).toLocaleString() : ''
          };
      });
      setExitApplications(mapped);

      // Handle deep-linking from dashboard
      const queryParams = new URLSearchParams(location.search);
      const targetId = queryParams.get('id');
      if (targetId) {
        const index = mapped.findIndex(app => app.id === targetId);
        if (index !== -1) {
          setSelectedApplication(index);
        }
      } else {
        setSelectedApplication(0);
      }
    } catch {
      setExitApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await proctorApi.getStudents();
      setStudents(res || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchStudents();
  }, []);

  const handleApprove = async () => {
    const app = filteredApplications[selectedApplication];
    if (!app) return;

    if (!window.confirm(`Approve exit clearance and apply digital stamp for ${app.studentName}?`)) return;

    try {
      const loadingToast = toast.loading('Processing approval and applying stamp...');
      await exitClearanceApi.approve(app.id);
      toast.dismiss(loadingToast);
      toast.success('Clearance approved and digital stamp applied!');
      await fetchApplications();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to approve application');
    }
  };

  const handleDecline = async () => {
    const app = filteredApplications[selectedApplication];
    if (!app) return;

    const reason = window.prompt('Please enter a reason for rejection:');
    if (!reason) return;

    try {
      const loadingToast = toast.loading('Declining application...');
      await exitClearanceApi.reject(app.id, reason);
      toast.dismiss(loadingToast);
      toast.success('Application declined');
      await fetchApplications();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to decline application');
    }
  };

  const handleDelete = async () => {
    const app = filteredApplications[selectedApplication];
    if (!app) return;

    if (!window.confirm(`Are you sure you want to permanently delete this record for ${app.studentName}?`)) return;

    try {
      const loadingToast = toast.loading('Deleting record...');
      await exitClearanceApi.delete(app.id);
      toast.dismiss(loadingToast);
      toast.success('Record deleted successfully');
      await fetchApplications();
    } catch (error) {
       toast.error('Only pending or specific records can be deleted');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.studentId) return toast.error('Please select a student');
    const validItems = manualForm.items.filter(i => i.name.trim());
    if (validItems.length === 0) return toast.error('Add at least one item');

    try {
      const loadingToast = toast.loading('Creating manual clearance...');
      await exitClearanceApi.request(validItems, manualForm.studentId);
      toast.dismiss(loadingToast);
      toast.success('Manual clearance created!');
      setIsModalOpen(false);
      setManualForm({ studentId: '', items: [{ name: '', quantity: 1 }] });
      await fetchApplications();
    } catch (err) {
      toast.error('Failed to create manual clearance');
    }
  };

  const addManualItem = () => {
    setManualForm(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1 }]
    }));
  };

  return (
    <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Exit Clearance Applications</h1>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
           >
             <FaPlus className="w-4 h-4" /> Manual Request
           </button>
        </div>
        <p className="text-slate-500 font-medium tracking-wide prose max-w-2xl">Review, manage, and approve student dormitory checkout requests with digital stamping.</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search applications..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeFilter === filter.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        {/* Time Filters */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          {['all', 'week', 'month'].map((range) => (
            <button
              key={range}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === range ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setTimeFilter(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Submission Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && (
                    <tr>
                      <td colSpan="4" className="px-6 py-6 text-center text-sm text-gray-500">
                        Loading exit clearance requests...
                      </td>
                    </tr>
                  )}
                  {!loading && filteredApplications.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-6 text-center text-sm text-gray-500">
                        No exit clearance requests found.
                      </td>
                    </tr>
                  )}
                  {!loading && filteredApplications.map((application, index) => (
                    <tr
                      key={application.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedApplication === index ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedApplication(index)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedApplication === index ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}>
                              <span className={`font-bold ${selectedApplication === index ? 'text-blue-600' : 'text-gray-600'}`}>
                                {application.studentInitials}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{application.studentName}</div>
                            <div className="text-sm text-gray-500">ID: {application.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FaBuilding className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900">Block {application.block}</div>
                            <div className="text-sm text-gray-500">Dorm {application.dorm}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{application.submissionDate}</div>
                        <div className="text-xs text-gray-500">
                          <FaCalendarAlt className="inline w-3 h-3 mr-1" />
                          Departure: {application.departureDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            <span className="ml-1.5">{getStatusText(application.status)}</span>
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {application.remarks}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Application Details Sidebar */}
        {filteredApplications[selectedApplication] && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Checkout Details</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Block:</span>
                    <span className="font-semibold">Block {filteredApplications[selectedApplication].block}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Dorm Number:</span>
                    <span className="font-semibold">{filteredApplications[selectedApplication].dorm}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Departure Date:</span>
                    <span className="font-semibold">{filteredApplications[selectedApplication].departureDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Application ID:</span>
                    <span className="font-mono font-bold text-blue-600">{filteredApplications[selectedApplication].id}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Items and their Amounts</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="text-left text-sm font-medium text-gray-700 pb-2">Item Name</th>
                          <th className="text-right text-sm font-medium text-gray-700 pb-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications[selectedApplication].items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-200 last:border-0">
                            <td className="py-2 text-sm text-gray-800 flex items-center">
                              {item.name.toLowerCase().includes('shirt') && <FaTshirt className="w-3 h-3 mr-2 text-gray-400" />}
                              {item.name.toLowerCase().includes('shoe') && <FaShoePrints className="w-3 h-3 mr-2 text-gray-400" />}
                              {item.name}
                            </td>
                            <td className="py-2 text-sm text-gray-800 text-right font-medium">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-6">
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(filteredApplications[selectedApplication].status)}`}>
                    {getStatusIcon(filteredApplications[selectedApplication].status)}
                    <span className="ml-2">Status: {getStatusText(filteredApplications[selectedApplication].status)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {filteredApplications[selectedApplication].status === 'pending' && (
                    <>
                      <button
                        onClick={handleApprove}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center font-medium"
                      >
                        <FaCheck className="w-4 h-4 mr-2" />
                        Approve & Apply Digital Stamp
                      </button>
                      <button
                        onClick={handleDecline}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center font-medium"
                      >
                        <FaTimes className="w-4 h-4 mr-2" />
                        Decline Application
                      </button>
                    </>
                  )}

                  <div className="flex space-x-3">
                    <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center font-medium">
                      <FaStamp className="w-4 h-4 mr-2" />
                      Add Stamp
                    </button>
                    <button className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center font-medium">
                      <FaPrint className="w-4 h-4 mr-2" />
                      Print
                    </button>
                  </div>

                  <button 
                    onClick={handleDelete}
                    className="w-full px-4 py-3 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 flex items-center justify-center font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    <FaTimes className="w-4 h-4 mr-2" />
                    Delete Record
                  </button>
                </div>
              </div>

              {/* Additional Information */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Application Info</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Submitted By:</span>
                    <span className="font-medium">{filteredApplications[selectedApplication].submittedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span className="font-medium">{filteredApplications[selectedApplication].lastUpdated}</span>
                  </div>
                  {filteredApplications[selectedApplication].approvedBy && (
                    <div className="flex justify-between">
                      <span>Approved By:</span>
                      <span className="font-medium text-green-600">{filteredApplications[selectedApplication].approvedBy}</span>
                    </div>
                  )}
                  {filteredApplications[selectedApplication].declinedReason && (
                    <div className="flex justify-between">
                      <span>Decline Reason:</span>
                      <span className="font-medium text-red-600">{filteredApplications[selectedApplication].declinedReason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{exitApplications.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FaFile className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {exitApplications.filter(app => app.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FaClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {exitApplications.filter(app => app.status === 'approved').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FaCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Declined</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {exitApplications.filter(app => app.status === 'declined').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FaTimesCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manual Exit Request</h2>
                <p className="text-sm text-slate-500 font-medium">Create a clearance record for a student manually.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl"><FaTimes className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Student</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 outline-none font-bold"
                  value={manualForm.studentId}
                  onChange={(e) => setManualForm({...manualForm, studentId: e.target.value})}
                  required
                >
                  <option value="">Choose a student...</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.fullName} - {s.studentID}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Items</label>
                  <button type="button" onClick={addManualItem} className="text-blue-600 font-black text-[10px] uppercase">+ Add Item</button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {manualForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Item Name"
                        className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-blue-500 outline-none text-sm font-bold"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...manualForm.items];
                          newItems[idx].name = e.target.value;
                          setManualForm({...manualForm, items: newItems});
                        }}
                      />
                      <input 
                        type="number"
                        className="w-20 px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-blue-500 outline-none text-sm font-bold"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...manualForm.items];
                          newItems[idx].quantity = parseInt(e.target.value);
                          setManualForm({...manualForm, items: newItems});
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex gap-4">
                 <button 
                   type="button"
                   onClick={() => setIsModalOpen(false)}
                   className="flex-1 py-4 px-6 bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
                 >
                   Create Record
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExit;