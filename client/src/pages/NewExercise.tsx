import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackLink } from '../components/BackLink';
import { EntryFields, type EntryFormValues } from '../components/EntryFields';
import { ZapIcon } from '../components/Icons';
import { Button, ErrorBanner, Input, Textarea } from '../components/ui';
import { api, errorMessage, firstFieldErrors } from '../lib/api';
import { parseReps, parseRm, todayISO } from '../lib/format';
import type { CreateInput } from '../lib/types';

export function NewExercise() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [gimnastico, setGimnastico] = useState(false);
  const [entry, setEntry] = useState<EntryFormValues>({
    rm: '',
    reps: '',
    date: todayISO(),
    comment: '',
  });
  const [observacion, setObservacion] = useState('');
  const [dolor, setDolor] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: CreateInput = {
      name: name.trim(),
      gimnastico,
      observacion: observacion.trim() || undefined,
      dolor,
      date: entry.date,
      comment: entry.comment.trim() || undefined,
    };

    if (gimnastico) {
      const repsRaw = entry.reps.trim();
      if (repsRaw !== '') {
        const reps = parseReps(repsRaw);
        if (reps === null) {
          setFieldErrors({ reps: 'Ingresá un número entero mayor a 0' });
          return;
        }
        payload.reps = reps;
      }
    } else {
      const rmKg = parseRm(entry.rm);
      if (rmKg === null) {
        setFieldErrors({ rmKg: 'Ingresá un número mayor a 0' });
        return;
      }
      payload.rmKg = rmKg;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const r = await api.exercises.create(payload);
      navigate(`/exercises/${r.exercise.id}`, { replace: true });
    } catch (err) {
      const fields = firstFieldErrors(err);
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <BackLink to="/">Ejercicios</BackLink>
      <h1 className="font-display text-2xl font-semibold text-ink">Nuevo ejercicio</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Input
          label="Nombre"
          placeholder="Ej: Clean, Back squat, Muscle-up…"
          required
          maxLength={60}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
            checked={gimnastico}
            onChange={(e) => setGimnastico(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-ink">Ejercicio gimnástico</span>
            <span className="block text-xs text-ink-dim">
              Sin cálculo de cargas. Registra el máximo de repeticiones (opcional).
            </span>
          </span>
        </label>

        <EntryFields values={entry} onChange={setEntry} errors={fieldErrors} gimnastico={gimnastico} />

        <Textarea
          label="Observación (opcional)"
          placeholder="Ej: cuidar el hombro, mantener escápulas activas…"
          maxLength={500}
          rows={3}
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
        />

        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={dolor}
              onChange={(e) => setDolor(e.target.checked)}
            />
            <div className="h-5 w-5 rounded border border-line bg-surface transition-colors peer-checked:border-danger peer-checked:bg-danger peer-focus-visible:ring-2 peer-focus-visible:ring-danger/30" />
            {dolor && (
              <ZapIcon className="absolute inset-0 m-auto h-3 w-3 text-white pointer-events-none" />
            )}
          </div>
          <span className="text-sm font-medium text-ink">Genera dolor</span>
          <span className="text-xs text-ink-dim">(lesión o molestia)</span>
        </label>

        <Button type="submit" full size="lg" loading={loading}>
          Guardar ejercicio
        </Button>
      </form>
    </div>
  );
}
