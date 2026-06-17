import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../lib/useTheme';
import { LogoutIcon, MoonIcon, SunIcon } from './Icons';
import { Logo } from './ui';

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro';
  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-raised hover:text-ink"
    >
      {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}

function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <Link to="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <LogoutIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-5">
        <Outlet />
      </main>
    </div>
  );
}
