import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Plus, BookOpen } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    subject_code: '',
    subject_name: '',
    branch_id: '',
    year: 2,
    semester: 3,
    credits: 3,
  });

  const loadData = async () => {
    try {
      const [sRes, bRes] = await Promise.all([
        axiosClient.get('/subjects'),
        axiosClient.get('/branches'),
      ]);
      setSubjects(sRes.data);
      setBranches(bRes.data);
      if (bRes.data.length > 0) setFormData((prev) => ({ ...prev, branch_id: bRes.data[0].id }));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/subjects', formData);
      setShowModal(false);
      loadData();
    } catch (err) { alert('Failed to create subject'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Subject Catalog</h3>
          <p className="text-xs text-slate-400">Manage course subjects, academic curriculum, and credits</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Subject
        </button>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Subject Code</th>
              <th className="px-6 py-4">Subject Name</th>
              <th className="px-6 py-4">Year / Sem</th>
              <th className="px-6 py-4">Credits</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {subjects.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/40">
                <td className="px-6 py-4 font-bold text-blue-400">{s.subject_code}</td>
                <td className="px-6 py-4 font-semibold text-white">{s.subject_name}</td>
                <td className="px-6 py-4 text-slate-300">Year {s.year} • Semester {s.semester}</td>
                <td className="px-6 py-4 text-slate-300">{s.credits} Credits</td>
                <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Add Subject</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input type="text" placeholder="Code (e.g. AI301)" required value={formData.subject_code} onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
              <input type="text" placeholder="Subject Name" required value={formData.subject_name} onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
              <select value={formData.branch_id} onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Year" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
                <input type="number" placeholder="Semester" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
                <input type="number" placeholder="Credits" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
