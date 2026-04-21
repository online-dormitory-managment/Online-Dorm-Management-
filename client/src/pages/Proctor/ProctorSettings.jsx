import React, { useState } from 'react';
import { 
  FaCog, 
  FaBell, 
  FaLock, 
  FaPalette, 
  FaShieldAlt,
  FaChevronRight,
  FaSave,
  FaSpinner,
  FaMoon,
  FaSun,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

const ProctorSettings = () => {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const { theme, toggleTheme, highContrast, toggleHighContrast } = useTheme();
  const darkMode = theme === 'dark';

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings updated successfully', {
        icon: '✅',
        style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
      });
    }, 1200);
  };

  const tabs = [
    { id: 'account', label: 'Account Profile', icon: FaCog, desc: 'Manage your public details' },
    { id: 'notifications', label: 'Alert Toggles', icon: FaBell, desc: 'Configure system alerts' },
    { id: 'security', label: 'Login Security', icon: FaLock, desc: 'Passwords and sessions' },
    { id: 'appearance', label: 'Appearance', icon: FaPalette, desc: 'Themes and accessibility' },
  ];

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen transition-colors duration-300 ${highContrast ? 'contrast-125' : ''}`}>
      {/* Header Section */}
      <header className="mb-10" role="banner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Platform Settings</h1>
            <p className="text-slate-500 font-medium">Configure your workspace and secure your proctor account.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            aria-label="Save all changes"
            className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-70"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {saving ? 'Synchronizing...' : 'Save All Changes'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Navigation Sidebar */}
        <nav className="lg:col-span-3 space-y-3" aria-label="Settings navigation">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={isActive}
                role="tab"
                tabIndex={0}
                className={`w-full group flex flex-col items-start p-5 rounded-[1.5rem] text-left transition-all duration-300 border-2 ${
                  isActive
                    ? 'bg-white border-indigo-100 shadow-xl shadow-slate-200/50 text-indigo-600'
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-slate-100 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-wider">{tab.label}</span>
                </div>
                <p className={`text-[10px] font-bold ml-11 uppercase tracking-tight ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
                  {tab.desc}
                </p>
              </button>
            );
          })}
          
          <div className="pt-6 mt-6 border-t border-slate-200 opacity-50">
             <div className="flex items-center gap-3 text-slate-400 px-4">
                <FaShieldAlt className="text-xs" />
                <span className="text-[10px] font-black uppercase tracking-widest">AAU Secure Admin v2.4</span>
             </div>
          </div>
        </nav>

        {/* Content Area */}
        <main className="lg:col-span-9" role="tabpanel" aria-labelledby={activeTab}>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[500px]">
            {/* Tab Title Section */}
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Live Configuration</p>
                </div>
              </div>
            </div>

            <div className="p-10">
              {/* Account Section */}
              {activeTab === 'account' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label htmlFor="display-name" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Display Name</label>
                      <input 
                        id="display-name"
                        type="text" 
                        aria-required="true"
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.25rem] px-6 py-5 text-sm font-bold focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                        placeholder="John Proctor"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="email" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Primary Email</label>
                      <input 
                        id="email"
                        type="email" 
                        aria-required="true"
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.25rem] px-6 py-5 text-sm font-bold focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                        placeholder="proctor@aau.edu.et"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label htmlFor="dashboard-pref" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Dashboard Landing Preference</label>
                    <div className="relative">
                      <select 
                        id="dashboard-pref"
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.25rem] px-6 py-5 text-sm font-bold focus:bg-white focus:border-indigo-100 transition-all outline-none appearance-none"
                      >
                        <option>Real-time Block Analytics</option>
                        <option>Student Maintenance List</option>
                        <option>Emergency Request Priority</option>
                      </select>
                      <FaChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeTab === 'notifications' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {[
                    { title: 'Critical Maintenance', desc: 'Alerts for burst pipes, electrical issues, or safety hazards.', color: 'text-orange-500' },
                    { title: 'New Student Complaints', desc: 'Get notified as soon as a student logs a grievance.', color: 'text-indigo-500' },
                    { title: 'Clearance Requests', desc: 'Stamping alerts for student exit clearances.', color: 'text-emerald-500' },
                    { title: 'Administrative Broadcasts', desc: 'Global system updates from AAU management.', color: 'text-blue-500' }
                  ].map((item, i) => (
                    <div key={i} className="group flex items-center justify-between p-6 bg-slate-50/50 rounded-[1.75rem] border-2 border-transparent hover:border-slate-100 hover:bg-white transition-all cursor-pointer">
                      <div className="flex gap-4">
                        <div className={`mt-1 font-bold ${item.color}`}>
                           <FaBell className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-none mb-1">{item.title}</p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{item.desc}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i < 3} />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[21px] after:w-[21px] after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Security Section */}
              {activeTab === 'security' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-start gap-4 p-6 bg-rose-50 rounded-3xl border border-rose-100">
                    <FaExclamationTriangle className="text-rose-500 text-xl shrink-0 mt-1" />
                    <div>
                      <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest mb-1">Account Protection Policy</h4>
                      <p className="text-xs text-rose-700 font-medium leading-relaxed">
                        Changing your security credentials will invalidate all existing tokens. You will be prompted to re-authenticate on all devices.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Current Identifier</label>
                       <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-rose-100" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Target Password</label>
                       <input type="password" placeholder="Min. 8 Chars" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-indigo-100" />
                    </div>
                  </div>
                  <button className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] hover:text-indigo-800 transition-colors">
                     <FaCheckCircle className="text-xs" /> Enable Two-Factor (AAU Authenticator)
                  </button>
                </div>
              )}

              {/* Appearance Section */}
              {activeTab === 'appearance' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-4">
                         <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Interface Theme</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <button 
                              onClick={() => { if (darkMode) toggleTheme(); }}
                              className={`p-6 rounded-[2rem] border-2 transition-all text-center ${!darkMode ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                            >
                               <FaSun className={`w-8 h-8 mx-auto mb-3 ${!darkMode ? 'text-indigo-600' : 'text-slate-400'}`} />
                               <span className="text-xs font-black uppercase tracking-widest">Modern Light</span>
                            </button>
                            <button 
                              onClick={() => { if (!darkMode) toggleTheme(); }}
                              className={`p-6 rounded-[2rem] border-2 transition-all text-center ${darkMode ? 'bg-slate-900 border-indigo-400 text-white' : 'bg-slate-100 border-transparent hover:border-slate-200'}`}
                            >
                               <FaMoon className={`w-8 h-8 mx-auto mb-3 ${darkMode ? 'text-indigo-400' : 'text-slate-400'}`} />
                               <span className="text-xs font-black uppercase tracking-widest">Slate Dark</span>
                            </button>
                         </div>
                      </div>
                      <div className="flex-1 space-y-4">
                         <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Accessibility Overrides</h3>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-indigo-600 font-bold">A+</div>
                                  <span className="text-xs font-bold text-slate-700">High Contrast Mode</span>
                               </div>
                               <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={highContrast} onChange={toggleHighContrast} />
                                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                               </label>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProctorSettings;
