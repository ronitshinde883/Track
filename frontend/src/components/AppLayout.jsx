import React from 'react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpenCheck, CalendarDays, CheckCheck, ClipboardList, GraduationCap, LayoutDashboard, LogOut, Menu, QrCode, Users, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const nav = {
  ADMIN: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Teachers', to: '/admin/teachers', icon: Users },
    { label: 'Pending teachers', to: '/admin/teachers/pending', icon: CalendarDays },
    { label: 'Approved teachers', to: '/admin/teachers/approved', icon: CheckCheck },
    { label: 'Rejected teachers', to: '/admin/teachers/rejected', icon: X },
    { label: 'Students', to: '/admin/students', icon: GraduationCap },
  ],
  TEACHER: [
    { label: 'Dashboard', to: '/teacher', icon: LayoutDashboard },
    { label: 'Create session', to: '/teacher/create-session', icon: QrCode },
    { label: 'My sessions', to: '/teacher/sessions', icon: CalendarDays },
    { label: 'Attendance', to: '/teacher/attendance', icon: ClipboardList },
    { label: 'Profile', to: '/teacher/profile', icon: UserRound },
  ],
  STUDENT: [
    { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
    { label: 'Scan QR', to: '/student/scan', icon: QrCode },
    { label: 'My attendance', to: '/student/attendance', icon: ClipboardList },
    { label: 'Profile', to: '/student/profile', icon: UserRound },
  ],
};
const titles = { ADMIN: 'Administration', TEACHER: 'Teacher workspace', STUDENT: 'Student workspace' };

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const links = nav[user?.role] || [];
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><div className="brand-mark">CA</div><div><strong>Campus Attendance</strong><small>{titles[user?.role]}</small></div><button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{links.map(({ label, to, icon: Icon }, index) => <NavLink key={to} to={to} end={index === 0} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="user-chip"><div className="avatar">{(user?.username || 'U').slice(0, 1).toUpperCase()}</div><div className="user-copy"><strong>{user?.username || 'User'}</strong><small>{user?.role?.toLowerCase()}</small></div></div><button className="logout-button" onClick={logout}><LogOut size={17} />Log out</button></div>
    </aside>
    {open && <button className="drawer-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
    <main className="main-content"><header className="topbar"><button className="menu-button" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div className="topbar-context">{titles[user?.role]}</div><div className="topbar-user">{user?.username}</div></header><div className="content-area"><Outlet /></div></main>
  </div>;
}
