import type { Context, MiddlewareHandler } from 'hono';
import { config } from '../config.js';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function clientIp(c: Context): string {
  if (config.trustProxy) {
    const xff = c.req.header('x-forwarded-for');
    if (xff) {
      // La última IP de la lista es la agregada por el proxy del hosting.
      const parts = xff.split(',');
      const last = parts[parts.length - 1]?.trim();
      if (last) return last;
    }
  }
  // Sin proxy confiable no hay IP fiable a nivel framework: clave única degradada.
  return c.req.header('x-real-ip')?.trim() ?? 'local';
}

/**
 * Limitador simple de ventana fija en memoria. Suficiente para una
 * instancia única; si escalás horizontalmente, mover a un store compartido.
 */
export function rateLimit(opts: { id: string; max: number; windowMs: number }): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    sweep(now);
    const key = `${opts.id}:${clientIp(c)}`;
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > opts.max) {
        const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
        c.header('Retry-After', String(retryAfter));
        return c.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Demasiados intentos. Probá de nuevo en unos minutos.',
            },
          },
          429,
        );
      }
    }
    await next();
  };
}
