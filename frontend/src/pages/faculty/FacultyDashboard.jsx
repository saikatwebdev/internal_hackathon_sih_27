import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Calendar, Plus, Users, TrendingUp, Clock, Eye } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await axiosClient.get('/analytics/faculty');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) return <div className="p-8 text-slate-400 text-xs animate-pulse">Loading dashboard...</div>;

  const kpis = data?.kpis || {};
  const todaysClasses = data?.todays_classes || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Faculty Dashboard</h3>
          <p className="text-xs text-slate-400">Class schedule, live attendance, and course analytics</p>
        </div>
        <button
          onClick={() => navigate('/faculty/classes')}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center"
        >
          <Calendar className="w-4 h-4 mr-2" /> View All Classes
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Classes</p>
          <h3 className="text-2xl font-extrabold text-white mt-1">{kpis.total_assigned_classes || 0}</h3>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Attendance Rate</p>
          <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{kpis.average_attendance_pct || 0}%</h3>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Sessions</p>
          <h3 className="text-2xl font-extrabold text-blue-400 mt-1">{kpis.todays_class_count || 0}</h3>
        </div>
      </div>

      {/* Today's Classes List */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Today's Class Schedule</h4>
        {todaysClasses.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No class sessions scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todaysClasses.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-400">{c.subject_code}</span>
                  <h5 className="text-sm font-bold text-white mt-0.5">{c.subject_name}</h5>
                  <p className="text-xs text-slate-400 mt-1 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" /> {c.start_time} - {c.end_time} • Room {c.room_code} • Sec {c.section}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <StatusBadge status={c.status} />
                  <button
                    onClick={() => navigate(`/faculty/classes/${c.id}/attendance`)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold text-xs border border-blue-500/30 flex items-center"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> View Spreadsheet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;
