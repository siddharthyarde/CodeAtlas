import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#070714' }}>
        <div style={{ width: 32, height: 32, borderRadius: 999, border: '3px solid rgba(124,58,237,.3)', borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
