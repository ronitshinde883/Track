import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';

export function Loading({ label = 'Loading…' }) { return <div className="loading"><LoaderCircle className="spin" size={19} />{label}</div>; }
export function Notice({ type = 'error', children, onClose }) {
  if (!children) return null;
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  return <div className={`notice ${type}`} role="status"><Icon size={18} /><span>{children}</span>{onClose && <button className="notice-close" onClick={onClose} aria-label="Dismiss">×</button>}</div>;
}
export function EmptyState({ title, detail }) { return <div className="empty-state"><div className="empty-icon">—</div><strong>{title}</strong>{detail && <p>{detail}</p>}</div>; }
export function Badge({ children }) { return <span className={`badge badge-${String(children).toLowerCase()}`}>{children}</span>; }
export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-action">{action}</div>}</div>;
}
export function StatCard({ label, value, caption, icon: Icon }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span>{Icon && <Icon size={19} />}</div><strong>{value}</strong>{caption && <small>{caption}</small>}</div>;
}
export function Field({ label, hint, ...props }) {
  return <label className="field"><span>{label}</span><input {...props} />{hint && <small>{hint}</small>}</label>;
}
export function SelectField({ label, children, ...props }) {
  return <label className="field"><span>{label}</span><select {...props}>{children}</select></label>;
}
export function DataTable({ columns, rows, emptyTitle = 'Nothing to show yet', emptyDetail, loading, rowKey = 'id' }) {
  if (loading) return <div className="table-message"><Loading /></div>;
  if (!rows?.length) return <EmptyState title={emptyTitle} detail={emptyDetail} />;
  return <div className="table-wrap"><table><thead><tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row[rowKey] ?? index}>{columns.map((col) => <td key={col.key}>{col.render ? col.render(row) : row[col.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>;
}
export function AuthShell({ title, description, children, footnote }) {
  return <main className="auth-page"><div className="auth-brand"><div className="brand-mark">CA</div><span>Campus Attendance</span></div><section className="auth-card"><div className="eyebrow">COLLEGE PORTAL</div><h1>{title}</h1><p className="auth-description">{description}</p>{children}{footnote && <div className="auth-footnote">{footnote}</div>}</section><div className="auth-footer">Attendance, managed with clarity.</div></main>;
}
export function LinkButton({ to, children, ...props }) { return <Link to={to} className="button button-secondary" {...props}>{children}</Link>; }
