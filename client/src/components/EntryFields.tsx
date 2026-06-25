import { fmtKg, parseReps, parseRm } from '../lib/format';
import type { EntryInput, RmEntry } from '../lib/types';
import { Input, Textarea } from './ui';

export type EntryFormValues = { rm: string; reps: string; date: string; comment: string };
export type EntryFieldErrors = Partial<Record<'rmKg' | 'reps' | 'date' | 'comment', string>>;

export const emptyEntryForm = (date: string): EntryFormValues => ({
  rm: '',
  reps: '',
  date,
  comment: '',
});

export type BuiltEntry = { payload: EntryInput } | { error: Record<string, string> };

/** Arma el payload del registro según el modo y valida los campos. */
export function buildEntryPayload(gimnastico: boolean, values: EntryFormValues): BuiltEntry {
  const base = { date: values.date, comment: values.comment.trim() || undefined };
  if (gimnastico) {
    const raw = values.reps.trim();
    if (raw === '') return { payload: { ...base } };
    const reps = parseReps(raw);
    if (reps === null) return { error: { reps: 'Ingresá un número entero mayor a 0' } };
    return { payload: { ...base, reps } };
  }
  const rmKg = parseRm(values.rm);
  if (rmKg === null) return { error: { rmKg: 'Ingresá un número mayor a 0' } };
  return { payload: { ...base, rmKg } };
}

/** Texto de la marca de un registro: «120 kg» o «12 reps» (o «Sin marca»). */
export function entryValueLabel(entry: RmEntry, gimnastico: boolean): string {
  if (gimnastico) return entry.reps != null ? `${entry.reps} reps` : 'Sin marca';
  return entry.rmKg != null ? `${fmtKg(entry.rmKg)} kg` : 'Sin marca';
}

/** Campos compartidos para crear o editar un registro (RM en kg o reps gimnásticas). */
export function EntryFields({
  values,
  onChange,
  errors,
  gimnastico = false,
}: {
  values: EntryFormValues;
  onChange: (values: EntryFormValues) => void;
  errors?: EntryFieldErrors;
  gimnastico?: boolean;
}) {
  return (
    <div className="space-y-4">
      {gimnastico ? (
        <Input
          label="Máximo de repeticiones (opcional)"
          type="number"
          inputMode="numeric"
          step="1"
          min="1"
          placeholder="Ej: 12"
          value={values.reps}
          onChange={(e) => onChange({ ...values, reps: e.target.value })}
          error={errors?.reps}
        />
      ) : (
        <Input
          label="RM (kg)"
          type="number"
          inputMode="decimal"
          step="0.5"
          min="1"
          placeholder="Ej: 100"
          required
          value={values.rm}
          onChange={(e) => onChange({ ...values, rm: e.target.value })}
          error={errors?.rmKg}
        />
      )}
      <Input
        label="Fecha"
        type="date"
        required
        value={values.date}
        onChange={(e) => onChange({ ...values, date: e.target.value })}
        error={errors?.date}
      />
      <Textarea
        label="Comentario (opcional)"
        rows={2}
        maxLength={300}
        placeholder="Ej: con cinturón, sin dolor de hombro…"
        value={values.comment}
        onChange={(e) => onChange({ ...values, comment: e.target.value })}
        error={errors?.comment}
      />
    </div>
  );
}
