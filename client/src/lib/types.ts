export type User = { id: number; alias: string };

export type SecurityQuestion = { id: number; text: string };

export type ExerciseListItem = {
  id: number;
  name: string;
  currentRm: { rmKg: number; date: string } | null;
  observacion: string | null;
  dolor: boolean;
};

export type RmEntry = {
  id: number;
  rmKg: number;
  date: string; // yyyy-mm-dd
  comment: string | null;
  createdAt: string;
};

export type ExerciseDetail = {
  id: number;
  name: string;
  createdAt: string;
  entries: RmEntry[]; // ordenadas por fecha desc (la primera es la vigente)
  observacion: string | null;
  dolor: boolean;
};

export type EntryInput = { rmKg: number; date: string; comment?: string };
