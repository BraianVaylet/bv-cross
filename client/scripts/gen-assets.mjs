// Genera los assets estáticos de la app a partir de las fuentes del repo:
//   1. Iconos PWA (icon-192, icon-512, icon-maskable-512) desde public/favicon.svg
//   2. Imágenes demostrativas de cada ejercicio, optimizadas a WebP.
//
// Las fuentes pesadas viven en client/assets/ (PNG de 1–2 MB) y NO se sirven;
// este script las comprime a public/exercises/*.webp para priorizar performance.
//
// Uso:  pnpm --filter @bvcross/client gen:assets
import { readdir, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const clientRoot = join(here, '..');
const SRC_DIR = join(clientRoot, 'assets');
const PUBLIC_DIR = join(clientRoot, 'public');
const EX_OUT = join(PUBLIC_DIR, 'exercises');
const FAVICON = join(PUBLIC_DIR, 'favicon.svg');

const BG = '#18181B'; // mismo fondo que el favicon

// PNG fuente -> slug del WebP de salida. "Front SQ - Clean" sirve a dos ejercicios.
const IMAGE_SLUGS = {
  'Back SQ': 'back-sq',
  'Front SQ - Clean': 'front-sq-clean',
  Snatch: 'snatch',
  'Split Jerk': 'split-jerk',
  DL: 'dl',
  'Push Press': 'push-press',
  'press militar': 'press-militar',
  'Floor Press': 'floor-press',
  'Hip Thruster': 'hip-thrust',
  thruster: 'thruster',
};

async function genIcons() {
  // Iconos "any": el favicon ya trae su recuadro redondeado.
  await sharp(FAVICON, { density: 384 })
    .resize(192, 192, { fit: 'contain', background: BG })
    .png()
    .toFile(join(PUBLIC_DIR, 'icon-192.png'));
  await sharp(FAVICON, { density: 384 })
    .resize(512, 512, { fit: 'contain', background: BG })
    .png()
    .toFile(join(PUBLIC_DIR, 'icon-512.png'));

  // Maskable: fondo a sangre completa + el ícono al ~78% (zona segura).
  const inner = await sharp(FAVICON, { density: 512 })
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: BG },
  })
    .composite([{ input: inner, gravity: 'centre' }])
    .png()
    .toFile(join(PUBLIC_DIR, 'icon-maskable-512.png'));

  console.log('✓ iconos PWA generados');
}

async function genExerciseImages() {
  await mkdir(EX_OUT, { recursive: true });
  const files = await readdir(SRC_DIR);
  for (const [base, slug] of Object.entries(IMAGE_SLUGS)) {
    const file = files.find((f) => f.toLowerCase() === `${base.toLowerCase()}.png`);
    if (!file) {
      console.warn(`! falta fuente para "${base}" (${slug})`);
      continue;
    }
    const out = join(EX_OUT, `${slug}.webp`);
    const info = await sharp(join(SRC_DIR, file))
      .resize({ width: 900, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(out);
    console.log(`✓ ${slug}.webp  (${(info.size / 1024).toFixed(0)} KB)`);
  }
}

await genIcons();
await genExerciseImages();
console.log('Listo.');
