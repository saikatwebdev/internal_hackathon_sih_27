import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Plus, School } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ branch_code: '', branch_name: '', department: 'CSE' });

  const loadBranches = async () => {
    try {
      const res = await axiosClient.get('/branches');
      setBranches(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadBranches(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/branches', formData);
      setShowModal(false);
      loadBranches();
    } catch (err) { alert('Failed to create branch'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Academic Branches</h3>
          <p className="text-xs text-slate-400">Configure college branches and degree programs</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Branch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {branches.map((b) => (
          <div key={b.id} className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{b.branch_code}</span>
              <h4 className="text-base font-bold text-white mt-1">{b.branch_name}</h4>
              <p className="text-xs text-slate-400 mt-1">Department: {b.department}</p>
            </div>
            <StatusBadge status={b.status} />
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Add Branch</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input type="text" placeholder="Branch Code (e.g. ECE)" required value={formData.branch_code} onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
              <input type="text" placeholder="Branch Name" required value={formData.branch_name} onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
              <input type="text" placeholder="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
