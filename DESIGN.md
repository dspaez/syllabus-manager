---
name: Syllabus Manager
description: El cuaderno del docente digital — gestión de sílabo y generación de clases con IA
colors:
  chalkboard-blue: "#2563eb"
  chalkboard-blue-hover: "#1d4ed8"
  marker-violet: "#7c3aed"
  marker-violet-hover: "#6d28d9"
  presente-green: "#059669"
  presente-green-soft: "#15803d"
  correction-red: "#dc2626"
  correction-red-soft: "#b91c1c"
  overview-bg: "#f8fafc"
  overview-surface: "#ffffff"
  overview-border: "#e2e8f0"
  overview-divider: "#f1f5f9"
  overview-text: "#0f172a"
  overview-muted: "#64748b"
  overview-subtle: "#94a3b8"
  overview-bg-dark: "#020617"
  overview-surface-dark: "#0f172a"
  overview-text-dark: "#f1f5f9"
  overview-border-dark: "#334155"
  task-text: "#374151"
  task-border: "#d1d5db"
  task-muted: "#6b7280"
  task-bg: "#f9fafb"
  material-doc: "#1d4ed8"
  material-pptx: "#6d28d9"
  material-pdf: "#b91c1c"
  material-video: "#c2410c"
  material-slides-ia: "#15803d"
  material-generic: "#475569"
typography:
  display:
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.1em"
  mono:
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace"
    fontSize: "0.75rem"
rounded:
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.chalkboard-blue}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.chalkboard-blue-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.overview-muted}"
    rounded: "{rounded.xl}"
    padding: "10px 14px"
  card-surface:
    backgroundColor: "{colors.overview-surface}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  badge-pill:
    rounded: "{rounded.full}"
    typography: "{typography.label}"
    padding: "4px 10px"
---

# Design System: Syllabus Manager

## Overview

**Creative North Star: "El Cuaderno del Docente Digital"**

Syllabus Manager es el cuaderno de planificación de un solo docente, llevado en la pantalla en vez del papel: cálido y personal en la superficie de panorama (dashboard, tarjetas de materia), pero sin sacrificar nunca la densidad de información que un docente necesita para gestionar un semestre completo de un vistazo. No es un SaaS corporativo genérico — es una herramienta de trabajo diario que se permite un emoji por materia, un degradado suave en el header, y números en negrita extrema para los conteos que importan.

El sistema convive hoy en dos capas visuales igualmente válidas, no en conflicto: una capa de **panorama** (dashboard, layout de admin, tarjetas públicas) más expresiva — neutros slate, degradado azul→violeta, `rounded-2xl`, soporte completo de modo oscuro — y una capa de **tarea** (formularios de alta/edición) más utilitaria — neutros gray, botones planos, sin modo oscuro todavía. La primera es donde el docente mira y decide; la segunda es donde el docente completa un formulario y sigue. Cada una documenta su propio vocabulario abajo; no se deben mezclar dentro de un mismo componente.

Dirección confirmada hacia adelante: las tarjetas deben sentirse más "levantadas" en reposo (no solo al hover) — ver Elevación & Profundidad.

**Key Characteristics:**
- Cálido pero eficiente: personalidad sin perder densidad de datos.
- Dos capas de neutros conviviendo a propósito: slate (panorama) y gray (tarea).
- Emoji por materia como sistema de iconografía humano, no un set de íconos custom.
- Color de acento por materia es libre (`subject.color`); azul/violeta son solo el acento por defecto del producto, sin significado de marca.
- Tipografía suave y redondeada por defecto (`rounded-xl`/`rounded-2xl`), nunca angulosa.

## Colors

Paleta funcional sobre neutros fríos, con un rol de color fijo por tipo de material que nunca cambia aunque la materia tenga su propio color de acento.

### Primary
- **Chalkboard Blue** (#2563eb): acento por defecto del producto — CTA primario, nav activo, focus ring, enlaces. Hover en `chalkboard-blue-hover` (#1d4ed8). Sin significado de marca: es el acento de fábrica, reemplazable si aparece algo mejor.

### Secondary
- **Marker Violet** (#7c3aed): siempre acompaña al azul en degradados (marca del sidebar, CTA "+ Asignatura", header del dashboard). Hover en `marker-violet-hover` (#6d28d9).

### Status
- **Presente Green** (#059669): estado "activo" — punto pulsante de semestre activo, badges de éxito. Nombre por analogía con pasar lista.
- **Correction Red** (#dc2626 / #b91c1c): errores, acción destructiva (cerrar sesión en hover), badge de PDF. Analogía con la lapicera roja del docente.

### Neutral — Panorama (slate)
- **Notebook Paper** (#f8fafc): fondo de página en modo claro.
- **Clean Page** (#ffffff): superficie de tarjetas y paneles.
- **Graphite Ink** (#0f172a): texto principal.
- **Pencil Grey** (#64748b): texto secundario / metadatos.
- **Faint Pencil** (#94a3b8): texto terciario, iconografía inactiva.
- **Margin Line** (#e2e8f0): bordes de tarjetas y separadores fuertes.
- **Hairline** (#f1f5f9): divisores sutiles entre filas.
- **Chalkboard Night** (#020617): fondo en modo oscuro.

### Neutral — Tarea (gray)
- **Task Ink** (#374151): texto de labels y encabezados en formularios.
- **Task Border** (#d1d5db): bordes de inputs.
- **Task Muted** (#6b7280): texto de ayuda bajo los campos.

### Material Type Colors (Named Rule)
**The Material Badge Rule.** El color de una badge de tipo de material (DOC, PPTX, PDF, Video, "Slides IA", genérico) está fijado por tipo, nunca por el color de la materia que lo contiene. Un PDF es siempre rojo (#b91c1c / bg #fef2f2), un PPTX siempre violeta (#6d28d9 / bg #f5f3ff), un DOC siempre azul (#1d4ed8 / bg #eff6ff), un Video siempre naranja (#c2410c / bg #fff7ed), "Slides IA" siempre verde (#15803d / bg #f0fdf4). Esto le da al docente reconocimiento instantáneo del tipo de recurso sin importar en qué materia esté navegando.

## Typography

**Display/Body Font:** Geist Sans (declarado vía `next/font`, variable `--font-geist-sans`)
**Mono Font:** Geist Mono (`--font-geist-mono`), usado para valores de color hex en formularios.

**Character:** Sans-serif geométrica neutra — deja que el color y la densidad de negrita carguen la personalidad, no la forma de la letra.

> **Gap detectado (no confirmado como intencional):** `globals.css` fija `body { font-family: Arial, Helvetica, sans-serif; }` de forma literal, lo que pisa el token `--font-sans`/Geist salvo que un elemento use explícitamente la utilidad `font-sans`. En la práctica, el sitio hoy renderiza en Arial/Helvetica del sistema, no en Geist. Parece un remanente del boilerplate de `create-next-app`, no una decisión — repórtalo antes de asumir que Geist está activo.

### Hierarchy
- **Display** (900, 2.25rem/`text-4xl`, leading 1.1, tracking -0.02em): valores numéricos de métricas del dashboard.
- **Headline** (900, 1.5rem/`text-2xl`, leading 1.2): títulos de bienvenida y encabezados de sección en la capa panorama. La capa tarea usa 600 (`font-semibold`) en su lugar — ver nota de capas.
- **Title** (700, 1rem/`text-base`): nombre de materia en tarjetas, títulos de card.
- **Body** (400, 0.875rem/`text-sm`, leading 1.5): descripciones, texto de párrafo, 55-70ch aprox en formularios.
- **Label** (700, 0.6875rem/`text-[11px]`, tracking 0.1em, uppercase): eyebrows ("Menú", "Asignaturas recientes"), labels de sección.

### Named Rules
**The Black Weight Rule.** Los números y encabezados de la capa panorama usan `font-black` (900), no `font-bold` — es lo que le da al dashboard su peso visual "de instrumento". La capa tarea se queda en `font-semibold`/`font-medium`; no subir su peso sin decidir migrarla a la capa panorama primero.

## Layout

- **Shell de admin:** sidebar fija de 288px (`w-72`) + columna principal flexible. Sin colapso a menú hamburguesa observado — cualquier trabajo de `/impeccable adapt` en el sidebar debe empezar por decidir ese comportamiento en mobile, no asumirlo resuelto.
- **Padding de página:** `p-6 lg:p-8` (24px / 32px) en vistas de panorama; `p-8` fijo en formularios de tarea.
- **Grillas:** métricas del dashboard en `grid-cols-1 sm:grid-cols-3 gap-4`; contenido + panel lateral en `xl:grid-cols-[1fr_320px] gap-6`; tarjetas públicas de materia en grid responsive estándar.
- **Formularios:** columna única, `max-w-lg`, `space-y-5` entre campos — nunca multi-columna salvo pares cortos (color + semestre van en `grid-cols-2`).
- **Ritmo:** contenedores usan `space-y-6` entre bloques mayores; tarjetas usan `p-5` (20px) interno.

## Elevation & Depth

Estado actual: superficies casi planas — borde + `shadow-sm` en reposo, `shadow-md` y `-translate-y-0.5` solo al hover. Dirección confirmada hacia adelante: **más profundidad en reposo**, no solo como respuesta a interacción.

### Shadow Vocabulary
- **Resting Lift** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` — Tailwind `shadow`): nueva sombra de reposo por defecto para tarjetas de panorama (metric cards, subject cards, paneles), reemplazando el `shadow-sm` casi invisible actual.
- **Hover Lift** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` — Tailwind `shadow-lg`): estado hover de esas mismas tarjetas, combinado con el `-translate-y-0.5` ya existente.
- **CTA Glow** (`shadow-md shadow-blue-200` / `shadow-blue-950/40` en dark): sombra de color usada solo en los botones gradiente azul→violeta, no en tarjetas.

### Named Rules
**The Always-Lifted Rule.** Las tarjetas de la capa panorama nunca están completamente planas en reposo; la sombra crece al hover, pero nunca parte de cero. La capa tarea (formularios) puede seguir plana — es una superficie de un solo uso, no de exploración.

## Shapes

Escala de radios generosa y consistente en toda la app — nada de esquinas rectas.

- **`rounded-full`**: pastillas de estado, badges, puntos de indicador, avatares.
- **`rounded-2xl`** (16px): contenedor por defecto — tarjetas, paneles, banners. El radio "de reposo" del sistema.
- **`rounded-xl`** (12px): botones, íconos contenedores, inputs de la capa panorama.
- **`rounded-lg`** (8px): inputs y botones de la capa tarea (más compacta que la panorama).
- **`rounded-3xl`** (24px): uso raro, solo para el bloque de marca del sidebar cuando necesita destacar más que una tarjeta normal.

Sin bordes duros ni esquinas cuadradas en ningún componente observado — la suavidad es intencional y confirmada.

## Components

### Buttons
- **Shape:** `rounded-lg` (capa tarea) o `rounded-xl` (capa panorama).
- **Primary (tarea):** fondo sólido `chalkboard-blue`, hover `chalkboard-blue-hover`, texto blanco, `px-4 py-2 text-sm font-medium`.
- **Primary CTA (panorama):** degradado `from-blue-700 to-violet-700`, texto blanco, `shadow-md shadow-blue-200`, hover sube a `shadow-lg`.
- **Ghost/Secondary:** transparente o `bg-white`/`bg-slate-50`, borde `overview-border`, texto `overview-muted`, hover pasa a azul (texto + borde).
- **Destructive (hover-triggered):** texto neutro por defecto, en hover pasa a `correction-red` sobre fondo `bg-red-50` — nunca rojo sólido en reposo, solo se revela como advertencia al acercarse.

### Cards / Containers
- **Corner Style:** `rounded-2xl`.
- **Background:** `overview-surface` (blanco) / `overview-surface-dark` en modo oscuro.
- **Border:** siempre presente, `overview-border` (1px).
- **Shadow Strategy:** ver Elevation & Depth — Resting Lift en reposo, Hover Lift + `-translate-y-0.5` al hover.
- **Internal Padding:** `p-5` (20px).

### Badges / Pills
- **Style:** `rounded-full`, borde 1px + fondo suave + texto saturado del mismo color, `text-[10px] font-semibold uppercase` o `font-bold`.
- **Regla de color:** ver The Material Badge Rule — el color es por tipo de contenido, no por materia.

### Inputs / Fields
- **Style (capa tarea):** `rounded-lg border border-gray-300 px-3 py-2 text-sm`.
- **Focus:** `focus:ring-2 focus:ring-blue-500`, sin cambio de borde — el anillo es el único indicador de foco.
- **Color picker:** input `type="color"` nativo, `h-9 w-12 rounded border p-0.5`, con el hex mostrado al lado en `font-mono text-xs`.
- **Error:** banda `bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2`, no inline junto al campo.

### Navigation (Sidebar)
- **Style:** ítems `rounded-2xl px-3 py-3`, texto `text-sm font-medium`.
- **Active:** fondo `bg-blue-50`/`bg-blue-500/15` (dark), texto azul, barra vertical de 4px `bg-blue-500` pegada al borde izquierdo.
- **Hover (inactivo):** `hover:bg-slate-100 hover:translate-x-0.5` — un desplazamiento sutil de 2px como único feedback de movimiento.
- **Mobile:** sin comportamiento definido todavía (ver Layout).

### Subject Emoji (signature component)
Cada materia se identifica con un emoji elegido por palabra clave en su nombre (`subjectEmoji()`: ☕ Java, 🐍 Python, 💻 Web, 🗄️ Datos, 🌐 Redes, 📐 Matemática, ⚛️ Física, 🎨 Diseño, 🔒 Seguridad, 🤖 IA, ⚙️ Algoritmos, 🖥️ Sistemas, 📋 Proyectos, 📡 Comunicación, 📖 genérico). Es el sistema de iconografía real del producto — no hay un set de íconos SVG custom por materia, y no debe agregarse uno; el emoji es la decisión de personalidad "cálido pero eficiente" hecha componente.

### Subject Accent Dot (signature component)
Punto de acento: `h-2 w-2 shrink-0 rounded-full` (8px), fondo con el color de acento de la materia/unidad (`accentColor`/`subject.color`), ubicado junto al título en headers de materia/unidad y junto a rótulos de sección (p. ej. "Resumen" en la vista de material, cada ítem del acordeón de políticas). Reemplaza al patrón anterior de borde izquierdo de 4px (`borderLeft: 4px solid ${accentColor}`) sobre el contenedor completo: el acento ahora vive como un punto discreto pegado al texto, no como una franja de borde en toda la tarjeta.

## Do's and Don'ts

### Do:
- **Do** usar `slate` para cualquier superficie nueva de tipo panorama (dashboards, vistas de exploración) y mantener `gray` como válido en formularios existentes de la capa tarea — son dos capas confirmadas, no una inconsistencia a resolver de oficio.
- **Do** dar a las tarjetas de panorama una sombra visible en reposo (Resting Lift), no solo al hover, per la dirección confirmada.
- **Do** mantener el color de badge de tipo de material fijo (The Material Badge Rule) sin importar el `subject.color` de la materia contenedora.
- **Do** usar `font-black` para números y encabezados de panorama; reservar `font-semibold`/`font-medium` para la capa tarea.
- **Do** seguir usando emoji por materia como iconografía — es una decisión de personalidad confirmada, no un placeholder a reemplazar por un set de íconos.

### Don't:
- **Don't** mezclar `slate-*` y `gray-*` dentro de un mismo componente — cada capa tiene su propia escala de neutros.
- **Don't** dejar que el color de acento de una materia (`subject.color`, libre) pise los colores fijos de las badges de tipo de material.
- **Don't** asumir que Geist está renderizando sin verificar — `globals.css` hoy fuerza Arial/Helvetica en `body`; confírmalo o corrígelo antes de tocar tipografía.
- **Don't** usar esquinas rectas (`rounded-none` o radios menores a `rounded-lg`) en ningún componente nuevo — la suavidad es una decisión confirmada del sistema.
- **Don't** tratar azul/violeta como "la marca" al punto de bloquear su reemplazo — es el acento por defecto, no una decisión de identidad irrevocable.
