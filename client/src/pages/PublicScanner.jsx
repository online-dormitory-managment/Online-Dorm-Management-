import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  FaQrcode, 
  FaUser, 
  FaBuilding, 
  FaDoorOpen, 
  FaBox, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaShieldAlt,
  FaSpinner,
  FaMapMarkerAlt
} from 'react-icons/fa';
import exitClearanceApi from '../api/exitClearanceApi';
import toast, { Toaster } from 'react-hot-toast';

export default function PublicScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isScanning && !scanResult) {
      // Delay scanner initialization to ensure DOM element is ready
      const timer = setTimeout(() => {
        const scanner = new Html5QrcodeScanner("reader-public", { 
          fps: 15, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          supportedScanTypes: [0] // 0 = Html5QrcodeScanType.SCAN_TYPE_CAMERA
        });

        scanner.render((decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            setScanResult(data);
            setIsScanning(false);
            scanner.clear().catch(e => console.warn("Scanner clear failed:", e));
            toast.success('Clearance Loaded Successfully');
          } catch (err) {
            console.error('Invalid QR Format:', err);
            toast.error('Not a valid AAU Clearance JSON');
          }
        }, (err) => {
          // ignore scan errors
        });

        scannerRef.current = scanner;
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(e => console.warn("Failed to clear scanner on unmount", e));
        }
      };
    }
  }, [isScanning, scanResult]);

  const handleVerifyWithServer = async () => {
    if (!scanResult?.id) return;
    
    try {
      setVerifying(true);
      const res = await exitClearanceApi.verifyQR(JSON.stringify({ id: scanResult.id }));
      setServerStatus(res);
      if (res.valid) {
        toast.success('Security Clearance Verified (Database Sync)');
      } else {
        toast.error('Clearance Records Discrepancy Found');
      }
    } catch (err) {
      toast.error('Server check failed: ' + (err.response?.data?.message || 'Check connection'));
    } finally {
      setVerifying(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setServerStatus(null);
    setIsScanning(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 font-sans flex flex-col items-center">
      <Toaster position="top-center" />
      
      {/* Official Banner */}
      <div className="w-full max-w-lg flex items-center gap-4 mb-8 pt-4">
         <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <FaShieldAlt className="w-6 h-6 text-white" />
         </div>
         <div className="flex-1">
            <h1 className="text-xl font-black tracking-tight leading-none">Security Gateway</h1>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Addis Ababa University Official</p>
         </div>
         <div className="hidden sm:block text-right">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Local Verification</div>
            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Endpoint: /v</div>
         </div>
      </div>

      <div className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 shadow-2xl p-6 md:p-10 relative overflow-hidden">
        {/* Progress header decorator */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

        {isScanning ? (
          <div className="space-y-8 py-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-500/20">
                 <FaQrcode className="w-3 h-3" /> Scanner Active
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-2">Electronic Exit Check</h2>
              <p className="text-slate-400 text-sm font-medium">Scan the student's digital stamp below.</p>
            </div>
            
            <div id="reader-public" className="scan-frame-outer rounded-[2rem] overflow-hidden border-2 border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.3)] mx-auto"></div>
            
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-center">
              <p className="text-xs text-slate-400 leading-relaxed italic">
                Device handles JSON data locally. No browser redirects or search indexing will occur.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center bg-slate-800/30 p-4 rounded-2xl border border-slate-700/30">
               <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Scanned Resident</p>
                  <h3 className="text-2xl font-black tracking-tighter text-white uppercase">{scanResult?.name}</h3>
                  <p className="text-blue-400 text-xs font-black tracking-widest">{scanResult?.ugr}</p>
               </div>
               <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                  {scanResult?.name?.charAt(0)}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/30">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                     <FaBuilding className="text-blue-500" /> Building
                  </p>
                  <p className="font-black text-sm text-slate-200">{scanResult?.block || 'Not Mentioned'}</p>
               </div>
               <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/30">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                     <FaDoorOpen className="text-blue-500" /> Room
                  </p>
                  <p className="font-black text-sm text-slate-200">Room {scanResult?.room || 'N/A'}</p>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <FaBox className="text-blue-500" /> Itemized Inventory
                  </p>
                  <span className="text-[9px] font-black text-slate-600 px-2 py-0.5 bg-slate-900 rounded-lg">{scanResult?.items?.length || 0} ITEMS</span>
               </div>
               <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                     {scanResult?.items?.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-400">
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                           {item}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-4">
               {!serverStatus ? (
                  <button 
                    onClick={handleVerifyWithServer}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    disabled={verifying}
                  >
                     {verifying ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                     Verify Record Match
                  </button>
               ) : (
                  <div className={`flex-1 py-4 px-6 rounded-2xl flex items-center gap-4 border-2 ${
                    serverStatus.valid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                     {serverStatus.valid ? <FaCheckCircle className="w-6 h-6" /> : <FaTimesCircle className="w-6 h-6" />}
                     <div className="leading-tight">
                        <p className="font-black text-xs uppercase tracking-widest">{serverStatus.valid ? 'Official Authorization' : 'Database Mismatch'}</p>
                        <p className="text-[9px] font-bold opacity-60">Synced with Registrar Repository</p>
                     </div>
                  </div>
               )}
               <button 
                 onClick={resetScanner}
                 className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
               >
                  Next Scan
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="w-full max-w-lg mt-10 text-center space-y-4">
         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
            This gateway provides instant local visualization of student exit credentials. For security assistance contact Campus Police at Extension 991.
         </p>
         <div className="text-[10px] font-bold text-slate-700">© 2026 AAU SECURITY INFRASTRUCTURE</div>
      </div>
    </div>
  );
}
