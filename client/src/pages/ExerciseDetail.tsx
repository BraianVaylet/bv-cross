import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../components/BackLink';
import { EntryFields, type EntryFormValues } from '../components/EntryFields';
import { PencilIcon, PlusIcon, TrashIcon } from '../components/Icons';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  Input,
  Segmented,
  Skeleton,
  buttonCx,
} from '../components/ui';
import { ApiError, api, errorMessage, firstFieldErrors } from '../lib/api';
import { fmtDate, fmtKg, parseRm, percentWeight, roundTo, todayISO } from '../lib/format';
import { cx } from '../lib/cx';
import type { ExerciseDetail as ExerciseDetailType } from '../lib/types';
import { useLocalStorage } from '../lib/useLocalStorage';

const PRESET_PCTS = [65, 75, 80, 85, 90, 95];

type RoundValue = 'exact' | '1.25' | '2.5' | '5';
const ROUND_OPTIONS: Array<{ value: RoundValue; label: string }> = [
  { value: 'exact', label: 'Exacto' },
  { value: '1.25', label: '1,25' },
  { value: '2.5', label: '2,5' },
  { value: '5', label: '5' },
];

const iconBtn =
  'flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-raised hover:text-ink';

export function ExerciseDetail() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();

  const [data, setData] = useState<ExerciseDetailType | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [baseId, setBaseId] = useState<number | null>(null);
  const [pct, setPct] = useState(80);
  const [custom, setCustom] = useState('');
  const [round, setRound] = useLocalStorage<RoundValue>('bv-round', '2.5');

  const [showNewRm, setShowNewRm] = useState(false);
  const [newEntry, setNewEntry] = useState<EntryFormValues>({ rm: '', date: todayISO(), comment: '' });
  const [entryErrors, setEntryErrors] = useState<Record<string, string>>({});
  const [savingEntry, setSavingEntry] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.exercises.get(id);
      setData(r.exercise);
      setBaseId((prev) =>
        prev !== null && r.exercise.entries.some((e) => e.id === prev)
          ? prev
          : r.exercise.entries[0]?.id ?? null,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    if (Number.isInteger(id) && id > 0) void load();
    else setNotFound(true);
  }, [id, load]);

  const entries = data?.entries ?? [];
  const base = useMemo(
    () => entries.find((e) => e.id === baseId) ?? entries[0] ?? null,
    [entries, baseId],
  );
  const isCurrent = base !== null && entries[0]?.id === base.id;

  const customNum = custom === '' ? null : Number(custom.replace(',', '.'));
  const customValid =
    customNum === null || (Number.isFinite(customNum) && customNum > 0 && customNum <= 200);
  const activePct = customNum !== null && customValid ? customNum : pct;
  const step = round === 'exact' ? null : Number(round);
  const exact = base ? percentWeight(base.rmKg, activePct) : 0;
  const result = roundTo(exact, step);
  const showExact = step !== null && Math.abs(result - exact) > 0.004;

  const submitNewEntry = async (e: FormEvent) => {
    e.preventDefault();
    const rmKg = parseRm(newEntry.rm);
    if (rmKg === null) {
      setEntryErrors({ rmKg: 'Ingresá un número mayor a 0' });
      return;
    }
    setEntryErrors({});
    setSavingEntry(true);
    try {
      const r = await api.exercises.addEntry(id, {
        rmKg,
        date: newEntry.date,
        comment: newEntry.comment.trim() || undefined,
      });
      await load();
      setBaseId(r.entry.id);
      setShowNewRm(false);
      setNewEntry({ rm: '', date: todayISO(), comment: '' });
    } catch (err) {
      const fields = firstFieldErrors(err);
      setEntryErrors(Object.keys(fields).length > 0 ? fields : { rmKg: errorMessage(err) });
    } finally {
      setSavingEntry(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.exercises.remove(id);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setConfirmDelete(false);
      setDeleting(false);
    }
  };

  if (notFound) {
    return (
      <div className="space-y-5">
        <BackLink to="/">Ejercicios</BackLink>
        <EmptyState
          title="No encontramos ese ejercicio"
          text="Puede que lo hayas eliminado."
          action={
            <Link to="/" className={buttonCx({ variant: 'secondary' })}>
              Ir a mis ejercicios
            </Link>
          }
        />
      </div>
    );
  }

  if (!data || !base) {
    return (
      <div className="space-y-5">
        <BackLink to="/">Ejercicios</BackLink>
        {error ? (
          <ErrorBanner>{error}</ErrorBanner>
        ) : (
          <>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24" />
            <Skeleton className="mx-auto h-60 w-60 rounded-full" />
            <Skeleton className="h-24" />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <BackLink to="/">Ejercicios</BackLink>
        <div className="flex items-center gap-1">
          <Link to={`/exercises/${id}/edit`} aria-label="Editar ejercicio" className={iconBtn}>
            <PencilIcon className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Eliminar ejercicio"
            className={cx(iconBtn, 'hover:text-danger')}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <h1 className="font-display text-[26px] font-semibold leading-tight text-ink">{data.name}</h1>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Card>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-muted">RM base</span>
          <span
            className={cx(
              'rounded-full px-2 py-0.5 text-[11px] font-medium',
              isCurrent ? 'bg-accent-soft text-accent' : 'bg-raised text-ink-muted',
            )}
          >
            {isCurrent ? 'Vigente' : 'Histórico'}
          </span>
        </div>
        <p className="mt-1">
          <span className="font-display text-3xl font-semibold text-ink">{fmtKg(base.rmKg)}</span>
          <span className="ml-1.5 text-ink-muted">kg</span>
          <span className="ml-3 text-sm text-ink-dim">{fmtDate(base.date)}</span>
        </p>
        {base.comment && <p className="mt-1.5 text-sm italic text-ink-muted">{base.comment}</p>}
      </Card>

      {/* Resultado: el disco */}
      <section aria-label="Carga calculada" className="py-1">
        <div className="relative mx-auto flex h-60 w-60 items-center justify-center rounded-full border-[10px] border-accent bg-surface shadow-sm">
          <div aria-hidden className="pointer-events-none absolute inset-2.5 rounded-full border border-line" />
          <div aria-hidden className="pointer-events-none absolute inset-5 rounded-full border border-line/70" />
          <div className="px-7 text-center">
            <p className="text-[13px] font-medium text-ink-muted">
              {fmtKg(activePct)}% de {fmtKg(base.rmKg)} kg
            </p>
            <p className="font-display text-5xl font-semibold tracking-tight text-ink">
              {customValid ? fmtKg(result) : '—'}
            </p>
            <p className="text-sm text-ink-muted">kg</p>
            {customValid && showExact && (
              <p className="mt-1 text-xs text-ink-dim">exacto: {fmtKg(exact)} kg</p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        {PRESET_PCTS.map((p) => {
          const active = custom === '' && pct === p;
          const weight = roundTo(percentWeight(base.rmKg, p), step);
          return (
            <button
              key={p}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setPct(p);
                setCustom('');
              }}
              className={cx(
                'rounded-xl border px-2 py-2.5 text-center transition-colors',
                active
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-line bg-surface text-ink hover:border-accent/40',
              )}
            >
              <span className="block text-base font-semibold">{p}%</span>
              <span className={cx('block text-xs', active ? 'text-on-accent/75' : 'text-ink-muted')}>
                {fmtKg(weight)} kg
              </span>
            </button>
          );
        })}
      </div>

      <Card className="space-y-4">
        <Input
          label="Porcentaje personalizado"
          type="number"
          inputMode="decimal"
          min="1"
          max="200"
          step="0.5"
          suffix="%"
          placeholder="Ej: 72,5"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          error={customValid ? undefined : 'Ingresá un porcentaje entre 1 y 200'}
        />
        <Segmented
          label="Redondeo (kg)"
          options={ROUND_OPTIONS}
          value={round}
          onChange={setRound}
        />
      </Card>

      <section className="space-y-2.5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Historial</h2>
          <span className="text-xs text-ink-dim">Tocá uno para usarlo de base</span>
        </div>
        {entries.map((e, index) => {
          const selected = base.id === e.id;
          return (
            <button
              key={e.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setBaseId(e.id)}
              className={cx(
                'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors',
                selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent/40',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  {fmtDate(e.date)}
                  {index === 0 && (
                    <span className="ml-2 rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                      Vigente
                    </span>
                  )}
                </p>
                {e.comment && <p className="mt-0.5 truncate text-xs text-ink-muted">{e.comment}</p>}
              </div>
              <p className="shrink-0 font-display text-lg font-semibold text-ink">
                {fmtKg(e.rmKg)} <span className="text-xs font-normal text-ink-muted">kg</span>
              </p>
            </button>
          );
        })}
      </section>

      {showNewRm ? (
        <Card className="space-y-4">
          <h3 className="font-display text-base font-semibold text-ink">Registrar nuevo RM</h3>
          <form onSubmit={submitNewEntry} className="space-y-4">
            <EntryFields values={newEntry} onChange={setNewEntry} errors={entryErrors} />
            <div className="flex gap-2.5">
              <Button variant="secondary" full onClick={() => setShowNewRm(false)} disabled={savingEntry}>
                Cancelar
              </Button>
              <Button type="submit" full loading={savingEntry}>
                Guardar
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button
          variant="secondary"
          full
          onClick={() => {
            setNewEntry({ rm: '', date: todayISO(), comment: '' });
            setEntryErrors({});
            setShowNewRm(true);
          }}
        >
          <PlusIcon className="h-4 w-4" /> Registrar nuevo RM
        </Button>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`¿Eliminar «${data.name}»?`}
        message="Se borra el ejercicio con todo su historial de RMs. No se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
