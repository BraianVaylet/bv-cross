import { serveStatic } from '@hono/node-server/serve-static';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { authRoutes } from './auth/routes.js';
import type { AppEnv } from './auth/session.js';
import { config } from './config.js';
import { exerciseRoutes } from './exercises/routes.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const CLIENT_DIST = resolve(here, '../../client/dist');

export const app = new Hono<AppEnv>();

app.use(logger());

app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Defensa CSRF extra (las cookies SameSite=Lax ya cubren el vector principal):
// las mutaciones solo se aceptan desde el propio origen o los configurados.
app.use('/api/*', async (c, next) => {
  const method = c.req.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  const origin = c.req.header('origin');
  if (!origin) return next();
  const host = c.req.header('x-forwarded-host') ?? c.req.header('host') ?? '';
  const proto = c.req.header('x-forwarded-proto') ?? new URL(c.req.url).protocol.replace(':', '');
  const self = `${proto}://${host}`;
  const devOrigin = !config.isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (origin === self || devOrigin || config.appOrigins.includes(origin)) return next();
  return c.json({ error: { code: 'BAD_ORIGIN', message: 'Origen no permitido.' } }, 403);
});

app.use('/api/*', bodyLimit({ maxSize: 16 * 1024 }));

app.route('/api/auth', authRoutes);
app.route('/api/exercises', exerciseRoutes);

app.all('/api/*', (c) =>
  c.json({ error: { code: 'NOT_FOUND', message: 'Ruta inexistente.' } }, 404),
);

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  console.error('[error]', err);
  return c.json({ error: { code: 'INTERNAL', message: 'Ocurrió un error inesperado.' } }, 500);
});

// En producción el mismo proceso sirve el frontend compilado (single deploy).
if (existsSync(CLIENT_DIST)) {
  const staticRoot = relative(process.cwd(), CLIENT_DIST) || '.';
  app.use(
    '*',
    serveStatic({
      root: staticRoot,
      onFound: (path, c) => {
        if (path.includes('/assets/')) {
          c.header('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  // Fallback SPA: cualquier otra ruta devuelve index.html.
  const indexPath = join(CLIENT_DIST, 'index.html');
  let indexHtml: string | null = null;
  app.get('*', (c) => {
    if (indexHtml === null || !config.isProd) {
      indexHtml = readFileSync(indexPath, 'utf8');
    }
    return c.html(indexHtml);
  });
}
