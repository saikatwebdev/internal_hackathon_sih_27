import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { UserCheck, Plus, Edit3, Key, Trash2 } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    phone: '',
    email: '',
    password: 'faculty123',
    department: 'CSE',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    department: 'CSE',
  });

  const loadFaculty = async () => {
    try {
      const res = await axiosClient.get('/users/faculty');
      setFaculty(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/users/faculty', formData);
      alert(`Faculty member "${formData.name}" (${formData.employee_id}) created successfully!`);
      setShowModal(false);
      setFormData({
        employee_id: '',
        name: '',
        phone: '',
        email: '',
        password: 'faculty123',
        department: 'CSE',
      });
      loadFaculty();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (detail?.[0]?.msg || 'Failed to add faculty member');
      alert(`Error: ${msg}`);
    }
  };

  const handleDeleteFaculty = async (facultyId, facultyName) => {
    if (!window.confirm(`Are you sure you want to delete faculty member "${facultyName}"? Associated scheduled class sessions will also be removed.`)) {
      return;
    }
    try {
      await axiosClient.delete(`/users/faculty/${facultyId}`);
      alert(`Faculty member "${facultyName}" deleted successfully.`);
      loadFaculty();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : 'Failed to delete faculty member';
      alert(`Error: ${msg}`);
    }
  };

  const handleEditClick = (f) => {
    setSelectedFaculty(f);
    setEditFormData({
      name: f.name,
      phone: f.phone || '',
      email: f.email,
      password: '',
      department: f.department || 'CSE',
    });
  };

  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    try {
      const payload = { ...editFormData };
      if (!payload.password || !payload.password.trim()) delete payload.password;
      await axiosClient.put(`/users/faculty/${selectedFaculty.id}`, payload);
      alert(`Faculty profile ${editFormData.password ? '& new password' : ''} updated successfully!`);
      setSelectedFaculty(null);
      loadFaculty();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (detail?.[0]?.msg || 'Failed to update faculty profile');
      alert(`Error: ${msg}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Faculty Directory</h3>
          <p className="text-xs text-slate-400">Manage teaching staff and department responsibilities</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center transition-all"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Faculty
        </button>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Employee ID</th>
              <th className="px-6 py-4">Faculty Name</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {faculty.map((f) => (
              <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 font-bold text-indigo-400">{f.employee_id}</td>
                <td className="px-6 py-4 font-semibold text-white">{f.name}</td>
                <td className="px-6 py-4 text-slate-300">{f.department}</td>
                <td className="px-6 py-4 text-slate-300">{f.email}</td>
                <td className="px-6 py-4 text-slate-300">{f.phone || '--'}</td>
                <td className="px-6 py-4"><StatusBadge status={f.status} /></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEditClick(f)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-bold flex items-center"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFaculty(f.id, f.name)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-bold flex items-center"
                      title="Delete Faculty Member"
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

      {/* Add Faculty Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Faculty Member</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text" placeholder="Employee ID (e.g. FAC004)" required value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <input
                type="text" placeholder="Full Name" required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <input
                type="password" placeholder="Initial Password (e.g. faculty123)" required value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <input
                type="email" placeholder="Email" required value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <input
                type="text" placeholder="Phone (Optional)" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <input
                type="text" placeholder="Department" value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl bg-indigo-600 text-xs font-bold text-white">Save Faculty</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit & Reset Password Modal */}
      {selectedFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-700 shadow-2xl bg-slate-900">
            <h3 className="text-lg font-bold text-white mb-1">Edit Faculty Member</h3>
            <p className="text-xs text-slate-400 mb-4">Editing ID: <span className="text-indigo-400 font-mono font-bold">{selectedFaculty.employee_id}</span></p>

            <form onSubmit={handleUpdateFaculty} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text" required value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email" required value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              {/* Password Reset Section */}
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30">
                <label className="block text-xs font-bold text-indigo-400 flex items-center mb-1">
                  <Key className="w-3.5 h-3.5 mr-1.5" /> Set / Reset Faculty Password
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
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text" value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <button type="button" onClick={() => setSelectedFaculty(null)} className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg">Save Faculty Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement;
