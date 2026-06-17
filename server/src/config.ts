const env = process.env;

const isProd = env.NODE_ENV === 'production';

export const config = {
  isProd,
  port: Number(env.PORT ?? 8787),
  /** Ruta del archivo SQLite. En hosting con volumen: /data/bvcross.db */
  dbPath: env.DB_PATH ?? './data/bvcross.db',
  /** Días de vida de una sesión */
  sessionDays: Number(env.SESSION_DAYS ?? 30),
  /** Cookie Secure (detrás del proxy TLS del hosting funciona igual) */
  cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProd,
  /**
   * Orígenes permitidos para requests mutantes (CSV). Si está vacío,
   * se acepta el mismo host de la request y localhost en desarrollo.
   */
  appOrigins: (env.APP_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** Confiar en x-forwarded-* (los PaaS siempre tienen proxy delante) */
  trustProxy: env.TRUST_PROXY ? env.TRUST_PROXY === 'true' : isProd,
};
