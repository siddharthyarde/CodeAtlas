import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Layout';
import toast from 'react-hot-toast';

// Dedicated landing page for OAuth redirects (/auth-callback?token=xxx or ?error=xxx)
// Public route — never wrapped in ProtectedRoute.
// Stores the token, refreshes user state, then navigates to /dashboard.
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const token  = searchParams.get('token');
  const error  = searchParams.get('error');
  const msg    = searchParams.get('msg');
  const linked = searchParams.get('linked');

  useEffect(() => {
    if (error || !token) {
      const label = {
        github_denied:   'GitHub authorization was cancelled.',
        github_token:    msg || 'GitHub token exchange failed. Try again.',
        github_user:     'Could not fetch your GitHub profile.',
        github_no_email: 'Your GitHub account has no verified email. Make your email public on GitHub and try again.',
        google_failed:   'Google sign-in failed. Try again.',
        github_failed:   'GitHub sign-in failed. Try again.',
      }[error] || 'OAuth sign-in failed.';
      navigate(`/login?oauthError=${encodeURIComponent(label)}`, { replace: true });
      return;
    }

    loginWithToken(token)
      .then(() => {
        if (linked === '1') {
          toast.success('GitHub connected to your account');
          navigate('/settings', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      })
      .catch(() => navigate('/login?oauthError=Session+could+not+be+established.', { replace: true }));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#070714' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Logo size={22} />
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 999, border: '3px solid rgba(124,58,237,.3)', borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Completing sign-in…</p>
      </div>
    </div>
  );
}
