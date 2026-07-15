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

/** Tokens de medano-ui que sobrescribe el acento elegido. Las vars legacy
    (--c-accent*) son alias de estos tokens en index.css. */
const MEDANO_ACCENT_VARS = [
  '--medano-accent-base',
  '--medano-accent-strong',
  '--medano-accent-subtle',
  '--medano-ink-on-accent',
  '--medano-border-focus',
] as const;

/**
 * Deriva los tonos del acento desde un único color base y los aplica sobre los
 * tokens de medano-ui en el <html>. Las tintas dependen del tema (por eso se
 * reaplica al togglear).
 */
function applyAccent(base: string, theme: Theme): void {
  const isDark = theme === 'dark';
  // En oscuro aclaramos un poco el acento, como hacen los tokens originales.
  const accent = isDark ? mix(base, '#ffffff', 0.12) : base;
  const lum = luminance(accent);
  const onAccent =
    contrast(lum, 1) >= contrast(lum, luminance(DARK_INK)) ? '#ffffff' : DARK_INK;
  const strong = isDark ? mix(accent, '#ffffff', 0.18) : mix(accent, '#000000', 0.16);
  const [r, g, b] = hexToRgb(accent);

  const root = document.documentElement.style;
  root.setProperty('--medano-accent-base', accent);
  root.setProperty('--medano-accent-strong', strong);
  root.setProperty('--medano-accent-subtle', `rgba(${r}, ${g}, ${b}, 0.16)`);
  root.setProperty('--medano-ink-on-accent', onAccent);
  root.setProperty('--medano-border-focus', `rgba(${r}, ${g}, ${b}, 0.75)`);
}

/** Quita las sobreescrituras: vuelve al acento nativo de medano (brasa). */
function clearAccent(): void {
  const root = document.documentElement.style;
  for (const varName of MEDANO_ACCENT_VARS) root.removeProperty(varName);
}

/** Fallback si el token no está disponible (tests). Aproxima --medano-surface-0. */
const THEME_COLOR_FALLBACK: Record<Theme, string> = { light: '#faf9f3', dark: '#201e1a' };

function syncThemeColor(theme: Theme): void {
  const surface = getComputedStyle(document.documentElement)
    .getPropertyValue('--medano-surface-0')
    .trim();
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', surface || THEME_COLOR_FALLBACK[theme]);
}

function initialTheme(): Theme {
  // El script anti-FOUC de index.html ya resolvió y aplicó el tema antes del paint.
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/** Acento inicial: id guardado válido, o null = acento nativo de medano (brasa). */
function initialAccent(): AccentId | null {
  try {
    const stored = localStorage.getItem(ACCENT_KEY) as AccentId | null;
    if (ACCENTS.some((a) => a.id === stored)) return stored as AccentId;
  } catch {
    /* storage no disponible */
  }
  return null;
}

interface ThemeValue {
  theme: Theme;
  toggle: () => void;
  /** Id elegido, o null = acento nativo de medano-ui (brasa). */
  accent: AccentId | null;
  setAccent: (id: AccentId) => void;
}

const ThemeContext = createContext<ThemeValue>({
  theme: 'light',
  toggle: () => {},
  accent: null,
  setAccent: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [accent, setAccent] = useState<AccentId | null>(initialAccent);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage no disponible */
    }
    syncThemeColor(theme);
  }, [theme]);

  useEffect(() => {
    if (accent === null) {
      clearAccent();
      return;
    }
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
