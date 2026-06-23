import type Database from 'better-sqlite3';
import * as m001 from './migrations/001_init.js';
import * as m002 from './migrations/002_exercise_meta.js';

const MIGRATIONS: Array<{ name: string; sql: string }> = [m001, m002];

/**
 * Aplica las migraciones pendientes. Se ejecuta automáticamente al abrir
 * la conexión (ver db/index.ts), por lo que el schema siempre está listo
 * antes de preparar cualquier statement.
 */
export function runMigrations(db: Database.Database) {
  db.exec(
    `CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  );
  const isApplied = db.prepare('SELECT 1 FROM _migrations WHERE name = ?');
  const markApplied = db.prepare('INSERT INTO _migrations (name) VALUES (?)');

  for (const migration of MIGRATIONS) {
    if (isApplied.get(migration.name)) continue;
    db.transaction(() => {
      db.exec(migration.sql);
      markApplied.run(migration.name);
    })();
    console.log(`[db] migración aplicada: ${migration.name}`);
  }
}
