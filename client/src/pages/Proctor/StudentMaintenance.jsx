import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FaSearch,
  FaFilter,
  FaDownload,
  FaPlus,
  FaEye,
  FaEdit,
  FaEllipsisV,
  FaPlug,
  FaWifi,
  FaTint,
  FaWindowClose,
  FaBolt,
  FaWrench,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';
import maintenanceApi from '../../api/maintenanceApi';
import toast from 'react-hot-toast';

const StudentMaintenance = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    // Pick up ID from dashboard review button
    const queryParams = new URLSearchParams(location.search);
    const targetId = queryParams.get('id');
    if (targetId) {
      setSearchTerm(targetId);
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await maintenanceApi.allForProctor();
        if (!alive) return;
        const data = res?.data || [];
        setRequests(
          data.map((r) => {
            const studentName = r.student?.fullName || 'Unknown student';
            const studentId = r.student?.studentID || r.student?.studentId || '';
            const initials =
              studentName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase() || 'ST';
            return {
              id: r._id,
              studentInitials: initials,
              studentName,
              studentId,
              dorm: r.location || 'Dorm',
              block: '',
              issue: r.issueCategory,
              description: r.description,
              dateSubmitted: new Date(r.createdAt).toLocaleDateString(),
              status: (r.status || 'Pending').toLowerCase().replace(' ', '-'),
              priority: (r.urgency || 'Low').toLowerCase(),
              category: r.issueCategory?.toLowerCase().includes('water')
                ? 'plumbing'
                : r.issueCategory?.toLowerCase().includes('wifi') ||
                  r.issueCategory?.toLowerCase().includes('network')
                ? 'network'
                : r.issueCategory?.toLowerCase().includes('door') ||
                  r.issueCategory?.toLowerCase().includes('lock')
                ? 'security'
                : 'electrical',
              technician: '',
              estimatedCompletion: ''
            };
          })
        );
      } catch {
        setRequests([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Status filters
  const statusFilters = [
    { id: 'all', label: 'All Requests' },
    { id: 'pending', label: 'Pending' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'complete', label: 'Complete' },
  ];

  const filteredRequests = requests.filter(request => {
    if (activeFilter === 'all') return true;
    return request.status === activeFilter;
  }).filter(request =>
    request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete': return <FaCheckCircle className="text-green-500" />;
      case 'in-progress': return <FaClock className="text-blue-500" />;
      case 'pending': return <FaExclamationCircle className="text-yellow-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'in-progress': return 'In Progress';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'electrical': return <FaPlug className="text-yellow-500" />;
      case 'plumbing': return <FaTint className="text-blue-500" />;
      case 'security': return <FaWindowClose className="text-red-500" />;
      case 'network': return <FaWifi className="text-purple-500" />;
      default: return <FaBolt className="text-gray-500" />;
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const statusLabel = newStatus === 'complete' ? 'Resolved' : 'In Progress';
      const loadingToast = toast.loading(`Updating status to ${statusLabel}...`);
      await maintenanceApi.updateStatus(id, statusLabel, `Status updated by Proctor to ${statusLabel}`);
      toast.dismiss(loadingToast);
      toast.success(`Request marked as ${statusLabel}`);
      
      // Refresh list
      const res = await maintenanceApi.allForProctor();
      const data = res?.data || [];
      setRequests(data.map(r => {
        const studentName = r.student?.fullName || 'Unknown';
        const initials = studentName.split(' ').filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase() || 'ST';
        return {
          id: r._id,
          studentInitials: initials,
          studentName,
          studentId: r.student?.studentID || '',
          dorm: r.location || 'Dorm',
          issue: r.issueCategory,
          description: r.description,
          dateSubmitted: new Date(r.createdAt).toLocaleDateString(),
          status: (r.status || 'Pending').toLowerCase().replace(/\s+/g, '-'),
          priority: (r.urgency || 'Low').toLowerCase(),
          category: r.issueCategory?.toLowerCase().includes('water') ? 'plumbing' : 'electrical'
        };
      }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Maintenance Requests</h1>
          <p className="text-slate-500 font-medium">Manage and resolve dormitory maintenance issues.</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests..."
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
        </div>
      </div>

      {/* Maintenance Requests Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Student & Dorm
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-sm text-gray-500">
                    Loading maintenance requests...
                  </td>
                </tr>
              )}
              {!loading && filteredRequests.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-sm text-gray-500">
                    No maintenance requests found.
                  </td>
                </tr>
              )}
              {!loading && filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-blue-600 font-mono font-bold text-sm">
                        #{request.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">{request.studentInitials}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{request.studentName}</div>
                        <div className="text-sm text-gray-500">{request.dorm}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getCategoryIcon(request.category)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.issue}</div>
                        <div className="text-sm text-gray-600 mt-1">{request.description}</div>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            <span className="capitalize">{request.priority}</span> Priority
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.dateSubmitted}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1.5">{getStatusText(request.status)}</span>
                      </span>
                    </div>
                    {request.technician && (
                      <div className="text-xs text-gray-500 mt-1">
                        Tech: {request.technician}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(request.id, 'in-progress')}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                        >
                          Mark In Progress
                        </button>
                      )}
                      {(request.status === 'pending' || request.status === 'in-progress') && (
                        <button 
                          onClick={() => handleStatusUpdate(request.id, 'complete')}
                          className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                        >
                          Resolve
                        </button>
                      )}
                      {request.status === 'complete' && (
                        <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-xl">
                          No Actions
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Showing <span className="text-slate-900 font-bold">{filteredRequests.length}</span> of <span className="text-slate-900 font-bold">{requests.length}</span> total requests
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMaintenance;