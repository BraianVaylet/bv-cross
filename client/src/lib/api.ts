import type {
  EntryInput,
  ExerciseDetail,
  ExerciseListItem,
  RmEntry,
  SecurityQuestion,
  User,
} from './types';

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string[] | undefined>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type RequestOptions = { method?: string; body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: options.method ?? 'GET',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'No pudimos conectar con el servidor. Revisá tu conexión.');
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta sin cuerpo */
  }

  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; fields?: ApiError['fields'] } })
      ?.error;
    // Sesión vencida en cualquier llamada (excepto el chequeo inicial):
    // avisamos a AuthContext para redirigir a login.
    if (res.status === 401 && !path.endsWith('/auth/me')) {
      window.dispatchEvent(new Event('bv:unauthorized'));
    }
    throw new ApiError(
      res.status,
      err?.code ?? 'ERROR',
      err?.message ?? 'Ocurrió un error inesperado.',
      err?.fields,
    );
  }

  return data as T;
}

export const api = {
  auth: {
    me: () => request<{ user: User }>('/api/auth/me'),
    questions: () => request<{ questions: SecurityQuestion[] }>('/api/auth/questions'),
    aliasAvailable: (alias: string) =>
      request<{ available: boolean; valid: boolean }>(
        `/api/auth/alias-available?alias=${encodeURIComponent(alias)}`,
      ),
    register: (payload: {
      alias: string;
      password: string;
      securityQuestionId: number;
      securityAnswer: string;
    }) => request<{ user: User }>('/api/auth/register', { method: 'POST', body: payload }),
    login: (alias: string, password: string) =>
      request<{ user: User }>('/api/auth/login', { method: 'POST', body: { alias, password } }),
    logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
    recoveryQuestion: (alias: string) =>
      request<{ question: SecurityQuestion }>(`/api/auth/recovery/${encodeURIComponent(alias)}`),
    recoveryReset: (payload: { alias: string; answer: string; newPassword: string }) =>
      request<{ ok: true }>('/api/auth/recovery', { method: 'POST', body: payload }),
  },
  exercises: {
    list: () => request<{ exercises: ExerciseListItem[] }>('/api/exercises'),
    get: (id: number) => request<{ exercise: ExerciseDetail }>(`/api/exercises/${id}`),
    create: (payload: EntryInput & { name: string }) =>
      request<{ exercise: ExerciseDetail }>('/api/exercises', { method: 'POST', body: payload }),
    rename: (id: number, name: string) =>
      request<{ exercise: ExerciseDetail }>(`/api/exercises/${id}`, {
        method: 'PATCH',
        body: { name },
      }),
    remove: (id: number) => request<void>(`/api/exercises/${id}`, { method: 'DELETE' }),
    addEntry: (id: number, payload: EntryInput) =>
      request<{ entry: RmEntry }>(`/api/exercises/${id}/entries`, {
        method: 'POST',
        body: payload,
      }),
    updateEntry: (id: number, entryId: number, payload: EntryInput) =>
      request<{ ok: true }>(`/api/exercises/${id}/entries/${entryId}`, {
        method: 'PATCH',
        body: payload,
      }),
    removeEntry: (id: number, entryId: number) =>
      request<void>(`/api/exercises/${id}/entries/${entryId}`, { method: 'DELETE' }),
  },
};

/** Primer mensaje de error por campo, listo para mostrar bajo cada input. */
export function firstFieldErrors(err: unknown): Record<string, string> {
  if (err instanceof ApiError && err.fields) {
    const out: Record<string, string> = {};
    for (const [key, messages] of Object.entries(err.fields)) {
      if (messages && messages[0]) out[key] = messages[0];
    }
    return out;
  }
  return {};
}

/** Mensaje legible para banners de error. */
export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.';
}
