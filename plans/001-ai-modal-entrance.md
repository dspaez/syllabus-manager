# 001 — Animate the entrance of the 5 AI-generation modals

- **Status**: TODO
- **Commit**: 64742da
- **Severity**: MEDIUM
- **Category**: Missed opportunities / Interruptibility (Accessibility + Cohesion touch multiple files)
- **Estimated scope**: 6 files (5 components + 1 shared token addition in `src/app/globals.css`)

## Problem

Five components implement an "AI generation" modal with the identical structure: a boolean `open` state, and `{open && <div className="fixed inset-0 z-50 ...">...}` — the backdrop and the panel both pop into existence with zero transition the instant `open` becomes `true`, and vanish the same way on close. There is no motion bridging the state change, so the modal appears to "teleport" onto the screen.

This was found during a `find-animation-opportunities` sweep of the whole app (Syllabus Manager — Next.js 16 App Router, React 19, Tailwind CSS v4.2.2, no animation library, no existing `--ease-*`/`--duration-*` custom tokens). All five modals are opened occasionally (a docente uses "Generar con IA" / "Class Kit" / "Documento técnico" / "Sugerir próxima semana" / "Planificador Curricular" a handful of times per session, not a high-frequency action), so this sits squarely in the "Occasional → standard animation" tier, not the "never animate" tier.

Two structural variants exist. Read each file's current code carefully before editing — do not assume the four "variant A" files are byte-identical beyond what's quoted below (headers, copy, and colors differ; only the wrapper/panel classes matter here).

**Variant A — single wrapper carries both backdrop color and centering** (4 files):

```tsx
// src/components/GenerateWithAI.tsx:270-274 — current
{open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
```

```tsx
// src/components/GenerateClassKit.tsx:196-198 — current
{open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="flex w-full max-w-3xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
```

```tsx
// src/components/GenerateTechnicalDoc.tsx:144-146 — current
{open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="flex w-full max-w-3xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
```

```tsx
// src/components/SuggestNextWeek.tsx:150-152 — current
{open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
```

**Variant B — separate backdrop element + `relative` panel** (1 file):

```tsx
// src/components/CurriculumPlanner.tsx:170-178 — current
{open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
        />

        {/* Panel */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
```

None of the 5 components delay unmounting on close (no exit-animation state machine, no library). This plan only adds an **entrance** transition via CSS `@starting-style` — closing stays an instant unmount exactly as it is today. Do not add exit animation; that would require new JS state and is out of scope.

## Target

**New shared token** — add to the existing `@theme inline { ... }` block in `src/app/globals.css` (this repo already has zero custom `--ease-*`/`--duration-*` tokens; Tailwind v4's default `ease-out` resolves to the "weak" `cubic-bezier(0, 0, 0.2, 1)`, which is too soft for a deliberate UI entrance per this skill's easing rules — introduce a named, stronger curve instead of reaching for the built-in):

```css
/* src/app/globals.css — inside the existing @theme inline block */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --ease-snappy: cubic-bezier(0.23, 1, 0.32, 1); /* NEW — strong ease-out for entrances */
}
```

This generates a Tailwind utility class `ease-snappy` usable anywhere in the app going forward — confirmed valid for the installed Tailwind version (`node_modules/tailwindcss` is `4.2.2`; the `--ease-*` namespace and the `starting:` variant are both present in the compiled engine, checked directly in `node_modules/tailwindcss/theme.css` and `node_modules/tailwindcss/dist/lib.js`).

**Variant A target** (backdrop + panel, both get the same duration/easing; only the panel scales):

```tsx
{open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-200 ease-snappy starting:opacity-0">
        <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto transition-[opacity,transform] duration-200 ease-snappy starting:opacity-0 starting:scale-95 motion-reduce:starting:scale-100">
```

(`max-w-2xl` vs `max-w-3xl` stays whatever that file already has — only the trailing classes are new.)

**Variant B target**:

```tsx
{open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-snappy starting:opacity-0"
            onClick={closeModal}
        />

        {/* Panel */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-[opacity,transform] duration-200 ease-snappy starting:opacity-0 starting:scale-95 motion-reduce:starting:scale-100">
```

Values, and why:
- **Duration 200ms** — matches this repo's own existing modal-adjacent rhythm (`PoliciesAccordion.tsx` uses `duration-300` for its expand, `SlidesPresentation.tsx` uses `duration-200 ease-in-out` for its slide transitions); 200ms sits inside the AUDIT.md modal budget (200–500ms) at the fast end, appropriate for a workaday admin tool, not a marketing surface.
- **`ease-snappy` = `cubic-bezier(0.23, 1, 0.32, 1)`** — the AUDIT.md "strong ease-out for UI" curve. Entrances always use ease-out (start fast, settle) — never `ease-in`.
- **`scale-95` (0.95), never `scale-0`** — inside the 0.9–0.97 recommended range and is a real default Tailwind scale step (no arbitrary value needed).
- **`transition-[opacity,transform]`, never `transition-all`** — animates only GPU-friendly properties; `transition-all` on the panel would also transition its `max-h`/layout-adjacent properties unintentionally.
- **`motion-reduce:starting:scale-100`** overrides `starting:scale-95` back to 100 under `prefers-reduced-motion: reduce`, so the scale never moves (100 → 100) while the opacity fade still plays — motion is reduced, not eliminated, per AUDIT.md's accessibility rule.
- **Modals are centered by design** (`items-center justify-center` on the wrapper) — `transform-origin: center` (the default) is correct here and must not be changed; do not add `transform-origin` overrides. This is the one case where a centered origin is exempt from the "scale from the trigger" rule.

## Repo conventions to follow

- Tokens: this repo keeps its only two existing CSS custom properties (`--background`, `--foreground`) inside the `@theme inline { ... }` block in `src/app/globals.css:9-14`. Add `--ease-snappy` to that same block, same style, same location — do not create a second `:root` block or a separate file.
- Duration/easing precedent already in the codebase: `src/app/(public)/subjects/[id]/PoliciesAccordion.tsx:91` (`className="overflow-hidden transition-all duration-300"`, driven by an inline `maxHeight` style) and `src/components/SlidesPresentation.tsx:719` (`className={\`w-full max-w-3xl transition-all duration-200 ease-in-out ${animClasses[anim]}\`}`) are the two closest exemplars of "this app animates a state change over 200–300ms with a named easing class." Neither uses `@starting-style` — this plan introduces that technique to the repo for the first time because it is the only technique that animates a conditionally-*rendered* (not just conditionally-styled) element without adding new JS state, which keeps this change to className-only edits.
- Every one of the 5 files already imports nothing animation-related — do not add `framer-motion`, `motion`, or any other dependency. This is a pure CSS/Tailwind change.

## Steps

1. **`src/app/globals.css`** — inside the existing `@theme inline { ... }` block (currently lines 9–14), add one line: `--ease-snappy: cubic-bezier(0.23, 1, 0.32, 1);` immediately after the existing `--font-mono: var(--font-geist-mono);` line. Do not touch `:root`, `html.dark`, or the `body` rule below it.

2. **`src/components/GenerateWithAI.tsx:271`** — append to the wrapper `<div>`'s className: ` transition-opacity duration-200 ease-snappy starting:opacity-0`. Append to the panel `<div>`'s className on line 272: ` transition-[opacity,transform] duration-200 ease-snappy starting:opacity-0 starting:scale-95 motion-reduce:starting:scale-100`. Change nothing else in the file (the header, close button, form fields, and footer buttons are out of scope).

3. **`src/components/GenerateClassKit.tsx:197-198`** — same two edits, same exact classes appended, on its wrapper (line 197) and panel (line 198) divs.

4. **`src/components/GenerateTechnicalDoc.tsx:145-146`** — same two edits, on its wrapper (line 145) and panel (line 146) divs.

5. **`src/components/SuggestNextWeek.tsx:151-152`** — same two edits, on its wrapper (line 151) and panel (line 152) divs.

6. **`src/components/CurriculumPlanner.tsx:171,174,178`** — three edits:
   - Line 171 (outer wrapper `fixed inset-0 z-50 flex items-center justify-center p-4`): **no change** — it carries no background/opacity, it's pure positioning.
   - Line 174 (backdrop div): append ` transition-opacity duration-200 ease-snappy starting:opacity-0` to its className, keeping the existing `onClick={closeModal}` prop untouched.
   - Line 178 (panel div): append ` transition-[opacity,transform] duration-200 ease-snappy starting:opacity-0 starting:scale-95 motion-reduce:starting:scale-100` to its className.

## Boundaries

- Do NOT touch any file other than the 5 listed components and `src/app/globals.css`.
- Do NOT change colors, copy, layout structure, form logic, or the `open`/`handleClose`/`closeModal` state machines in any of the 5 files — className additions only.
- Do NOT add exit-animation state, `setTimeout`-delayed unmounts, or any new `useState`/`useEffect` — the `@starting-style` approach animates entrance only, by design, with zero new JS.
- Do NOT add `framer-motion`, `motion`, or any other new dependency.
- Do NOT use `transition-all` anywhere in this plan's edits.
- Do NOT change `items-center justify-center` or add a `transform-origin` override — centered origin is correct for modals.
- If any file's current code doesn't match the excerpts quoted in "Problem" above (line numbers shifted, classNames already edited), STOP and report the drift instead of improvising a fix.

## Verification

- **Mechanical**: `npx tsc --noEmit` (expect no errors — these are JSX className string edits only, no type surface changes) and `npm run lint` (expect the same pre-existing warning/error count as before this change — grep the lint output for the 6 touched file paths and confirm none of them appear as new offenders).
- **Feel check**: run `npm run dev`, open `/admin/subjects/[id]` (or any admin page where one of these 5 "Generar..." buttons lives), and for each of the 5 modals:
  - Click the trigger button and confirm the backdrop fades in and the panel fades **and** grows slightly (from ~95% to 100%) rather than popping into place instantly.
  - Confirm the panel never appears to shrink from nothing or overshoot past 100% (no bounce) — this is a snap-in-and-settle motion, not a spring.
  - Click the same trigger rapidly several times in a row (only possible while closed, since these are simple boolean toggles) and confirm there's no visual glitch or flash — since this is entrance-only with no exit animation, closing should still be an instant, clean unmount exactly as before.
  - In Chrome DevTools → More tools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce", reopen each modal, and confirm the panel appears via a fade only (no visible grow/scale) while the backdrop still fades in.
  - In DevTools → Elements → Styles, confirm the computed `transition-property` on the panel is exactly `opacity, transform` (not `all`).
- **Done when**: all 5 modals visibly fade+scale in on open, `prefers-reduced-motion` strips the scale but keeps the fade, `tsc`/`lint` are clean relative to the pre-change baseline, and no file outside the 6 listed was touched.
