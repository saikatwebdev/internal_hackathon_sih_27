import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Plus, Calendar, Clock, Eye, BookOpen, Layers } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

const MyClasses = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    subject_id: '',
    branch_id: '',
    year: 1,
    semester: 1,
    section: 'A',
    classroom_id: '',
    class_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '12:00',
    allowed_late_minutes: 10,
    minimum_duration_minutes: 72,
  });

  const [selectedSubjDetails, setSelectedSubjDetails] = useState(null);

  const calculateTotalMinutes = (startStr, endStr) => {
    if (!startStr || !endStr) return 120;
    const [sH, sM] = startStr.split(':').map(Number);
    const [eH, eM] = endStr.split(':').map(Number);
    const total = (eH * 60 + eM) - (sH * 60 + sM);
    return total > 0 ? total : 120;
  };

  const totalClassTime = calculateTotalMinutes(formData.start_time, formData.end_time);
  const default60PctDuration = Math.max(1, Math.floor(totalClassTime * 0.60));
  const max75PctCap = Math.floor(totalClassTime * 0.749);

  const loadData = async () => {
    try {
      const [sessRes, subjRes, roomRes, brRes] = await Promise.all([
        axiosClient.get('/sessions'),
        axiosClient.get('/subjects'),
        axiosClient.get('/classrooms'),
        axiosClient.get('/branches'),
      ]);
      setSessions(sessRes.data);
      setSubjects(subjRes.data);
      setClassrooms(roomRes.data);
      setBranches(brRes.data);

      if (subjRes.data.length > 0) {
        const firstSubj = subjRes.data[0];
        setSelectedSubjDetails(firstSubj);
        setFormData((p) => ({
          ...p,
          subject_id: firstSubj.id,
          branch_id: firstSubj.branch_id || (brRes.data[0]?.id || ''),
          year: firstSubj.year || 1,
          semester: firstSubj.semester || 1,
        }));
      }
      if (roomRes.data.length > 0) {
        setFormData((p) => ({ ...p, classroom_id: roomRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubjectSelect = (subjectId) => {
    const selectedSubj = subjects.find((s) => s.id === subjectId);
    if (selectedSubj) {
      setSelectedSubjDetails(selectedSubj);
      setFormData((prev) => ({
        ...prev,
        subject_id: subjectId,
        branch_id: selectedSubj.branch_id || prev.branch_id,
        year: selectedSubj.year || 1,
        semester: selectedSubj.semester || 1,
      }));
    } else {
      setFormData((prev) => ({ ...prev, subject_id: subjectId }));
    }
  };

  const handleTimeChange = (field, value) => {
    const newStart = field === 'start_time' ? value : formData.start_time;
    const newEnd = field === 'end_time' ? value : formData.end_time;
    const totalMins = calculateTotalMinutes(newStart, newEnd);
    const newDefault60Pct = Math.max(1, Math.floor(totalMins * 0.60));

    setFormData((prev) => ({
      ...prev,
      [field]: value,
      minimum_duration_minutes: newDefault60Pct,
    }));
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (formData.minimum_duration_minutes >= Math.floor(totalClassTime * 0.75)) {
      alert(`Minimum required attendance duration (${formData.minimum_duration_minutes} mins) must be strictly less than 75% of total class duration (${Math.floor(totalClassTime * 0.75)} mins).`);
      return;
    }

    try {
      await axiosClient.post('/sessions', formData);
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to schedule class session');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Class Sessions</h3>
          <p className="text-xs text-slate-400">Schedule new classes and manage attendance spreadsheets</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Schedule Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sessions.map((s) => (
          <div key={s.id} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  {s.subject?.subject_code}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">{s.subject?.subject_name}</h4>
                <p className="text-xs text-slate-400 mt-1">Section {s.section} • Year {s.year} • Semester {s.semester}</p>
              </div>
              <StatusBadge status={s.status} />
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 space-y-1">
              <p className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-2 text-blue-400" /> Date: {s.class_date}</p>
              <p className="flex items-center"><Clock className="w-3.5 h-3.5 mr-2 text-blue-400" /> Time: {s.start_time} - {s.end_time}</p>
              <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                Min Required Attendance: {s.minimum_duration_minutes} mins
              </p>
            </div>

            <button
              onClick={() => navigate(`/faculty/classes/${s.id}/attendance`)}
              className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold text-xs border border-blue-500/30 flex items-center justify-center transition-all"
            >
              <Eye className="w-4 h-4 mr-2" /> Open Virtual Spreadsheet
            </button>
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-700 shadow-2xl bg-slate-900 max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">Schedule Class Session</h3>
            <form onSubmit={handleSchedule} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Select Subject Code / Name</label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => handleSubjectSelect(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-semibold"
                >
                  {subjects.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.subject_code} - {subj.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-derived Subject Info Box */}
              {selectedSubjDetails && (
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center text-blue-400 font-bold">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span>Auto Database Target:</span>
                  </div>
                  <div className="text-slate-200 text-right">
                    <span className="font-bold text-white">Year {selectedSubjDetails.year} • Sem {selectedSubjDetails.semester}</span>
                    <span className="text-[10px] text-slate-400 block">Section {formData.section}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Select Classroom</label>
                <select
                  value={formData.classroom_id}
                  onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  {classrooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.room_code} ({rm.building})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.class_date}
                    onChange={(e) => setFormData({ ...formData, class_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => handleTimeChange('start_time', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => handleTimeChange('end_time', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              {/* Minimum Required Attendance Duration (Default 60%, Max <75%) */}
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/30 space-y-1">
                <label className="block text-xs font-bold text-blue-400 flex items-center justify-between">
                  <span>Min Required Attendance (Exit - Entry)</span>
                  <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full">Total: {totalClassTime}m</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.minimum_duration_minutes}
                  onChange={(e) => setFormData({ ...formData, minimum_duration_minutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <p className="text-[10px] text-slate-400">
                  Default: 60% of class time ({default60PctDuration} mins). Limit must be &lt; 75% of class time ({max75PctCap} mins).
                </p>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg"
                >
                  Schedule Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClasses;
