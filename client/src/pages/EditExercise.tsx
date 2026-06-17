import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../components/BackLink';
import { EntryFields, type EntryFormValues } from '../components/EntryFields';
import { CheckIcon, PencilIcon, PlusIcon, TrashIcon } from '../components/Icons';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  Input,
  Skeleton,
  buttonCx,
} from '../components/ui';
import { ApiError, api, errorMessage, firstFieldErrors } from '../lib/api';
import { cx } from '../lib/cx';
import { fmtDate, fmtKg, parseRm, todayISO } from '../lib/format';
import type { ExerciseDetail as ExerciseDetailType, RmEntry } from '../lib/types';

const iconBtn =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-40';

const emptyForm = (): EntryFormValues => ({ rm: '', date: todayISO(), comment: '' });

export function EditExercise() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();

  const [data, setData] = useState<ExerciseDetailType | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const initialized = useRef(false);
  const flashTimer = useRef<number | undefined>(undefined);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<EntryFormValues>(emptyForm());
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addValues, setAddValues] = useState<EntryFormValues>(emptyForm());
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [savingAdd, setSavingAdd] = useState(false);

  const [entryToDelete, setEntryToDelete] = useState<RmEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState(false);
  const [confirmDeleteEx, setConfirmDeleteEx] = useState(false);
  const [deletingEx, setDeletingEx] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.exercises.get(id);
      setData(r.exercise);
      if (!initialized.current) {
        setName(r.exercise.name);
        initialized.current = true;
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    if (Number.isInteger(id) && id > 0) void load();
    else setNotFound(true);
    return () => window.clearTimeout(flashTimer.current);
  }, [id, load]);

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setNameError(undefined);
    setSavingName(true);
    try {
      await api.exercises.rename(id, name.trim());
      setNameSaved(true);
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setNameSaved(false), 2000);
      void load();
    } catch (err) {
      const fields = firstFieldErrors(err);
      setNameError(fields.name ?? errorMessage(err));
    } finally {
      setSavingName(false);
    }
  };

  const startEdit = (entry: RmEntry) => {
    setEditingId(entry.id);
    setEditValues({ rm: String(entry.rmKg), date: entry.date, comment: entry.comment ?? '' });
    setEditErrors({});
    setError(null);
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    const rmKg = parseRm(editValues.rm);
    if (rmKg === null) {
      setEditErrors({ rmKg: 'Ingresá un número mayor a 0' });
      return;
    }
    setEditErrors({});
    setSavingEdit(true);
    try {
      await api.exercises.updateEntry(id, editingId, {
        rmKg,
        date: editValues.date,
        comment: editValues.comment.trim() || undefined,
      });
      await load();
      setEditingId(null);
    } catch (err) {
      const fields = firstFieldErrors(err);
      setEditErrors(Object.keys(fields).length > 0 ? fields : { rmKg: errorMessage(err) });
    } finally {
      setSavingEdit(false);
    }
  };

  const saveAdd = async (e: FormEvent) => {
    e.preventDefault();
    const rmKg = parseRm(addValues.rm);
    if (rmKg === null) {
      setAddErrors({ rmKg: 'Ingresá un número mayor a 0' });
      return;
    }
    setAddErrors({});
    setSavingAdd(true);
    try {
      await api.exercises.addEntry(id, {
        rmKg,
        date: addValues.date,
        comment: addValues.comment.trim() || undefined,
      });
      await load();
      setAddOpen(false);
      setAddValues(emptyForm());
    } catch (err) {
      const fields = firstFieldErrors(err);
      setAddErrors(Object.keys(fields).length > 0 ? fields : { rmKg: errorMessage(err) });
    } finally {
      setSavingAdd(false);
    }
  };

  const deleteEntry = async () => {
    if (!entryToDelete) return;
    setDeletingEntry(true);
    try {
      await api.exercises.removeEntry(id, entryToDelete.id);
      await load();
      setEntryToDelete(null);
    } catch (err) {
      setEntryToDelete(null);
      setError(errorMessage(err));
    } finally {
      setDeletingEntry(false);
    }
  };

  const deleteExercise = async () => {
    setDeletingEx(true);
    try {
      await api.exercises.remove(id);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setConfirmDeleteEx(false);
      setDeletingEx(false);
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

  if (!data) {
    return (
      <div className="space-y-5">
        <BackLink to={`/exercises/${id}`}>Volver</BackLink>
        {error ? (
          <ErrorBanner>{error}</ErrorBanner>
        ) : (
          <>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </>
        )}
      </div>
    );
  }

  const single = data.entries.length === 1;

  return (
    <div className="space-y-5">
      <BackLink to={`/exercises/${id}`}>Volver al ejercicio</BackLink>
      <h1 className="font-display text-2xl font-semibold text-ink">Editar ejercicio</h1>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Card>
        <form onSubmit={saveName} className="space-y-3">
          <Input
            label="Nombre"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
          />
          <Button type="submit" variant="secondary" loading={savingName}>
            {nameSaved ? (
              <>
                <CheckIcon className="h-4 w-4 text-ok" /> Guardado
              </>
            ) : (
              'Guardar nombre'
            )}
          </Button>
        </form>
      </Card>

      <section className="space-y-2.5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Historial de RMs</h2>
          {single && <span className="text-xs text-ink-dim">El único RM no se puede borrar</span>}
        </div>

        {data.entries.map((entry) =>
          editingId === entry.id ? (
            <Card key={entry.id} className="space-y-4">
              <form onSubmit={saveEdit} className="space-y-4">
                <EntryFields values={editValues} onChange={setEditValues} errors={editErrors} />
                <div className="flex gap-2.5">
                  <Button
                    variant="secondary"
                    full
                    onClick={() => setEditingId(null)}
                    disabled={savingEdit}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" full loading={savingEdit}>
                    Guardar
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <div
              key={entry.id}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  {fmtKg(entry.rmKg)} kg
                  <span className="ml-2 text-xs font-normal text-ink-dim">{fmtDate(entry.date)}</span>
                </p>
                {entry.comment && (
                  <p className="mt-0.5 truncate text-xs text-ink-muted">{entry.comment}</p>
                )}
              </div>
              <button
                type="button"
                aria-label={`Editar RM del ${fmtDate(entry.date)}`}
                className={iconBtn}
                onClick={() => startEdit(entry)}
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Borrar RM del ${fmtDate(entry.date)}`}
                className={cx(iconBtn, 'hover:text-danger')}
                disabled={single}
                onClick={() => setEntryToDelete(entry)}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ),
        )}

        {addOpen ? (
          <Card className="space-y-4">
            <h3 className="font-display text-base font-semibold text-ink">Agregar RM</h3>
            <form onSubmit={saveAdd} className="space-y-4">
              <EntryFields values={addValues} onChange={setAddValues} errors={addErrors} />
              <div className="flex gap-2.5">
                <Button variant="secondary" full onClick={() => setAddOpen(false)} disabled={savingAdd}>
                  Cancelar
                </Button>
                <Button type="submit" full loading={savingAdd}>
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
              setAddValues(emptyForm());
              setAddErrors({});
              setAddOpen(true);
            }}
          >
            <PlusIcon className="h-4 w-4" /> Agregar RM
          </Button>
        )}
      </section>

      <Card className="space-y-3 border-danger/30">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Eliminar ejercicio</h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            Se borra «{data.name}» con todo su historial. No se puede deshacer.
          </p>
        </div>
        <Button variant="danger" full onClick={() => setConfirmDeleteEx(true)}>
          Eliminar ejercicio
        </Button>
      </Card>

      <ConfirmDialog
        open={entryToDelete !== null}
        title="¿Borrar este RM?"
        message={
          entryToDelete
            ? `Se borra el registro de ${fmtKg(entryToDelete.rmKg)} kg del ${fmtDate(entryToDelete.date)}.`
            : ''
        }
        confirmLabel="Borrar"
        loading={deletingEntry}
        onConfirm={deleteEntry}
        onCancel={() => setEntryToDelete(null)}
      />

      <ConfirmDialog
        open={confirmDeleteEx}
        title={`¿Eliminar «${data.name}»?`}
        message="Se borra el ejercicio con todo su historial de RMs. No se puede deshacer."
        confirmLabel="Eliminar"
        loading={deletingEx}
        onConfirm={deleteExercise}
        onCancel={() => setConfirmDeleteEx(false)}
      />
    </div>
  );
}
