import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import CollaborativeEditor from './components/CollaborativeEditor';
import './index.css';

// Protected route — redirects to /login if not authenticated
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0d0f14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid rgba(110,231,183,0.2)',
          borderTopColor: '#6ee7b7',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        }} />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/auth/callback"  element={<AuthCallback />} />
      <Route path="/editor"         element={
        <ProtectedRoute>
          <CollaborativeEditor docId="doc-001" />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}