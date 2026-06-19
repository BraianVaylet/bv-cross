import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { Button, ErrorBanner, Input } from '../components/ui';
import { errorMessage } from '../lib/api';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(alias, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Iniciá sesión"
      subtitle="Tus RMs y cargas, listos para entrenar."
      footer={
        <>
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Creá una
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Input
          label="Alias"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" full size="lg" loading={loading}>
          Entrar
        </Button>        
        <p className="text-center">
          <Link to="/recover" className="text-sm font-medium text-ink-muted hover:text-ink">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
