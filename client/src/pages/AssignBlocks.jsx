import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FaSearch,
  FaChevronLeft,
  FaCheck,
  FaRedo,
  FaLock,
  FaChevronDown,
  FaInfoCircle,
  FaUser,
  FaArrowRight,
  FaClipboardList,
  FaBuilding,
  FaUserShield,
  FaHistory
} from 'react-icons/fa';
import adminApi from '../api/adminApi';
import toast from 'react-hot-toast';

export default function AssignBlocks() {
  const [blockId, setBlockId] = useState('');
  const [proctorUserID, setProctorUserID] = useState('');
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [proctors, setProctors] = useState([]);

  const handleReset = () => {
    setBlockId('');
    setProctorUserID('');
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [b, p] = await Promise.all([adminApi.buildings(), adminApi.proctors()]);
        if (!alive) return;
        setBuildings(b?.data || []);
        setProctors(p?.data || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleAssign = async () => {
    if (!blockId || !proctorUserID) return;
    try {
      setLoading(true);
      const res = await adminApi.assignProctor(proctorUserID, blockId);
      if (res.success || res) {
        toast.success('Assignment Synchronized Successfully', {
          icon: '🛡️',
          style: { borderRadius: '12px', background: '#0f172a', color: '#fff' }
        });
        handleReset();
        // Refresh data
        const [b, p] = await Promise.all([adminApi.buildings(), adminApi.proctors()]);
        setBuildings(b?.data || []);
        setProctors(p?.data || []);
      }
    } catch (err) {
      toast.error('Failed to update assignment audit trail');
    } finally {
      setLoading(false);
    }
  };

  const selectedBuilding = buildings.find(b => b._id === blockId);
  const selectedProctor = proctors.find(p => p.userID === proctorUserID);

  const filteredProctors = selectedBuilding 
    ? proctors.filter(p => {
        const matchesGender = selectedBuilding.gender === 'Mixed' || p.gender === selectedBuilding.gender;
        const isAvailableOrAssignedHere = !p.assignedBuilding || p.assignedBuilding === selectedBuilding._id;
        return matchesGender && isAvailableOrAssignedHere;
      })
    : proctors;

  useEffect(() => {
    if (selectedBuilding && selectedProctor) {
      if (
        selectedBuilding.gender && 
        selectedBuilding.gender !== 'Mixed' &&
        selectedProctor.gender && 
        selectedBuilding.gender !== selectedProctor.gender
      ) {
        setProctorUserID('');
      }
    }
  }, [selectedBuilding, selectedProctor]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-2">
              <FaClipboardList /> Resource Management
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Block Assignment <span className="text-slate-400">Hub</span></h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Designating administrative authority to dormitory blocks.</p>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
          >
            <FaChevronLeft className="w-3 h-3 text-slate-400" />
            Control Center
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Action Area */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50 pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                  <FaUserShield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-none">Authority Designation</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">New Active Assignment</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Block Selection */}
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-indigo-600 transition-colors">
                    Target Block / Building
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <FaBuilding className="w-4 h-4" />
                    </div>
                    <select
                      value={blockId}
                      onChange={(e) => setBlockId(e.target.value)}
                      className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl text-sm font-bold text-slate-900 appearance-none transition-all outline-none"
                    >
                      <option value="">Choose a dormitory block...</option>
                      {buildings.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.buildingID} — {b.name} ({b.gender})
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex justify-center -my-4 relative z-10">
                  <div className="bg-white p-2 rounded-full border-2 border-slate-50 shadow-sm">
                    <FaArrowRight className="w-4 h-4 text-indigo-500 rotate-90 lg:rotate-0" />
                  </div>
                </div>

                {/* Proctor Selection */}
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-indigo-600 transition-colors">
                    Dormitory Proctor
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <FaUser className="w-4 h-4" />
                    </div>
                    <select
                      value={proctorUserID}
                      onChange={(e) => setProctorUserID(e.target.value)}
                      className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl text-sm font-bold text-slate-900 appearance-none transition-all outline-none"
                    >
                      <option value="">Select executive staff...</option>
                      {filteredProctors.map((p) => (
                        <option key={p._id} value={p.userID}>
                          {p.userID} — {p.name} {p.gender ? `(${p.gender})` : ''}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Summary Preview */}
              {(selectedBuilding || selectedProctor) && (
                <div className="mt-10 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex flex-col md:flex-row items-center gap-6 animate-in zoom-in-95 duration-300">
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Target</p>
                    <p className="text-sm font-bold text-slate-900">{selectedBuilding?.name || '---'}</p>
                  </div>
                  <div className="hidden md:block w-px h-8 bg-slate-200" />
                  <div className="flex-1 text-center md:text-right">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Assigned To</p>
                    <p className="text-sm font-bold text-slate-900">{selectedProctor?.name || '---'}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 mt-12 pt-8 border-t border-slate-100">
                <button
                  onClick={handleReset}
                  className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <FaRedo className="w-3 h-3" />
                  Clear
                </button>
                <button
                  onClick={handleAssign}
                  disabled={loading || !blockId || !proctorUserID}
                  className="flex-1 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 disabled:opacity-30 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FaCheck className="w-3 h-3" />
                      Finalize Assignment
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Info Message */}
            <div className="flex items-start gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-[1.5rem]">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <FaInfoCircle className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-indigo-900/70 font-bold leading-relaxed uppercase tracking-tight">
                Designations are subject to global security protocols and will be reflected in the infrastructure audit logs immediately.
              </p>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-5 space-y-6">
             <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">
                   <FaHistory className="text-indigo-500" /> Recent Activity
                </div>
                
                <div className="space-y-6">
                   {buildings.slice(0, 3).map((b, i) => (
                      <div key={b._id} className="flex gap-4 group">
                         <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                            <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600">{i+1}</span>
                         </div>
                         <div className="flex-1 border-b border-slate-50 pb-4">
                            <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{b.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${b.gender === 'Female' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {b.gender}
                               </span>
                               <span className="text-[9px] font-bold text-slate-400">Total Rooms: {b.totalRooms || 24}</span>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-50">
                   <Link to="/building-management" className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                      Manage Infrastructure <FaArrowRight className="w-3 h-3" />
                   </Link>
                </div>
             </div>

             <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <h3 className="text-xl font-black mb-1 leading-none tracking-tight">System Intel</h3>
                <p className="text-indigo-100/70 text-xs font-medium mb-8">Infrastructure capacity metrics.</p>
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mb-1">Blocks</p>
                      <p className="text-2xl font-black">{buildings.length}</p>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mb-1">Staff</p>
                      <p className="text-2xl font-black">{proctors.length}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}