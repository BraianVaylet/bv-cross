export type User = { id: number; alias: string };

export type SecurityQuestion = { id: number; text: string };

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
  date: string; // yyyy-mm-dd
  comment: string | null;
  createdAt: string;
};

export type ExerciseDetail = {
  id: number;
  name: string;
  gimnastico: boolean;
  createdAt: string;
  entries: RmEntry[]; // ordenadas por fecha desc (la primera es la vigente)
  observacion: string | null;
  dolor: boolean;
};

export type EntryInput = { rmKg?: number | null; reps?: number | null; date: string; comment?: string };

export type CreateInput = EntryInput & {
  name: string;
  gimnastico?: boolean;
  observacion?: string | null;
  dolor?: boolean;
};
