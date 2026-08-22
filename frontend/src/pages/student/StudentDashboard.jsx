import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { QrCode, Clock, AlertTriangle } from 'lucide-react';
import QRGeneratorModal from '../../components/qr/QRGeneratorModal';
import StatusBadge from '../../components/common/StatusBadge';

const StudentDashboard = () => {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionForQR, setSelectedSessionForQR] = useState(null);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const res = await axiosClient.get('/analytics/student');
        setDashData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentData();
  }, []);

  if (loading) return <div className="p-4 text-slate-400 text-xs animate-pulse">Loading dashboard...</div>;

  const kpis = dashData?.kpis || {};
  const subjects = dashData?.subject_breakdown || [];
  const todaysClasses = dashData?.todays_classes || [];

  return (
    <div className="space-y-6">
      {/* Top Banner KPI summary: 2x2 grid on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
        <div className={`glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${kpis.is_low_attendance ? 'border-rose-500/40 bg-rose-500/10' : 'border-slate-800'}`}>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall</p>
          <h3 className={`text-2xl sm:text-3xl font-extrabold mt-0.5 sm:mt-1 ${kpis.is_low_attendance ? 'text-rose-400' : 'text-emerald-400'}`}>
            {kpis.overall_attendance_pct || 100}%
          </h3>
          {kpis.is_low_attendance && (
            <p className="text-[9px] font-bold text-rose-400 mt-1 flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" /> &lt;75% Alert
            </p>
          )}
        </div>

        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Attended</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-0.5 sm:mt-1">{kpis.total_attended || 0}</h3>
        </div>

        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Missed</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-0.5 sm:mt-1">{kpis.classes_missed || 0}</h3>
        </div>

        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5 sm:mt-1">{kpis.total_completed_classes || 0}</h3>
        </div>
      </div>

      {/* Today's Classes Cards with mobile touch button */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Today's Classes</h3>
        {todaysClasses.length === 0 ? (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
            No class sessions scheduled for today
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaysClasses.map((c) => (
              <div key={c.id} className="glass-card p-5 rounded-2xl sm:rounded-3xl border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{c.subject_code}</span>
                    <StatusBadge status={c.my_status} />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white mt-1">{c.subject_name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Faculty: {c.faculty_name}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> {c.start_time} - {c.end_time}</span>
                  <span className="font-semibold text-slate-400">Room {c.room_code}</span>
                </div>

                <button
                  onClick={() => setSelectedSessionForQR(c)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 active:scale-98 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all touch-manipulation"
                >
                  <QrCode className="w-4 h-4 mr-2" /> Generate Attendance QR
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject Wise Breakdown */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Subject Breakdown</h3>
        <div className="space-y-3">
          {subjects.map((sub) => (
            <div key={sub.subject_code} className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-400">{sub.subject_code}</span>
                  <h5 className="text-xs sm:text-sm font-bold text-white">{sub.subject_name}</h5>
                </div>
                <span className={`text-xs sm:text-sm font-extrabold ${sub.is_low_attendance ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {sub.percentage}% ({sub.attended}/{sub.total})
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    sub.is_low_attendance ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Generator Modal */}
      {selectedSessionForQR && (
        <QRGeneratorModal
          session={selectedSessionForQR}
          onClose={() => setSelectedSessionForQR(null)}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
