import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, UserCheck, BookOpen, School, GraduationCap,
  Calendar, FileSpreadsheet, ShieldAlert, Settings, QrCode, ClipboardList, LogOut
} from 'lucide-react';

const Sidebar = () => {
  const { role, logout, user } = useAuth();

  const getNavItems = () => {
    if (role === 'super_admin') {
      return [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Students', path: '/admin/students', icon: Users },
        { label: 'Faculty', path: '/admin/faculty', icon: UserCheck },
        { label: 'Branches', path: '/admin/branches', icon: School },
        { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
        { label: 'Classrooms', path: '/admin/classrooms', icon: GraduationCap },
        { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
      ];
    } else if (role === 'faculty') {
      return [
        { label: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
        { label: 'My Classes', path: '/faculty/classes', icon: Calendar },
        { label: 'Class Reports', path: '/faculty/reports', icon: FileSpreadsheet },
      ];
    } else if (role === 'student') {
      return [
        { label: 'Dashboard', path: '/student', icon: LayoutDashboard },
        { label: 'My Classes', path: '/student/classes', icon: Calendar },
        { label: 'History', path: '/student/attendance', icon: ClipboardList },
        { label: 'Profile', path: '/student/profile', icon: Settings },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (visible on md:flex, hidden on mobile) */}
      <aside className="hidden md:flex w-64 glass-card border-r border-slate-800 flex-col justify-between h-screen sticky top-0">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-tight">Smart Attendance</h1>
              <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">{role?.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin' || item.path === '/faculty' || item.path === '/student'}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Desktop Logout Footer */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/40 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || user?.roll_no || user?.employee_id}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR (visible on mobile <768px, hidden on md+) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-slate-800/80 px-2 py-1.5 justify-around items-center bg-slate-950/95 backdrop-blur-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin' || item.path === '/faculty' || item.path === '/student'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-medium transition-all ${
                  isActive
                    ? 'text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;
