import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export interface AuthUser {
  id:          string;
  email:       string;
  displayName: string;
  avatar:      string;
}

interface AuthContextValue {
  user:        AuthUser | null;
  token:       string | null;
  isLoading:   boolean;
  login:       () => void;
  logout:      () => void;
  setAuthData: (token: string, user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
// Store token in sessionStorage — survives page refresh but not new tabs
const TOKEN_KEY = 'collab_token';
const USER_KEY  = 'collab_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from sessionStorage on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    const storedUser  = sessionStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        setToken(storedToken);
        setUser(parsed);

        // Verify token is still valid with backend
        fetch(`${BACKEND}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
          .then((r) => { if (!r.ok) throw new Error('expired'); return r.json(); })
          .then((u) => {
            setUser(u);
            sessionStorage.setItem(USER_KEY, JSON.stringify(u));
          })
          .catch(() => {
            // Token expired — clear
            setToken(null);
            setUser(null);
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(USER_KEY);
          })
          .finally(() => setIsLoading(false));
      } catch {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const setAuthData = useCallback((t: string, u: AuthUser) => {
    setToken(t);
    setUser(u);
    sessionStorage.setItem(TOKEN_KEY, t);
    sessionStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  const login = useCallback(() => {
    window.location.href = `${BACKEND}/auth/google`;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}