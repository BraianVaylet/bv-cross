import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import {
  hashSecret,
  normalizeAlias,
  normalizeAnswer,
  verifySecret,
} from '../lib/crypto.js';
import { apiError, readJson } from '../lib/http.js';
import { rateLimit } from '../lib/rateLimit.js';
import { questionById, SECURITY_QUESTIONS } from './questions.js';
import {
  createSession,
  currentUser,
  destroyAllUserSessions,
  destroySession,
  requireAuth,
  type AppEnv,
} from './session.js';

const aliasSchema = z
  .string()
  .trim()
  .min(3, 'Mínimo 3 caracteres')
  .max(20, 'Máximo 20 caracteres')
  .regex(/^[a-zA-Z0-9_.-]+$/, 'Solo letras, números, punto, guion y guion bajo');

const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(128, 'Máximo 128 caracteres');

const answerSchema = z
  .string()
  .trim()
  .min(2, 'Mínimo 2 caracteres')
  .max(100, 'Máximo 100 caracteres');

const registerSchema = z.object({
  alias: aliasSchema,
  password: passwordSchema,
  securityQuestionId: z.number().int(),
  securityAnswer: answerSchema,
});

const loginSchema = z.object({
  alias: z.string().trim().min(1, 'Ingresá tu alias').max(20),
  password: z.string().min(1, 'Ingresá tu contraseña').max(128),
});

const recoverySchema = z.object({
  alias: z.string().trim().min(1).max(20),
  answer: answerSchema,
  newPassword: passwordSchema,
});

type UserRow = {
  id: number;
  alias: string;
  alias_display: string;
  password_hash: string;
  security_question_id: number;
  security_answer_hash: string;
};

const selectUserByAlias = db.prepare('SELECT * FROM users WHERE alias = ?');
const insertUser = db.prepare(
  `INSERT INTO users (alias, alias_display, password_hash, security_question_id, security_answer_hash)
   VALUES (?, ?, ?, ?, ?)`,
);
const updatePassword = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');

// Hash de referencia para igualar tiempos cuando el alias no existe.
const DUMMY_HASH = await hashSecret('bv-cross-timing-equalizer');

const MIN15 = 15 * 60_000;

export const authRoutes = new Hono<AppEnv>();

authRoutes.get('/questions', (c) => c.json({ questions: SECURITY_QUESTIONS }));

authRoutes.get(
  '/alias-available',
  rateLimit({ id: 'alias', max: 30, windowMs: 5 * 60_000 }),
  (c) => {
    const parsed = aliasSchema.safeParse(c.req.query('alias') ?? '');
    if (!parsed.success) return c.json({ available: false, valid: false });
    const exists = selectUserByAlias.get(normalizeAlias(parsed.data));
    return c.json({ available: !exists, valid: true });
  },
);

authRoutes.post(
  '/register',
  rateLimit({ id: 'register', max: 5, windowMs: MIN15 }),
  async (c) => {
    const body = await readJson(c, registerSchema);
    if (!questionById(body.securityQuestionId)) {
      throw apiError(400, 'VALIDATION', 'Elegí una pregunta de seguridad válida.', {
        securityQuestionId: ['Pregunta inválida'],
      });
    }
    const alias = normalizeAlias(body.alias);
    if (selectUserByAlias.get(alias)) {
      throw apiError(409, 'ALIAS_TAKEN', 'Ese alias ya está en uso.', {
        alias: ['Ese alias ya está en uso'],
      });
    }
    const [passwordHash, answerHash] = await Promise.all([
      hashSecret(body.password),
      hashSecret(normalizeAnswer(body.securityAnswer)),
    ]);
    let userId: number;
    try {
      const result = insertUser.run(
        alias,
        body.alias.trim(),
        passwordHash,
        body.securityQuestionId,
        answerHash,
      );
      userId = Number(result.lastInsertRowid);
    } catch (err) {
      // Carrera entre el check y el insert: el UNIQUE manda.
      if ((err as { code?: string }).code?.startsWith('SQLITE_CONSTRAINT')) {
        throw apiError(409, 'ALIAS_TAKEN', 'Ese alias ya está en uso.', {
          alias: ['Ese alias ya está en uso'],
        });
      }
      throw err;
    }
    createSession(c, userId);
    return c.json({ user: { id: userId, alias: body.alias.trim() } }, 201);
  },
);

authRoutes.post(
  '/login',
  rateLimit({ id: 'login', max: 10, windowMs: MIN15 }),
  async (c) => {
    const body = await readJson(c, loginSchema);
    const row = selectUserByAlias.get(normalizeAlias(body.alias)) as UserRow | undefined;
    const ok = await verifySecret(body.password, row?.password_hash ?? DUMMY_HASH);
    if (!row || !ok) {
      throw apiError(401, 'BAD_CREDENTIALS', 'Alias o contraseña incorrectos.');
    }
    createSession(c, row.id);
    return c.json({ user: { id: row.id, alias: row.alias_display } });
  },
);

authRoutes.post('/logout', (c) => {
  destroySession(c);
  return c.json({ ok: true });
});

authRoutes.get('/me', (c) => {
  const user = currentUser(c);
  if (!user) throw apiError(401, 'UNAUTHORIZED', 'Sin sesión activa.');
  return c.json({ user });
});

// Paso 1 de recuperación: obtener la pregunta del alias.
authRoutes.get(
  '/recovery/:alias',
  rateLimit({ id: 'recovery-q', max: 8, windowMs: MIN15 }),
  (c) => {
    const row = selectUserByAlias.get(normalizeAlias(c.req.param('alias'))) as
      | UserRow
      | undefined;
    if (!row) {
      throw apiError(404, 'NOT_FOUND', 'No encontramos una cuenta con ese alias.');
    }
    const question = questionById(row.security_question_id);
    return c.json({ question: { id: question?.id ?? 0, text: question?.text ?? '' } });
  },
);

// Paso 2: responder la pregunta y definir nueva contraseña.
authRoutes.post(
  '/recovery',
  rateLimit({ id: 'recovery', max: 5, windowMs: MIN15 }),
  async (c) => {
    const body = await readJson(c, recoverySchema);
    const row = selectUserByAlias.get(normalizeAlias(body.alias)) as UserRow | undefined;
    const ok = await verifySecret(
      normalizeAnswer(body.answer),
      row?.security_answer_hash ?? DUMMY_HASH,
    );
    if (!row || !ok) {
      throw apiError(401, 'BAD_ANSWER', 'La respuesta no es correcta.');
    }
    const newHash = await hashSecret(body.newPassword);
    updatePassword.run(newHash, row.id);
    // Invalida cualquier sesión previa por seguridad.
    destroyAllUserSessions(row.id);
    return c.json({ ok: true });
  },
);

export { requireAuth };
