/* Shared UI primitives + global state hook */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2600); return () => clearTimeout(t); }, []);
  const Ic = type === 'success' ? Icons.CheckCircle : Icons.AlertTriangle;
  return (
    <div className={`toast ${type}`}>
      <Ic size={16} style={{ color: type === 'success' ? '#22C55E' : '#EF4444' }} />
      <span style={{ fontSize: 13, color: '#E5E7EB' }}>{msg}</span>
    </div>
  );
}

function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F9FAFB', margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text-2)', margin: '6px 0 0', fontSize: 14 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

function StatCard({ icon: Ic, color, value, label, accent }) {
  return (
    <div className="card card-hover" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}22`, display: 'grid', placeItems: 'center', color }}>
          <Ic size={18} />
        </div>
        {accent && <span className="pill" style={{ background: 'rgba(34,197,94,.16)', color: '#86EFAC' }}>{accent}</span>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#F9FAFB', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function EmptyState({ icon: Ic, title, ctaLabel, onCta }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(124,58,237,.08)', display: 'grid', placeItems: 'center', color: '#9CA3AF', margin: '0 auto 14px' }}>
        <Ic size={28} />
      </div>
      <div style={{ color: 'var(--text-2)', fontSize: 15, marginBottom: 16 }}>{title}</div>
      {ctaLabel && <button className="btn btn-primary" onClick={onCta}>{ctaLabel}</button>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { cls: 'badge-pending', label: 'Pending' },
    cloning: { cls: 'badge-cloning', label: 'Cloning' },
    complete: { cls: 'badge-complete', label: 'Complete' },
    error: { cls: 'badge-error', label: 'Error' },
  };
  const m = map[status] || map.pending;
  return (
    <span className={`pill ${m.cls}`}>
      {status === 'cloning' && <span style={{ width: 6, height: 6, borderRadius: 999, background: '#93C5FD' }} className="pulse-dot" />}
      {m.label}
    </span>
  );
}

Object.assign(window, { Toast, PageHeader, StatCard, EmptyState, StatusBadge });
