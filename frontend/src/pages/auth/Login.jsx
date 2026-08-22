import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QrCode, Lock, User, Sparkles } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('super_admin');
  const [username, setUsername] = useState('admin@college.edu');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    if (newRole === 'super_admin') {
      setUsername('admin@college.edu');
      setPassword('admin123');
    } else if (newRole === 'scanner') {
      setUsername('LAB204_SCANNER');
      setPassword('scanner123');
    } else if (newRole === 'faculty') {
      setUsername('');
      setPassword('');
    } else if (newRole === 'student') {
      setUsername('');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(username, password, role);
      if (user.role === 'super_admin') navigate('/admin');
      else if (user.role === 'faculty') navigate('/faculty');
      else if (user.role === 'student') navigate('/student');
      else if (user.role === 'scanner') navigate('/scanner');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-card max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/20 mb-3">
            <QrCode className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Smart Attendance</h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">College Biometric & QR Attendance Portal</p>
        </div>

        {/* 4 Restored Role Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800 mb-5">
          {[
            { id: 'student', label: 'Student' },
            { id: 'faculty', label: 'Faculty' },
            { id: 'super_admin', label: 'Admin' },
            { id: 'scanner', label: 'Kiosk' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleRoleChange(item.id)}
              className={`py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all touch-manipulation ${
                role === item.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              {role === 'student' ? 'Roll No or Phone' : role === 'faculty' ? 'Email or Employee ID' : role === 'super_admin' ? 'Admin Email' : 'Scanner ID'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={role === 'student' ? 'Enter Roll No' : role === 'faculty' ? 'Enter Email' : role === 'super_admin' ? 'admin@college.edu' : 'LAB204_SCANNER'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Password / Secret
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 active:scale-98 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all touch-manipulation mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
            Default Admin & Kiosk credentials pre-filled
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
