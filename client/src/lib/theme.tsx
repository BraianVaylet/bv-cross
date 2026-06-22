import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
const THEME_KEY = 'bv-theme';
const ACCENT_KEY = 'bv-accent';

/** Colores de acento seleccionables. El naranja es la identidad original de bv-cross. */
export type AccentId = 'orange' | 'green' | 'blue' | 'red' | 'yellow' | 'magenta';

export const ACCENTS: { id: AccentId; label: string; base: string }[] = [
  { id: 'orange', label: 'Naranja', base: '#FF5722' },
  { id: 'green', label: 'Verde', base: '#2F9E6F' },
  { id: 'blue', label: 'Azul', base: '#307BD1' },
  { id: 'red', label: 'Rojo', base: '#D13030' },
  { id: 'yellow', label: 'Amarillo', base: '#E0A92E' },
  { id: 'magenta', label: 'Magenta', base: '#C430D1' },
];

const DEFAULT_ACCENT: AccentId = 'orange';
const FALLBACK_BASE = '#FF5722';
/** Tinta oscura cálida para texto sobre acentos claros. */
const DARK_INK = '#2A1206';

// ── Utilidades de color (deben coincidir con public/theme-init.js) ──
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Mezcla `hex` hacia `target` (0 = sin cambios, 1 = target puro). */
function mix(hex: string, target: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [tr, tg, tb] = hexToRgb(target);
  return rgbToHex(r + (tr - r) * amount, g + (tg - g) * amount, b + (tb - b) * amount);
}

/** Luminancia relativa WCAG (0 = negro, 1 = blanco). */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(l1: number, l2: number): number {
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Deriva los tonos del acento desde un único color base y los aplica como
 * variables CSS inline sobre el <html>, sobreescribiendo los valores fijos del
 * index.css. Las tintas dependen del tema (por eso se reaplica al togglear).
 */
function applyAccent(base: string, theme: Theme): void {
  const isDark = theme === 'dark';
  // En oscuro aclaramos un poco el acento, como hacen los tokens originales.
  const accent = isDark ? mix(base, '#ffffff', 0.12) : base;
  const lum = luminance(accent);
  const onAccent =
    contrast(lum, 1) >= contrast(lum, luminance(DARK_INK)) ? '#ffffff' : DARK_INK;
  const strong = isDark ? mix(accent, '#ffffff', 0.18) : mix(accent, '#000000', 0.16);
  const soft = isDark ? mix(accent, '#000000', 0.8) : mix(accent, '#ffffff', 0.86);

  const root = document.documentElement.style;
  root.setProperty('--c-accent', accent);
  root.setProperty('--c-accent-strong', strong);
  root.setProperty('--c-accent-soft', soft);
  root.setProperty('--c-on-accent', onAccent);
}

const THEME_COLOR: Record<Theme, string> = { light: '#F7F8F3', dark: '#191B16' };

function syncThemeColor(theme: Theme): void {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

function initialTheme(): Theme {
  // El script anti-FOUC de index.html ya resolvió y aplicó el tema antes del paint.
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function initialAccent(): AccentId {
  try {
    const stored = localStorage.getItem(ACCENT_KEY) as AccentId | null;
    if (ACCENTS.some((a) => a.id === stored)) return stored as AccentId;
  } catch {
    /* storage no disponible */
  }
  return DEFAULT_ACCENT;
}

interface ThemeValue {
  theme: Theme;
  toggle: () => void;
  accent: AccentId;
  setAccent: (id: AccentId) => void;
}

const ThemeContext = createContext<ThemeValue>({
  theme: 'light',
  toggle: () => {},
  accent: DEFAULT_ACCENT,
  setAccent: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [accent, setAccent] = useState<AccentId>(initialAccent);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage no disponible */
    }
    syncThemeColor(theme);
  }, [theme]);

  useEffect(() => {
    const base = ACCENTS.find((a) => a.id === accent)?.base ?? FALLBACK_BASE;
    applyAccent(base, theme);
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      /* storage no disponible */
    }
  }, [accent, theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggle, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
