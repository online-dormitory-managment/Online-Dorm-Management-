import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaWrench,
  FaExclamationTriangle,
  FaEllipsisV,
  FaCheckCircle,
  FaDoorOpen,
  FaTachometerAlt,
  FaBell,
  FaChartBar,
  FaBuilding,
  FaUser,
  FaCog,
  FaQuestionCircle,
  FaSignOutAlt,
  FaSpinner,
  FaFile
} from 'react-icons/fa';
import proctorApi from '../../api/proctorApi';
import complaintApi from '../../api/complaintApi';
import maintenanceApi from '../../api/maintenanceApi';
import exitClearanceApi from '../../api/exitClearanceApi';
import toast from 'react-hot-toast';
import authApi from '../../api/authApi';

export default function ProctorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const user = authApi.getCurrentUser();
    const role = user?.role || '';
    if (role !== 'Proctor') {
      if (role === 'SuperAdmin') navigate('/super-admin-dashboard');
      else if (role === 'CampusAdmin') navigate('/dashboard');
      else if (role === 'Student') navigate('/student-portal');
      else navigate('/login');
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // Fetch dashboard stats
        const dashboardRes = await proctorApi.getDashboard();
        if (!alive) return;

        const data = dashboardRes.data || {};
        setDashboardData(data);

        // Fetch recent complaints
        const complaintsRes = await complaintApi.blockComplaints();
        const complaints = (complaintsRes?.data || []).map(c => ({
          id: c._id,
          type: 'Complaint',
          icon: <FaExclamationTriangle className="w-4 h-4 text-red-500" />,
          location: c.student?.name || 'Anonymous Student',
          description: c.title || c.description || 'No description',
          status: c.status || 'Open',
          createdAt: c.createdAt,
          statusColor: c.status === 'Resolved' ? 'bg-green-100 text-green-600' :
            c.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
              'bg-red-100 text-red-600'
        }));

        // Fetch recent maintenance
        const maintenanceRes = await maintenanceApi.allForProctor();
        const maintenance = (maintenanceRes?.data || []).map(m => ({
          id: m._id,
          type: 'Maintenance',
          icon: <FaWrench className="w-4 h-4 text-orange-500" />,
          location: m.location || 'N/A',
          description: `${m.student?.fullName || 'Student'}: ${m.description || 'No description'}`,
          status: m.status || 'Pending',
          createdAt: m.createdAt,
          statusColor: m.status === 'Resolved' ? 'bg-green-100 text-green-600' :
            m.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
              'bg-red-100 text-red-600'
        }));

        // Fetch recent exit clearances
        const exitClearanceRes = await exitClearanceApi.pending();
        const exitClearances = (exitClearanceRes || []).map(e => ({
          id: e._id,
          type: 'Exit Clearance',
          icon: <FaCheckCircle className="w-4 h-4 text-green-500" />,
          location: e.student?.fullName || 'Student',
          description: `ID: ${e.student?.studentID || 'N/A'}`,
          status: e.status || 'Pending',
          createdAt: e.createdAt,
          statusColor: e.status === 'Approved' ? 'bg-green-100 text-green-600' :
            e.status === 'Rejected' ? 'bg-red-100 text-red-600' :
              'bg-yellow-100 text-yellow-600'
        }));

        // Combine and sort by date
        const activities = [...complaints, ...maintenance, ...exitClearances]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 6);

        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const stats = dashboardData ? [
    {
      icon: <FaUsers className="w-6 h-6 text-blue-600" />,
      label: 'Total Assigned Students',
      value: String(dashboardData.totalStudents || 0),
      subValue: ` / ${dashboardData.totalCapacity || 0}`,
      badge: '',
      badgeColor: 'text-blue-600',
      progress: dashboardData.capacityPercentage || 0,
      progressColor: 'bg-blue-600'
    },
    {
      icon: <FaWrench className="w-6 h-6 text-orange-500" />,
      label: 'Pending Maintenance',
      value: String(dashboardData.pendingMaintenance || 0),
      badge: '',
      badgeColor: 'text-green-600',
      note: '',
      noteColor: 'text-orange-500'
    },
    {
      icon: <FaExclamationTriangle className="w-6 h-6 text-red-500" />,
      label: 'Active Complaints',
      value: String(dashboardData.activeComplaints || 0),
      badge: '',
      badgeColor: 'text-red-500',
      note: '',
      noteColor: 'text-slate-500'
    },
    {
      icon: <FaDoorOpen className="w-6 h-6 text-blue-600" />,
      label: 'Dorm Room Availability',
      value: `${dashboardData.availableRooms || 0}`,
      subValue: `/ ${dashboardData.totalRooms || 0}`,
      valueLabel: 'Rooms Avail',
      valueLabelColor: 'text-emerald-600',
      progress: dashboardData.occupancyPercentage || 0,
      progressColor: 'bg-indigo-600',
      note: `${dashboardData.totalRooms || 0} Total Rooms in Block`,
      noteColor: 'text-slate-500 font-medium'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, Proctor</h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening in {dashboardData?.building?.name || 'your building'} today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-slate-50 rounded-lg">
                  {stat.icon}
                </div>
                {stat.badge && (
                  <span className={`text-xs font-medium ${stat.badgeColor}`}>
                    {stat.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                {stat.subValue && (
                  <span className="text-lg text-slate-400">{stat.subValue}</span>
                )}
                {stat.valueLabel && (
                  <span className={`text-sm font-medium ${stat.valueLabelColor}`}>
                    {stat.valueLabel}
                  </span>
                )}
              </div>
              {stat.progress !== undefined && (
                <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${stat.progressColor}`}
                    style={{ width: `${Math.min(stat.progress, 100)}%` }}
                  ></div>
                </div>
              )}
              {stat.note && (
                <p className={`mt-2 text-sm ${stat.noteColor}`}>{stat.note}</p>
              )}
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <Link to="/proctor/complaints" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>

          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Location</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Description</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No recent activity
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((activity) => (
                    <tr key={activity.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {activity.icon}
                          <span className="font-medium text-slate-800">{activity.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-blue-600">{activity.location}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">{activity.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${activity.statusColor}`}>
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={
                            activity.type === 'Complaint' ? `/proctor/complaints?id=${activity.id}` :
                              activity.type === 'Maintenance' ? `/proctor/maintenance?id=${activity.id}` :
                                `/proctor/exit-clearance?id=${activity.id}`
                          }
                          className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wider"
                        >
                          Review
                        </Link>

                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/proctor/student-list"
                className="flex items-center gap-3 p-3 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FaUsers className="w-4 h-4" />
                <span>View Students</span>
              </Link>
              <Link
                to="/proctor/maintenance"
                className="flex items-center gap-3 p-3 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <FaWrench className="w-4 h-4" />
                <span>View Maintenance</span>
              </Link>
              <Link
                to="/proctor/complaints"
                className="flex items-center gap-3 p-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FaExclamationTriangle className="w-4 h-4" />
                <span>View Complaints</span>
              </Link>
              <Link
                to="/proctor/operational-reports"
                className="flex items-center gap-3 p-3 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <FaFile className="w-4 h-4" />
                <span>Submit Operational Report</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Total Assigned</p>
                  <p className="text-sm text-slate-600">Active Residents</p>
                </div>
                <span className="text-sm text-purple-600 font-medium">{dashboardData?.totalStudents || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Pending Exit Clearances</p>
                  <p className="text-sm text-slate-600">{dashboardData?.pendingExitClearances || 0} requests</p>
                </div>
                <span className="text-sm text-blue-600 font-medium">{dashboardData?.pendingExitClearances || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Active Complaints</p>
                  <p className="text-sm text-slate-600">Requiring attention</p>
                </div>
                <span className="text-sm text-green-600 font-medium">{dashboardData?.activeComplaints || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Maintenance Requests</p>
                  <p className="text-sm text-slate-600">Awaiting resolution</p>
                </div>
                <span className="text-sm text-amber-600 font-medium">{dashboardData?.pendingMaintenance || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-200">
          <div className="text-center text-xs text-slate-500">
            © 2024 Dorm Portal Management System. Proctor Dashboard v1.0
          </div>
        </footer>

        {/* Floating Quick Report Button */}
        <Link 
          to="/proctor/operational-reports"
          className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-slate-900 text-white rounded-full flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95 group z-[40]"
          title="Send Quick Operational Report"
        >
          <FaPaperPlane className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Quick Report
          </span>
        </Link>
      </div>
    </div>
  );
}
