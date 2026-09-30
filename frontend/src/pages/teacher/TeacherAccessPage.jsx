import React from 'react';
import { useEffect, useState } from 'react';
import { Hourglass, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, apiError } from '../../services/api.js';
import { Loading, Notice } from '../../components/Common.jsx';

export default function TeacherAccessPage() {
  const { logout } = useAuth(); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { let live = true; api.get('/teacher-profiles/').then(() => { if (live) window.location.replace('/teacher'); }).catch((err) => { if (live) setError(err.response?.status === 403 ? 'Teacher access is not active.' : apiError(err)); }).finally(() => live && setLoading(false)); return () => { live = false; }; }, []);
  return <main className="approval-page"><section className="approval-card"><div className="approval-icon"><Hourglass size={28} /></div><div className="eyebrow">TEACHER REGISTRATION</div><h1>Your teacher access is not active.</h1><p>This account cannot access teacher features. The backend does not expose account role or teacher approval status here, so this may mean the account type is incorrect, approval is pending, or registration was rejected.</p>{loading ? <Loading label="Checking account access…" /> : <Notice>{error}</Notice>}<button className="button button-secondary" onClick={logout}>Log out</button><div className="small-note"><ShieldAlert size={15} /> Confirm the account type and registration status with your college administrator.</div></section></main>;
}
