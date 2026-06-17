# BV Cross

Web app **mobile-first** para registrar tus RMs de CrossFit y calcular cargas por porcentaje en segundos. Pensada para usarla desde el celular en el box: abrís el ejercicio, tocás el porcentaje y ves el peso a cargar.

## Funcionalidades

- **Cuentas sin email**: alias único + contraseña. La recuperación es con pregunta de seguridad (catálogo fijo: nombre de tu madre, primera mascota, primer auto, etc.).
- **Ejercicios con historial de RMs**: cada ejercicio guarda todos sus registros (peso, fecha, comentario). El RM vigente es el de fecha más reciente.
- **Calculadora de cargas**: chips de 65 / 75 / 80 / 85 / 90 / 95 % + porcentaje libre. El resultado se muestra en un "disco" central, con el valor exacto debajo cuando difiere del redondeado.
- **Redondeo configurable**: exacto, 1,25, 2,5 o 5 kg (se recuerda tu preferencia en el dispositivo).
- **Base de cálculo elegible**: tocás cualquier RM del historial para calcular sobre ese valor (útil para comparar con marcas viejas).
- **Modo oscuro** con detección del sistema y toggle manual, sin parpadeo al cargar.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + Vite 6 + Tailwind CSS v4 + React Router 6 |
| Backend | Hono (Node) + better-sqlite3 + Zod |
| Base de datos | SQLite (archivo único, modo WAL) |
| Deploy | Un solo servicio Node que sirve API + frontend compilado |

Sin ORM ni librerías de UI: SQL preparado a mano y componentes propios. Menos dependencias, menos superficie de ataque, más velocidad.

## Estructura

```
bvcross/
├── client/                  # React + Vite + Tailwind v4
│   ├── public/              # favicon, theme-init.js (anti-parpadeo de tema)
│   └── src/
│       ├── auth/            # AuthContext, rutas protegidas
│       ├── components/      # UI base, layout, íconos SVG propios
│       ├── lib/             # cliente de API, formato, hooks
│       └── pages/           # Login, Registro, Recuperar, Home, Detalle, Edición
├── server/                  # API Hono
│   └── src/
│       ├── auth/            # sesiones, registro/login/recuperación
│       ├── db/              # conexión SQLite, migraciones embebidas
│       ├── exercises/       # CRUD de ejercicios y entradas de RM
│       └── lib/             # crypto (scrypt), rate limiting, helpers HTTP
├── Dockerfile
└── package.json             # workspaces npm + scripts
```

## Requisitos

- Node.js **20 o superior** (recomendado 22).
- npm 9+.

## Desarrollo local

```bash
npm install        # instala client + server (workspaces)
npm run dev        # server en :8787 + client en :5173 (con proxy /api)
```

Abrí `http://localhost:5173`. La base se crea sola en `server/data/bvcross.db` (las migraciones corren automáticamente al iniciar).

### Usuario de prueba

En desarrollo se siembra automáticamente un usuario para testear sin pasar por el registro:

- **Alias:** `admin`
- **Contraseña:** `admin`

En la pantalla de login, en modo desarrollo, aparece un atajo que completa esas credenciales. Para crearlo manualmente en cualquier entorno: `npm run db:seed -w server`. No se siembra en producción.

Otros comandos útiles:

```bash
npm run typecheck   # chequeo de tipos de ambos paquetes
npm run build       # compila client y server
npm start           # producción local: todo en http://localhost:8787
```

> Tras el primer `npm install`, commiteá el `package-lock.json` generado: el Dockerfile y los deploys reproducibles dependen de él.

## Variables de entorno (server)

Copiá `server/.env.example` como referencia.

| Variable | Default | Descripción |
| --- | --- | --- |
| `PORT` | `8787` | Puerto HTTP |
| `DB_PATH` | `./data/bvcross.db` | Ruta del archivo SQLite. En hosting: `/data/bvcross.db` |
| `NODE_ENV` | — | `production` en deploy |
| `SESSION_DAYS` | `30` | Vida de la sesión |
| `COOKIE_SECURE` | `true` en prod | Cookie solo por HTTPS |
| `APP_ORIGINS` | — | Orígenes extra permitidos para mutaciones (CSV). Normalmente no hace falta |
| `TRUST_PROXY` | `true` en prod | Usa `x-forwarded-*` del proxy del hosting |

## Deploy

La app es **un solo servicio Node**: el server expone la API y sirve el frontend compilado. Lo único crítico es montar un **volumen persistente** para la base: sin volumen, el filesystem de Render/Railway/Fly es efímero y la DB se pierde en cada deploy o reinicio.

Configuración común:

- Build: `npm install && npm run build` (o `npm ci && npm run build` con lock commiteado)
- Start: `npm start`
- Env: `NODE_ENV=production`, `DB_PATH=/data/bvcross.db`
- Volumen/disco montado en `/data`

### Render

1. New → Web Service apuntando al repo (runtime Node).
2. Build Command: `npm ci && npm run build` — Start Command: `npm start`.
3. En **Disks**: agregar un disco (1 GB alcanza) con mount path `/data`.
4. Environment: `NODE_ENV=production`, `DB_PATH=/data/bvcross.db`.

### Railway

1. New Project → Deploy from GitHub (detecta Node automáticamente, o usa el `Dockerfile`).
2. En el servicio: **Volumes** → montar en `/data`.
3. Variables: `NODE_ENV=production`, `DB_PATH=/data/bvcross.db`.

### Fly.io

```bash
fly launch --no-deploy          # usa el Dockerfile del repo
fly volumes create bvcross_data --size 1
```

En `fly.toml` agregá:

```toml
[mounts]
  source = "bvcross_data"
  destination = "/data"

[env]
  DB_PATH = "/data/bvcross.db"
  NODE_ENV = "production"
```

Y después `fly deploy`.

## Docker

```bash
docker build -t bv-cross .
docker run -p 8787:8787 -v bvcross_data:/data bv-cross
```

La imagen es multi-stage sobre `node:22-slim` (glibc: better-sqlite3 instala su binario precompilado sin toolchain). Requiere `package-lock.json` commiteado.

## Seguridad

- Contraseñas y respuestas de seguridad hasheadas con **scrypt** (`node:crypto`), comparación en tiempo constante y timing uniforme aunque el alias no exista.
- Sesiones de 256 bits en cookie `httpOnly` + `SameSite=Lax` + `Secure`; en la DB se guarda solo el **hash** del token.
- **Rate limiting** por IP en login, registro y recuperación.
- Validación de entrada con **Zod** y límite de body de 16 KB.
- SQL 100 % con **prepared statements** (sin inyección posible) y ownership verificado en cada query.
- **CSP** estricta y headers de seguridad (`secureHeaders` de Hono), guard de `Origin` en mutaciones.
- Al recuperar la contraseña se invalidan todas las sesiones previas.

Tené en cuenta el trade-off elegido a propósito: la recuperación por pregunta de seguridad es tan fuerte como la respuesta. Usá respuestas que solo vos sepas.

## Notas

- Las migraciones corren solas al iniciar el server (`npm run db:migrate` existe por si querés ejecutarlas a mano).
- El historial impide borrar el último RM de un ejercicio: para sacarlo, se elimina el ejercicio completo.
- Preferencias de tema y redondeo se guardan en `localStorage` del dispositivo.
