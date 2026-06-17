import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BarbellIcon, ChevronRightIcon, PlusIcon } from '../components/Icons';
import { EmptyState, ErrorBanner, Skeleton, buttonCx } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { fmtDate, fmtKg } from '../lib/format';
import type { ExerciseListItem } from '../lib/types';

export function Home() {
  const { user } = useAuth();
  const [items, setItems] = useState<ExerciseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.exercises
      .list()
      .then((r) => setItems(r.exercises))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-ink-muted">Hola, {user?.alias}</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Tus ejercicios</h1>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {!error && items === null && (
        <div className="space-y-2.5">
          <Skeleton className="h-[76px]" />
          <Skeleton className="h-[76px]" />
          <Skeleton className="h-[76px]" />
        </div>
      )}

      {items !== null && items.length === 0 && (
        <EmptyState
          icon={<BarbellIcon className="h-10 w-10" />}
          title="Todavía no cargaste ejercicios"
          text="Registrá tu primer RM para empezar a calcular cargas."
          action={
            <Link to="/exercises/new" className={buttonCx()}>
              <PlusIcon className="h-4 w-4" /> Nuevo ejercicio
            </Link>
          }
        />
      )}

      {items !== null && items.length > 0 && (
        <ul className="space-y-2.5">
          {items.map((e) => (
            <li key={e.id}>
              <Link
                to={`/exercises/${e.id}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-accent/40 active:bg-raised"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[17px] font-medium text-ink">{e.name}</h2>
                  {e.currentRm && (
                    <p className="mt-0.5 text-xs text-ink-dim">RM del {fmtDate(e.currentRm.date)}</p>
                  )}
                </div>
                {e.currentRm ? (
                  <p className="shrink-0 text-right">
                    <span className="font-display text-2xl font-semibold text-ink">
                      {fmtKg(e.currentRm.rmKg)}
                    </span>
                    <span className="ml-1 text-sm text-ink-muted">kg</span>
                  </p>
                ) : (
                  <span className="shrink-0 text-sm text-ink-dim">Sin RM</span>
                )}
                <ChevronRightIcon className="h-5 w-5 shrink-0 text-ink-dim" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {items !== null && items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base via-base/80 to-transparent" />
          <div className="relative mx-auto w-full max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            <Link
              to="/exercises/new"
              className={buttonCx({ size: 'lg', full: true }) + ' shadow-lg shadow-accent/25'}
            >
              <PlusIcon className="h-5 w-5" /> Nuevo ejercicio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
