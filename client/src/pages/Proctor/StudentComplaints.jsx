import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FaFilter,
  FaSearch,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaComments,
  FaVolumeUp,
  FaExclamationCircle,
  FaCalendarAlt,
  FaBuilding,
  FaChevronRight,
  FaEllipsisV,
  FaPlus,
  FaEye,
  FaCheck,
  FaTimes,
  FaUserCircle,
  FaBell
} from 'react-icons/fa';
import complaintApi from '../../api/complaintApi';
import toast from 'react-hot-toast';

const Complaints = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const activityLog = [
    {
      type: 'proctor',
      title: 'Proctor Review',
      description: 'Visited common area. Confirmed students holding late-night party. Students were cooperative when reminded. Issued first warning for disturbing others.',
      time: 'Oct 24, 2:45 PM',
      icon: <FaUserCircle className="text-blue-500" />,
    },
    {
      type: 'system',
      title: 'System',
      description: 'Ticket marked as "In Progress" by Proctor Admin.',
      time: 'Oct 24, 2:31 PM',
      icon: <FaBell className="text-green-500" />,
    },
  ];

  const [stats, setStats] = useState([]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintApi.blockComplaints();
      const data = res?.data || [];
      const mapped = data.map((c) => {
        const studentName = c.student?.fullName || 'Student';
        const studentId = c.student?.studentID || '';
        const dorm = c.roomNumber || '';
        const block = c.dormBlock?.name || '';
        const initials = studentName.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'ST';
        return {
          id: c._id,
          student: studentName,
          studentInitials: initials,
          studentId,
          dorm,
          block,
          title: c.category,
          description: c.description,
          urgency: (c.priority || 'medium').toLowerCase(),
          status:
            c.status === 'Open'
              ? 'new'
              : c.status === 'In Progress'
                ? 'in-progress'
                : c.status === 'Resolved'
                  ? 'resolved'
                  : 'pending',
          date: new Date(c.createdAt).toLocaleDateString(),
          time: new Date(c.createdAt).toLocaleTimeString(),
          category: c.category
        };
      });
      setComplaints(mapped);

      const openCount = mapped.filter((c) => c.status !== 'resolved').length;
      const highUrgency = mapped.filter((c) => c.urgency === 'high').length;
      const resolved = mapped.filter((c) => c.status === 'resolved').length;
      setStats([
        {
          title: 'Open Complaints',
          value: String(openCount),
          change: '',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: <FaComments className="text-blue-500" />
        },
        {
          title: 'High Urgency',
          value: String(highUrgency),
          change: '',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: <FaExclamationTriangle className="text-red-500" />
        },
        {
          title: 'Resolved',
          value: String(resolved),
          change: '',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: <FaCheckCircle className="text-green-500" />
        }
      ]);
    } catch {
      setComplaints([]);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    // Pick up ID from dashboard review button
    const queryParams = new URLSearchParams(location.search);
    const targetId = queryParams.get('id');
    if (targetId) {
      setSearchTerm(targetId);
    }

    fetchComplaints();
  }, []);

  const handleResolve = async (id) => {
    if (!window.confirm('Mark this complaint as Resolved?')) return;
    const loadingToast = toast.loading('Resolving complaint...');
    try {
      await complaintApi.updateStatus(id, 'Resolved', 'Resolved by Proctor via Dashboard');
      toast.dismiss(loadingToast);
      toast.success('Complaint resolved and student notified');
      await fetchComplaints();
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error('Failed to resolve complaint');
    }
  };

  const handleEscalate = async (id) => {
    if (!window.confirm('Escalate this complaint?')) return;
    const loadingToast = toast.loading('Escalating complaint...');
    try {
      await complaintApi.updateStatus(id, 'Pending', 'Escalated to Admin');
      toast.dismiss(loadingToast);
      toast.success('Complaint escalated and student notified');
      await fetchComplaints();
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error('Failed to escalate complaint');
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filter === 'all') return true;
    if (filter === 'high') return complaint.urgency === 'high';
    if (filter === 'new') return complaint.status === 'new';
    if (filter === 'in-progress') return complaint.status === 'in-progress';
    return true;
  }).filter(complaint =>
    complaint.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'New';
      case 'in-progress': return 'In Progress';
      case 'pending': return 'Pending';
      case 'resolved': return 'Resolved';
      default: return 'Unknown';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'high': return <FaExclamationTriangle className="text-red-500" />;
      case 'medium': return <FaExclamationCircle className="text-yellow-500" />;
      case 'low': return <FaCheckCircle className="text-green-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  return (
    <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Complaints Management</h1>
        <p className="text-slate-500 font-medium tracking-wide prose max-w-2xl">Review incoming reports, manage urgency levels, and resolve student issues efficiently.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-3xl border-2 border-slate-50 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{stat.title}</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-black text-slate-900">{stat.value}</span>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${stat.bgColor}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Complaint Details */}
        <div className="lg:col-span-2">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-3xl border-2 border-slate-50 p-6 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium text-slate-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                {['all', 'high', 'new', 'in-progress'].map((filterType) => (
                  <button
                    key={filterType}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${filter === filterType ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
                    onClick={() => setFilter(filterType)}
                  >
                    {filterType === 'all' ? 'All' : filterType.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Complaints List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Recent Complaints</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {loading && (
                <div className="p-4 text-sm text-gray-500">Loading complaints...</div>
              )}
              {!loading && filteredComplaints.length === 0 && (
                <div className="p-4 text-sm text-gray-500">No complaints found for your block.</div>
              )}
              {!loading && filteredComplaints.map((complaint) => (
                <div key={complaint.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(complaint.urgency)}`}>
                          {getUrgencyIcon(complaint.urgency)}
                          <span className="ml-1 capitalize">{complaint.urgency}</span>
                        </span>
                        <span className="text-xs text-gray-500">{complaint.date}</span>
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-1">{complaint.student} (Dorm {complaint.dorm})</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">{complaint.category}</span> • Block {complaint.block}
                      </p>
                      <p className="text-gray-700 mb-3">{complaint.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <FaCalendarAlt className="w-4 h-4 mr-1" />
                          {complaint.time}
                        </span>
                        <span className="flex items-center">
                          <FaBuilding className="w-4 h-4 mr-1" />
                          Dorm {complaint.dorm}, Block {complaint.block}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {getStatusText(complaint.status)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    {complaint.status !== 'resolved' && (
                      <button 
                        onClick={() => handleResolve(complaint.id)}
                        className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all flex items-center"
                      >
                        <FaCheck className="mr-2" /> Resolve
                      </button>
                    )}
                    {complaint.status === 'new' && (
                      <button 
                        onClick={() => handleEscalate(complaint.id)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center"
                      >
                        <FaChevronRight className="mr-2" /> Escalate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Activity and Details */}
        <div className="space-y-6">
          {/* Active Complaint Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Active Complaint</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <FaEllipsisV className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUserCircle className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Hlina Grma</h4>
                <p className="text-sm text-gray-600">ID: 24901</p>
                <p className="text-sm text-gray-600">{JSON.parse(localStorage.getItem('user'))?.campus || 'Dormitory'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  In Progress
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Complaint Type</p>
                <p className="font-medium text-gray-800">Noise Complaint</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Reported</p>
                <p className="font-medium text-gray-800">Oct 24, 2:30 PM</p>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Activity Log</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {activityLog.map((activity, index) => (
                <div key={index} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-800">{activity.title}</h4>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button className="w-full px-4 py-3 text-sm font-medium text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 flex items-center justify-center">
                <FaExclamationTriangle className="w-4 h-4 mr-2" />
                Escalate to Dean
              </button>
              <button className="w-full px-4 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                <FaClock className="w-4 h-4 mr-2" />
                Mark as Pending
              </button>
              <button className="w-full px-4 py-3 text-sm font-medium text-green-600 border border-green-300 rounded-lg hover:bg-green-50 flex items-center justify-center">
                <FaCheck className="w-4 h-4 mr-2" />
                Resolve Complaint
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Complaint Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Noise Issues</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Communication</span>
                <span className="font-semibold">2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{JSON.parse(localStorage.getItem('user'))?.campus || 'Your Building'}</span>
                <span className="font-semibold">5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Resolved This Week</span>
                <span className="font-semibold text-green-600">12</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Complaints;