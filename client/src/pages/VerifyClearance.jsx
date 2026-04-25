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
  FaStamp,
  FaFileAlt,
  FaHistory
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <FaShieldAlt className="absolute inset-0 m-auto w-8 h-8 text-blue-500 animate-pulse" />
        </div>
        <p className="mt-8 text-blue-400 font-bold tracking-widest text-xs uppercase animate-pulse">
          Authenticating UUID...
        </p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const status = clearance?.status?.toUpperCase() || 'UNKNOWN';
  const isApproved = status === 'APPROVED';

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100">
      {/* Dynamic Header Overlay */}
      <div className={`h-64 w-full absolute top-0 left-0 transition-colors duration-1000 ${
        error ? 'bg-rose-600' : isApproved ? 'bg-emerald-600' : 'bg-amber-500'
      }`}>
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
           <div className="flex flex-wrap gap-4 p-4">
              {Array.from({ length: 40 }).map((_, i) => (
                <FaStamp key={i} className="text-4xl -rotate-12" />
              ))}
           </div>
        </div>
      </div>

      <div className="relative pt-20 pb-20 px-4 sm:px-6 flex flex-col items-center">
        {/* Verification Card */}
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden border border-white">
          
          {/* Header Section */}
          <div className="p-8 text-center bg-white border-b border-slate-100">
            <div className="flex justify-center mb-6">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-lg ${
                error ? 'bg-rose-500 shadow-rose-200' : isApproved ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-500 shadow-amber-200'
              }`}>
                {error ? <FaTimesCircle className="w-12 h-12" /> : isApproved ? <FaCheckCircle className="w-12 h-12" /> : <FaHistory className="w-12 h-12" />}
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              {error ? 'Scan Error' : isApproved ? 'Clearance Valid' : 'Pending Review'}
            </h1>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-[0.2em]">
              {error ? 'Record Inaccessible' : `Dorm Exit Authorization`}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
              <FaShieldAlt className="w-3 h-3" /> Secure AAU Network
            </div>
          </div>

          {error ? (
            <div className="p-10 text-center">
              <p className="text-slate-600 mb-8 leading-relaxed font-medium">
                The QR code scanned does not point to a valid or currently active exit clearance certificate in our system.
              </p>
              <Link to="/" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all block">
                Close Verification
              </Link>
            </div>
          ) : (
            <div className="p-8 space-y-8">
              {/* Profile Info */}
              <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                  <FaUser className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated Student</p>
                  <h2 className="text-xl font-bold text-slate-900 leading-none">{clearance.student?.fullName || 'N/A'}</h2>
                  <p className="text-xs font-bold text-blue-600 mt-2">ID: {clearance.student?.studentID || 'N/A'}</p>
                </div>
              </div>

              {/* Location Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Block</p>
                  <div className="flex items-center gap-3">
                    <FaBuilding className="text-slate-300" />
                    <span className="font-bold text-slate-800">{clearance.blockName || 'N/A'}</span>
                  </div>
                </div>
                <div className="p-5 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Room</p>
                  <div className="flex items-center gap-3">
                    <FaDoorOpen className="text-slate-300" />
                    <span className="font-bold text-slate-800">{clearance.roomNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Inventory Items */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Authorized Property</p>
                <div className="space-y-3">
                  {clearance.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      </div>
                      <span className="text-xs font-black bg-slate-100 px-3 py-1 rounded-lg text-slate-900 border border-slate-200">
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                  {(!clearance.items || clearance.items.length === 0) && (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl italic">
                      No personal property items listed for exit.
                    </div>
                  )}
                </div>
              </div>

              {/* Security Footer */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Signed on</span>
                    <span className="text-xs font-bold text-slate-600">
                      {clearance.approvalDate ? new Date(clearance.approvalDate).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authority</span>
                    <span className="text-xs font-extrabold text-slate-900">University Proctor</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
                  >
                    <FaPrint /> Print Copy
                  </button>
                  <Link 
                    to="/" 
                    className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Return Home
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Technical Info */}
        <div className="mt-12 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">
            Security Identifier: {id?.slice(0, 16)}
          </p>
          <div className="flex items-center justify-center gap-4 text-slate-300">
            <div className="w-12 h-[1px] bg-slate-300/30"></div>
            <FaStamp className="text-sm opacity-30" />
            <div className="w-12 h-[1px] bg-slate-300/30"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
