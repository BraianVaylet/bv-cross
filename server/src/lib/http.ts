import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { z } from 'zod';

type ErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[] | undefined>;
  };
};

export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: ErrorBody['error']['fields'],
): HTTPException {
  const body: ErrorBody = { error: { code, message, ...(fields ? { fields } : {}) } };
  const res = new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
  return new HTTPException(status as 400, { res });
}

/** Lee y valida el body JSON. Lanza 400 con detalle de campos si no valida. */
export async function readJson<S extends z.ZodTypeAny>(c: Context, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw apiError(400, 'BAD_JSON', 'El cuerpo de la request debe ser JSON válido.');
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw apiError(400, 'VALIDATION', 'Revisá los datos ingresados.', result.error.flatten().fieldErrors);
  }
  return result.data;
}

/** Valida un parámetro de ruta numérico (id). */
export function idParam(c: Context, name: string): number {
  const value = Number(c.req.param(name));
  if (!Number.isInteger(value) || value <= 0) {
    throw apiError(400, 'BAD_ID', 'Identificador inválido.');
  }
  return value;
}
