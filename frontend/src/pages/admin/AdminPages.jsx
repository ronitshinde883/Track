import React from 'react';
import { useEffect, useState } from 'react';
import { Check, X, Users, GraduationCap, Hourglass, UserCheck } from 'lucide-react';
import { adminAPI, apiError, listData } from '../../services/api.js';
import { Badge, DataTable, EmptyState, Notice, PageHeader, StatCard } from '../../components/Common.jsx';

function useResource(load) {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  async function refresh() { setLoading(true); setError(''); try { setData(listData((await load()).data)); } catch (err) { setError(apiError(err)); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, []);
  return { data, loading, error, refresh };
}
const teacherColumns = (actions) => [
  { key: 'username', label: 'Username' }, { key: 'employee_id', label: 'Employee ID' },
  { key: 'college_name', label: 'College' }, { key: 'department_name', label: 'Department' },
  { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> },
  ...(actions ? [{ key: 'actions', label: 'Actions', render: actions }] : []),
];

export function AdminDashboard() {
  const teachers = useResource(adminAPI.teachers); const students = useResource(adminAPI.students);
  const pending = useResource(adminAPI.pendingTeachers); const approved = useResource(adminAPI.approvedTeachers); const rejected = useResource(adminAPI.rejectedTeachers);
  const recent = [...teachers.data].sort((a, b) => b.id - a.id).slice(0, 5);
  return <><PageHeader eyebrow="ADMINISTRATION" title="Dashboard" description="Manage the people and approval requests for your college." /><Notice>{[teachers.error, students.error, pending.error, approved.error, rejected.error].filter(Boolean).join(' ')}</Notice><div className="stats-grid"><StatCard label="Total teachers" value={teachers.data.length} icon={Users} /><StatCard label="Pending requests" value={pending.data.length} icon={Hourglass} /><StatCard label="Approved teachers" value={approved.data.length} icon={UserCheck} /><StatCard label="Rejected teachers" value={rejected.data.length} icon={X} /><StatCard label="Total students" value={students.data.length} icon={GraduationCap} /></div><section className="panel"><div className="panel-heading"><div><h2>Recent teacher registrations</h2><p>Most recently added teachers in your college</p></div></div><DataTable columns={teacherColumns()} rows={recent} loading={teachers.loading} emptyTitle="No teachers found" /></section></>;
}

export function AdminTeachersPage({ filter = 'all' }) {
  const loaders = { all: adminAPI.teachers, pending: adminAPI.pendingTeachers, approved: adminAPI.approvedTeachers, rejected: adminAPI.rejectedTeachers };
  const { data, loading, error, refresh } = useResource(loaders[filter]); const [busyId, setBusyId] = useState(null); const [notice, setNotice] = useState(null);
  const names = { all: 'Teachers', pending: 'Pending teachers', approved: 'Approved teachers', rejected: 'Rejected teachers' };
  async function decide(teacher, decision) {
    const verb = decision === 'approve' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${verb} ${teacher.username}?`)) return;
    setBusyId(teacher.id); setNotice(null);
    try { const response = await (decision === 'approve' ? adminAPI.approveTeacher(teacher.id) : adminAPI.rejectTeacher(teacher.id)); setNotice({ type: 'success', text: response.data.message }); await refresh(); }
    catch (err) { setNotice({ type: 'error', text: apiError(err) }); }
    finally { setBusyId(null); }
  }
  const actions = filter === 'pending' ? (row) => <div className="action-group"><button className="button button-small button-primary" disabled={busyId === row.id} onClick={() => decide(row, 'approve')}><Check size={15} />Approve</button><button className="button button-small button-secondary danger-text" disabled={busyId === row.id} onClick={() => decide(row, 'reject')}><X size={15} />Reject</button></div> : null;
  return <><PageHeader eyebrow="ADMINISTRATION" title={names[filter]} description={filter === 'all' ? 'Teachers registered with your college.' : `Teacher requests currently marked ${filter}.`} /><Notice>{error}</Notice>{notice && <Notice type={notice.type}>{notice.text}</Notice>}<section className="panel"><DataTable columns={teacherColumns(actions)} rows={data} loading={loading} emptyTitle={`No ${filter === 'all' ? '' : `${filter} `}teachers`} emptyDetail={filter === 'pending' ? 'There are no teacher requests to review.' : undefined} /></section></>;
}

export function AdminStudentsPage() {
  const { data, loading, error } = useResource(adminAPI.students);
  const columns = [{ key: 'username', label: 'Username' }, { key: 'enrollment_no', label: 'Enrollment number' }, { key: 'college_name', label: 'College' }, { key: 'department_name', label: 'Department' }, { key: 'division', label: 'Division' }];
  return <><PageHeader eyebrow="ADMINISTRATION" title="Students" description="Students registered with your college." /><Notice>{error}</Notice><section className="panel"><DataTable columns={columns} rows={data} loading={loading} emptyTitle="No students found" /></section></>;
}
