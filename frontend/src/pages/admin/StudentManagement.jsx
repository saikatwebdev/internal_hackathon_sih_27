import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { UserPlus, Edit3, ShieldCheck, Camera, Upload, Key, Trash2 } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [formData, setFormData] = useState({
    roll_no: '',
    name: '',
    phone: '',
    email: '',
    password: 'student123',
    branch_id: '',
    year: 2,
    semester: 3,
    section: 'A',
    face_reference_id: '',
  });

  const [editFormData, setEditFormData] = useState({
    roll_no: '',
    name: '',
    phone: '',
    email: '',
    password: '',
    branch_id: '',
    year: 2,
    semester: 3,
    section: 'A',
    face_reference_id: '',
  });

  const loadData = async () => {
    try {
      const [stRes, brRes] = await Promise.all([
        axiosClient.get('/users/students'),
        axiosClient.get('/branches'),
      ]);
      setStudents(stRes.data);
      setBranches(brRes.data);
      if (brRes.data.length > 0) {
        setFormData((prev) => ({ ...prev, branch_id: prev.branch_id || brRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/users/students', formData);
      alert(`Student "${formData.name}" (${formData.roll_no}) created successfully!`);
      setShowCreateModal(false);
      setFormData({
        roll_no: '',
        name: '',
        phone: '',
        email: '',
        password: 'student123',
        branch_id: branches[0]?.id || '',
        year: 2,
        semester: 3,
        section: 'A',
        face_reference_id: '',
      });
      loadData();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (detail?.[0]?.msg || 'Failed to create student');
      alert(`Error: ${msg}`);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete student "${studentName}"? All related attendance and enrollment records will be permanently removed.`)) {
      return;
    }
    try {
      await axiosClient.delete(`/users/students/${studentId}`);
      alert(`Student "${studentName}" deleted successfully.`);
      loadData();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : 'Failed to delete student';
      alert(`Error: ${msg}`);
    }
  };

  const handleEditClick = (st) => {
    setSelectedStudent(st);
    setEditFormData({
      roll_no: st.roll_no,
      name: st.name,
      phone: st.phone || '',
      email: st.email || '',
      password: '',
      branch_id: st.branch_id,
      year: st.year,
      semester: st.semester,
      section: st.section,
      face_reference_id: st.face_reference_id || `FACE_${st.roll_no}`,
    });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const payload = { ...editFormData };
      if (!payload.password || !payload.password.trim()) delete payload.password;
      await axiosClient.put(`/users/students/${selectedStudent.id}`, payload);
      alert(`Student profile ${editFormData.password ? '& new password' : ''} updated successfully!`);
      setSelectedStudent(null);
      loadData();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (detail?.[0]?.msg || 'Failed to update student profile');
      alert(`Error: ${msg}`);
    }
  };

  const handlePhotoFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData((prev) => ({ ...prev, face_reference_id: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Student Directory</h3>
          <p className="text-xs text-slate-400">Manage student profiles, passwords, biometrics, and directory records</p>
        </div>
        <button
          onClick={() => {
            if (branches.length > 0 && !formData.branch_id) {
              setFormData((p) => ({ ...p, branch_id: branches[0].id }));
            }
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center transition-all"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Add Student
        </button>
      </div>

      {/* Student List Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Phone / Email</th>
                <th className="px-6 py-4">Yr / Sem / Sec</th>
                <th className="px-6 py-4">Face Biometric</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-blue-400">{st.roll_no}</td>
                  <td className="px-6 py-4 font-semibold text-white">{st.name}</td>
                  <td className="px-6 py-4 text-slate-300">{st.phone || '--'}<br/><span className="text-[10px] text-slate-500">{st.email || '--'}</span></td>
                  <td className="px-6 py-4 text-slate-300">Yr {st.year} • Sem {st.semester} • Sec {st.section}</td>
                  <td className="px-6 py-4">
                    {st.face_registered ? (
                      <span className="inline-flex items-center text-emerald-400 text-[11px] font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Registered
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={st.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditClick(st)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-bold flex items-center"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(st.id, st.name)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-bold flex items-center"
                        title="Delete Student"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add New Student</h3>
            <form onSubmit={handleCreateStudent} className="space-y-3">
              <input
                type="text" placeholder="Roll No (e.g. 23AI011)" required value={formData.roll_no}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <input
                type="text" placeholder="Full Name" required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <input
                type="password" placeholder="Initial Password (e.g. student123)" required value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <input
                type="text" placeholder="Phone Number (Optional)" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <input
                type="email" placeholder="Email (Optional)" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <select
                required
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="">Select Academic Branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name} ({b.branch_code})</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number" placeholder="Year" value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 1 })}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
                <input
                  type="number" placeholder="Semester" value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) || 1 })}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
                <input
                  type="text" placeholder="Section" value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-lg">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit & Password Reset Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-700 shadow-2xl bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1">Edit Student Profile & Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">Editing Roll: <span className="text-blue-400 font-mono font-bold">{selectedStudent.roll_no}</span></p>

            <form onSubmit={handleUpdateStudent} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Roll Number</label>
                <input
                  type="text" required value={editFormData.roll_no}
                  onChange={(e) => setEditFormData({ ...editFormData, roll_no: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text" required value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              {/* Password Reset Input */}
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/30">
                <label className="block text-xs font-bold text-blue-400 flex items-center mb-1">
                  <Key className="w-3.5 h-3.5 mr-1.5" /> Set / Reset Student Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (leave blank to keep current)"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text" value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email" value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              {/* Face Photo Section */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-emerald-400 flex items-center">
                  <Camera className="w-4 h-4 mr-1.5" /> Face Biometric Reference Photo
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file" accept="image/*" onChange={handlePhotoFileUpload} className="hidden" id="face-photo-file-edit"
                  />
                  <label
                    htmlFor="face-photo-file-edit"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center cursor-pointer border border-slate-700"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Upload Photo
                  </label>
                  <span className="text-[10px] text-slate-500 truncate max-w-[180px]">
                    {editFormData.face_reference_id ? 'Photo attached' : 'No photo uploaded'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <button type="button" onClick={() => setSelectedStudent(null)} className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg">Save Student Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
