import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { newSessionToken, sha256 } from '../lib/crypto.js';
import { apiError } from '../lib/http.js';

export type SessionUser = { id: number; alias: string };

export type AppEnv = { Variables: { user: SessionUser } };

const COOKIE_NAME = 'bv_session';

const insertSession = db.prepare(
  'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
);
const selectSession = db.prepare(
  `SELECT s.token_hash, s.expires_at, u.id AS user_id, u.alias_display
   FROM sessions s JOIN users u ON u.id = s.user_id
   WHERE s.token_hash = ?`,
);
const removeSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
const removeUserSessions = db.prepare('DELETE FROM sessions WHERE user_id = ?');
const removeExpired = db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')");

export function createSession(c: Context, userId: number): void {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + config.sessionDays * 86_400_000).toISOString();
  insertSession.run(sha256(token), userId, expiresAt);
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: config.cookieSecure,
    path: '/',
    maxAge: config.sessionDays * 86_400,
  });
}

export function destroySession(c: Context): void {
  const token = getCookie(c, COOKIE_NAME);
  if (token) removeSession.run(sha256(token));
  deleteCookie(c, COOKIE_NAME, { path: '/' });
}

export function destroyAllUserSessions(userId: number): void {
  removeUserSessions.run(userId);
}

export function currentUser(c: Context): SessionUser | null {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;
  const row = selectSession.get(sha256(token)) as
    | { token_hash: string; expires_at: string; user_id: number; alias_display: string }
    | undefined;
  if (!row) return null;
  if (row.expires_at <= new Date().toISOString()) {
    removeSession.run(row.token_hash);
    return null;
  }
  return { id: row.user_id, alias: row.alias_display };
}

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = currentUser(c);
  if (!user) throw apiError(401, 'UNAUTHORIZED', 'Tenés que iniciar sesión.');
  c.set('user', user);
  await next();
};

/** Limpieza periódica de sesiones vencidas (ver index.ts). */
export function pruneExpiredSessions() {
  removeExpired.run();
}
