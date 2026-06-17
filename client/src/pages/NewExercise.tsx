import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackLink } from '../components/BackLink';
import { EntryFields, type EntryFormValues } from '../components/EntryFields';
import { Button, ErrorBanner, Input } from '../components/ui';
import { api, errorMessage, firstFieldErrors } from '../lib/api';
import { parseRm, todayISO } from '../lib/format';

export function NewExercise() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [entry, setEntry] = useState<EntryFormValues>({ rm: '', date: todayISO(), comment: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const rmKg = parseRm(entry.rm);
    if (rmKg === null) {
      setFieldErrors({ rmKg: 'Ingresá un número mayor a 0' });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const r = await api.exercises.create({
        name: name.trim(),
        rmKg,
        date: entry.date,
        comment: entry.comment.trim() || undefined,
      });
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
          placeholder="Ej: Clean, Back squat, Deadlift…"
          required
          maxLength={60}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
        <EntryFields values={entry} onChange={setEntry} errors={fieldErrors} />
        <Button type="submit" full size="lg" loading={loading}>
          Guardar ejercicio
        </Button>
      </form>
    </div>
  );
}
