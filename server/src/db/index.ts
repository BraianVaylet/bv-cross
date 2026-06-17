import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config } from '../config.js';
import { runMigrations } from './migrate.js';

const dbFile = resolve(process.cwd(), config.dbPath);
mkdirSync(dirname(dbFile), { recursive: true });

export const db = new Database(dbFile);

// WAL: lecturas concurrentes y mejor performance de escritura.
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// El schema queda listo antes de que cualquier módulo prepare statements.
runMigrations(db);

export function closeDb() {
  db.close();
}
