import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import RepositoryPage from './pages/RepositoryPage';
import GraphPage from './pages/GraphPage';
import FilesPage from './pages/FilesPage';
import ComplexityPage from './pages/ComplexityPage';
import DocsPage from './pages/DocsPage';
import PRAnalysisPage from './pages/PRAnalysisPage';
import TeamPage from './pages/TeamPage';
import UsagePage from './pages/UsagePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import JoinPage from './pages/JoinPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ErrorBoundary from './components/ErrorBoundary';

function EB({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/auth-callback" element={<AuthCallbackPage />} />

            {/* Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><EB><DashboardPage /></EB></ProtectedRoute>} />
            <Route path="/repositories" element={<ProtectedRoute><EB><RepositoryPage /></EB></ProtectedRoute>} />
            <Route path="/graph" element={<ProtectedRoute><EB><GraphPage /></EB></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><EB><FilesPage /></EB></ProtectedRoute>} />
            <Route path="/complexity" element={<ProtectedRoute><EB><ComplexityPage /></EB></ProtectedRoute>} />
            <Route path="/docs" element={<ProtectedRoute><EB><DocsPage /></EB></ProtectedRoute>} />
            <Route path="/pr" element={<ProtectedRoute><EB><PRAnalysisPage /></EB></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><EB><TeamPage /></EB></ProtectedRoute>} />
            <Route path="/usage" element={<ProtectedRoute><EB><UsagePage /></EB></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><EB><SettingsPage /></EB></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#1a1730', color: '#E5E7EB', border: '1px solid rgba(124,58,237,.25)', fontSize: 13 },
              success: { iconTheme: { primary: '#22C55E', secondary: '#1a1730' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#1a1730' } },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
