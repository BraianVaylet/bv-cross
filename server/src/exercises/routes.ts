import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AppEnv } from '../auth/session.js';
import { apiError, idParam, readJson } from '../lib/http.js';
import { exercisesRepo } from './repo.js';

const nameSchema = z.string().trim().min(1, 'Ingresá un nombre').max(60, 'Máximo 60 caracteres');

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')
  .refine((value) => {
    const d = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
  }, 'Fecha inexistente');

const entrySchema = z.object({
  rmKg: z
    .number({ invalid_type_error: 'Ingresá un número' })
    .positive('Debe ser mayor a 0')
    .max(1000, 'Valor fuera de rango'),
  date: dateSchema,
  comment: z.string().trim().max(300, 'Máximo 300 caracteres').optional(),
});

const createSchema = entrySchema.extend({ name: nameSchema });
const renameSchema = z.object({ name: nameSchema });
const metaSchema = z.object({
  observacion: z.string().trim().max(500, 'Máximo 500 caracteres').nullable().optional(),
  dolor: z.boolean().optional(),
});

const toComment = (value?: string) => (value && value.length > 0 ? value : null);

export const exerciseRoutes = new Hono<AppEnv>();

exerciseRoutes.use('*', requireAuth);

exerciseRoutes.get('/', (c) => {
  const user = c.get('user');
  return c.json({ exercises: exercisesRepo.list(user.id) });
});

exerciseRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await readJson(c, createSchema);
  const id = exercisesRepo.create(user.id, body.name, {
    rmKg: body.rmKg,
    date: body.date,
    comment: toComment(body.comment),
  });
  return c.json({ exercise: exercisesRepo.get(user.id, id) }, 201);
});

exerciseRoutes.get('/:id', (c) => {
  const user = c.get('user');
  const exercise = exercisesRepo.get(user.id, idParam(c, 'id'));
  if (!exercise) throw apiError(404, 'NOT_FOUND', 'No encontramos ese ejercicio.');
  return c.json({ exercise });
});

exerciseRoutes.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = idParam(c, 'id');
  const body = await readJson(c, renameSchema);
  if (!exercisesRepo.updateName(user.id, id, body.name)) {
    throw apiError(404, 'NOT_FOUND', 'No encontramos ese ejercicio.');
  }
  return c.json({ exercise: exercisesRepo.get(user.id, id) });
});

exerciseRoutes.patch('/:id/meta', async (c) => {
  const user = c.get('user');
  const id = idParam(c, 'id');
  const body = await readJson(c, metaSchema);
  const ok = exercisesRepo.updateMeta(user.id, id, {
    observacion: body.observacion ?? null,
    dolor: body.dolor ?? false,
  });
  if (!ok) throw apiError(404, 'NOT_FOUND', 'No encontramos ese ejercicio.');
  return c.json({ exercise: exercisesRepo.get(user.id, id) });
});

exerciseRoutes.delete('/:id', (c) => {
  const user = c.get('user');
  if (!exercisesRepo.remove(user.id, idParam(c, 'id'))) {
    throw apiError(404, 'NOT_FOUND', 'No encontramos ese ejercicio.');
  }
  return c.body(null, 204);
});

exerciseRoutes.post('/:id/entries', async (c) => {
  const user = c.get('user');
  const id = idParam(c, 'id');
  const body = await readJson(c, entrySchema);
  const entry = exercisesRepo.addEntry(user.id, id, {
    rmKg: body.rmKg,
    date: body.date,
    comment: toComment(body.comment),
  });
  if (!entry) throw apiError(404, 'NOT_FOUND', 'No encontramos ese ejercicio.');
  return c.json({ entry }, 201);
});

exerciseRoutes.patch('/:id/entries/:entryId', async (c) => {
  const user = c.get('user');
  const id = idParam(c, 'id');
  const entryId = idParam(c, 'entryId');
  const body = await readJson(c, entrySchema);
  const ok = exercisesRepo.updateEntry(user.id, id, entryId, {
    rmKg: body.rmKg,
    date: body.date,
    comment: toComment(body.comment),
  });
  if (!ok) throw apiError(404, 'NOT_FOUND', 'No encontramos ese registro.');
  return c.json({ ok: true });
});

exerciseRoutes.delete('/:id/entries/:entryId', (c) => {
  const user = c.get('user');
  const result = exercisesRepo.removeEntry(user.id, idParam(c, 'id'), idParam(c, 'entryId'));
  if (result === 'not_found') throw apiError(404, 'NOT_FOUND', 'No encontramos ese registro.');
  if (result === 'last_entry') {
    throw apiError(
      409,
      'LAST_ENTRY',
      'Es el único RM del ejercicio. Si querés sacarlo, eliminá el ejercicio completo.',
    );
  }
  return c.body(null, 204);
});
