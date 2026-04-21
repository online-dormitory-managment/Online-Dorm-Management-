import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaBuilding, 
  FaLock, 
  FaEye, 
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaUsers,
  FaArrowLeft
} from 'react-icons/fa';
import { MdPrivacyTip, MdAdminPanelSettings, MdSupport } from 'react-icons/md';
import { FaFileContract } from 'react-icons/fa';

export default function Activate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    institutionalId: '',
    fullName: '',
    email: '',
    password: '',
    userRole: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Must be at least 8 characters with a mix of letters and numbers.';
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return 'Must be at least 8 characters with a mix of letters and numbers.';
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    
    // Validate password in real-time
    if (name === 'password') {
      const pwdError = validatePassword(value);
      setPasswordError(pwdError);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.institutionalId.trim()) {
      setError('Please enter your Institutional ID');
      return;
    }
    if (!formData.fullName.trim()) {
      setError('Please enter your Full Name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your University Email Address');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.password) {
      setError('Please enter a password');
      return;
    }
    const pwdError = validatePassword(formData.password);
    if (pwdError) {
      setError(pwdError);
      setPasswordError(pwdError);
      return;
    }
    if (!formData.userRole) {
      setError('Please select a User Role');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/activate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Activation attempt:', formData);
      
      // Temporary: just show success message
      alert('Account activation functionality will be connected to backend API');
      
      // On success, redirect to login
      // navigate('/login');
    } catch (err) {
      setError(err.message || 'Activation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="w-full px-6 py-5 flex justify-between items-center border-b border-slate-200/50 bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
            <FaBuilding className="w-6 h-6 text-white" />
          </div>
          <span className="text-slate-800 font-bold text-xl tracking-tight">
            AAU Online Dormitory Management System
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Activation Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              Activate Your Account
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Institutional ID Field */}
              <div>
                <label 
                  htmlFor="institutionalId" 
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Institutional ID
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaBuilding className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="institutionalId"
                    name="institutionalId"
                    value={formData.institutionalId}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-800"
                    placeholder="Enter your Institutional ID"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Full Name Field */}
              <div>
                <label 
                  htmlFor="fullName" 
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaUser className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-800"
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* University Email Address Field */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  University Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaEnvelope className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-800"
                    placeholder="Enter your university email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaLock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-12 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-800"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="w-5 h-5" />
                    ) : (
                      <FaEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600">{passwordError}</p>
                )}
                {!passwordError && formData.password && (
                  <p className="mt-2 text-sm text-slate-500">
                    Must be at least 8 characters with a mix of letters and numbers.
                  </p>
                )}
              </div>

              {/* User Role Field */}
              <div>
                <label 
                  htmlFor="userRole" 
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  User Role
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                    <FaUsers className="w-5 h-5" />
                  </div>
                  <select
                    id="userRole"
                    name="userRole"
                    value={formData.userRole}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-800 appearance-none bg-white cursor-pointer"
                    disabled={isLoading}
                  >
                    <option value="">Select your role</option>
                    <option value="student">Student</option>
                    <option value="proctor">Proctor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span>Create Account</span>
              </button>

              {/* Restriction Message */}
              <p className="text-center text-sm text-slate-500 mt-4">
                Registration is restricted to authorized university personnel only.
              </p>

              {/* Already have account link */}
              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  Already have an account? Log in here
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-6 flex flex-col items-center gap-4 border-t border-slate-200/50 bg-white/50 z-10">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 text-sm">
          <Link
            to="/privacy"
            className="hover:text-blue-600 transition-colors font-medium flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-blue-50 group"
          >
            <MdPrivacyTip className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Privacy Policy
          </Link>
          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          <Link
            to="/terms"
            className="hover:text-blue-600 transition-colors font-medium flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-blue-50 group"
          >
            <FaFileContract className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Terms of Service
          </Link>
          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          <Link
            to="/support"
            className="hover:text-blue-600 transition-colors font-medium flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-blue-50 group"
          >
            <MdSupport className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Support
          </Link>
        </div>
      </footer>
    </div>
  );
}

