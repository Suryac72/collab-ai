import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const { setAuthData } = useAuth();
  const navigate        = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const userRaw = params.get('user');

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        setAuthData(token, user);
        // Clean the URL, then go to editor
        window.history.replaceState({}, '', '/');
        navigate('/editor', { replace: true });
      } catch {
        navigate('/login?error=parse', { replace: true });
      }
    } else {
      navigate('/login?error=missing_token', { replace: true });
    }
  }, []);

  return (
    <div className="callback-screen">
      <div className="callback-spinner" />
      <p>Signing you in…</p>
    </div>
  );
}