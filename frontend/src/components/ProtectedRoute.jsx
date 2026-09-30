import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AppLayout from './AppLayout.jsx';
import TeacherAccessPage from '../pages/teacher/TeacherAccessPage.jsx';

export function RequireAuth() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RequireRole({ role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'TEACHER' && user.role === role && user.teacherAccess === false) return <Navigate to="/teacher/access" replace />;
  return user.role === role ? <AppLayout /> : <Navigate to={`/${user.role.toLowerCase()}`} replace />;
}

export function TeacherApprovalRoute() {
  const { user } = useAuth();
  if (user?.role !== 'TEACHER') return <Navigate to="/login" replace />;
  return <TeacherAccessPage />;
}
