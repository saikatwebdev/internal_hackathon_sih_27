import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, ShieldCheck, Lock, Check } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const StudentProfilePage = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await axiosClient.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setMsg('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Overview Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center space-x-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 font-extrabold text-2xl flex items-center justify-center border border-blue-500/30">
          {user?.name ? user.name.charAt(0) : 'S'}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{user?.name}</h3>
          <p className="text-xs text-slate-400">Roll No: <span className="text-blue-400 font-mono font-bold">{user?.roll_no}</span></p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> Biometric Face Reference Registered
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Registration</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500">Phone</span>
            <p className="font-semibold text-white mt-0.5">{user?.phone || 'N/A'}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500">Email</span>
            <p className="font-semibold text-white mt-0.5">{user?.email || 'N/A'}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500">Academic Placement</span>
            <p className="font-semibold text-white mt-0.5">Year {user?.year} • Sem {user?.semester} • Sec {user?.section}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500">Branch ID</span>
            <p className="font-mono text-slate-300 mt-0.5 truncate">{user?.branch_id}</p>
          </div>
        </div>
      </div>

      {/* Security Form */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
          <Lock className="w-4 h-4 mr-1.5 text-blue-400" /> Account Security
        </h4>

        {msg && <p className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">{msg}</p>}
        {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</p>}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password" required placeholder="Current Password" value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
          />
          <input
            type="password" required minLength={6} placeholder="New Password (min 6 chars)" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
          />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentProfilePage;
