import { db } from '../db/index.js';

export type ExerciseListItem = {
  id: number;
  name: string;
  currentRm: { rmKg: number; date: string } | null;
};

export type RmEntry = {
  id: number;
  rmKg: number;
  date: string;
  comment: string | null;
  createdAt: string;
};

export type ExerciseDetail = {
  id: number;
  name: string;
  createdAt: string;
  entries: RmEntry[];
};

const listStmt = db.prepare(
  `SELECT e.id, e.name, le.rm_kg, le.date
   FROM exercises e
   LEFT JOIN rm_entries le ON le.id = (
     SELECT id FROM rm_entries
     WHERE exercise_id = e.id
     ORDER BY date DESC, id DESC
     LIMIT 1
   )
   WHERE e.user_id = ?
   ORDER BY e.name COLLATE NOCASE ASC`,
);

const exerciseStmt = db.prepare(
  'SELECT id, name, created_at FROM exercises WHERE id = ? AND user_id = ?',
);
const entriesStmt = db.prepare(
  `SELECT id, rm_kg, date, comment, created_at
   FROM rm_entries WHERE exercise_id = ?
   ORDER BY date DESC, id DESC`,
);
const insertExerciseStmt = db.prepare(
  'INSERT INTO exercises (user_id, name) VALUES (?, ?)',
);
const insertEntryStmt = db.prepare(
  'INSERT INTO rm_entries (exercise_id, rm_kg, date, comment) VALUES (?, ?, ?, ?)',
);
const updateNameStmt = db.prepare(
  "UPDATE exercises SET name = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
);
const deleteExerciseStmt = db.prepare(
  'DELETE FROM exercises WHERE id = ? AND user_id = ?',
);
const entryOwnedStmt = db.prepare(
  `SELECT r.id FROM rm_entries r
   JOIN exercises e ON e.id = r.exercise_id
   WHERE r.id = ? AND r.exercise_id = ? AND e.user_id = ?`,
);
const updateEntryStmt = db.prepare(
  'UPDATE rm_entries SET rm_kg = ?, date = ?, comment = ? WHERE id = ?',
);
const deleteEntryStmt = db.prepare('DELETE FROM rm_entries WHERE id = ?');
const countEntriesStmt = db.prepare(
  'SELECT COUNT(*) AS n FROM rm_entries WHERE exercise_id = ?',
);

function mapEntry(row: {
  id: number;
  rm_kg: number;
  date: string;
  comment: string | null;
  created_at: string;
}): RmEntry {
  return {
    id: row.id,
    rmKg: row.rm_kg,
    date: row.date,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

export const exercisesRepo = {
  list(userId: number): ExerciseListItem[] {
    const rows = listStmt.all(userId) as Array<{
      id: number;
      name: string;
      rm_kg: number | null;
      date: string | null;
    }>;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      currentRm: r.rm_kg != null && r.date != null ? { rmKg: r.rm_kg, date: r.date } : null,
    }));
  },

  get(userId: number, exerciseId: number): ExerciseDetail | null {
    const ex = exerciseStmt.get(exerciseId, userId) as
      | { id: number; name: string; created_at: string }
      | undefined;
    if (!ex) return null;
    const entries = (entriesStmt.all(exerciseId) as Parameters<typeof mapEntry>[0][]).map(mapEntry);
    return { id: ex.id, name: ex.name, createdAt: ex.created_at, entries };
  },

  create(
    userId: number,
    name: string,
    entry: { rmKg: number; date: string; comment: string | null },
  ): number {
    const tx = db.transaction(() => {
      const result = insertExerciseStmt.run(userId, name);
      const exerciseId = Number(result.lastInsertRowid);
      insertEntryStmt.run(exerciseId, entry.rmKg, entry.date, entry.comment);
      return exerciseId;
    });
    return tx();
  },

  updateName(userId: number, exerciseId: number, name: string): boolean {
    return updateNameStmt.run(name, exerciseId, userId).changes > 0;
  },

  remove(userId: number, exerciseId: number): boolean {
    return deleteExerciseStmt.run(exerciseId, userId).changes > 0;
  },

  addEntry(
    userId: number,
    exerciseId: number,
    entry: { rmKg: number; date: string; comment: string | null },
  ): RmEntry | null {
    if (!exerciseStmt.get(exerciseId, userId)) return null;
    const result = insertEntryStmt.run(exerciseId, entry.rmKg, entry.date, entry.comment);
    const id = Number(result.lastInsertRowid);
    return { id, rmKg: entry.rmKg, date: entry.date, comment: entry.comment, createdAt: '' };
  },

  updateEntry(
    userId: number,
    exerciseId: number,
    entryId: number,
    entry: { rmKg: number; date: string; comment: string | null },
  ): boolean {
    if (!entryOwnedStmt.get(entryId, exerciseId, userId)) return false;
    updateEntryStmt.run(entry.rmKg, entry.date, entry.comment, entryId);
    return true;
  },

  /** Devuelve 'ok' | 'not_found' | 'last_entry'. No se puede borrar el único RM. */
  removeEntry(userId: number, exerciseId: number, entryId: number): 'ok' | 'not_found' | 'last_entry' {
    const tx = db.transaction((): 'ok' | 'not_found' | 'last_entry' => {
      if (!entryOwnedStmt.get(entryId, exerciseId, userId)) return 'not_found';
      const { n } = countEntriesStmt.get(exerciseId) as { n: number };
      if (n <= 1) return 'last_entry';
      deleteEntryStmt.run(entryId);
      return 'ok';
    });
    return tx();
  },
};
