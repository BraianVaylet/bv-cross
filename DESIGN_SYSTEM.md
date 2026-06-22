# BV Design System

Guía de UI/UX de **bv-cross**, pensada como sistema de diseño reutilizable para todas las apps de la familia **BV** (bv-cross, bv-bow-sight, bv-archery, etc.).

El objetivo es que todas las apps compartan la misma identidad: tipografías, espaciados, colores, fondos, iconografía, componentes y patrones de interacción. Este documento describe **qué** define el diseño y **cómo** está implementado, para poder portarlo a otra app casi sin cambios.

Stack de referencia: **React 18 + React Router 6 + Vite 6 + Tailwind CSS v4**.

---

## 1. Principios de diseño

1. **Estética cálida tipo Claude.** Fondos crema/verdosos, no blancos puros. Acento naranja. Sensación de calma y foco.
2. **Mobile-first.** Todo el contenido vive en una columna centrada de ancho máximo `max-w-md` (28rem). Pensado para usarse con una mano, en el gimnasio / campo de tiro.
3. **Tokens semánticos, no colores crudos.** Nunca se usa `bg-white` o `text-gray-500`. Siempre tokens (`bg-surface`, `text-ink-muted`) que se adaptan solos a claro/oscuro.
4. **Dark mode de primera clase.** Se aplica antes del primer paint (sin parpadeo) y cada token tiene su valor en ambos temas.
5. **Componentes pequeños y compartidos.** Botones, inputs, cards, estados vacíos y skeletons viven en un único `ui.tsx`. Las páginas componen, no reinventan.
6. **Redondeado y suave.** Esquinas grandes (`rounded-xl` / `rounded-2xl`), bordes finos, transiciones de color en hover/active.
7. **Tipografía con personalidad.** Un serif display para títulos y números grandes; sans del sistema para el cuerpo; una fuente "Chewy" sólo para el logotipo.

---

## 2. Color (tokens semánticos)

Los colores se definen como variables CSS en `:root` (claro) y `.dark` (oscuro), y luego se exponen a Tailwind con `@theme inline`. **Esta es la pieza central del sistema** — copiar este bloque ya da el 80% de la identidad visual.

```css
/* client/src/index.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

/* ====== Tokens semánticos (estética cálida tipo Claude) ====== */
:root {
  --c-base: #F7F8F3;        /* fondo de la app */
  --c-surface: #FFFFFF;     /* cards, inputs, header */
  --c-raised: #ECEEE5;      /* superficie elevada / hover / skeleton */
  --c-ink: #1E241A;         /* texto principal */
  --c-ink-muted: #5C6356;   /* texto secundario / labels */
  --c-ink-dim: #8B9281;     /* texto terciario / placeholders */
  --c-line: #E2E5DA;        /* bordes y divisores */
  --c-accent: #FF5722;      /* acento (naranja) */
  --c-accent-strong: #E64A19; /* acento hover/active */
  --c-accent-soft: #FFE0D6; /* fondo suave de acento / selección */
  --c-on-accent: #3E0F00;   /* texto sobre el acento */
  --c-danger: #C9403F;      /* error / destructivo */
  --c-ok: #2F9E6F;          /* éxito */
}

.dark {
  --c-base: #191B16;
  --c-surface: #24271F;
  --c-raised: #2F332A;
  --c-ink: #E8EBE1;
  --c-ink-muted: #A0A697;
  --c-ink-dim: #71776A;
  --c-line: #353930;
  --c-accent: #FF6E4A;
  --c-accent-strong: #FF8A6E;
  --c-accent-soft: #3D1508;
  --c-on-accent: #FFE0D6;
  --c-danger: #E5615F;
  --c-ok: #56C08A;
}

@theme inline {
  --color-base: var(--c-base);
  --color-surface: var(--c-surface);
  --color-raised: var(--c-raised);
  --color-ink: var(--c-ink);
  --color-ink-muted: var(--c-ink-muted);
  --color-ink-dim: var(--c-ink-dim);
  --color-line: var(--c-line);
  --color-accent: var(--c-accent);
  --color-accent-strong: var(--c-accent-strong);
  --color-accent-soft: var(--c-accent-soft);
  --color-on-accent: var(--c-on-accent);
  --color-danger: var(--c-danger);
  --color-ok: var(--c-ok);
}
```

### Cómo se usan
Cada token genera utilidades de Tailwind automáticamente:

| Token | Clases generadas | Uso típico |
|---|---|---|
| `base` | `bg-base` | Fondo del `<body>` y de la app |
| `surface` | `bg-surface` | Cards, inputs, header |
| `raised` | `bg-raised` | Hover de botones ghost, fondo de segmented, skeletons |
| `ink` | `text-ink` | Texto principal, títulos |
| `ink-muted` | `text-ink-muted` | Labels, subtítulos, texto secundario |
| `ink-dim` | `text-ink-dim` | Placeholders, hints, texto terciario |
| `line` | `border-line` | Bordes de cards e inputs, divisores |
| `accent` | `bg-accent` `text-accent` | Botón primario, links, foco |
| `accent-strong` | `bg-accent-strong` | Hover/active del botón primario |
| `accent-soft` | `bg-accent-soft` | Fondos suaves, `::selection` |
| `on-accent` | `text-on-accent` | Texto sobre fondo de acento |
| `danger` | `text-danger` `bg-danger` | Errores, acción destructiva |
| `ok` | `text-ok` | Confirmaciones / éxito |

> **Regla de oro al portar a otra app:** mantené los nombres de los tokens. Si una app necesita otra identidad (p. ej. bv-bow-sight con acento distinto), cambiá **sólo los valores hex** de `--c-accent*`. El resto del sistema sigue funcionando sin tocar componentes.

### El acento: dos modos

El único color que varía entre apps (o dentro de una app) es el **acento**. El sistema soporta dos modos; ambos son válidos y comparten el resto de la identidad (fondos, tintas, tipografía, componentes).

**Modo A — acento fijo.** Un único acento horneado en las variables CSS. Para una app con acento fijo, se cambian sólo las 4 variables `--c-accent`, `--c-accent-strong`, `--c-accent-soft`, `--c-on-accent` (y sus equivalentes dark). Útil cuando la app tiene una identidad de marca única e inamovible.

**Modo B — acento seleccionable por el usuario (bv-cross y bv-bow-sight).** La app ofrece una paleta de acentos y el usuario elige; la elección se persiste (`localStorage('bv-accent')`) y se aplica en runtime. En vez de hornear el acento en el CSS, se define **un solo color base por opción** y se **derivan** los tonos restantes en JS (hover, tinta para texto, color del texto sobre el acento) calculando contraste real. Así cada acento queda legible en claro y oscuro sin definir 4 valores a mano por color. bv-cross arranca en naranja (`#FF5722`, su identidad original) y ofrece además verde, azul, rojo, amarillo y magenta; bv-bow-sight arranca en verde.

Implementación de referencia (`packages/web/src/theme.tsx` en bv-bow-sight):

```ts
// Paleta de acentos seleccionables (el verde es el original)
export type AccentId = 'green' | 'blue' | 'red' | 'orange' | 'yellow' | 'magenta';
export const ACCENTS: { id: AccentId; label: string; base: string }[] = [
  { id: 'green',   label: 'Verde',    base: '#30bd1a' },
  { id: 'blue',    label: 'Azul',     base: '#307bd1' },
  { id: 'red',     label: 'Rojo',     base: '#d13030' },
  { id: 'orange',  label: 'Naranja',  base: '#d18330' },
  { id: 'yellow',  label: 'Amarillo', base: '#d1bc30' },
  { id: 'magenta', label: 'Magenta',  base: '#c430d1' },
];

// A partir del color base se derivan los demás tonos con math de color:
function applyAccent(base: string, theme: Theme): void {
  const lum = luminance(base);
  // texto sobre el acento: blanco o tinta oscura, el que dé mejor contraste
  const onPrimary = contrast(lum, 1) >= contrast(lum, luminance(DARK_INK)) ? '#ffffff' : DARK_INK;
  const strong = mix(base, '#000000', 0.16);                       // hover (más oscuro)
  const ink = theme === 'dark' ? mix(base, '#fff', 0.3)            // tinta para texto/links:
                               : mix(base, '#000', 0.35);          // aclara en dark, oscurece en light
  const root = document.documentElement.style;
  root.setProperty('--primary', base);
  root.setProperty('--primary-strong', strong);
  root.setProperty('--primary-ink', ink);
  root.setProperty('--on-primary', onPrimary);
}
```

El `ThemeProvider` expone `{ theme, toggle, accent, setAccent }` vía contexto, persiste el acento en `localStorage('bv-accent')` y re-aplica `applyAccent` cuando cambia el acento **o** el tema (porque la tinta depende del tema). La UI de selección es una grilla de swatches (un botón por `ACCENTS`).

> **Regla para la familia BV:** una app puede usar Modo A o Modo B, pero **el modo elegido no se quita**. bv-bow-sight nace con selector de acento → se mantiene el selector y su paleta. bv-cross adoptó el Modo B (2026-06-22) conservando el naranja como acento por defecto. El resto del sistema (fondos, tintas, tipografía, componentes) es común; sólo cambia cómo se resuelve el acento.
>
> En bv-cross la derivación del acento vive en `client/src/lib/theme.tsx` (no `theme.tsx` en `packages/web`) y, para evitar el flash del naranja por defecto cuando hay otro acento guardado, **se duplica la misma matemática de color en `public/theme-init.js`** (se aplica antes del primer paint). Si tocás una, actualizá la otra.

---

## 3. Tipografía

Tres familias, declaradas con `@theme`:

```css
@theme {
  --font-display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia,
    "Times New Roman", serif;
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}
```

- **`font-sans` (cuerpo)** — sans del sistema. Es la fuente por defecto del `<body>`. No requiere descarga: rápida y nativa en cada plataforma.
- **`font-display` (títulos y números)** — serif clásico (`Iowan Old Style` / `Palatino` / `Georgia`). Se aplica con la clase `font-display`. Se usa en: títulos de página (`h1`), nombres en estados vacíos, y **números grandes** (RM en kg). Le da el toque editorial/cálido.
- **"Chewy" (sólo logo)** — fuente redondeada y divertida cargada desde Google Fonts, usada **únicamente** dentro del SVG del logo para el wordmark "BV". No se usa en ningún otro lugar de la UI.

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chewy&display=swap" />
```

### Escala tipográfica usada
| Contexto | Clases |
|---|---|
| Título de página (h1) | `font-display text-2xl font-semibold` |
| Título auth | `font-display text-[22px] font-semibold` |
| Título de card / dialog | `font-display text-lg font-semibold` |
| Número destacado (RM) | `font-display text-2xl font-semibold` |
| Nombre de ítem en lista | `text-[17px] font-medium` |
| Cuerpo / inputs | `text-[15px]` |
| Texto secundario | `text-sm` (14px) |
| Hints / metadatos | `text-xs` (12px) |

Patrón frecuente: un eyebrow en `text-sm text-ink-muted` encima de un `h1` display. Ej:
```tsx
<p className="text-sm text-ink-muted">Hola, {user?.alias}</p>
<h1 className="font-display text-2xl font-semibold text-ink">Tus ejercicios</h1>
```

---

## 4. Layout y espaciado

### Estructura general
- **Ancho máximo:** `max-w-md` (28rem / 448px) centrado con `mx-auto`. Es el contenedor de header y main.
- **Padding horizontal:** `px-4` en zonas de app, `px-6` en pantallas de auth.
- **Altura mínima:** `min-h-dvh` (usa dynamic viewport height para móvil correcto).
- **Safe areas iOS:** se respeta el notch/home indicator con `env(safe-area-inset-bottom)` y `viewport-fit=cover`.

```tsx
// AppLayout.tsx — esqueleto de toda página autenticada
<div className="min-h-dvh">
  <Header />
  <main className="mx-auto w-full max-w-md px-4 pb-28 pt-5">
    <Outlet />
  </main>
</div>
```

### Header (sticky)
```tsx
<header className="sticky top-0 z-40 border-b border-line bg-base/85 backdrop-blur">
  <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
    {/* logo a la izquierda, acciones (tema, logout) a la derecha */}
  </div>
</header>
```
Notas: altura `h-14`, fondo semi-transparente `bg-base/85` + `backdrop-blur` para efecto vidrio, borde inferior `border-line`.

### Ritmo vertical
- Secciones de una página se separan con `space-y-5`.
- Listas de ítems con `space-y-2.5`.
- Campos de formulario con `space-y-4`.
- Interior de un campo (label + input + error) con `space-y-1.5`.

### Escala de espaciado (referencia rápida)
Se usa la escala estándar de Tailwind. Valores más frecuentes: `gap-1`, `gap-2`, `gap-2.5`, `gap-3`; paddings `p-4` (cards), `px-3.5` (inputs), `px-4`/`px-5` (botones).

---

## 5. Radios, bordes, sombras, transiciones

- **Radios:** `rounded-lg` (8px) para elementos chicos (foco, segmented interno), `rounded-xl` (12px) para botones/inputs, `rounded-2xl` (16px) para cards, dialogs y ítems de lista.
- **Bordes:** siempre `border border-line` (1px). Estados vacíos usan `border-dashed`.
- **Sombras:** mínimas. `shadow-sm` para el thumb del segmented activo; `shadow-lg shadow-accent/25` para el CTA flotante; `shadow-xl` para el dialog modal.
- **Transiciones:** `transition-colors` en todo lo interactivo. Hover cambia fondo/borde/texto; `active:` para feedback táctil en móvil.
- **Foco accesible:** anillo de acento `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50`.

---

## 6. Iconografía

Sistema de íconos propio, en línea (sin librería externa), todos con el mismo estilo: **stroke 2, line-cap/join redondeados, viewBox 24, sin fill** (estilo Feather/Lucide).

```tsx
// components/Icons.tsx — wrapper base
function Icon({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}
```

- Heredan color con `currentColor` → se tiñen con `text-*`.
- Tamaño con clases: `h-4 w-4` (en botones), `h-5 w-5` (acciones de header, chevrons), `h-10 w-10` (estado vacío).
- Set actual: `Sun`, `Moon`, `Plus`, `ChevronRight`, `ChevronLeft`, `Pencil`, `Trash`, `Logout`, `Check`, `Barbell`, `Alert`.

> Al portar a otra app: mantené el wrapper `Icon` y el estilo (stroke 2, redondeado). Cambiá sólo los íconos de dominio (en bv-cross es `Barbell`; en bv-bow-sight sería un blanco/diana/flecha). Si necesitás más íconos, copiá paths de [Lucide](https://lucide.dev) que comparten exactamente este estilo.

---

## 7. Componentes (la librería `ui.tsx`)

Todos viven en `client/src/components/ui.tsx`. Resumen de la API y las decisiones de estilo.

### Botones — `buttonCx()` y `<Button>`
Helper `buttonCx({ variant, size, full })` que devuelve las clases, y un componente `<Button>` con estado `loading` (muestra `<Spinner>`).

- **Variants:** `primary` (acento, por defecto), `secondary` (borde + surface), `ghost` (transparente, hover raised), `danger` (rojo).
- **Sizes:** `sm` (h-9), `md` (h-11, default), `lg` (h-12).
- Base: `inline-flex items-center justify-center gap-2 rounded-xl font-medium`, foco con ring de acento, `disabled:opacity-50`.

```tsx
<Button>Guardar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="danger" loading={deleting}>Eliminar</Button>
// También como clase suelta para <Link>:
<Link to="/exercises/new" className={buttonCx({ size: 'lg', full: true })}>Nuevo</Link>
```

### Campos de formulario — `<Input>`, `<Textarea>`, `<Select>`
Comparten un `FieldShell` (label + control + error/hint) y un estilo `inputCx`:
- Alto `h-11`, `rounded-xl`, `bg-surface`, `border-line`.
- Foco: `focus:border-accent focus:ring-2 focus:ring-accent/25`.
- Error: borde `border-danger` y mensaje en `text-danger`.
- `<Input>` soporta `suffix` (ej. "kg") posicionado a la derecha.
- `<Select>` usa `appearance-none`.
- Ids generados con `useId()` para accesibilidad (label↔control).

### Superficies y estado
- **`<Card>`** — `rounded-2xl border border-line bg-surface p-4`.
- **`<ErrorBanner>`** — caja `border-danger/30 bg-danger/10 text-danger` con `AlertIcon`.
- **`<Spinner>`** / **`<FullScreenSpinner>`** — SVG con `animate-spin`.
- **`<Skeleton>`** — `animate-pulse rounded-xl bg-raised`. Se usa para placeholders de carga (ej. lista en Home).
- **`<EmptyState>`** — caja con borde **dashed**, ícono en `text-ink-dim`, título display, texto y acción opcional.

### Controles compuestos
- **`<Segmented>`** — control segmentado genérico (`bg-raised p-1`, thumb activo `bg-surface shadow-sm`). Para alternar 2-3 opciones.
- **`<ConfirmDialog>`** — modal de confirmación. Overlay `bg-black/40 backdrop-blur-sm`, panel `rounded-2xl bg-surface shadow-xl`. En móvil aparece desde abajo (`items-end`), en desktop centrado (`sm:items-center`). Cierra con Escape y bloquea el scroll del body.
- **`<Logo>`** — marca SVG inline (no `<img>`) en dos tamaños: `lg` (wordmark completo "BV cross" para login) y `md` (compacto "BV" + ícono, para el header). El naranja es fijo (`var(--color-accent)`) y las partes claras usan `currentColor` para adaptarse al tema.

### Otros componentes de página
- **`<AppLayout>`** — header sticky + main centrado. Envuelve las rutas protegidas.
- **`<AuthShell>`** — layout centrado vertical para login/registro/recuperación: logo grande, título display, subtítulo, contenido y footer.
- **`<BackLink>`** — link "volver" con `ChevronLeft`, `text-ink-muted hover:text-ink`.

### Utilidad `cx()`
Mini-helper para concatenar clases ignorando falsy (en vez de `clsx`):
```ts
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
```

---

## 8. Dark mode

Implementación sin parpadeo (FOUC) en tres piezas:

1. **`@custom-variant dark`** en el CSS define el modo oscuro como `.dark` en `<html>`.
2. **`theme-init.js`** (cargado en `<head>` **antes** del bundle) lee `localStorage('bv-theme')` o el `prefers-color-scheme` y agrega la clase `dark` antes del primer paint. También sincroniza el `<meta name="theme-color">`.
3. **`useTheme()`** hook que togglea la clase, persiste en `localStorage` y actualiza `theme-color`.

```js
// public/theme-init.js — corre antes del render
(function () {
  try {
    var saved = localStorage.getItem('bv-theme');
    var dark = saved ? saved === 'dark'
                     : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#191B16' : '#F7F8F3');
  } catch (e) {}
})();
```

```ts
// lib/useTheme.ts — toggle + persistencia
const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
// efecto: document.documentElement.classList.toggle('dark', ...), localStorage, meta theme-color
```

> Clave de portabilidad: la key de localStorage es `bv-theme` (compartida en la familia BV) y los hex del `theme-color` deben coincidir con `--c-base` de cada tema.

---

## 9. Patrones de interacción y UX

- **CTA flotante.** En listas largas, el botón primario flota abajo con un degradado de fondo (`bg-gradient-to-t from-base`) para separarlo del contenido, respetando safe-area. Ver `Home.tsx`.
- **Estados de carga explícitos.** Las listas muestran skeletons (no spinners) mientras `data === null`. Las acciones muestran spinner inline en el botón (`loading`).
- **Estados vacíos con acción.** Nunca una pantalla en blanco: `<EmptyState>` con ícono, copy y CTA.
- **Errores inline.** `<ErrorBanner>` arriba del formulario o la sección; errores de campo bajo el input.
- **Confirmación destructiva.** Toda eliminación pasa por `<ConfirmDialog>`.
- **Feedback táctil.** `active:` states en ítems y botones para respuesta inmediata en móvil.
- **Copy cercano, en español rioplatense (voseo).** "Registrá tu primer RM", "¿No tenés cuenta?". El tono es directo y motivador.

---

## 10. Localización y formato

- Idioma `es` (`<html lang="es">`), copy en voseo argentino.
- Números con `Intl.NumberFormat('es-AR')` → coma decimal (`78,25`).
- Fechas mostradas como `dd/mm/yyyy`; almacenadas/manejadas como ISO `yyyy-mm-dd`.
- Helpers en `lib/format.ts` (`fmtKg`, `fmtDate`, `todayISO`, `parseRm`, `roundTo`, `percentWeight`). Los de formato (`fmtKg`, `fmtDate`, `todayISO`) son genéricos y conviene compartirlos entre apps; los de dominio (RM, %) son específicos de bv-cross.

---

## 11. Cómo portar el sistema a una app nueva (checklist)

Para replicar la UI en **bv-bow-sight** o cualquier app futura:

1. **Stack.** Asegurá React 18 + Vite + Tailwind v4 (`@tailwindcss/vite`).
2. **CSS base.** Copiá `index.css` entero: tokens `:root`/`.dark`, `@theme inline`, `@theme` (fuentes), `@layer base`. → identidad inmediata.
3. **Acento.** Decidí el modo (ver §3):
   - *Fijo:* cambiá `--c-accent`, `--c-accent-strong`, `--c-accent-soft`, `--c-on-accent` (claro y oscuro). Dejá fondos y tintas igual.
   - *Seleccionable (como bv-bow-sight):* copiá `theme.tsx` (paleta `ACCENTS` + `applyAccent` + `ThemeProvider`) y la UI de swatches. **Si la app ya lo tiene, no lo quites** — sólo asegurate de que conviva con el resto del sistema.
4. **Dark mode.** Copiá `public/theme-init.js` (cargado en `<head>`), `lib/useTheme.ts` y el `<meta name="theme-color">`. Ajustá los hex del meta al `--c-base` de la app.
5. **Helpers.** Copiá `lib/cx.ts` y los formateadores genéricos de `lib/format.ts`.
6. **Librería UI.** Copiá `components/ui.tsx` completo (botones, campos, card, banner, spinner, skeleton, empty state, segmented, dialog) y `components/Icons.tsx`.
7. **Logo.** Reemplazá el SVG de `<Logo>` por el de la app (mantené el patrón: naranja/acento fijo + `currentColor`). Para BV, los logos viven en el repo `bv-logos`.
8. **Íconos de dominio.** Cambiá `BarbellIcon` por el ícono propio de la app (ej. diana/flecha en bv-bow-sight). Tomá paths de Lucide para mantener el estilo.
9. **Shells.** Copiá `AppLayout`, `AuthShell`, `BackLink`. Ajustá los ítems del header.
10. **Fuentes.** Mantené `font-sans` del sistema y `font-display` serif. Cargá `Chewy` sólo si el logo lo usa.
11. **Idioma/formato.** `<html lang="es">`, voseo, `Intl` con locale `es-AR`.

Resultado: misma sensación visual y de interacción, con sólo el acento, el logo y el ícono de dominio cambiando entre apps.

---

## 12. Estado de convergencia entre apps

bv-bow-sight **adoptó la paleta cálida completa de bv-cross** (2026-06-21): mismos fondos crema/verdosos, mismas tintas, tipografía serif `font-display`, tema claro por defecto y anti-FOUC inline. Conserva su **selector de acento** (6 colores) como feature propia.

### Ya convergido ✓
| Aspecto | Estado común |
|---|---|
| Paleta de color (fondos, tintas, líneas, danger) | valores cálidos de bv-cross en claro y oscuro |
| Tema por defecto | **claro** (cremoso), respetando `prefers-color-scheme` |
| Tipografía | `font-display` serif en títulos + `font-sans` del sistema; Chewy sólo en el logo |
| Anti-FOUC | script inline en `<head>` que fija el tema antes del paint |
| `theme-color` por tema | `#F7F8F3` claro / `#191B16` oscuro |
| Key de localStorage del tema | `bv-theme` |
| Tooling | Tailwind v4 |

### Diferencias que persisten (a propósito o pendientes)
| Aspecto | bv-cross | bv-bow-sight |
|---|---|---|
| Acento | **seleccionable** (naranja por defecto + verde/azul/rojo/amarillo/magenta), derivado en JS | **seleccionable** (verde por defecto + azul/rojo/naranja/amarillo/magenta), derivado en JS — *se mantiene* |
| Nombres de tokens | `--c-base`, `--c-surface`, `--c-raised`, `--c-line`, `--c-ink`, `--c-ink-muted`, `--c-ink-dim`, `--c-accent…` | `--bg`, `--surface`, `--surface-2`, `--border`, `--fg`, `--muted`, `--primary…` |
| Mecanismo de tema | clase `.dark` + `@custom-variant dark` | atributo `data-theme="dark"` |
| Tinta terciaria | 3 niveles (`ink` / `ink-muted` / `ink-dim`) | 2 niveles (`fg` / `muted`) |
| Tooling extra | — | Biome (lint/format) |

**Mapeo de tokens entre apps** (para portar código):
`--bg ↔ --c-base` · `--surface ↔ --c-surface` · `--surface-2 ↔ --c-raised` · `--border ↔ --c-line` · `--fg ↔ --c-ink` · `--muted ↔ --c-ink-muted` · `--primary ↔ --c-accent` · `--primary-strong ↔ --c-accent-strong` · `--primary-soft ↔ --c-accent-soft` · `--on-primary ↔ --c-on-accent`.

**Pendiente opcional** (no urgente): unificar nombres de tokens a un set canónico (el de bv-cross es más semántico) y, si se quiere acento sin ningún parpadeo, inlinear también la derivación del acento en el script anti-FOUC.

> Para una **app nueva**: partí de bv-cross (paleta + componentes) y sumale el selector de acento de bv-bow-sight (`theme.tsx`) si la app lo necesita.

---

## 13. Inventario de archivos clave (referencia)

| Archivo | Rol |
|---|---|
| `client/index.html` | meta tags, theme-color, carga de fuente Chewy y `theme-init.js` |
| `client/public/theme-init.js` | aplica dark mode antes del paint |
| `client/src/index.css` | **tokens de color, fuentes, base** — corazón del sistema |
| `client/src/components/ui.tsx` | librería de componentes |
| `client/src/components/Icons.tsx` | set de íconos SVG |
| `client/src/components/AppLayout.tsx` | header sticky + main centrado |
| `client/src/components/AuthShell.tsx` | layout de pantallas de auth |
| `client/src/components/BackLink.tsx` | link de volver |
| `client/src/lib/useTheme.ts` | hook de tema |
| `client/src/lib/cx.ts` | helper de clases |
| `client/src/lib/format.ts` | formateadores (números, fechas) |
