import React from 'react';
import ClassroomScannerComponent from '../../components/qr/ClassroomScannerComponent';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Camera } from 'lucide-react';

const ScannerKioskPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
      {/* Top Kiosk Header */}
      <header className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/30">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">Classroom Attendance Kiosk</h1>
            <p className="text-xs text-blue-400 font-semibold">{user?.room_name || 'Lab 204'} • Scanner: {user?.scanner_id || 'LAB204_SCANNER'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-400 border border-slate-700 flex items-center"
        >
          <LogOut className="w-4 h-4 mr-2" /> Exit Kiosk Mode
        </button>
      </header>

      {/* Main Kiosk Area */}
      <main className="my-auto py-6">
        <ClassroomScannerComponent
          scannerInfo={user}
          activeSession={{ id: 'sess-active-1', subject_code: 'AI301' }}
        />
      </main>

      {/* Kiosk Footer */}
      <footer className="text-center py-3 border-t border-slate-900 text-xs text-slate-500">
        Smart Attendance Kiosk System v1.0 • Connected to Authorized Classroom Scanner
      </footer>
    </div>
  );
};

export default ScannerKioskPage;
