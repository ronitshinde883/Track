import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import { apiError, listData, studentAPI } from '../../services/api.js';
import { Badge, DataTable, EmptyState, Loading, Notice, PageHeader, StatCard } from '../../components/Common.jsx';
import { formatDate } from '../teacher/TeacherPages.jsx';
import { ClipboardCheck, QrCode } from 'lucide-react';

function useLoad(loader) {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  async function refresh() { setLoading(true); setError(''); try { setData(listData((await loader()).data)); } catch (err) { setError(apiError(err)); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, []);
  return { data, loading, error, refresh };
}

async function decodePhoto(file, scanner) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('This photo format could not be opened by the browser.'));
      element.src = url;
    });
    const scale = Math.min(1, 3000 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Could not process the photo.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const decoded = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
    if (decoded?.data) return decoded.data;
  } finally {
    URL.revokeObjectURL(url);
  }

  // Use the scanner library as a second decoder for images jsQR cannot read.
  return scanner.scanFile(file, false);
}

export function StudentDashboard() {
  const attendance = useLoad(studentAPI.attendance); const profile = useLoad(studentAPI.profile); const person = profile.data[0];
  const recent = [...attendance.data].sort((a, b) => new Date(b.marked_at) - new Date(a.marked_at)).slice(0, 5);
  const columns = [{ key: 'session_title', label: 'Session' }, { key: 'marked_at', label: 'Marked at', render: (row) => formatDate(row.marked_at) }, { key: 'status', label: 'Status', render: () => <Badge>MARKED</Badge> }];
  return <><PageHeader eyebrow="STUDENT WORKSPACE" title="Dashboard" description={`Welcome${person?.username ? `, ${person.username}` : ''}. Here is your attendance overview.`} action={<Link className="button button-primary" to="/student/scan"><QrCode size={17} />Scan QR</Link>} /><Notice>{attendance.error || profile.error}</Notice><div className="stats-grid stats-three"><StatCard label="Attendance records" value={attendance.data.length} icon={ClipboardCheck} /><StatCard label="College" value={person?.college_name || '—'} /><StatCard label="Division" value={person?.division || '—'} /></div><section className="panel"><div className="panel-heading"><div><h2>Recent attendance</h2><p>Your latest marked sessions</p></div><Link className="text-link" to="/student/attendance">View all</Link></div><DataTable columns={columns} rows={recent} loading={attendance.loading} emptyTitle="No attendance records yet" /></section></>;
}

export function StudentAttendancePage() {
  const { data, loading, error } = useLoad(studentAPI.attendance);
  const columns = [{ key: 'session_title', label: 'Session' }, { key: 'marked_at', label: 'Date and time', render: (row) => formatDate(row.marked_at) }, { key: 'status', label: 'Status', render: () => <Badge>MARKED</Badge> }];
  return <><PageHeader eyebrow="STUDENT WORKSPACE" title="My attendance" description="Attendance recorded for your account." /><Notice>{error}</Notice><section className="panel"><DataTable columns={columns} rows={data} loading={loading} emptyTitle="No attendance records yet" /></section></>;
}

export function StudentProfilePage() {
  const { data, loading, error } = useLoad(studentAPI.profile); const profile = data[0];
  return <><PageHeader eyebrow="STUDENT WORKSPACE" title="Profile" description="Your student account information." /><Notice>{error}</Notice>{loading ? <Loading /> : profile ? <section className="panel profile-card"><ProfileLine label="Username" value={profile.username} /><ProfileLine label="Enrollment number" value={profile.enrollment_no} /><ProfileLine label="College" value={profile.college_name} /><ProfileLine label="Department" value={profile.department_name} /><ProfileLine label="Division" value={profile.division} /></section> : !error && <EmptyState title="Profile unavailable" />}</>;
}
function ProfileLine({ label, value }) { return <div className="profile-line"><span>{label}</span><strong>{value || '—'}</strong></div>; }

export function StudentScanPage() {
  const scannerRef = useRef(null); const photoInputRef = useRef(null); const scanHandled = useRef(false); const [scanning, setScanning] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(null); const [cameraError, setCameraError] = useState(''); const [scannerReady, setScannerReady] = useState(false);
  useEffect(() => {
    const scanner = new Html5Qrcode('attendance-reader', { verbose: false });
    scannerRef.current = scanner;
    setScannerReady(true);
    return () => {
      if (scanner.isScanning) scanner.stop().then(() => scanner.clear()).catch(() => {});
      else scanner.clear();
    };
  }, []);
  async function stopScan() { const scanner = scannerRef.current; if (scanner?.isScanning) await scanner.stop().catch(() => {}); setScanning(false); }
  async function submitToken(qrContent) {
    // Backend QR code is the raw UUID; the endpoint expects { qr_token: "..." }.
    const token = String(qrContent).trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
      setNotice({ type: 'error', text: 'Invalid QR code.' }); return;
    }
    try { const { data } = await studentAPI.scan(token); setNotice({ type: 'success', text: data.message || 'Attendance marked successfully.' }); }
    catch (err) { setNotice({ type: 'error', text: apiError(err) }); }
  }
  async function mark(qrContent) {
    if (scanHandled.current) return;
    scanHandled.current = true;
    setBusy(true); await stopScan(); setNotice(null); setCameraError('');
    try { await submitToken(qrContent); }
    finally { setBusy(false); }
  }
  async function scanPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setNotice(null); setCameraError(''); setBusy(true); scanHandled.current = true;
    try {
      await stopScan();
      const decoded = await decodePhoto(file, scannerRef.current);
      await submitToken(decoded);
    } catch (error) {
      const detail = error?.message || String(error || '');
      setNotice({ type: 'error', text: detail.includes('could not be opened') ? detail : 'Could not find a QR code in that photo. Make the code larger on the teacher screen, keep the full code in focus, avoid glare, and try again.' });
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }
  async function startScan() {
    setNotice(null); setCameraError(''); scanHandled.current = false;
    try {
      await scannerRef.current.start({ facingMode: 'environment' }, { fps: 10, qrbox: (width, height) => { const size = Math.floor(Math.min(240, width * 0.82, height * 0.82)); return { width: size, height: size }; } }, (decoded) => { if (!busy) mark(decoded); }, () => {});
      setScanning(true);
    } catch (err) {
      const message = String(err?.message || err || '');
      setCameraError(/NotAllowed|Permission|denied/i.test(message) ? 'Camera permission was denied. Allow camera access in your browser settings and try again.' : `Could not start the camera. ${message || 'Check camera permission and HTTPS on mobile.'}`);
    }
  }
  return <><PageHeader eyebrow="STUDENT WORKSPACE" title="Scan attendance QR" description="Scan a live QR code or use your phone camera to take a QR photo." /><div className="scanner-layout"><section className="panel scanner-panel"><Notice type={notice?.type}>{notice?.text}</Notice><Notice>{cameraError}</Notice><div className={`reader ${scanning ? 'reader-active' : ''}`}><div id="attendance-reader" className="reader-viewport" />{!scanning && !busy && <div className="reader-placeholder"><div className="reader-icon"><QrCode size={35} /></div><strong>Camera preview</strong><p>For LAN testing, use the camera photo option below.</p></div>}{busy && <div className="reader-overlay"><Loading label="Reading QR and marking attendance…" /></div>}</div><input ref={photoInputRef} className="photo-input" type="file" accept="image/*" capture="environment" onChange={scanPhoto} /><div className="scanner-actions"><button className="button button-primary" onClick={startScan} disabled={scanning || busy || !scannerReady}>Start live scanner</button>{scanning && <button className="button button-secondary" onClick={stopScan}>Stop scanner</button>}<button className="button button-secondary" onClick={() => photoInputRef.current?.click()} disabled={scanning || busy || !scannerReady}>Use camera photo</button></div><p className="small-note">On a local LAN address, live camera streaming may be blocked by the browser. Use camera photo, or open the app on an HTTPS origin for live scanning.</p></section><section className="panel instructions-panel"><div className="eyebrow">HOW IT WORKS</div><h2>Mark your attendance</h2><ol><li>Ask your teacher to display the session QR code.</li><li>Tap <strong>Use camera photo</strong> and take a clear picture of the full code.</li><li>The backend validates the session and records attendance.</li></ol><p className="muted">Only the backend can confirm whether a session is active, expired, or valid for your college.</p></section></div></>;
}
