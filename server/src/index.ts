import { serve } from '@hono/node-server';
import { app } from './app.js';
import { pruneExpiredSessions } from './auth/session.js';
import { config } from './config.js';
import { closeDb } from './db/index.js';
import { seedAdminUser } from './db/seed.js';

// En desarrollo dejamos listo un usuario de prueba: admin / admin.
if (!config.isProd) {
  seedAdminUser()
    .then((created) => {
      if (created) console.log('[dev] usuario de prueba listo → alias: admin / contraseña: admin');
    })
    .catch((err) => console.error('[dev] no se pudo crear el usuario de prueba:', err));
}

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`BV Cross server escuchando en http://localhost:${info.port}`);
});

// Limpieza de sesiones vencidas cada 6 horas.
const prune = setInterval(pruneExpiredSessions, 6 * 60 * 60 * 1000);
prune.unref();

function shutdown() {
  console.log('\nCerrando server...');
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
