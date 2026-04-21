import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaFilter,
  FaSearch,
  FaCheck,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';
import adminApi from '../api/adminApi';
import toast from 'react-hot-toast';
import AdminHeader from '../components/layout/AdminHeader';
import ProfilePictureUpload from '../components/common/ProfilePictureUpload';

export default function ManageStudents() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await adminApi.applications();
      const data = res || [];
      setStudents(
        data
          .filter((app) => !!app.student)
          .map((app) => {
            const s = app.student;
            let studentType = 'Other';
            if (app.studentType) {
              if (app.studentType === 'Self-Sponsored' || app.studentType === 'Self Sponsored') {
                studentType = 'Self Sponsored';
              } else if (app.studentType === 'Government' || app.studentType === 'Government Sponsorship') {
                studentType = 'Government Sponsorship';
              } else if (app.studentType === 'Special Needs') {
                studentType = 'Special Needs';
              } else if (app.studentType === 'Staff Relatives' || app.studentType === 'Staff Relative') {
                studentType = 'Staff Relatives';
              }
            } else if (s.sponsorship) {
              if (s.sponsorship === 'Self-Sponsored') {
                studentType = 'Self Sponsored';
              } else if (s.sponsorship === 'Government') {
                studentType = 'Government Sponsorship';
              }
            }

            return {
              id: s.studentID,
              applicationId: app._id,
              name: s.fullName,
              email: s.user?.email || '',
              checkIn: new Date(app.createdAt).toLocaleDateString(),
              status: app.status,
              statusColor:
                app.status === 'Assigned'
                  ? 'bg-emerald-100 text-emerald-700'
                  : app.status === 'Pending' || app.status === 'Under Review' || app.status === 'Approved'
                    ? 'bg-amber-100 text-amber-700'
                    : app.status === 'Rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-700',
              studentType: studentType
            };
          })
      );
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleApprove = async (e, applicationId) => {
    e.stopPropagation();
    const notes = window.prompt('Enter review notes (optional):');
    if (notes === null) return; // User cancelled

    try {
      setProcessingId(applicationId);
      await adminApi.reviewApplication(applicationId, 'Approved', notes || 'Approved via Student List');
      toast.success('Application approved');
      await fetchStudents();
    } catch (error) {
      console.error('Error approving:', error);
      toast.error(error.response?.data?.message || 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (e, applicationId) => {
    e.stopPropagation();
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) {
      if (reason === "") toast.error('Rejection reason is required');
      return; // User cancelled or empty
    }

    try {
      setProcessingId(applicationId);
      await adminApi.reviewApplication(applicationId, 'Rejected', reason);
      toast.success('Application rejected');
      await fetchStudents();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error(error.response?.data?.message || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesType = selectedType === 'All' || student.studentType === selectedType;
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [selectedType, students, searchTerm]);

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Manage Students</h1>
        <p className="text-sm text-slate-500">
          View current residents, manage assignments, and update records.
        </p>
      </div>

      {/* Filters row */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[220px] relative">
          <FaSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-slate-50"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Student Type</span>
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="appearance-none pl-3 pr-9 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            >
              <option>All</option>
              <option>Self Sponsored</option>
              <option>Government Sponsorship</option>
              <option>Special Needs</option>
              <option>Staff Relatives</option>
            </select>
            <FaFilter className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors ml-auto">
          <FaDownload className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Student</th>
              <th className="px-6 py-3 text-left font-semibold">Student ID</th>
              <th className="px-6 py-3 text-left font-semibold">Check-in Date</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr
                  key={student.applicationId || student.id}
                  onClick={() => navigate(`/students/${student.applicationId || student.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <ProfilePictureUpload 
                      currentImage={student.user?.profilePicture} 
                      size="small" 
                      onUploadSuccess={() => fetchStudents()}
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{student.id}</td>
                  <td className="px-6 py-4 text-slate-700">{student.checkIn}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${student.statusColor}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'Assigned' ? 'bg-emerald-500' :
                        student.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {student.status !== 'Assigned' && student.status !== 'Rejected' && (
                        <>
                          <button
                            onClick={(e) => handleReject(e, student.applicationId)}
                            disabled={processingId === student.applicationId}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            {processingId === student.applicationId ? (
                              <FaSpinner className="w-4 h-4 animate-spin" />
                            ) : (
                              <FaTimes className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleApprove(e, student.applicationId)}
                            disabled={processingId === student.applicationId}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            {processingId === student.applicationId ? (
                              <FaSpinner className="w-4 h-4 animate-spin" />
                            ) : (
                              <FaCheck className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  {loading ? 'Loading students...' : 'No students found for the selected type.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
          <span>Rows per page: 5</span>
          <div className="flex items-center gap-4">
            <span>
              {filteredStudents.length > 0 ? `1-${Math.min(filteredStudents.length, 5)}` : '0'} of {filteredStudents.length}
            </span>
            <div className="flex items-center gap-2">
              <button className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                <FaChevronLeft className="w-3 h-3" />
              </button>
              <button className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                <FaChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


