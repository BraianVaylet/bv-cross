import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import type { User } from '../lib/types';
import { FullScreenSpinner } from '../components/ui';

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  login: (alias: string, password: string) => Promise<void>;
  register: (payload: {
    alias: string;
    password: string;
    securityQuestionId: number;
    securityAnswer: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.auth
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));

    const onUnauthorized = () => setUser(null);
    window.addEventListener('bv:unauthorized', onUnauthorized);
    return () => window.removeEventListener('bv:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (alias: string, password: string) => {
    const r = await api.auth.login(alias, password);
    setUser(r.user);
  }, []);

  const register = useCallback(async (payload: Parameters<AuthContextValue['register']>[0]) => {
    const r = await api.auth.register(payload);
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => undefined);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready, login, register, logout],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/** Rutas que requieren sesión: redirige a /login recordando el destino. */
export function ProtectedRoute() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Rutas de auth: si ya hay sesión, va directo a Home. */
export function PublicOnlyRoute() {
  const { user, ready } = useAuth();
  if (!ready) return <FullScreenSpinner />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
