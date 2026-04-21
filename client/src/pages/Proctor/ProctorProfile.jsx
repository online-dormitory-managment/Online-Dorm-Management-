import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaBuilding, 
  FaEnvelope, 
  FaShieldAlt, 
  FaIdBadge,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaKey,
  FaEdit,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import ProfilePictureUpload from '../../components/common/ProfilePictureUpload';
import proctorApi from '../../api/proctorApi';
import authApi from '../../api/authApi';
import toast from 'react-hot-toast';

const ProctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    userID: '',
    name: '',
    email: '',
    campus: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await proctorApi.getProfile();
        if (res.success) {
          const fetchedProfile = res.data;
          setProfile(fetchedProfile);
          setEditData({
            userID: fetchedProfile.user?.userID || '',
            name: fetchedProfile.user?.name || '',
            email: fetchedProfile.user?.email || '',
            campus: fetchedProfile.user?.campus || fetchedProfile.assignedBuilding?.campus || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        toast.error('Could not load profile information');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwordData.newPassword.length < 4) {
      return toast.error('Password must be at least 4 characters');
    }

    try {
      setChangingPassword(true);
      await authApi.changePassword(passwordData.oldPassword, passwordData.newPassword);
      toast.success('Password updated successfully');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdatingProfile(true);
      const res = await authApi.updateProfile(editData);
      if (res.success) {
        toast.success('Profile updated successfully');
        
        // Update local state
        setProfile(prev => ({
          ...prev,
          user: { 
            ...prev.user, 
            userID: res.data.userID,
            name: res.data.name, 
            email: res.data.email,
            campus: res.data.campus 
          }
        }));
        
        // Update localStorage for immediate Header sync
        const currentUser = authApi.getCurrentUser();
        if (currentUser) {
          const updatedUser = { 
            ...currentUser, 
            userID: res.data.userID,
            userId: res.data.userID, // Also update the lowercase alias just in case
            name: res.data.name, 
            email: res.data.email,
            campus: res.data.campus 
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          // Dispatch storage event to notify other components (like Header)
          window.dispatchEvent(new Event('storage'));
        }
        
        setIsEditing(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const user = profile?.user || authApi.getCurrentUser();
  const building = profile?.assignedBuilding;

  return (
    <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50 min-h-screen">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personal Profile</h1>
        <p className="text-slate-500 font-medium">Manage your identity and account security.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Profile Card & Info */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
            
            <div className="relative pt-8 flex flex-col items-center">
              <ProfilePictureUpload 
                currentImage={user?.profilePicture} 
                onUploadSuccess={(newPath) => {
                  setProfile(prev => ({
                    ...prev,
                    user: { ...prev.user, profilePicture: newPath }
                  }));
                }}
              />
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-4">{user?.name || 'Proctor Name'}</h2>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="mt-4 p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <FaEdit className="w-5 h-5" />
                </button>
              </div>
              <span className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 border border-indigo-100">
                Official Proctor
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="mt-10 space-y-6 text-left w-full max-w-sm mx-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID / Username</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                    value={editData.userID}
                    onChange={(e) => setEditData({...editData, userID: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campus</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                    value={editData.campus}
                    onChange={(e) => setEditData({...editData, campus: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={updatingProfile}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2"
                  >
                    {updatingProfile ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    Save
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-black uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <FaIdBadge />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</p>
                    <p className="text-sm font-bold text-slate-900">{user?.userID || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <FaEnvelope />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-slate-900">{user?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Working Campus</p>
                  <p className="text-sm font-bold text-slate-900">{user?.campus || 'Main Campus'}</p>
                </div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest leading-loose">
                <FaCheckCircle />
                Verified Active Personnel
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
            <FaShieldAlt className="absolute -right-4 -bottom-4 text-white/5 text-8xl transform rotate-12 transition-transform group-hover:rotate-0" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Privacy Policy</h3>
            <p className="text-sm font-medium leading-relaxed text-slate-300">
              Your credentials are encrypted. Avoid sharing your password with anyone, including administrative staff.
            </p>
          </div>
        </div>

        {/* Right Column: Jurisdiction & Security */}
        <div className="xl:col-span-2 space-y-8">
          {/* Jurisdiction Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Assigned Jurisdiction</h3>
              <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-wider">
                Full Access
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-5">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <FaBuilding className="text-2xl" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">{building?.name || 'Assigned Block'}</h4>
                  <p className="text-slate-500 font-medium text-xs mt-0.5">Dormitory Block ID: {building?.buildingID || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</span>
                  <span className="text-sm font-bold text-slate-900">{building?.gender || 'Co-ed'}</span>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Floor Count</span>
                  <span className="text-sm font-bold text-slate-900">Ground</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security / Password Change Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <FaLock />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Security Credentials</h3>
            </div>

            {!showPasswordForm ? (
              <div className="flex justify-center py-6">
                <button 
                  onClick={() => setShowPasswordForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  <FaKey />
                  Change Password
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showOldPassword ? 'text' : 'password'}
                        required
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-indigo-100 transition-all outline-none"
                        placeholder="Enter old password"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                      >
                        {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-indigo-100 transition-all outline-none"
                        placeholder="Min. 6 characters"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-indigo-100 transition-all outline-none"
                      placeholder="Verify new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex gap-2 items-end">
                    <button 
                      type="submit"
                      disabled={changingPassword}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                    >
                      {changingPassword ? <FaSpinner className="animate-spin" /> : <FaKey />}
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-slate-400 px-4">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest">Platform Security: AES-256 Encryption Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctorProfile;
