import { Link } from 'react-router-dom';
import { buttonCx } from '../components/ui';

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-display text-6xl font-semibold text-accent">404</p>
      <h1 className="font-display text-xl font-semibold text-ink">Esta página no existe</h1>
      <p className="text-sm text-ink-muted">Capaz el link está mal escrito o la página se movió.</p>
      <Link to="/" className={buttonCx({ variant: 'secondary' }) + ' mt-3'}>
        Ir al inicio
      </Link>
    </div>
  );
}
