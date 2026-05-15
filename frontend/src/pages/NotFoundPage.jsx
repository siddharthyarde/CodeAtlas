import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 96, fontWeight: 800, color: 'rgba(124,58,237,.2)', lineHeight: 1, marginBottom: 16, fontFamily: 'monospace' }}>404</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: 'white' }}>Page not found</h2>
        <p style={{ margin: '0 0 28px', color: 'var(--text-2)', fontSize: 14 }}>The page you're looking for doesn't exist or has been moved.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => navigate(-1)}
            style={{ padding: '10px 20px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            Go back
          </button>
          <button onClick={() => navigate('/dashboard')}
            style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--purple)', border: 0, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
