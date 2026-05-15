import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icons from '../components/Icons';
import { Logo } from '../components/Layout';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(name, email, pw);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const githubLogin = () => { window.location.href = `${API}/auth/github`; };
  const googleLogin = () => { window.location.href = `${API}/auth/google`; };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div className="purple-radial" style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, opacity: .4 }} />
      <div className="card fade-up" style={{ position: 'relative', width: '100%', maxWidth: 480, padding: 40, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={22} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Create your account</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 14, margin: '0 0 24px' }}>Start mapping codebases in seconds</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button type="button" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center', padding: '11px 16px' }} onClick={githubLogin}>
            <Icons.Github size={16} /> Continue with GitHub
          </button>
          <button type="button" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center', padding: '11px 16px' }} onClick={googleLogin}>
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', margin: '0 0 20px' }}>
          <hr className="divider" style={{ flex: 1 }} />
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em' }}>or</span>
          <hr className="divider" style={{ flex: 1 }} />
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Name</label>
            <input className="input" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••••" value={pw} onChange={(e) => setPw(e.target.value)} style={{ paddingRight: 40 }} required />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, color: 'var(--text-2)', cursor: 'pointer', padding: 6, display: 'grid', placeItems: 'center' }}>
                {showPw ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '12px 16px', marginTop: 6 }} disabled={loading}>
            {loading ? (
              <><div style={{ width: 16, height: 16, borderRadius: 999, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} /> Creating account...</>
            ) : (
              <>Create Account <Icons.ArrowRight size={14} /></>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-2)' }}>
          Already have an account? <Link to="/login" style={{ color: '#C4B5FD' }}>Sign in</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12 }}>
          <Link to="/" style={{ color: 'var(--text-3)' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
