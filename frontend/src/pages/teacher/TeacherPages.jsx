import React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, QrCode, Users } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { adminAPI, apiError, listData, teacherAPI } from '../../services/api.js';
import { Badge, DataTable, EmptyState, Field, Loading, Notice, PageHeader, SelectField, StatCard } from '../../components/Common.jsx';

function useLoad(loader) {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  async function refresh() { setLoading(true); setError(''); try { setData(listData((await loader()).data)); } catch (err) { setError(apiError(err)); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, []);
  return { data, loading, error, refresh };
}
export function TeacherDashboard() {
  const sessions = useLoad(teacherAPI.sessions); const attendance = useLoad(teacherAPI.attendance);
  const active = sessions.data.filter((item) => item.is_active && new Date(item.expires_at) > new Date());
  const recent = [...sessions.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  return <><PageHeader eyebrow="TEACHER WORKSPACE" title="Dashboard" description="Create attendance sessions and review your class activity." action={<Link className="button button-primary" to="/teacher/create-session"><QrCode size={17} />Create session</Link>} /><Notice>{sessions.error || attendance.error}</Notice><div className="stats-grid stats-three"><StatCard label="Total sessions" value={sessions.data.length} icon={CalendarDays} /><StatCard label="Active sessions" value={active.length} icon={QrCode} /><StatCard label="Attendance records" value={attendance.data.length} icon={ClipboardCheck} /></div><section className="panel"><div className="panel-heading"><div><h2>Recent sessions</h2><p>Your latest attendance sessions</p></div><Link className="text-link" to="/teacher/sessions">View all</Link></div><SessionTable rows={recent} loading={sessions.loading} /></section></>;
}

function SessionTable({ rows, loading }) {
  const columns = [{ key: 'title', label: 'Session' }, { key: 'department_name', label: 'Department', render: (row) => row.department_name || '—' }, { key: 'created_at', label: 'Created', render: (row) => formatDate(row.created_at) }, { key: 'expires_at', label: 'Expires', render: (row) => formatDate(row.expires_at) }, { key: 'is_active', label: 'Status', render: (row) => <Badge>{row.is_active && new Date(row.expires_at) > new Date() ? 'ACTIVE' : 'INACTIVE'}</Badge> }, { key: 'id', label: 'Actions', render: (row) => <Link className="text-link" to={`/teacher/sessions/${row.id}`}>View QR</Link> }];
  return <DataTable columns={columns} rows={rows} loading={loading} emptyTitle="No sessions created" emptyDetail="Create an attendance session to get started." />;
}

export function TeacherSessionsPage() {
  const { data, loading, error } = useLoad(teacherAPI.sessions);
  return <><PageHeader eyebrow="TEACHER WORKSPACE" title="My sessions" description="Sessions created by your account." action={<Link className="button button-primary" to="/teacher/create-session"><QrCode size={17} />Create session</Link>} /><Notice>{error}</Notice><section className="panel"><SessionTable rows={data} loading={loading} /></section></>;
}

export function CreateSessionPage() {
  const [form, setForm] = useState({ title: '', expires_at: '', department: '' }); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [session, setSession] = useState(null);
  const profileState = useLoad(teacherAPI.profile); const departmentState = useLoad(teacherAPI.departments);
  const profile = profileState.data[0];
  const departments = departmentState.data.filter((department) => department.college === profile?.college);
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); setSession(null); try { const { data } = await teacherAPI.createSession({ title: form.title, department: Number(form.department), expires_at: new Date(form.expires_at).toISOString() }); setSession(data); } catch (err) { setError(apiError(err)); } finally { setBusy(false); } }
  const loading = profileState.loading || departmentState.loading;
  return <><PageHeader eyebrow="TEACHER WORKSPACE" title="Create attendance session" description="Choose the department for this session. The backend creates the QR token automatically." /><div className="create-layout"><section className="panel form-panel"><Notice>{error || profileState.error || departmentState.error}</Notice><form className="form-stack" onSubmit={submit}><Field label="Session title" name="title" maxLength="200" placeholder="Operating Systems — SB3" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /><SelectField label="Department" name="department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} required disabled={loading || departments.length === 0}><option value="">{loading ? 'Loading departments…' : 'Select a department'}</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</SelectField><Field label="Expiry date and time" name="expires_at" type="datetime-local" value={form.expires_at} onChange={(event) => setForm({ ...form, expires_at: event.target.value })} required /><button className="button button-primary" disabled={busy || loading || departments.length === 0}>{busy ? 'Creating…' : 'Create session'}</button></form></section>{session && <section className="panel qr-panel"><div className="eyebrow">SESSION CREATED</div><h2>{session.title}</h2><p className="muted">{session.department_name}</p><div className="qr-frame"><QRCodeCanvas value={session.qr_token} size={360} level="H" includeMargin /></div><p className="muted">Display this code for students to scan.</p><div className="session-details"><span>Expires</span><strong>{formatDate(session.expires_at)}</strong><span>Status</span><Badge>{session.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge></div><p className="token-hint">The QR encodes the UUID token expected by the scan endpoint.</p></section>}</div></>;
}

export function SessionDetailPage() {
  const { data, loading, error } = useLoad(teacherAPI.sessions);
  const id = Number(window.location.pathname.split('/').pop()); const session = data.find((item) => item.id === id);
  if (loading) return <Loading />;
  return <><PageHeader eyebrow="TEACHER WORKSPACE" title={session?.title || 'Session QR'} description="Attendance QR for this session." /><Notice>{error}</Notice>{session ? <section className="panel qr-panel"><div className="qr-frame"><QRCodeCanvas value={session.qr_token} size={360} level="H" includeMargin /></div><div className="session-details"><span>Created</span><strong>{formatDate(session.created_at)}</strong><span>Expires</span><strong>{formatDate(session.expires_at)}</strong><span>Status</span><Badge>{session.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge></div></section> : !error && <EmptyState title="Session not found" detail="This session is not in your account’s session list." />}</>;
}

export function TeacherAttendancePage() {
  const { data, loading, error } = useLoad(teacherAPI.attendance);
  const columns = [{ key: 'student_username', label: 'Student' }, { key: 'session_title', label: 'Session' }, { key: 'marked_at', label: 'Marked at', render: (row) => formatDate(row.marked_at) }, { key: 'status', label: 'Status', render: () => <Badge>MARKED</Badge> }];
  return <><PageHeader eyebrow="TEACHER WORKSPACE" title="Attendance" description="Attendance records for sessions you created." /><Notice>{error}</Notice><section className="panel"><DataTable columns={columns} rows={data} loading={loading} emptyTitle="No attendance records yet" /></section></>;
}

export function TeacherProfilePage() {
  const { data, loading, error } = useLoad(teacherAPI.profile); const profile = data[0];
  return <><PageHeader eyebrow="TEACHER WORKSPACE" title="Profile" description="Your teacher account information." /><Notice>{error}</Notice>{loading ? <Loading /> : profile ? <section className="panel profile-card"><ProfileLine label="Username" value={profile.username} /><ProfileLine label="Employee ID" value={profile.employee_id} /><ProfileLine label="College" value={profile.college_name} /><ProfileLine label="Department" value={profile.department_name} /><ProfileLine label="Status" value={<Badge>{profile.status}</Badge>} /></section> : !error && <EmptyState title="Profile unavailable" />}</>;
}
function ProfileLine({ label, value }) { return <div className="profile-line"><span>{label}</span><strong>{value || '—'}</strong></div>; }
export function formatDate(value) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'; }
