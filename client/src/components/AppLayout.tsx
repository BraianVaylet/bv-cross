import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ACCENTS, useTheme } from '../lib/theme';
import { CheckIcon, LogoutIcon, MoonIcon, PaletteIcon, SunIcon } from './Icons';
import { InstallButton } from './InstallButton';
import { Logo } from './ui';

const iconBtn =
  'flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-raised hover:text-ink';

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro';
  return (
    <button type="button" onClick={toggle} title={label} aria-label={label} className={iconBtn}>
      {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}

/** Selector de color de acento de la app (popover con muestras). */
function AccentPicker() {
  const { accent, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Cambiar color de la app"
        aria-haspopup="true"
        aria-expanded={open}
        className={iconBtn}
      >
        <PaletteIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-line bg-surface p-2 shadow-xl">
          <p className="px-2 pb-1 pt-1 text-xs font-medium text-ink-muted">Color de la app</p>
          <div className="flex flex-col gap-0.5">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAccent(a.id);
                  setOpen(false);
                }}
                aria-pressed={accent === a.id}
                className={cxBtn(accent === a.id)}
              >
                <span
                  className="h-6 w-6 shrink-0 rounded-full ring-1 ring-line"
                  style={{ backgroundColor: a.base }}
                />
                <span className="flex-1 text-left">{a.label}</span>
                {accent === a.id && <CheckIcon className="h-4 w-4 text-accent" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function cxBtn(active: boolean): string {
  return `flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm text-ink transition-colors hover:bg-raised ${
    active ? 'bg-raised font-medium' : ''
  }`;
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
        <Link
          to="/"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-0.5">
          <InstallButton />
          <AccentPicker />
          <ThemeToggle />
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className={iconBtn}
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
