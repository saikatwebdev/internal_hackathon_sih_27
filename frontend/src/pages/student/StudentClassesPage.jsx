import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Calendar, Clock, QrCode } from 'lucide-react';
import QRGeneratorModal from '../../components/qr/QRGeneratorModal';
import StatusBadge from '../../components/common/StatusBadge';

const StudentClassesPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionForQR, setSelectedSessionForQR] = useState(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await axiosClient.get('/sessions');
        setSessions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, []);

  if (loading) return <div className="p-8 text-slate-400 text-xs animate-pulse">Loading classes...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">My Classes</h3>
        <p className="text-xs text-slate-400">Class schedule for your branch, year, semester, and section</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sessions.map((s) => (
          <div key={s.id} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{s.subject?.subject_code}</span>
                <h4 className="text-base font-bold text-white mt-0.5">{s.subject?.subject_name}</h4>
                <p className="text-xs text-slate-400 mt-1">Faculty: {s.faculty?.name}</p>
              </div>
              <StatusBadge status={s.status} />
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 space-y-1">
              <p className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-2 text-blue-400" /> Date: {s.class_date}</p>
              <p className="flex items-center"><Clock className="w-3.5 h-3.5 mr-2 text-blue-400" /> Time: {s.start_time} - {s.end_time}</p>
              <p className="text-[11px] text-slate-500 mt-1">Room: {s.classroom?.room_code}</p>
            </div>

            <button
              onClick={() => setSelectedSessionForQR(s)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center justify-center transition-all"
            >
              <QrCode className="w-4 h-4 mr-2" /> Generate Attendance QR
            </button>
          </div>
        ))}
      </div>

      {selectedSessionForQR && (
        <QRGeneratorModal
          session={selectedSessionForQR}
          onClose={() => setSelectedSessionForQR(null)}
        />
      )}
    </div>
  );
};

export default StudentClassesPage;
