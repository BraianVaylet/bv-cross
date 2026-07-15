import { AppHeader } from '@medano-ui/react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { InstallButton } from './InstallButton';
import { Logo } from './ui';

/**
 * Shell de la app. El header (marca + selector de acento + tema + salir) es el
 * componente común de la familia bv-* (AppHeader de medano); lo propio de cross
 * es el logo, el nombre y el botón de instalación PWA.
 */
export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-dvh">
      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-5">
        <div className="mb-5">
          <AppHeader
            logo={
              <Link
                to="/"
                className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <Logo />
              </Link>
            }
            title="BV Cross"
            actions={<InstallButton />}
            onLogout={onLogout}
          />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
