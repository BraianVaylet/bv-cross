import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { CheckIcon } from '../components/Icons';
import { Button, Card, ErrorBanner, Input, buttonCx } from '../components/ui';
import { api, errorMessage, firstFieldErrors } from '../lib/api';
import type { SecurityQuestion } from '../lib/types';

export function Recover() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [alias, setAlias] = useState('');
  const [question, setQuestion] = useState<SecurityQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const findQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await api.auth.recoveryQuestion(alias.trim());
      setQuestion(r.question);
      setStep(2);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setFieldErrors({ confirm: 'Las contraseñas no coinciden' });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await api.auth.recoveryReset({ alias: alias.trim(), answer, newPassword });
      setStep(3);
    } catch (err) {
      const fields = firstFieldErrors(err);
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <AuthShell title="Contraseña actualizada" subtitle="Ya podés entrar con tu nueva contraseña.">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CheckIcon className="h-8 w-8" />
          </div>
          <Link to="/login" className={buttonCx({ size: 'lg', full: true })}>
            Iniciar sesión
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (step === 2 && question) {
    return (
      <AuthShell title="Recuperá tu cuenta" subtitle={`Respondé la pregunta de seguridad de «${alias.trim()}».`}>
        <form onSubmit={resetPassword} className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <Card className="bg-raised">
            <p className="text-sm font-medium text-ink">{question.text}</p>
          </Card>
          <Input
            label="Tu respuesta"
            required
            autoFocus
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            error={fieldErrors.answer}
            hint="No distingue mayúsculas de minúsculas."
          />
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={fieldErrors.newPassword}
            hint="Mínimo 8 caracteres."
          />
          <Input
            label="Repetí la nueva contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={fieldErrors.confirm}
          />
          <Button type="submit" full size="lg" loading={loading}>
            Cambiar contraseña
          </Button>
          <p className="text-center">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setAnswer('');
                setError(null);
                setFieldErrors({});
              }}
              className="text-sm font-medium text-ink-muted hover:text-ink"
            >
              Usar otro alias
            </button>
          </p>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperá tu cuenta"
      subtitle="Ingresá tu alias y te mostramos tu pregunta de seguridad."
      footer={
        <Link to="/login" className="font-medium text-accent hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={findQuestion} className="space-y-4">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Input
          label="Alias"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
        />
        <Button type="submit" full size="lg" loading={loading}>
          Continuar
        </Button>
      </form>
    </AuthShell>
  );
}
