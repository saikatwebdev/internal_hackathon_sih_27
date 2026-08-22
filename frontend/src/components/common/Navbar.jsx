import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, ShieldCheck, QrCode, LogOut } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const Navbar = ({ title }) => {
  const { user, logout, role } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await axiosClient.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        // silent fail
      }
    };
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-14 sm:h-16 glass-card border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md">
      {/* Brand & Mobile Title */}
      <div className="flex items-center space-x-2.5">
        <div className="flex md:hidden w-8 h-8 rounded-lg bg-blue-600 items-center justify-center text-white shadow-md">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-none">
            {title}
          </h2>
          <span className="md:hidden text-[9px] text-blue-400 font-bold uppercase tracking-wider block -mt-0.5">
            {role?.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 relative transition-all"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 glass-card rounded-2xl p-4 shadow-2xl border border-slate-700/50 z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Notifications</h4>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} New
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No recent notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-800/50 text-xs">
                      <p className="font-semibold text-white">{n.title}</p>
                      <p className="text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center space-x-2 pl-2 sm:pl-4 border-l border-slate-800">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-slate-300 truncate max-w-[120px]">{user?.name}</span>
          
          {/* Mobile Logout Quick Icon */}
          <button
            onClick={logout}
            className="md:hidden p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
