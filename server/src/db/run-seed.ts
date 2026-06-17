// Crea el usuario de prueba admin/admin manualmente: npm run db:seed
import { seedAdminUser } from './seed.js';

const created = await seedAdminUser();
console.log(
  created
    ? '[db] usuario de prueba creado → alias: admin / contraseña: admin'
    : '[db] el usuario admin ya existía',
);
process.exit(0);
