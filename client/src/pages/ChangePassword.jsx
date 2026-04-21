import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import authApi from '../api/authApi';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return toast.error('Please fill all fields');
    if (newPassword.length < 4) return toast.error('New password must be at least 4 characters');
    if (newPassword !== confirm) return toast.error('Passwords do not match');

    setSaving(true);
    const t = toast.loading('Updating password...');
    try {
      await authApi.changePassword(oldPassword, newPassword);
      toast.dismiss(t);
      toast.success('Password changed successfully');
      navigate('/student-portal');
    } catch (err) {
      toast.dismiss(t);
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Change Password"
      breadcrumbs={[
        { label: 'Dashboard', path: '/student-portal' },
        { label: 'Change Password' }
      ]}
      showPageHeader={true}
    >
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

