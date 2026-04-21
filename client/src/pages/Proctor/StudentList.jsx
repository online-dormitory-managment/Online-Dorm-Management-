import React, { useState, useEffect, useMemo } from 'react';
import {
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash,
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaCalendarCheck,
  FaEllipsisV,
  FaBuilding,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUsers,
  FaSpinner
} from 'react-icons/fa';
import proctorApi from '../../api/proctorApi';
import ProfilePictureUpload from '../../components/common/ProfilePictureUpload';
import toast from 'react-hot-toast';

const StudentList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', notes: '', roomCondition: '' });
  const [saving, setSaving] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await proctorApi.getStudents();
      const studentData = (response.data || []).map((student) => {
        const initials = student.fullName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0])
          .join('')
          .toUpperCase() || 'ST';

        return {
          _id: student._id,
          id: student.studentID,
          initials,
          name: student.fullName,
          department: student.department || 'N/A',
          studentId: student.studentID || 'N/A',
          dorm: student.roomNumber || 'N/A',
          block: student.buildingID || student.building || 'N/A',
          email: student.user?.email || 'N/A',
          phone: student.user?.phone || 'N/A',
          status: student.status || 'checked-in',
          checkInDate: student.checkInDate ? new Date(student.checkInDate).toLocaleDateString() : 'N/A',
          roomCondition: student.roomCondition || 'N/A',
          notes: student.notes || '',
          emergencyContact: student.emergencyContact || 'N/A'
        };
      });

      setStudents(studentData);
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

  // Status options
  const statusOptions = [
    { id: 'all', label: 'All Status' },
    { id: 'checked-in', label: 'Checked In' },
    { id: 'late', label: 'Late' },
    { id: 'absent', label: 'Absent' },
    { id: 'leave', label: 'Leave' },
  ];

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    return students
      .filter(student => {
        if (statusFilter !== 'all' && student.status !== statusFilter) {
          return false;
        }
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            student.name.toLowerCase().includes(searchLower) ||
            student.studentId.toLowerCase().includes(searchLower) ||
            student.department.toLowerCase().includes(searchLower) ||
            student.email.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'id':
            aValue = a.studentId.toLowerCase();
            bValue = b.studentId.toLowerCase();
            break;
          case 'dorm':
            aValue = a.dorm.toString();
            bValue = b.dorm.toString();
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [students, statusFilter, searchTerm, sortField, sortDirection]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'checked-in': return <FaCheckCircle className="text-green-500" />;
      case 'late': return <FaClock className="text-yellow-500" />;
      case 'absent': return <FaTimesCircle className="text-red-500" />;
      case 'leave': return <FaCalendarCheck className="text-blue-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'checked-in': return 'bg-green-100 text-green-800 border-green-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'leave': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'checked-in': return 'Checked In';
      case 'late': return 'Late';
      case 'absent': return 'Absent';
      case 'leave': return 'Leave';
      default: return 'Unknown';
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setEditForm({
      status: student.status,
      notes: student.notes,
      roomCondition: student.roomCondition
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      await proctorApi.updateStudent(selectedStudent._id, editForm);
      toast.success('Student updated successfully');
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (error) {
      toast.error(error.message || 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="w-3 h-3 ml-1 text-gray-400" />;
    return sortDirection === 'asc'
      ? <FaSortUp className="w-3 h-3 ml-1 text-blue-500" />
      : <FaSortDown className="w-3 h-3 ml-1 text-blue-500" />;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Student List</h1>
        <p className="text-gray-600 mt-1">Manage and monitor resident status and details.</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, Name or Department..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="flex items-center px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <FaFilter className="w-4 h-4 mr-2" />
              More Filters
            </button>
            <button className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <FaDownload className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Student
                    {getSortIcon('name')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    ID Number
                    {getSortIcon('id')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dorm')}
                >
                  <div className="flex items-center">
                    Dorm No
                    {getSortIcon('dorm')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <FaSpinner className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredAndSortedStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredAndSortedStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ProfilePictureUpload 
                            currentImage={student.user?.profilePicture || student.profilePicture} 
                            size="small"
                            onUploadSuccess={() => fetchStudents()}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.studentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaBuilding className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.dorm}</div>
                          <div className="text-xs text-gray-500">Block {student.block}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <FaEnvelope className="w-3 h-3 text-gray-400 mr-2" />
                          {student.email}
                        </div>
                        {student.phone !== 'N/A' && (
                          <div className="flex items-center text-gray-600">
                            <FaPhone className="w-3 h-3 text-gray-400 mr-2" />
                            {student.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                          {getStatusIcon(student.status)}
                          <span className="ml-1.5">{getStatusText(student.status)}</span>
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Since {student.checkInDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(student)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="More Options">
                          <FaEllipsisV className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-700">
                Showing <span className="font-semibold">1</span> to <span className="font-semibold">{filteredAndSortedStudents.length}</span> of{' '}
                <span className="font-semibold">{students.length}</span> students
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Residents</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{students.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FaUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Checked In</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {students.filter(s => s.status === 'checked-in').length}
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
              <p className="text-sm text-gray-600">Late / Absent</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {students.filter(s => s.status === 'late' || s.status === 'absent').length}
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
              <p className="text-sm text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {students.filter(s => s.status === 'leave').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FaCalendarCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="bg-primary px-8 py-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Edit Resident Details</h3>
                <p className="text-white/70 text-sm mt-1">{selectedStudent?.name}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/80 hover:text-white p-2">
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Attendance Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    {statusOptions.filter(o => o.id !== 'all').map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, status: option.id }))}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                          editForm.status === option.id 
                            ? 'bg-primary-light border-primary text-primary ring-2 ring-primary/10' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-primary-light'
                        }`}
                      >
                        {getStatusIcon(option.id)}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Room Condition</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={editForm.roomCondition}
                    onChange={(e) => setEditForm(f => ({ ...f, roomCondition: e.target.value }))}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Needs Maintenance">Needs Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Internal Notes</label>
                  <textarea
                    rows="3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    placeholder="Add observations about this student..."
                    value={editForm.notes}
                    onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all uppercase tracking-wider text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveEdit}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                >
                  {saving ? <FaSpinner className="animate-spin w-4 h-4" /> : <FaCheckCircle className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
