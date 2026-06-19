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

/* ====== Logo ======
   Marca inline (no <img>) para que se adapte a ambos temas:
   el naranja queda como acento fijo y las partes claras usan
   currentColor (= text-ink: oscuro en claro, claro en oscuro).
   - size="lg" → wordmark completo "BV cross" (login)
   - size="md" → versión compacta "BV" + ícono (header) */

const ICON_FULL =
  'M 206.771 -24.619 L 206.771 -30.382 C 206.771 -37.626 200.758 -43.554 193.408 -43.554 C 186.059 -43.554 180.045 -37.626 180.045 -30.382 L 180.045 -24.619 C 176.871 -21.326 175.034 -17.046 175.034 -12.271 C 175.034 -6.508 177.707 -1.24 182.384 2.218 C 182.718 2.382 183.052 2.547 183.386 2.547 L 203.431 2.547 C 203.765 2.547 204.099 2.382 204.433 2.218 C 209.11 -1.24 211.783 -6.508 211.783 -12.271 C 211.783 -17.046 209.945 -21.491 206.771 -24.619 Z M 183.386 -27.418 L 183.386 -30.382 C 183.386 -35.815 187.896 -40.261 193.408 -40.261 C 198.921 -40.261 203.431 -35.815 203.431 -30.382 L 203.431 -27.418 C 200.591 -29.229 197.083 -30.382 193.408 -30.382 C 189.733 -30.382 186.226 -29.229 183.386 -27.418 Z M 203.431 -13.753 C 203.264 -13.753 203.097 -13.753 202.93 -13.753 C 202.261 -13.753 201.593 -14.247 201.259 -14.905 C 200.758 -16.716 199.422 -18.198 197.918 -19.186 C 197.083 -19.68 196.916 -20.668 197.417 -21.491 C 197.918 -22.314 198.921 -22.479 199.756 -21.985 C 201.927 -20.503 203.598 -18.363 204.433 -15.893 C 204.767 -14.905 204.266 -14.082 203.431 -13.753 Z';

const ICON_MINI =
  'M 404.324 78.956 L 404.324 73.193 C 404.324 65.949 398.311 60.021 390.961 60.021 C 383.612 60.021 377.598 65.949 377.598 73.193 L 377.598 78.956 C 374.424 82.249 372.587 86.529 372.587 91.304 C 372.587 97.067 375.26 102.335 379.937 105.793 C 380.271 105.957 380.605 106.122 380.939 106.122 L 400.984 106.122 C 401.318 106.122 401.652 105.957 401.986 105.793 C 406.663 102.335 409.336 97.067 409.336 91.304 C 409.336 86.529 407.498 82.084 404.324 78.956 Z M 380.939 76.157 L 380.939 73.193 C 380.939 67.76 385.449 63.314 390.961 63.314 C 396.474 63.314 400.984 67.76 400.984 73.193 L 400.984 76.157 C 398.144 74.346 394.636 73.193 390.961 73.193 C 387.286 73.193 383.779 74.346 380.939 76.157 Z M 400.984 89.822 C 400.817 89.822 400.65 89.822 400.483 89.822 C 399.814 89.822 399.146 89.328 398.812 88.67 C 398.311 86.859 396.975 85.377 395.471 84.389 C 394.636 83.895 394.469 82.907 394.97 82.084 C 395.471 81.261 396.474 81.096 397.309 81.59 C 399.48 83.072 401.151 85.212 401.986 87.682 C 402.32 88.67 401.819 89.493 400.984 89.822 Z';

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  if (size === 'lg') {
    return (
      <svg
        role="img"
        aria-label="BV Cross"
        viewBox="0 0 233.631 116.089"
        className="h-14 w-auto text-ink"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="matrix(1, 0, 0, 1, -36.871506, 86.201118)">
          <text
            x="44.581"
            y="2.011"
            fontFamily="Chewy, system-ui, sans-serif"
            fontSize="90"
            letterSpacing="-4"
            style={{ whiteSpace: 'pre', fill: 'var(--color-accent)' }}
          >
            BV
          </text>
          <text
            x="125"
            y="0"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="60"
            fontWeight={700}
            letterSpacing="-3"
            style={{ whiteSpace: 'pre', fill: 'currentColor' }}
          >
            cr   ss
          </text>
          <path d={ICON_FULL} style={{ fillRule: 'nonzero', fill: 'var(--color-accent)' }} />
        </g>
      </svg>
    );
  }

  return (
    <svg
      role="img"
      aria-label="BV Cross"
      viewBox="0 0 128.38 113.743"
      className="h-9 w-auto text-ink"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="matrix(1, 0, 0, 1, -290.279327, -18.100559)">
        <text
          x="296.772"
          y="104.916"
          fontFamily="Chewy, system-ui, sans-serif"
          fontSize="90"
          letterSpacing="-4"
          style={{ whiteSpace: 'pre', fill: 'var(--color-accent)' }}
        >
          BV
        </text>
        <path d={ICON_MINI} style={{ fillRule: 'nonzero', fill: 'currentColor' }} />
      </g>
    </svg>
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
