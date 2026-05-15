function AuthPage({ mode, navigate, onAuth }) {
  const isSignup = mode === 'signup';
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(isSignup ? '' : '');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onAuth(); }, 900);
  };

  return (
    <div data-screen-label={isSignup ? '03 Signup' : '02 Login'} style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div className="purple-radial" style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, opacity: .4 }} />
      <div className="card fade-up" style={{ position: 'relative', width: '100%', maxWidth: 480, padding: 40, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={22} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 14, margin: '0 0 24px' }}>
          {isSignup ? 'Start mapping codebases in seconds' : 'Sign in to your account'}
        </p>

        <button type="button" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', marginBottom: 20 }}>
          <Icons.Github size={16} /> Continue with GitHub
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', margin: '0 0 20px' }}>
          <hr className="divider" style={{ flex: 1 }} />
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em' }}>or</span>
          <hr className="divider" style={{ flex: 1 }} />
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isSignup && (
            <div>
              <label className="label">Name</label>
              <input className="input" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••••" value={pw} onChange={(e) => setPw(e.target.value)} style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, color: 'var(--text-2)', cursor: 'pointer', padding: 6, display: 'grid', placeItems: 'center' }}>
                {showPw ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '12px 16px', marginTop: 6 }} disabled={loading}>
            {loading ? (
              <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg> {isSignup ? 'Creating account...' : 'Signing in...'}</>
            ) : (
              <>{isSignup ? 'Create Account' : 'Sign In'} <Icons.ArrowRight size={14} /></>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-2)' }}>
          {isSignup ? (
            <>Already have an account? <a onClick={(e) => { e.preventDefault(); navigate('login'); }} href="#" style={{ color: '#C4B5FD' }}>Sign in</a></>
          ) : (
            <>Don't have an account? <a onClick={(e) => { e.preventDefault(); navigate('signup'); }} href="#" style={{ color: '#C4B5FD' }}>Sign up</a></>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12 }}>
          <a onClick={(e) => { e.preventDefault(); navigate('landing'); }} href="#" style={{ color: 'var(--text-3)' }}>← Back to home</a>
        </div>
      </div>
    </div>
  );
}

window.AuthPage = AuthPage;
