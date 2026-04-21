import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSpinner, 
  FaShieldAlt, 
  FaUser, 
  FaIdCard, 
  FaBuilding, 
  FaDoorOpen,
  FaArrowLeft,
  FaPrint,
  FaCertificate,
  FaStamp
} from 'react-icons/fa';
import exitClearanceApi from '../api/exitClearanceApi';

export default function VerifyClearance() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [clearance, setClearance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await exitClearanceApi.getStatus(id);
        if (res && res.clearance) {
          setClearance(res.clearance);
        } else {
          setError('Clearance record not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to verify clearance');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStatus();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="w-12 h-12 text-blue-900 animate-spin" />
          <p className="font-black text-slate-500 uppercase tracking-widest text-xs">Accessing AAU Central Registry...</p>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-serif">
      {/* Background Overlays */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden select-none flex flex-wrap gap-20 p-20 content-center justify-center grayscale">
         {Array.from({ length: 20 }).map((_, i) => (
           <span key={i} className="text-8xl font-black rotate-[-30deg]">AAU</span>
         ))}
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Verification Certificate */}
        <div className="bg-white certificate-border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-sm overflow-hidden">
          {/* Official Header */}
          <div className="bg-white border-b-2 border-slate-900 p-8 text-center space-y-2">
            <h1 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Addis Ababa University</h1>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Dormitory Management System</h2>
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="h-[2px] bg-slate-900 flex-1"></div>
              <FaShieldAlt className="text-slate-900 w-5 h-5" />
              <div className="h-[2px] bg-slate-900 flex-1"></div>
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Official Exit Clearance Certificate</p>
          </div>

          {error ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
                <FaTimesCircle className="text-rose-500 w-10 h-10" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-2">Record Not Found</h1>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed italic">The clearance identifier provided does not match any record in the university database.</p>
              <Link to="/student-portal" className="font-sans inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-black transition-all">
                Return to Portal
              </Link>
            </div>
          ) : clearance && clearance.status === 'Approved' ? (
            <div className="p-8 sm:p-12 relative">
               {/* Hologram Badge */}
               <div className="absolute top-8 right-8 w-28 h-28 hidden sm:block">
                  <div className="hologram-effect rounded-full w-full h-full p-1 opacity-90 shadow-lg border-2 border-white flex items-center justify-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-white/20 animate-pulse text-[8px] font-black flex items-center justify-center text-center uppercase leading-none px-4">
                        Secure<br/>Authenticated<br/>AAU
                     </div>
                     <FaStamp className="text-white/40 w-12 h-12" />
                  </div>
               </div>

               {/* Certificate Body */}
               <div className="space-y-10">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Certificate Status</p>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <FaCheckCircle className="w-5 h-5" />
                      <span className="text-2xl font-black tracking-tighter uppercase italic">Validated</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 border-y border-slate-100 py-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Candidate</p>
                      <p className="text-xl font-bold text-slate-900">{clearance.student?.fullName || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration ID</p>
                      <p className="text-xl font-black tracking-tight text-blue-900">{clearance.student?.studentID || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Block</p>
                      <p className="text-lg font-bold text-slate-900">{clearance.blockName || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Room Number</p>
                      <p className="text-lg font-bold text-slate-900">{clearance.roomNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Item Inventory</p>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg overflow-hidden">
                       <table className="w-full text-sm font-sans">
                         <thead>
                           <tr className="bg-white border-b border-slate-100">
                             <th className="text-left py-3 px-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Inventory Item</th>
                             <th className="text-right py-3 px-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Authorized Qty</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                           {clearance.items?.map((item, idx) => (
                             <tr key={idx}>
                               <td className="py-3 px-4 font-bold text-slate-700">{item.name}</td>
                               <td className="py-3 px-4 font-black text-slate-900 text-right">x{item.quantity}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                    </div>
                  </div>

                  {/* Footnotes & Stamping */}
                  <div className="pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date of Authentication</p>
                        <p className="text-sm font-bold text-slate-600">{new Date(clearance.approvalDate).toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Certificate UUID</p>
                        <p className="text-[10px] font-bold text-slate-400 font-sans tracking-tight">#{id}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center sm:items-end gap-3 font-sans print:hidden">
                       <button 
                         onClick={handlePrint}
                         className="flex items-center gap-2 px-6 py-2 border-2 border-slate-900 text-slate-900 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                       >
                         <FaPrint className="w-3 h-3" /> Print Certificate
                       </button>
                    </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
                <FaCertificate className="text-amber-500 w-10 h-10" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-2">Pending Authorization</h1>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed italic">
                Current Status: <strong>{clearance?.status?.toUpperCase() || 'INVALID'}</strong>.<br/>
                This clearance record has not yet been electronically stamped by the registrar.
              </p>
              <Link to="/student-portal" className="font-sans inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-black transition-all">
                Return to Portal
              </Link>
            </div>
          )}
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 text-center space-y-4 px-8">
          <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest opacity-60">
            This digital certificate is a legal record of Addis Ababa University. Any alteration of this document is a punishable offense under university policy. Security personnel are advised to verify this digital record against the physical student identification card.
          </p>
          <div className="flex justify-center gap-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <span>© {new Date().getFullYear()} AAU Security</span>
            <span>Ref: {id?.slice(0, 8)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
