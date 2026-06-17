import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

/**
 * Hashing con scrypt de node:crypto (recomendado por OWASP).
 * Sin dependencias externas para el material criptográfico.
 * Parámetros: N=16384, r=8, p=1, salt 16 bytes, clave derivada 64 bytes.
 */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

function scryptAsync(secret: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(secret, salt, KEYLEN, { N, r: R, p: P }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

/** Devuelve "scrypt$N$r$p$salt_b64$key_b64" */
export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(secret, salt);
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifySecret(secret: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const salt = Buffer.from(parts[4], 'base64');
    const expected = Buffer.from(parts[5], 'base64');
    const actual = await scryptAsync(secret, salt);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Token de sesión aleatorio (256 bits) apto para cookie. */
export function newSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** En DB se guarda el hash del token, no el token. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Alias: identidad case-insensitive. */
export function normalizeAlias(alias: string): string {
  return alias.trim().toLowerCase();
}

/** Respuesta de seguridad: tolerante a mayúsculas y espacios extra. */
export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}
