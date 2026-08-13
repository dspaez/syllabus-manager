# 005 — Cross-fade the ThemeToggle moon/sun icon instead of hard-swapping it

- **Status**: TODO
- **Commit**: 9a29158
- **Severity**: LOW (polish — state indication on a rare, non-critical toggle)
- **Category**: Missed opportunities / State indication
- **Estimated scope**: 1 file

## Problem

`src/components/ThemeToggle.tsx:40-52` — current code, verified at this exact line range and unchanged since the original `find-animation-opportunities` sweep:

```tsx
      <span suppressHydrationWarning>
        {!mounted || theme === 'light' ? (
          // Moon icon — shown before mount (SSR default) and in light mode
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M17.293 13.293A8 8 0 0 1 6.707 2.707a.75.75 0 0 0-.974-.91A9.5 9.5 0 1 0 18.203 14.267a.75.75 0 0 0-.91-.974Z" />
          </svg>
        ) : (
          // Sun icon — shown in dark mode
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M10 2.75a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 10 2.75Zm0 11a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1a.75.75 0 0 1 .75-.75ZM4.47 4.47a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 1 1-1.06 1.06L4.47 5.53a.75.75 0 0 1 0-1.06Zm9.293 9.293a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM2.75 10a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1A.75.75 0 0 1 2.75 10Zm11 0a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1-.75-.75ZM5.177 13.763a.75.75 0 1 1 1.06 1.06l-.707.707a.75.75 0 1 1-1.06-1.06l.707-.707Zm9.646-9.646a.75.75 0 0 1 0 1.06l-.707.707a.75.75 0 1 1-1.06-1.06l.707-.707a.75.75 0 0 1 1.06 0ZM10 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
          </svg>
        )}
      </span>
```

This is a React conditional-mount ternary: only one `<svg>` element exists in the DOM at any moment. Clicking the toggle unmounts one icon and mounts the other in the same tick — a hard cut, no bridge.

Verified this component is genuinely in use (unlike `WeeksAccordion.tsx` in `plans/002`, which turned out to be dead code): imported and rendered in both `src/app/admin/layout.tsx:7` and `src/app/(public)/PublicShell.tsx:6`, i.e. it's the theme toggle shown in both the admin header and the public site header.

`mounted` starts `false` on both server and client's first render, and only flips to `true` inside `useEffect` after hydration — so the server-rendered markup and the client's first paint always agree (both show the moon icon, since `!mounted` is `true` until the effect runs). This plan preserves that exact mechanism; it doesn't touch the hydration-safety logic, only how the two icons coexist and transition once mounted.

## Target

Replace the ternary with two permanently-mounted, absolutely-stacked icons whose `opacity`/`rotate` are driven by state, cross-fading between them:

```tsx
      <span suppressHydrationWarning className="relative inline-block size-5">
        {/* Moon icon — visible before mount (SSR default) and in light mode */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`absolute inset-0 size-5 transition-[opacity,transform] duration-200 ease-snappy motion-reduce:transition-opacity ${isDark ? 'opacity-0 rotate-45' : 'opacity-100 rotate-0'}`}
        >
          <path d="M17.293 13.293A8 8 0 0 1 6.707 2.707a.75.75 0 0 0-.974-.91A9.5 9.5 0 1 0 18.203 14.267a.75.75 0 0 0-.91-.974Z" />
        </svg>
        {/* Sun icon — visible in dark mode */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`absolute inset-0 size-5 transition-[opacity,transform] duration-200 ease-snappy motion-reduce:transition-opacity ${isDark ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-45'}`}
        >
          <path d="M10 2.75a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 10 2.75Zm0 11a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1a.75.75 0 0 1 .75-.75ZM4.47 4.47a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 1 1-1.06 1.06L4.47 5.53a.75.75 0 0 1 0-1.06Zm9.293 9.293a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM2.75 10a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1A.75.75 0 0 1 2.75 10Zm11 0a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1-.75-.75ZM5.177 13.763a.75.75 0 1 1 1.06 1.06l-.707.707a.75.75 0 1 1-1.06-1.06l.707-.707Zm9.646-9.646a.75.75 0 0 1 0 1.06l-.707.707a.75.75 0 1 1-1.06-1.06l.707-.707a.75.75 0 0 1 1.06 0ZM10 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
        </svg>
      </span>
```

Where `isDark` is a new derived constant, `const isDark = mounted && theme === 'dark';`, computed once above the `return` (see Steps — this replaces the inline `!mounted || theme === 'light'` ternary condition with a single named boolean reused by both icons).

Values, and why:
- **Both icons always mounted, stacked via `absolute inset-0` inside a `relative` sized wrapper** — this is the only way to cross-fade two elements; a conditional mount can only pop one in as the other pops out, with no overlap. The wrapper `<span>` gains `relative inline-block size-5` (it previously had no sizing classes at all, relying on the single child `<svg>`'s own `size-5`); with two absolutely-positioned children now, the wrapper itself must carry the size so the button's `items-center justify-center` still centers a correctly-sized box.
- **`duration-200`** — matches the original finding's suggested duration and sits at the upper end of AUDIT.md's "tooltips, small popovers" budget (125–200ms), appropriate for a small, infrequent icon swap.
- **`ease-snappy` (`cubic-bezier(0.23, 1, 0.32, 1)`)** — reuses this repo's one established custom easing token (from `plans/001-ai-modal-entrance.md`) instead of introducing a second, uncoordinated curve. Both the outgoing and incoming icon use the same strong ease-out — appropriate since both are, from their own perspective, "entering or exiting," which per this skill's easing decision order always resolves to `ease-out`, never a bespoke `ease-in-out`.
- **`rotate-45` / `-rotate-45`, never `rotate-90` or higher** — a subtle quarter-of-45° twist, matching the original finding's suggested angle, and landing on real default Tailwind utilities (`rotate-45`, `-rotate-45` are both default steps — no arbitrary value needed). The outgoing icon always rotates clockwise into hiding (`rotate-45`), the incoming icon always rotates in from counter-clockwise (`-rotate-45` → `rotate-0`) — a single consistent rotational direction across the whole toggle, not a symmetric bounce.
- **`transition-[opacity,transform]`, never `transition-all`** — only these two GPU-friendly properties actually change; explicit list avoids animating anything unintended.
- **`motion-reduce:transition-opacity`** — under `prefers-reduced-motion: reduce`, this narrows the animated `transition-property` down to `opacity` alone, so `rotate-45`/`-rotate-45` still apply as instant, unanimated value changes (no smooth rotation is ever rendered) while the cross-fade itself keeps playing at the same 200ms — "gentler, not zero," matching every other reduced-motion gate already established in `plans/001`, `002`, `003`, and `004`. (Rotation on a fully transparent element is invisible anyway, so this has no visible effect beyond removing the rotation of whichever icon is mid-fade.)
- **`aria-hidden="true"` added to both `<svg>` elements — new, not present in the current code** — the button already carries the real accessible name via its own `aria-label` (line 35, unchanged), so these icons are purely decorative. In the current code only one `<svg>` is ever in the DOM, so this was never strictly necessary; once both are permanently mounted side-by-side, marking both `aria-hidden="true"` keeps a screen reader from ever encountering two overlapping icons (one of them always at `opacity-0`, still technically present in the accessibility tree unless hidden) as it announces the button. This is a deliberate, disclosed accessibility addition made necessary by the structural change, not scope creep.

## Repo conventions to follow

- `--ease-snappy` is defined once, in `src/app/globals.css`'s `@theme inline` block (added in `plans/001-ai-modal-entrance.md`). Do **not** add it again. If it's missing, STOP and report instead of re-adding it.
- This is the fourth plan in this repo to use the `motion-reduce:` variant to narrow (not eliminate) an animation — see `plans/001` (`motion-reduce:starting:scale-100`), `plans/002`/`003` (`motion-reduce:transition-none` on `max-height` collapses), `plans/004` (`motion-reduce:starting:translate-y-0` on feedback messages). This plan's `motion-reduce:transition-opacity` follows the same "gentler, not zero" spirit but is mechanically different (it's a *toggle-driven* class swap on a permanently-mounted element, not an `@starting-style` mount transition) — do not try to force this into the `starting:` pattern from the other plans; it doesn't apply here since nothing is being newly mounted.
- The existing hydration-safety comments and `suppressHydrationWarning` attributes (on both the `<button>` and the `<span>`) must be preserved exactly as-is — do not remove or "clean up" them, and do not change the `mounted`/`theme` state logic, `toggleTheme`, or the `useEffect`. This plan only touches the render output of the icon-swap, nothing else in the component.

## Steps

1. In `src/components/ThemeToggle.tsx`, immediately above the `return (` statement (i.e. right after the `toggleTheme` function definition, before the JSX), add one new line: `const isDark = mounted && theme === 'dark';`
2. Replace the entire `<span suppressHydrationWarning>...</span>` block (lines 40-52 in the current file) with the Target block shown above, verbatim — including both `<path>` elements copied exactly as they are today (do not alter the icon artwork itself, only the wrapping `<svg>` tags' attributes and the parent `<span>`).
3. Leave everything else in the file — the `'use client'` directive, imports, `Theme` type, `STORAGE_KEY`, the `theme`/`mounted` state, the `useEffect`, `toggleTheme`, and the outer `<button>`'s own props (`onClick`, `className`, `aria-label`, `title`, `suppressHydrationWarning`) — completely untouched.

## Boundaries

- Do NOT touch any file other than `src/components/ThemeToggle.tsx`.
- Do NOT re-add or redefine `--ease-snappy` — it must already exist in `src/app/globals.css`. If missing, stop and report.
- Do NOT change the `mounted`/`theme` state logic, the `useEffect`, `toggleTheme`, `localStorage` handling, or any prop on the `<button>` itself (`onClick`, `aria-label`, `title`, the button's own `className`).
- Do NOT alter the SVG `<path>` d-attributes — the icon artwork is unchanged, only the wrapping element's classes and the new `aria-hidden` attribute.
- Do NOT add a new dependency, animation library, or JS-driven animation (no `useSpring`, no WAAPI `.animate()`) — this is a pure Tailwind className/CSS transition change.
- Do NOT use `transition-all` anywhere in this plan's edit.
- If the current code doesn't match the "Problem" excerpt above (line numbers shifted, className already different), STOP and report the drift instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` (expect clean — this is a JSX/className restructuring plus one new `const`, no type surface change) and `npm run lint` (expect the same pre-existing warning/error count on `ThemeToggle.tsx` specifically, before vs. after — note this file currently has a known pre-existing `set-state-in-effect` lint error unrelated to this change; confirm that exact error is still present and unchanged, not newly introduced by this edit).
- **Feel check**: run `npm run dev`, open any page with the header visible (admin or public), and:
  - Click the theme toggle and confirm the moon icon fades out while rotating slightly clockwise, and the sun icon fades in while rotating in from a slight counter-clockwise offset, over roughly 200ms — a smooth cross-fade, not a snap.
  - Click it again (dark → light) and confirm the reverse plays symmetrically.
  - Click it rapidly several times in a row and confirm no flicker, no icon getting "stuck" mid-rotation, no layout shift in the button's size — CSS `transition` (not `@keyframes`) should retarget smoothly from wherever it currently is if toggled again mid-animation.
  - Confirm the button itself doesn't change size or shift position at any point during the transition (the `<span>` wrapper's explicit `size-5` should keep the icon's footprint fixed).
  - In Chrome DevTools → More tools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce", toggle the theme again and confirm the icon swap is a plain fade with no visible rotation.
  - In DevTools → Elements, confirm both `<svg>` elements are present in the DOM at all times (inspect before and after clicking) and each carries `aria-hidden="true"`.
- **Done when**: the icon visibly cross-fades with a slight rotation instead of popping, rapid toggling never glitches, reduced motion drops the rotation but keeps the fade, both icons carry `aria-hidden="true"`, `tsc`/`lint` are clean relative to the pre-change baseline, and no file other than `ThemeToggle.tsx` was touched.
