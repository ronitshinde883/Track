import React from 'react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authAPI, apiError } from '../../services/api.js';
import { useAuth, homeForRole } from '../../context/AuthContext.jsx';
import { AuthShell, Field, Notice, SelectField } from '../../components/Common.jsx';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '', role: 'STUDENT' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(location.state?.message || '');
  if (user) return <Navigate to={homeForRole(user.role)} replace />;
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { const loggedIn = await login(form); navigate(loggedIn.role === 'TEACHER' && loggedIn.teacherAccess === false ? '/teacher/access' : homeForRole(loggedIn.role), { replace: true }); }
    catch (err) { setError(apiError(err)); }
    finally { setBusy(false); }
  }
  return <AuthShell title="Welcome back" description="Sign in to your college attendance workspace." footnote={<>New to the portal? <Link to="/register">Create an account</Link></>}>
    <form className="form-stack" onSubmit={submit}><Notice>{error}</Notice><Field label="Username" name="username" autoComplete="username" value={form.username} onChange={change} required /><Field label="Password" type="password" name="password" autoComplete="current-password" value={form.password} onChange={change} required /><SelectField label="Account type" name="role" value={form.role} onChange={change}><option value="STUDENT">Student</option><option value="TEACHER">Teacher</option><option value="ADMIN">Administrator</option></SelectField><p className="field-hint">Administrator accounts are created by your developer.</p><button className="button button-primary button-wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form>
  </AuthShell>;
}

export function RegisterPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', role: 'STUDENT', college: '', department: '', enrollment_no: '', division: '', employee_id: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  if (user) return <Navigate to={homeForRole(user.role)} replace />;
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    const payload = { username: form.username, password: form.password, role: form.role, college: Number(form.college) };
    if (form.role === 'STUDENT') payload.department = Number(form.department);
    if (form.role === 'STUDENT') Object.assign(payload, { enrollment_no: form.enrollment_no, division: form.division });
    if (form.role === 'TEACHER') payload.employee_id = form.employee_id;
    try { const { data } = await authAPI.register(payload); setSuccess(data.message + (data.role === 'TEACHER' ? ' Your teacher account is pending admin approval.' : ' You can now sign in.')); }
    catch (err) { setError(apiError(err)); }
    finally { setBusy(false); }
  }
  return <AuthShell title="Create an account" description="Register as a student or teacher. Administrator accounts are managed by the developer." footnote={<>Already registered? <Link to="/login">Sign in</Link></>}>
    <form className="form-stack" onSubmit={submit}><Notice>{error}</Notice><Notice type="success">{success}</Notice><Field label="Username" name="username" autoComplete="username" value={form.username} onChange={change} required /><Field label="Password" name="password" type="password" autoComplete="new-password" minLength="6" value={form.password} onChange={change} required hint="At least 6 characters." /><SelectField label="Register as" name="role" value={form.role} onChange={change}><option value="STUDENT">Student</option><option value="TEACHER">Teacher</option></SelectField><Field label="College ID" name="college" type="number" min="1" value={form.college} onChange={change} required />{form.role === 'STUDENT' && <><Field label="Department ID" name="department" type="number" min="1" value={form.department} onChange={change} required /><p className="field-hint">Use the IDs provided by your college. The backend requires sign-in to view college and department lists.</p></>}{form.role === 'STUDENT' ? <><Field label="Enrollment number" name="enrollment_no" value={form.enrollment_no} onChange={change} required /><Field label="Division" name="division" value={form.division} onChange={change} required /></> : <><Field label="Employee ID" name="employee_id" value={form.employee_id} onChange={change} required /><p className="field-hint">Choose the department separately for each attendance session.</p></>}<button className="button button-primary button-wide" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button></form>
  </AuthShell>;
}
