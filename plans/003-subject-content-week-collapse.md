# 003 — Bridge the week-collapse content teleport in SubjectContent.tsx (the real, live component)

- **Status**: TODO
- **Commit**: 2b9f1fc
- **Severity**: MEDIUM
- **Category**: Missed opportunities / Interruptibility
- **Estimated scope**: 1 file

## Problem

This is a correction, not a new finding: `plans/002-accordion-height-transition.md`'s "Target 1" fixed this exact bug in `src/app/(public)/subjects/[id]/WeeksAccordion.tsx` — but a live browser feel-check (done after that plan was executed) discovered `WeeksAccordion.tsx` was never imported anywhere in the app. `git grep` confirmed zero references outside its own file and the planning docs; `src/app/(public)/subjects/[id]/page.tsx` actually imports and renders a *different* component, `SubjectContent.tsx`. `WeeksAccordion.tsx` has since been deleted from the repo as dead code (a superseded redesign attempt from an earlier commit that was never wired in). This plan applies the same fix, with the same reasoning, to the real component.

**The correct exemplar — already in the repo, do not modify it** (same one plan 002 used):

```tsx
// src/app/(public)/subjects/[id]/PoliciesAccordion.tsx:79-93 — reference pattern, already correct
<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`size-5 shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500 ${open ? 'rotate-180' : ''}`}
>
    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
</svg>
</button>

{/* Content with CSS transition */}
<div
    className="overflow-hidden transition-all duration-300"
    style={{ maxHeight: open ? '2000px' : '0px' }}
>
    <div className="grid gap-4 border-t border-slate-200 px-6 py-5 sm:grid-cols-2 dark:border-slate-800">
```

Always-mounted content `<div>`, `overflow-hidden` clips it, `style={{ maxHeight: open ? '2000px' : '0px' }}` + `transition-all duration-300` animates the reveal, chevron rotates 180° over `duration-200` in lockstep. `2000px` is an arbitrary comfortable cap, not a measured value.

**Target — `src/app/(public)/subjects/[id]/SubjectContent.tsx:196-236`** (current code, verified live in the browser and re-verified in the source at this exact line range — this is the component that actually renders at `/subjects/[id]`):

```tsx
function WeekCollapsible({
  week,
  accentColor,
  highlight,
  defaultOpen,
}: {
  week: Week;
  accentColor: string;
  highlight?: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left bg-white hover:bg-slate-50 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800/60"
        aria-expanded={open}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
          style={{ background: withAlpha(accentColor, '14'), color: accentColor }}
        >
          {week.number}
        </span>
        <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200 text-left">
          {week.title ?? `Semana ${week.number}`}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
          {week.materials.length} mat.
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`size-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="bg-slate-50 dark:bg-slate-800/40 px-3 pb-3 pt-2 space-y-2 border-t border-slate-100 dark:border-slate-700">
          {week.materials.map((mat) => (
            <MaterialRow key={mat.id} material={mat} accentColor={accentColor} highlight={highlight} />
          ))}
        </div>
      )}
    </div>
  );
}
```

Chevron rotates (line 223) but has no explicit duration (defaults to Tailwind's 150ms). Content (`{open && (<div className="bg-slate-50 ...">...</div>)}`, lines 228-234) unmounts/mounts with a hard cut — no `overflow-hidden`, no `maxHeight`, no `transition` at all. `MaterialRow` (defined at `SubjectContent.tsx:88` onward) is pure presentation over the already-loaded `material` prop passed down from `week.materials` — no data fetching, safe to keep permanently mounted.

`WeekCollapsible` has two call sites in this file (`SubjectContent.tsx:180` and `:399-405`), both passing `defaultOpen={false}` — no special-casing needed for an initially-open week; the `maxHeight: open ? '2000px' : '0px'` expression is derived from state on every render regardless of how `open` was initialized.

This component already has full dark-mode coverage (`dark:border-slate-700`, `dark:bg-slate-800/40`, etc., unlike `CurriculumPlanner.tsx` in plan 002) — every dark: class on the touched lines must be preserved exactly.

## Target

```tsx
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 motion-reduce:transition-none"
        style={{ maxHeight: open ? '2000px' : '0px' }}
      >
        <div className="bg-slate-50 dark:bg-slate-800/40 px-3 pb-3 pt-2 space-y-2 border-t border-slate-100 dark:border-slate-700">
          {week.materials.map((mat) => (
            <MaterialRow key={mat.id} material={mat} accentColor={accentColor} highlight={highlight} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

Values, and why (same reasoning as plan 002's Target 1 — this is the same fix, correctly relocated):
- **`overflow-hidden` + `style={{ maxHeight: open ? '2000px' : '0px' }}` + `transition-all duration-300`** — copied verbatim from the `PoliciesAccordion.tsx` exemplar's technique and exact duration. This animates `max-height`, a non-GPU property — normally a performance finding, but this is the established, working pattern already shipping in this exact repo for this exact kind of component, and it's the pattern this plan was explicitly asked to reuse rather than replace with a different technique. Content blocks here are short (a handful of material rows), so the real-world cost is negligible.
- **`duration-300`, matching `PoliciesAccordion.tsx` exactly** — this is a primary, top-level accordion (same tier as the exemplar), not a nested secondary collapse, so it gets the same duration as its sibling rather than the lighter `duration-200` plan 002 used for `CurriculumPlanner.tsx`'s nested unit rows.
- **`motion-reduce:transition-none`** — `PoliciesAccordion.tsx` itself has no `prefers-reduced-motion` handling (a real, minor, pre-existing gap in it, out of scope to fix here). Rather than copy that gap forward again, this plan adds `motion-reduce:transition-none` so a reduced-motion user gets an instant expand/collapse instead of a 300ms height animation.
- **The inner content wrapper's classes are otherwise untouched** — `bg-slate-50 dark:bg-slate-800/40 px-3 pb-3 pt-2 space-y-2 border-t border-slate-100 dark:border-slate-700` moves as-is onto the newly-nested inner `<div>`; no dark-mode class is dropped or altered.

## Repo conventions to follow

- The one and only exemplar: `src/app/(public)/subjects/[id]/PoliciesAccordion.tsx:79-93`. Match its `overflow-hidden` + `maxHeight` + `transition-all` technique exactly; do not invent a different collapse mechanism (no `grid-template-rows`, no JS height measurement, no animation library).
- `SubjectContent.tsx` already imports `useState` from React (line 4) — no new imports needed.
- This file is fully dark-mode-covered already — every new/moved class must keep its `dark:` counterpart exactly as it appears in the current code. Do not add a class without checking whether it needs a `dark:` variant first (in this diff, none of the newly-added classes — `overflow-hidden`, `transition-all`, `duration-300`, `motion-reduce:transition-none`, `duration-200` on the chevron — need one; they're not color classes).

## Steps

1. **`src/app/(public)/subjects/[id]/SubjectContent.tsx:223`** — add ` duration-200` to the chevron `<svg>`'s className, changing `transition-transform ${open ? 'rotate-180' : ''}` to `transition-transform duration-200 ${open ? 'rotate-180' : ''}`. Change nothing else on that line.

2. **`src/app/(public)/subjects/[id]/SubjectContent.tsx:228-234`** — replace:
   ```tsx
      {open && (
        <div className="bg-slate-50 dark:bg-slate-800/40 px-3 pb-3 pt-2 space-y-2 border-t border-slate-100 dark:border-slate-700">
          {week.materials.map((mat) => (
            <MaterialRow key={mat.id} material={mat} accentColor={accentColor} highlight={highlight} />
          ))}
        </div>
      )}
   ```
   with:
   ```tsx
      <div
        className="overflow-hidden transition-all duration-300 motion-reduce:transition-none"
        style={{ maxHeight: open ? '2000px' : '0px' }}
      >
        <div className="bg-slate-50 dark:bg-slate-800/40 px-3 pb-3 pt-2 space-y-2 border-t border-slate-100 dark:border-slate-700">
          {week.materials.map((mat) => (
            <MaterialRow key={mat.id} material={mat} accentColor={accentColor} highlight={highlight} />
          ))}
        </div>
      </div>
   ```
   Note this only adds one new wrapping `<div>` and removes the `{open && (...)}` conditional — the inner `bg-slate-50 ...` div and everything inside it (the `week.materials.map(...)` call) is unchanged, just now one level deeper.

## Boundaries

- Do NOT touch `src/app/(public)/subjects/[id]/PoliciesAccordion.tsx` — it is the reference exemplar and is already correct; this plan copies its pattern, it does not modify it.
- Do NOT touch `MaterialRow`'s internals (`SubjectContent.tsx:88` onward) — only how it's mounted inside `WeekCollapsible`.
- Do NOT touch `WeekCollapsible`'s two call sites (lines ~180 and ~399-405) — this plan only changes what's inside the component, not how it's invoked.
- Do NOT add any animation library, JS height measurement, or `ResizeObserver`.
- Do NOT change the `2000px` cap value — it's an intentional arbitrary safety margin from the exemplar, not a measured value.
- Do NOT re-create `src/app/(public)/subjects/[id]/WeeksAccordion.tsx` — it was deleted as confirmed dead code (zero imports anywhere in the repo); this plan supersedes plan 002's now-moot Target 1 and there is no reason to bring that file back.
- If the current code at `SubjectContent.tsx:196-236` doesn't match what's quoted in "Problem" above, STOP and report the drift instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` (expect clean) and `npm run lint` (expect the same pre-existing warning/error count on `SubjectContent.tsx` specifically, before vs. after this change).
- **Feel check**: run `npm run dev`, open any subject's public page (`/subjects/[id]`) that has at least one unit with weeks, and:
  - Click a week row. Confirm the materials list grows into view smoothly over ~300ms rather than popping in, and the chevron rotates 180° in sync.
  - Collapse it and confirm the reverse happens smoothly, not instantly.
  - Expand multiple weeks in quick succession and confirm no glitching — a CSS `transition` (not `@keyframes`) should retarget smoothly if toggled again mid-animation.
  - Use the search box at the top of the subject page (if it surfaces `SearchResults`/highlighted weeks) and confirm those week rows behave identically.
  - Toggle dark mode (the theme toggle in the header) with a week expanded and confirm the content area's background/border still switch correctly between `bg-slate-50`/`dark:bg-slate-800/40` — this diff must not have dropped any dark: class.
  - In Chrome DevTools → More tools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce", re-test and confirm expand/collapse is instant (no visible height animation).
  - In DevTools → Elements, confirm the content wrapper div's computed `max-height` is `2000px` when open and `0px` when closed.
- **Done when**: the public week accordion visibly grows/shrinks its content instead of popping it, the chevron rotates in sync, dark mode still renders correctly, `prefers-reduced-motion` makes it instant, `tsc`/`lint` are clean relative to the pre-change baseline, and no file outside `SubjectContent.tsx` was touched.
