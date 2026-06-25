export const name = '003_gimnastico';

// Modo gimnástico: el ejercicio se mide por máximo de repeticiones (opcional)
// en vez de RM en kg. Por eso rm_kg pasa a ser nullable y se agrega `reps`.
// SQLite no permite quitar NOT NULL/CHECK con ALTER, así que se reconstruye
// la tabla rm_entries.
export const sql = `
ALTER TABLE exercises ADD COLUMN gimnastico INTEGER NOT NULL DEFAULT 0;

CREATE TABLE rm_entries_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  rm_kg REAL CHECK (rm_kg IS NULL OR rm_kg > 0),
  reps INTEGER CHECK (reps IS NULL OR reps > 0),
  date TEXT NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO rm_entries_new (id, exercise_id, rm_kg, reps, date, comment, created_at)
  SELECT id, exercise_id, rm_kg, NULL, date, comment, created_at FROM rm_entries;
DROP TABLE rm_entries;
ALTER TABLE rm_entries_new RENAME TO rm_entries;
CREATE INDEX idx_entries_exercise_date ON rm_entries(exercise_id, date DESC, id DESC);
`;
