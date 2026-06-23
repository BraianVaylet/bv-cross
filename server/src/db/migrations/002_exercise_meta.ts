export const name = '002_exercise_meta';

export const sql = `
ALTER TABLE exercises ADD COLUMN observacion TEXT;
ALTER TABLE exercises ADD COLUMN dolor INTEGER NOT NULL DEFAULT 0;
`;
