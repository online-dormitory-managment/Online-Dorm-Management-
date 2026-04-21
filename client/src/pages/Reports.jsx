import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  FaDownload,
  FaUser,
  FaWrench,
  FaExclamationTriangle,
  FaEdit,
  FaTrash,
  FaEllipsisH,
  FaCalendar
} from 'react-icons/fa';
import adminApi from '../api/adminApi';
import proctorApi from '../api/proctorApi';
import authApi from '../api/authApi';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const user = authApi.getCurrentUser();
        const isSuperAdmin = user?.role === 'SuperAdmin';
        const isAdmin = user?.role === 'Admin' || user?.role === 'CampusAdmin' || isSuperAdmin;
        const apiSource = isAdmin ? adminApi : proctorApi;

        const [o, r] = await Promise.all([
          apiSource.getOverview ? apiSource.getOverview() : apiSource.overview(),
          apiSource.getReports ? apiSource.getReports(30) : apiSource.reports(30)
        ]);
        
        if (!alive) return;
        setOverview(o);
        setSeries(r?.data || []);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const kpiCards = useMemo(() => {
    const s = overview?.stats;
    return [
      {
        title: 'Total Occupancy',
        value: s ? `${s.occupancyRate}%` : '-',
        change: 'Live',
        changeColor: 'text-slate-500',
        icon: FaUser,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50'
      },
      {
        title: 'Active Maintenance',
        value: s ? `${s.activeMaintenance} requests` : '-',
        change: 'Live',
        changeColor: 'text-slate-500',
        icon: FaWrench,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-50'
      },
      {
        title: 'Open Complaints',
        value: s ? `${s.openComplaints}` : '-',
        change: 'Live',
        changeColor: 'text-slate-500',
        icon: FaExclamationTriangle,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-50'
      }
    ];
  }, [overview]);

  const user = authApi.getCurrentUser();
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isAdminOrCampusAdmin = user?.role === 'Admin' || user?.role === 'CampusAdmin';
  const isAnyAdmin = isSuperAdmin || isAdminOrCampusAdmin;

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-4 lg:px-8 py-6">
      
      {/* Header Section */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Overview of dormitory performance and operational metrics.</p>
        </div>
        {!isAnyAdmin && (
          <Link to="/proctor-portal" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
            Back to Dashboard
          </Link>
        )}
      </div>

      {/* Filters and Download Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select className="appearance-none pl-10 pr-8 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
              <option>Last Year</option>
            </select>
            <FaCalendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <select className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300">
              <option>All Buildings</option>
              <option>Building 402</option>
              <option>Building 403</option>
              <option>Building 413</option>
            </select>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
          <FaDownload className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">{card.title}</p>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-3xl font-bold text-slate-900">{card.value}</h3>
                <span className={`text-sm font-medium ${card.changeColor}`}>{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Occupancy Trends Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Occupancy Trends</h2>
            <p className="text-sm text-slate-500">Semester occupancy rate over time</p>
          </div>
          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <FaEllipsisH className="w-4 h-4" />
          </button>
        </div>
        <div className="h-64">
          {loading ? (
            <div className="text-sm text-slate-500">Loading chart…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="applications" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="maintenance" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="complaints" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="exitClearance" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity (from logs) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <Link to="/activity" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-6 py-3 font-semibold">Issue Type</th>
                <th className="px-6 py-3 font-semibold">Location</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(overview?.recentActivity || []).map((activity) => {
                return (
                  <tr key={activity._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{activity.action}</td>
                    <td className="px-6 py-4 text-slate-700">{activity.description || '-'}</td>
                    <td className="px-6 py-4 text-slate-700">{activity.campus || '-'}</td>
                    <td className="px-6 py-4 text-slate-700">{new Date(activity.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        Logged
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-slate-500 hover:text-blue-600 transition-colors">
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button className="text-slate-500 hover:text-red-600 transition-colors">
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
