import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { ClipboardList, ShieldCheck } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

const StudentAttendanceHistoryPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axiosClient.get('/analytics/student');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-8 text-slate-400 text-xs animate-pulse">Loading history...</div>;

  const subjects = data?.subject_breakdown || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight flex items-center">
          <ClipboardList className="w-5 h-5 text-blue-400 mr-2" /> Attendance History & Breakdown
        </h3>
        <p className="text-xs text-slate-400">Detailed course-wise attendance metrics and records</p>
      </div>

      <div className="space-y-4">
        {subjects.map((sub) => (
          <div key={sub.subject_code} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{sub.subject_code}</span>
                <h4 className="text-base font-bold text-white mt-0.5">{sub.subject_name}</h4>
              </div>
              <div className="text-right">
                <span className={`text-lg font-extrabold ${sub.is_low_attendance ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {sub.percentage}%
                </span>
                <p className="text-[11px] text-slate-400">{sub.attended} Attended / {sub.total} Conducted</p>
              </div>
            </div>

            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
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
  );
};

export default StudentAttendanceHistoryPage;
