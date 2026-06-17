import { db } from './index.js';
import { hashSecret, normalizeAlias, normalizeAnswer } from '../lib/crypto.js';

const ADMIN_ALIAS = 'admin';
const ADMIN_PASSWORD = 'admin';
const ADMIN_ANSWER = 'admin';
const ADMIN_QUESTION_ID = 1;

/**
 * Crea un usuario de prueba admin/admin si no existe.
 * Pensado para testear la app sin pasar por el registro.
 * Devuelve true si lo creó, false si ya estaba.
 */
export async function seedAdminUser(): Promise<boolean> {
  const alias = normalizeAlias(ADMIN_ALIAS);
  const exists = db.prepare('SELECT 1 FROM users WHERE alias = ?').get(alias);
  if (exists) return false;

  const [passwordHash, answerHash] = await Promise.all([
    hashSecret(ADMIN_PASSWORD),
    hashSecret(normalizeAnswer(ADMIN_ANSWER)),
  ]);

  db.prepare(
    `INSERT INTO users (alias, alias_display, password_hash, security_question_id, security_answer_hash)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(alias, ADMIN_ALIAS, passwordHash, ADMIN_QUESTION_ID, answerHash);

  return true;
}
