import { db } from '../db/index.js';

export type ExerciseListItem = {
  id: number;
  name: string;
  gimnastico: boolean;
  currentRm: { rmKg: number; date: string } | null;
  currentReps: { reps: number; date: string } | null;
  observacion: string | null;
  dolor: boolean;
};

export type RmEntry = {
  id: number;
  rmKg: number | null;
  reps: number | null;
  date: string;
  comment: string | null;
  createdAt: string;
};

export type ExerciseDetail = {
  id: number;
  name: string;
  gimnastico: boolean;
  createdAt: string;
  entries: RmEntry[];
  observacion: string | null;
  dolor: boolean;
};

export type EntryData = {
  rmKg: number | null;
  reps: number | null;
  date: string;
  comment: string | null;
};

const listStmt = db.prepare(
  `SELECT e.id, e.name, e.observacion, e.dolor, e.gimnastico, le.rm_kg, le.reps, le.date
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
  'SELECT id, name, observacion, dolor, gimnastico, created_at FROM exercises WHERE id = ? AND user_id = ?',
);
const gimnasticoStmt = db.prepare(
  'SELECT gimnastico FROM exercises WHERE id = ? AND user_id = ?',
);
const entriesStmt = db.prepare(
  `SELECT id, rm_kg, reps, date, comment, created_at
   FROM rm_entries WHERE exercise_id = ?
   ORDER BY date DESC, id DESC`,
);
const insertExerciseStmt = db.prepare(
  'INSERT INTO exercises (user_id, name, gimnastico, observacion, dolor) VALUES (?, ?, ?, ?, ?)',
);
const insertEntryStmt = db.prepare(
  'INSERT INTO rm_entries (exercise_id, rm_kg, reps, date, comment) VALUES (?, ?, ?, ?, ?)',
);
const updateNameStmt = db.prepare(
  "UPDATE exercises SET name = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
);
const updateMetaStmt = db.prepare(
  "UPDATE exercises SET observacion = ?, dolor = ?, gimnastico = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
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
  'UPDATE rm_entries SET rm_kg = ?, reps = ?, date = ?, comment = ? WHERE id = ?',
);
const deleteEntryStmt = db.prepare('DELETE FROM rm_entries WHERE id = ?');
const countEntriesStmt = db.prepare(
  'SELECT COUNT(*) AS n FROM rm_entries WHERE exercise_id = ?',
);

/**
 * Ejercicios precargados al registrarse, todos con un RM inicial de 20 kg que
 * el usuario luego edita. El orden define cómo aparecen al crear la cuenta.
 */
export const DEFAULT_EXERCISES = [
  'Back SQ',
  'Front SQ',
  'Snatch',
  'Clean',
  'Split Jerk',
  'DL',
  'Push Press',
  'Press Militar',
  'Floor Press',
  'Hip Thrust',
  'Thruster',
] as const;

const DEFAULT_RM_KG = 20;

function mapEntry(row: {
  id: number;
  rm_kg: number | null;
  reps: number | null;
  date: string;
  comment: string | null;
  created_at: string;
}): RmEntry {
  return {
    id: row.id,
    rmKg: row.rm_kg,
    reps: row.reps,
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
      observacion: string | null;
      dolor: number;
      gimnastico: number;
      rm_kg: number | null;
      reps: number | null;
      date: string | null;
    }>;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      observacion: r.observacion,
      dolor: r.dolor === 1,
      gimnastico: r.gimnastico === 1,
      currentRm: r.rm_kg != null && r.date != null ? { rmKg: r.rm_kg, date: r.date } : null,
      currentReps: r.reps != null && r.date != null ? { reps: r.reps, date: r.date } : null,
    }));
  },

  get(userId: number, exerciseId: number): ExerciseDetail | null {
    const ex = exerciseStmt.get(exerciseId, userId) as
      | {
          id: number;
          name: string;
          observacion: string | null;
          dolor: number;
          gimnastico: number;
          created_at: string;
        }
      | undefined;
    if (!ex) return null;
    const entries = (entriesStmt.all(exerciseId) as Parameters<typeof mapEntry>[0][]).map(mapEntry);
    return {
      id: ex.id,
      name: ex.name,
      observacion: ex.observacion,
      dolor: ex.dolor === 1,
      gimnastico: ex.gimnastico === 1,
      createdAt: ex.created_at,
      entries,
    };
  },

  /** Modo del ejercicio: true gimnástico, false RM, null si no existe/ajeno. */
  gimnasticoMode(userId: number, exerciseId: number): boolean | null {
    const row = gimnasticoStmt.get(exerciseId, userId) as { gimnastico: number } | undefined;
    return row ? row.gimnastico === 1 : null;
  },

  create(
    userId: number,
    data: {
      name: string;
      gimnastico: boolean;
      observacion: string | null;
      dolor: boolean;
      entry: EntryData;
    },
  ): number {
    const tx = db.transaction(() => {
      const result = insertExerciseStmt.run(
        userId,
        data.name,
        data.gimnastico ? 1 : 0,
        data.observacion,
        data.dolor ? 1 : 0,
      );
      const exerciseId = Number(result.lastInsertRowid);
      insertEntryStmt.run(
        exerciseId,
        data.entry.rmKg,
        data.entry.reps,
        data.entry.date,
        data.entry.comment,
      );
      return exerciseId;
    });
    return tx();
  },

  /** Precarga los ejercicios por defecto (RM 20 kg) para un usuario nuevo. */
  seedDefaults(userId: number, date: string): void {
    const tx = db.transaction(() => {
      for (const name of DEFAULT_EXERCISES) {
        const result = insertExerciseStmt.run(userId, name, 0, null, 0);
        const exerciseId = Number(result.lastInsertRowid);
        insertEntryStmt.run(exerciseId, DEFAULT_RM_KG, null, date, null);
      }
    });
    tx();
  },

  updateName(userId: number, exerciseId: number, name: string): boolean {
    return updateNameStmt.run(name, exerciseId, userId).changes > 0;
  },

  updateMeta(
    userId: number,
    exerciseId: number,
    meta: { observacion: string | null; dolor: boolean; gimnastico: boolean },
  ): boolean {
    return (
      updateMetaStmt.run(
        meta.observacion,
        meta.dolor ? 1 : 0,
        meta.gimnastico ? 1 : 0,
        exerciseId,
        userId,
      ).changes > 0
    );
  },

  remove(userId: number, exerciseId: number): boolean {
    return deleteExerciseStmt.run(exerciseId, userId).changes > 0;
  },

  addEntry(userId: number, exerciseId: number, entry: EntryData): RmEntry | null {
    if (!exerciseStmt.get(exerciseId, userId)) return null;
    const result = insertEntryStmt.run(
      exerciseId,
      entry.rmKg,
      entry.reps,
      entry.date,
      entry.comment,
    );
    const id = Number(result.lastInsertRowid);
    return {
      id,
      rmKg: entry.rmKg,
      reps: entry.reps,
      date: entry.date,
      comment: entry.comment,
      createdAt: '',
    };
  },

  updateEntry(userId: number, exerciseId: number, entryId: number, entry: EntryData): boolean {
    if (!entryOwnedStmt.get(entryId, exerciseId, userId)) return false;
    updateEntryStmt.run(entry.rmKg, entry.reps, entry.date, entry.comment, entryId);
    return true;
  },

  /** Devuelve 'ok' | 'not_found' | 'last_entry'. No se puede borrar el único registro. */
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
