import React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, authAPI, setAuthExpiredHandler } from '../services/api.js';

const AuthContext = createContext(null);
export const homeForRole = (role) => ({ ADMIN: '/admin', TEACHER: '/teacher', STUDENT: '/student' }[role] || '/login');

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const role = sessionStorage.getItem('role');
    const access = sessionStorage.getItem('accessToken');
    return access && role ? { role, username: sessionStorage.getItem('username') || '', teacherAccess: sessionStorage.getItem('teacherAccess') !== 'false' } : null;
  });

  useEffect(() => {
    setAuthExpiredHandler(() => {
      sessionStorage.clear();
      setUser(null);
      navigate('/login', { replace: true, state: { message: 'Your session has expired. Please log in again.' } });
    });
  }, [navigate]);

  async function login({ username, password, role }) {
    const { data } = await authAPI.login({ username, password });
    sessionStorage.setItem('accessToken', data.access);
    if (data.refresh) sessionStorage.setItem('refreshToken', data.refresh);
    sessionStorage.setItem('role', role);
    sessionStorage.setItem('username', username);
    // Django's default SimpleJWT token has no role claim and there is no /me route.
    // Verify the chosen role against its own protected resource before opening its panel.
    try {
      if (role === 'ADMIN') await api.get('/admin/teachers/');
      if (role === 'STUDENT') await api.get('/student-profiles/');
      if (role === 'TEACHER') await api.get('/teacher-profiles/');
    } catch (error) {
      if (role === 'TEACHER' && error.response?.status === 403) {
        // The API's teacher profile permission only confirms approved accounts.
        // Keep the authenticated session so the restricted status page can explain this limitation.
        sessionStorage.setItem('role', role);
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('teacherAccess', 'false');
        const pendingTeacher = { role, username, teacherAccess: false };
        setUser(pendingTeacher);
        return pendingTeacher;
      }
      sessionStorage.clear();
      throw new Error(error.response?.status === 403 ? 'That account type does not have access.' : 'Could not verify account access. Please try again.');
    }
    sessionStorage.setItem('teacherAccess', 'true');
    const nextUser = { role, username, teacherAccess: true };
    setUser(nextUser);
    return nextUser;
  }

  function logout() {
    sessionStorage.clear();
    setUser(null);
    navigate('/login', { replace: true });
  }

  const value = useMemo(() => ({ user, login, logout, setUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
