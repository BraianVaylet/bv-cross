import {
  Alert as MedanoAlert,
  Button as MedanoButton,
  Card as MedanoCard,
  EmptyState as MedanoEmptyState,
  SegmentedControl as MedanoSegmentedControl,
  Skeleton as MedanoSkeleton,
  Spinner as MedanoSpinner,
} from '@medano-ui/react';
import { useEffect, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../lib/cx';
import { CloseIcon } from './Icons';

/* ====== Botones ====== */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'lg' | 'sm';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  loading?: boolean;
};

/** Adapter sobre medano-ui: firma legacy (full → fullWidth, type=button). */
export function Button({ variant, size, full, className, children, ...rest }: ButtonProps) {
  return (
    <MedanoButton
      type={rest.type ?? 'button'}
      variant={variant}
      size={size}
      fullWidth={full}
      className={className}
      {...rest}
    >
      {children}
    </MedanoButton>
  );
}

/**
 * Link de react-router con aspecto de botón medano (reemplaza a buttonCx).
 * Usa las clases públicas de medano — Button no acepta render prop todavía
 * (anotado en GAPS.md de la librería).
 */
export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  full,
  className,
  children,
}: {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cx('medano-button', full && 'w-full', className)}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </Link>
  );
}

/* ====== Campos de formulario ====== */

/* Estructura label + control + error/hint con las clases públicas de
 * medano-ui. Se mantiene el shell propio porque el Input de medano exige
 * label (acá es opcional) y no soporta suffix (gap anotado). El estado
 * inválido lo estila medano vía [aria-invalid]. */
function FieldShell({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label?: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="medano-field__label block">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="medano-field__error">{error}</p>
      ) : hint ? (
        <p className="medano-field__help">{hint}</p>
      ) : null}
    </div>
  );
}

const inputCx = (_hasError?: boolean) => 'medano-field__input w-full';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: ReactNode;
  suffix?: string;
};

export function Input({ label, error, hint, suffix, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cx(inputCx(!!error), suffix && 'pr-10', className)}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ink-dim">
            {suffix}
          </span>
        )}
      </div>
    </FieldShell>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: ReactNode;
};

export function Textarea({ label, error, hint, className, id, ...rest }: TextareaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint}>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cx('medano-field__input medano-field__textarea w-full', className)}
        {...rest}
      />
    </FieldShell>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: ReactNode;
};

export function Select({ label, error, hint, className, id, children, ...rest }: SelectProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint}>
      <select
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cx(inputCx(!!error), 'appearance-none pr-9', className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

/* ====== Superficies y estados ====== */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <MedanoCard className={className}>{children}</MedanoCard>;
}

/** Adapter sobre medano-ui: la firma legacy usa children como título. */
export function ErrorBanner({ children }: { children: ReactNode }) {
  return <MedanoAlert tone="danger" title={children} />;
}

/** Adapter sobre medano-ui; el tamaño se sigue dando por className (h-*, w-*). */
export function Spinner({ className }: { className?: string }) {
  return <MedanoSpinner className={className} />;
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-accent">
      <MedanoSpinner size="lg" label="Cargando" />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <MedanoSkeleton className={className} />;
}

/** Adapter sobre medano-ui: la firma legacy llama `text` a description. */
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return <MedanoEmptyState icon={icon} title={title} description={text} action={action} />;
}

/* ====== Logo ======
   Marca inline (no <img>): mismo tile que public/icon.svg (barbell sobre
   fondo oscuro redondeado). Los discos usan el acento seleccionable
   (`--color-accent`) y el centro el verde ok, igual que el patrón de
   Logo.tsx en el resto de la familia BV.
   - size="lg" → login
   - size="md" → header */

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <svg
      role="img"
      aria-label="BV Cross"
      viewBox="0 0 512 512"
      className={size === 'lg' ? 'h-14 w-14' : 'h-9 w-9'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="512" height="512" rx="112" fill="#191B16" />
      <path
        d="M168 256 L344 256"
        fill="none"
        stroke="#F7F8F3"
        strokeWidth={30}
        strokeLinecap="round"
      />
      <path
        d="M168 156 L168 356 M344 156 L344 356 M110 206 L110 306 M402 206 L402 306"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={38}
        strokeLinecap="round"
      />
      <circle cx={256} cy={256} r={22} fill="var(--c-ok)" />
    </svg>
  );
}

/* ====== Segmented control ====== */

/** Adapter sobre medano-ui (radios nativos, label obligatorio para SR). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <MedanoSegmentedControl
      label={label ?? 'Opciones'}
      options={options}
      value={value}
      onValueChange={(v) => onChange(v as T)}
      fullWidth
    />
  );
}

/* ====== Modal genérico ====== */

export function Modal({
  open,
  title,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={cx(
          'w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-xl',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-raised hover:text-ink"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ====== Diálogo de confirmación ====== */

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-1.5 text-sm text-ink-muted">{message}</p>
        <div className="mt-5 flex gap-2.5">
          <Button variant="secondary" full onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" full onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
