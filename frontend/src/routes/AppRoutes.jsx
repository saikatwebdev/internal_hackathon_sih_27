import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import FacultyLayout from '../layouts/FacultyLayout';
import StudentLayout from '../layouts/StudentLayout';

// Auth Pages
import Login from '../pages/auth/Login';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import StudentManagement from '../pages/admin/StudentManagement';
import FacultyManagement from '../pages/admin/FacultyManagement';
import BranchManagement from '../pages/admin/BranchManagement';
import SubjectManagement from '../pages/admin/SubjectManagement';
import ClassroomManagement from '../pages/admin/ClassroomManagement';
import AuditLogsPage from '../pages/admin/AuditLogsPage';

// Faculty Pages
import FacultyDashboard from '../pages/faculty/FacultyDashboard';
import MyClasses from '../pages/faculty/MyClasses';
import VirtualSpreadsheetPage from '../pages/faculty/VirtualSpreadsheetPage';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentClassesPage from '../pages/student/StudentClassesPage';
import StudentAttendanceHistoryPage from '../pages/student/StudentAttendanceHistoryPage';
import StudentProfilePage from '../pages/student/StudentProfilePage';

// Scanner Kiosk
import ScannerKioskPage from '../pages/scanner/ScannerKioskPage';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-400 text-xs">Verifying authorization...</div>;
  if (!user || !role) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'super_admin') return <Navigate to="/admin" replace />;
    if (role === 'faculty') return <Navigate to="/faculty" replace />;
    if (role === 'student') return <Navigate to="/student" replace />;
    if (role === 'scanner') return <Navigate to="/scanner" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="faculty" element={<FacultyManagement />} />
        <Route path="branches" element={<BranchManagement />} />
        <Route path="subjects" element={<SubjectManagement />} />
        <Route path="classrooms" element={<ClassroomManagement />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* Faculty Routes */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={['faculty', 'super_admin']}>
            <FacultyLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FacultyDashboard />} />
        <Route path="classes" element={<MyClasses />} />
        <Route path="classes/:sessionId/attendance" element={<VirtualSpreadsheetPage />} />
        <Route path="reports" element={<MyClasses />} />
      </Route>

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student', 'super_admin']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="classes" element={<StudentClassesPage />} />
        <Route path="attendance" element={<StudentAttendanceHistoryPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
      </Route>

      {/* Classroom Kiosk Route */}
      <Route
        path="/scanner"
        element={
          <ProtectedRoute allowedRoles={['scanner', 'super_admin', 'faculty']}>
            <ScannerKioskPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
