import { useEffect, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cx } from '../lib/cx';
import { AlertIcon } from './Icons';

/* ====== Botones ====== */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'lg' | 'sm';

export function buttonCx(opts: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
} = {}): string {
  const { variant = 'primary', size = 'md', full = false } = opts;
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
    'disabled:pointer-events-none disabled:opacity-50',
    size === 'sm' && 'h-9 px-3 text-sm',
    size === 'md' && 'h-11 px-4 text-[15px]',
    size === 'lg' && 'h-12 px-5 text-base',
    full && 'w-full',
    variant === 'primary' && 'bg-accent text-on-accent hover:bg-accent-strong active:bg-accent-strong',
    variant === 'secondary' && 'border border-line bg-surface text-ink hover:bg-raised',
    variant === 'ghost' && 'text-ink-muted hover:bg-raised hover:text-ink',
    variant === 'danger' && 'bg-danger text-white hover:opacity-90',
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  loading?: boolean;
};

export function Button({ variant, size, full, loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type={rest.type ?? 'button'}
      className={cx(buttonCx({ variant, size, full }), className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

/* ====== Campos de formulario ====== */

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
        <label htmlFor={id} className="block text-sm font-medium text-ink-muted">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-dim">{hint}</p>
      ) : null}
    </div>
  );
}

const inputCx = (hasError?: boolean) =>
  cx(
    'h-11 w-full rounded-xl border bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-dim',
    'outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25',
    hasError ? 'border-danger' : 'border-line',
  );

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
        <input id={inputId} className={cx(inputCx(!!error), suffix && 'pr-10', className)} {...rest} />
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
        className={cx(
          'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-dim',
          'outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25',
          error ? 'border-danger' : 'border-line',
          className,
        )}
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
      <select id={inputId} className={cx(inputCx(!!error), 'appearance-none pr-9', className)} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
}

/* ====== Superficies y estados ====== */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-line bg-surface p-4', className)}>{children}</div>;
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cx('animate-spin', className ?? 'h-5 w-5')} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-accent">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-xl bg-raised', className)} />;
}

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
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      {icon && <div className="text-ink-dim">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {text && <p className="max-w-xs text-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ====== Logo ====== */

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className={cx('font-display tracking-tight', size === 'md' ? 'text-xl' : 'text-3xl')}>
      <span className="font-bold text-accent">BV</span>{' '}
      <span className="font-semibold text-ink">Cross</span>
    </span>
  );
}

/* ====== Segmented control ====== */

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
    <div className="space-y-1.5">
      {label && <span className="block text-sm font-medium text-ink-muted">{label}</span>}
      <div className="flex rounded-xl bg-raised p-1" role="group" aria-label={label}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cx(
                'h-9 flex-1 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
              )}
            >
              {opt.label}
            </button>
          );
        })}
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
