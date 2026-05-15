import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle GitHub OAuth redirect — backend appends ?token=xxx to the dashboard URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      // Strip token from URL immediately so it isn't bookmarked or leaked in referrer
      params.delete('token');
      const newSearch = params.toString();
      const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      window.history.replaceState({}, '', cleanUrl);
      localStorage.setItem('token', urlToken);
    }

    const storedToken = urlToken || localStorage.getItem('token');
    if (!storedToken) { setLoading(false); return; }

    setToken(storedToken);
    // Fetch fresh user data so fields like hasAnthropicKey are always current
    api.get('/auth/me', { headers: { Authorization: `Bearer ${storedToken}` } })
      .then(res => {
        const u = res.data.data?.user;
        if (u) {
          setUser(u);
          localStorage.setItem('user', JSON.stringify(u));
        }
      })
      .catch(() => {
        // Token expired or invalid — clear session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: u, token: t } = res.data.data;
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/signup', { name, email, password });
    const { user: u, token: t } = res.data.data;
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Used by AuthCallbackPage after OAuth — stores token then fetches fresh user
  const loginWithToken = useCallback(async (t) => {
    localStorage.setItem('token', t);
    setToken(t);
    const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${t}` } });
    const u = res.data.data?.user;
    if (!u) throw new Error('No user returned');
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    return u;
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
