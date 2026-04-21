import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBuilding, FaEnvelope, FaChevronRight } from 'react-icons/fa';
import authApi from '../api/authApi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      await authApi.forgotPassword(email.trim());
      setStatus('sent');
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="w-full px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200">
        <Link to="/home" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
            <FaBuilding className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm sm:text-base font-extrabold text-slate-900">Addis Ababa University</p>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-700">Online Dormitory Management System</p>
          </div>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Forgot password</h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter your university email. We’ll send a password reset link.
            </p>
          </div>

          {status === 'sent' ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg p-4">
              If the email exists, a reset link has been sent. Please check your inbox (and spam).
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">University Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    placeholder="yourname@aau.edu.et"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{status === 'loading' ? 'Sending...' : 'Send reset link'}</span>
                <FaChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-center">
            <Link to="/login" className="text-xs font-medium text-blue-600 hover:text-blue-800">
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

