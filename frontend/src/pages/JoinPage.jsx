import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Layout';
import Icons from '../components/Icons';

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | success | error
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No invite token found in this link.'); return; }
    // Redirect to backend accept endpoint — it will handle the logic and redirect back
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/team/accept?token=${token}`;
  }, [token]);

  // This renders briefly before the redirect kicks in
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#070714' }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 420, padding: 40, borderRadius: 16, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={22} />
        </div>

        {status === 'checking' && (
          <>
            <div style={{ width: 36, height: 36, borderRadius: 999, border: '3px solid rgba(124,58,237,.3)', borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Accepting invite…</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Verifying your invite token</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 52, height: 52, borderRadius: 999, background: 'rgba(239,68,68,.15)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#EF4444' }}>
              <Icons.X size={24} />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'white' }}>Invalid Invite</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 24px' }}>{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
