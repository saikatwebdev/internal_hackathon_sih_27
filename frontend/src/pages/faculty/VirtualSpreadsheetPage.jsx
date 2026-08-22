import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { FileSpreadsheet, Download, Edit3, ArrowLeft, LayoutList, Table } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

const VirtualSpreadsheetPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' for mobile, 'matrix' for table
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState('present');
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSpreadsheet = async () => {
    try {
      const res = await axiosClient.get(`/attendance/session/${sessionId}`);
      setMatrixData(res.data);
    } catch (err) {
      console.error('Failed to load matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpreadsheet();
  }, [sessionId]);

  const handleManualOverride = async (e) => {
    e.preventDefault();
    if (!overrideReason || overrideReason.trim().length < 3) {
      alert('Reason is mandatory for manual attendance overrides.');
      return;
    }

    setSaving(true);
    try {
      await axiosClient.post('/attendance/manual-correct', {
        student_id: selectedStudent.student_id,
        status: overrideStatus,
        reason: overrideReason,
      });
      setSelectedStudent(null);
      setOverrideReason('');
      fetchSpreadsheet();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    window.open(`/api/reports/export/csv/${sessionId}`, '_blank');
  };

  const handleExportExcel = () => {
    window.open(`/api/reports/export/excel/${sessionId}`, '_blank');
  };

  if (loading) {
    return <div className="p-4 text-slate-400 text-xs animate-pulse">Loading Virtual Attendance Spreadsheet...</div>;
  }

  const session = matrixData?.session || {};
  const stats = matrixData?.stats || {};
  const students = matrixData?.students || [];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col space-y-3">
        <div>
          <button
            onClick={() => navigate('/faculty/classes')}
            className="text-xs text-blue-400 hover:underline flex items-center mb-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to My Classes
          </button>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center">
            <FileSpreadsheet className="w-5 h-5 text-blue-400 mr-2" />
            {session.subject_code}: {session.subject_name}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Date: {session.class_date} | Time: {session.start_time} - {session.end_time} | Sec {session.section}
          </p>
        </div>

        {/* View Switcher & Export Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-all ${
                viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5 mr-1.5" /> Mobile Cards
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-all ${
                viewMode === 'matrix' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Table className="w-3.5 h-3.5 mr-1.5" /> Matrix Table
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-400" /> CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Banner (2x2 on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled</span>
          <p className="text-lg sm:text-xl font-extrabold text-white mt-0.5">{stats.total_enrolled || 0}</p>
        </div>
        <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present</span>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-0.5">{stats.present_count || 0}</p>
        </div>
        <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent</span>
          <p className="text-lg sm:text-xl font-extrabold text-rose-400 mt-0.5">{stats.absent_count || 0}</p>
        </div>
        <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate</span>
          <p className="text-lg sm:text-xl font-extrabold text-blue-400 mt-0.5">{stats.attendance_percentage || 0}%</p>
        </div>
      </div>

      {/* View Mode 1: Mobile Student Cards View (default on mobile) */}
      {viewMode === 'cards' ? (
        <div className="space-y-3">
          {students.map((st) => (
            <div key={st.student_id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-400 font-mono">{st.roll_no}</span>
                  <h4 className="text-sm font-bold text-white">{st.student_name}</h4>
                </div>
                <StatusBadge status={st.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 block">Entry / Exit</span>
                  <span className="text-slate-200 font-mono text-[11px]">{st.entry_time} → {st.exit_time}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">QR / Face Check</span>
                  <span className="text-slate-200 text-[11px]">
                    QR: <strong className={st.qr_verified === 'YES' ? 'text-emerald-400' : 'text-slate-500'}>{st.qr_verified}</strong> |
                    Face: <strong className={st.face_verified === 'YES' ? 'text-emerald-400' : 'text-slate-500'}>{st.face_verified}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(st)}
                className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold text-xs border border-blue-500/30 flex items-center justify-center transition-all touch-manipulation"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Correct Attendance Status
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* View Mode 2: Scrollable Matrix Table */
        <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Entry</th>
                  <th className="px-4 py-3">Exit</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">QR</th>
                  <th className="px-4 py-3">Face</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {students.map((st) => (
                  <tr key={st.student_id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-blue-400 font-sans">{st.roll_no}</td>
                    <td className="px-4 py-3 font-semibold text-white font-sans whitespace-nowrap">{st.student_name}</td>
                    <td className="px-4 py-3 text-slate-300">{st.entry_time}</td>
                    <td className="px-4 py-3 text-slate-300">{st.exit_time}</td>
                    <td className="px-4 py-3 text-slate-300">{st.duration_minutes !== '--' ? `${st.duration_minutes}m` : '--'}</td>
                    <td className="px-4 py-3 font-sans">{st.qr_verified}</td>
                    <td className="px-4 py-3 font-sans">{st.face_verified}</td>
                    <td className="px-4 py-3 font-sans"><StatusBadge status={st.status} /></td>
                    <td className="px-4 py-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedStudent(st)}
                        className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 font-medium text-xs border border-blue-500/30"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Override Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/85 backdrop-blur-md p-0 sm:p-4">
          <div className="glass-card max-w-md w-full rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-slate-700 shadow-2xl bg-slate-900">
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">Manual Attendance Correction</h3>
            <p className="text-xs text-slate-400 mb-4">
              Student: <span className="text-white font-semibold">{selectedStudent.student_name} ({selectedStudent.roll_no})</span>
            </p>

            <form onSubmit={handleManualOverride} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Attendance Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="present">Present (Manual)</option>
                  <option value="absent">Absent (Manual)</option>
                  <option value="late">Late Entry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Override <span className="text-rose-400">* Mandatory</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Verified presence in classroom manually."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg"
                >
                  {saving ? 'Updating...' : 'Save Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualSpreadsheetPage;
