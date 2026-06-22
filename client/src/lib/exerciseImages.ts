// Imágenes demostrativas por ejercicio. Se sirven optimizadas (WebP) desde
// public/exercises/ — ver scripts/gen-assets.mjs. El match es por nombre
// normalizado, así que sólo los ejercicios precargados (o renombrados a esos
// nombres) muestran imagen; el resto simplemente no ofrece el botón.

const BY_NAME: Record<string, string> = {
  'back sq': '/exercises/back-sq.webp',
  'front sq': '/exercises/front-sq-clean.webp',
  clean: '/exercises/front-sq-clean.webp',
  snatch: '/exercises/snatch.webp',
  'split jerk': '/exercises/split-jerk.webp',
  dl: '/exercises/dl.webp',
  'push press': '/exercises/push-press.webp',
  'press militar': '/exercises/press-militar.webp',
  'floor press': '/exercises/floor-press.webp',
  'hip thrust': '/exercises/hip-thrust.webp',
  thruster: '/exercises/thruster.webp',
};

/** Devuelve la URL de la imagen demostrativa del ejercicio, o null si no hay. */
export function exerciseImage(name: string): string | null {
  return BY_NAME[name.trim().toLowerCase()] ?? null;
}
