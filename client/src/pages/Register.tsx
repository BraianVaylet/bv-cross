import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { Button, ErrorBanner, Input, Select } from '../components/ui';
import { api, errorMessage, firstFieldErrors } from '../lib/api';
import type { SecurityQuestion } from '../lib/types';

type AliasStatus = 'idle' | 'checking' | 'free' | 'taken' | 'invalid';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [questionId, setQuestionId] = useState('');
  const [answer, setAnswer] = useState('');

  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [aliasStatus, setAliasStatus] = useState<AliasStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.auth
      .questions()
      .then((r) => setQuestions(r.questions))
      .catch(() => setError('No pudimos cargar las preguntas de seguridad. Recargá la página.'));
  }, []);

  // Verificación de disponibilidad del alias con debounce.
  const aliasRef = useRef(alias);
  aliasRef.current = alias;
  useEffect(() => {
    const value = alias.trim();
    if (value.length < 3) {
      setAliasStatus('idle');
      return;
    }
    setAliasStatus('checking');
    const timer = setTimeout(() => {
      api.auth
        .aliasAvailable(value)
        .then((r) => {
          if (aliasRef.current.trim() !== value) return;
          setAliasStatus(r.valid ? (r.available ? 'free' : 'taken') : 'invalid');
        })
        .catch(() => {
          if (aliasRef.current.trim() === value) setAliasStatus('idle');
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [alias]);

  const aliasError =
    fieldErrors.alias ??
    (aliasStatus === 'taken'
      ? 'Ese alias ya está en uso'
      : aliasStatus === 'invalid'
        ? 'De 3 a 20 caracteres: letras, números, punto, guion y guion bajo'
        : undefined);

  const aliasHint =
    aliasStatus === 'checking' ? (
      'Verificando…'
    ) : aliasStatus === 'free' ? (
      <span className="text-ok">Disponible ✓</span>
    ) : (
      'Con esto entrás a la app. No usamos email.'
    );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    if (password !== confirm) errors.confirm = 'Las contraseñas no coinciden';
    if (!questionId) errors.securityQuestionId = 'Elegí una pregunta';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await register({
        alias: alias.trim(),
        password,
        securityQuestionId: Number(questionId),
        securityAnswer: answer,
      });
      navigate('/', { replace: true });
    } catch (err) {
      const fields = firstFieldErrors(err);
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Creá tu cuenta"
      subtitle="Solo un alias y una contraseña. Nada más."
      footer={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Iniciá sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Input
          label="Alias"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
          minLength={3}
          maxLength={20}
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          error={aliasError}
          hint={aliasHint}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint="Mínimo 8 caracteres."
        />
        <Input
          label="Repetí la contraseña"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
        />
        <Select
          label="Pregunta de seguridad"
          required
          value={questionId}
          onChange={(e) => setQuestionId(e.target.value)}
          error={fieldErrors.securityQuestionId}
        >
          <option value="" disabled>
            Elegí una pregunta…
          </option>
          {questions.map((q) => (
            <option key={q.id} value={q.id}>
              {q.text}
            </option>
          ))}
        </Select>
        <Input
          label="Respuesta"
          required
          minLength={2}
          maxLength={100}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          error={fieldErrors.securityAnswer}
          hint="Guardala bien: es la única forma de recuperar tu cuenta."
        />
        <Button type="submit" full size="lg" loading={loading}>
          Crear cuenta
        </Button>
      </form>
    </AuthShell>
  );
}
