import { Input, Textarea } from './ui';

export type EntryFormValues = { rm: string; date: string; comment: string };
export type EntryFieldErrors = Partial<Record<'rmKg' | 'date' | 'comment', string>>;

/** Campos compartidos para crear o editar un registro de RM. */
export function EntryFields({
  values,
  onChange,
  errors,
}: {
  values: EntryFormValues;
  onChange: (values: EntryFormValues) => void;
  errors?: EntryFieldErrors;
}) {
  return (
    <div className="space-y-4">
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
