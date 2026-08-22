import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Users, UserCheck, BookOpen, GraduationCap, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await axiosClient.get('/analytics/admin');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-400 text-xs animate-pulse">Loading institution dashboard...</div>;
  }

  const kpis = data?.kpis || {};
  const lowStudents = data?.low_attendance_students || [];

  const chartData = [
    { name: 'AIML Yr 2', attendance: 88 },
    { name: 'CSE Yr 1', attendance: 92 },
    { name: 'ECE Yr 3', attendance: 76 },
    { name: 'MECH Yr 2', attendance: 81 },
  ];

  return (
    <div className="space-y-8">
      {/* Top KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{kpis.total_students || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faculty Members</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{kpis.total_faculty || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Attendance</p>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{kpis.today_attendance_pct || 0}%</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Sessions</p>
              <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{kpis.active_classes || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance by Branch Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Attendance Trends by Department</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="attendance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Attendance Alert Table (<75%) */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <AlertCircle className="w-4 h-4 text-rose-400 mr-2" />
              Low Attendance Alert (&lt;75%)
            </h3>
            <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">
              {lowStudents.length} Students
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {lowStudents.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No students below 75% threshold</p>
            ) : (
              lowStudents.map((st) => (
                <div key={st.id} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{st.name}</p>
                    <p className="text-[10px] text-slate-400">{st.roll_no} • {st.phone}</p>
                  </div>
                  <span className="text-xs font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                    {st.attendance_percentage}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
