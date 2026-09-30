import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, homeForRole } from './context/AuthContext.jsx';
import { RequireRole, TeacherApprovalRoute } from './components/ProtectedRoute.jsx';
import { LoginPage, RegisterPage } from './pages/auth/AuthPages.jsx';
import { AdminDashboard, AdminStudentsPage, AdminTeachersPage } from './pages/admin/AdminPages.jsx';
import { CreateSessionPage, SessionDetailPage, TeacherAttendancePage, TeacherDashboard, TeacherProfilePage, TeacherSessionsPage } from './pages/teacher/TeacherPages.jsx';
import { StudentAttendancePage, StudentDashboard, StudentProfilePage, StudentScanPage } from './pages/student/StudentPages.jsx';

function RootRedirect() { const { user } = useAuth(); return <Navigate to={user ? homeForRole(user.role) : '/login'} replace />; }
function RoleRoutes({ role, children }) { return <Route element={<RequireRole role={role} />}>{children}</Route>; }

export default function App() {
  return <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/teacher/access" element={<TeacherApprovalRoute />} />
    {RoleRoutes({ role: 'ADMIN', children: <>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/teachers" element={<AdminTeachersPage />} />
      <Route path="/admin/teachers/pending" element={<AdminTeachersPage filter="pending" />} />
      <Route path="/admin/teachers/approved" element={<AdminTeachersPage filter="approved" />} />
      <Route path="/admin/teachers/rejected" element={<AdminTeachersPage filter="rejected" />} />
      <Route path="/admin/students" element={<AdminStudentsPage />} />
    </> })}
    {RoleRoutes({ role: 'TEACHER', children: <>
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/create-session" element={<CreateSessionPage />} />
      <Route path="/teacher/sessions" element={<TeacherSessionsPage />} />
      <Route path="/teacher/sessions/:id" element={<SessionDetailPage />} />
      <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
      <Route path="/teacher/profile" element={<TeacherProfilePage />} />
    </> })}
    {RoleRoutes({ role: 'STUDENT', children: <>
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/scan" element={<StudentScanPage />} />
      <Route path="/student/attendance" element={<StudentAttendancePage />} />
      <Route path="/student/profile" element={<StudentProfilePage />} />
    </> })}
    <Route path="*" element={<RootRedirect />} />
  </Routes>;
}
