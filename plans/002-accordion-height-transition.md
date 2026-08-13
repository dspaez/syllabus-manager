# 002 — Bridge the accordion/collapse content teleport in WeeksAccordion and CurriculumPlanner

- **Status**: PARTIALLY MOOT — see note below
- **Commit**: 2b9f1fc
- **Severity**: MEDIUM
- **Category**: Missed opportunities / Interruptibility (Accessibility touches both targets)
- **Estimated scope**: 2 files

> **Post-execution correction (superseded)**: after this plan was executed (in worktree `agent-a0b6b07c811d6f388`) and browser-verified, Target 1 (`WeeksAccordion.tsx`) turned out to be dead code — never imported anywhere in the app. The real, live component rendering the public weeks list is `SubjectContent.tsx` (`WeekCollapsible`), which had the identical unfixed bug. `WeeksAccordion.tsx` has been deleted from the repo; **`plans/003-subject-content-week-collapse.md` is the corrected version of Target 1** and should be executed instead. **Target 2 (`CurriculumPlanner.tsx`) is unaffected and still valid** — it was verified live in the browser (backdrop/panel real, plan generated, unit collapse confirmed working) and is still pending merge from the same worktree. When merging this plan's changes, take only the `CurriculumPlanner.tsx` half of the worktree diff; do not resurrect `WeeksAccordion.tsx`.

## Problem

Two collapsible-content components in this app conditionally *render* their content on open/close (`{isOpen && <Content />}`) instead of always rendering it and transitioning a height, so the content pops into existence with no bridge. A third, sibling component in the very same app already solves this correctly — this plan copies that exact solution to the other two.

**The correct exemplar — already in the repo, do not modify it:**

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

The technique: the content `<div>` is **always mounted**. `overflow-hidden` clips it, and `style={{ maxHeight: open ? '2000px' : '0px' }}` combined with `transition-all duration-300` animates the reveal. `2000px` is an arbitrary cap comfortably larger than any real content — not a measured value. The chevron `<svg>` rotates 180° over `duration-200` in lockstep.

**Target 1 — `src/app/(public)/subjects/[id]/WeeksAccordion.tsx:377-388`** (current code, verified at this line range):

```tsx
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`size-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {isOpen && <WeekMaterials materials={week.materials} accentColor={accentColor} />}
                </div>
```

The chevron already rotates (just missing an explicit `duration-200`, defaulting to Tailwind's 150ms instead). The content line — `{isOpen && <WeekMaterials materials={week.materials} accentColor={accentColor} />}` — is the actual gap: `WeekMaterials` unmounts completely on close and mounts instantly on open, no transition at all. `WeekMaterials` (defined at `WeeksAccordion.tsx:192-230`) is pure presentation over the already-loaded `materials` prop — no data fetching, safe to keep permanently mounted.

**Target 2 — `src/components/CurriculumPlanner.tsx:288-333`** (current code, verified at this line range — note this file already has unrelated animation classes on its modal wrapper/backdrop/panel from plan 001; this plan only touches the lines quoted below, further down inside the modal body):

```tsx
                                                <div key={unit.order} className="border border-gray-200 rounded-xl overflow-hidden">
                                                    <button
                                                        onClick={() => toggleUnit(unit.order)}
                                                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="shrink-0 h-5 w-5 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">
                                                                {unit.order}
                                                            </span>
                                                            <span className="text-sm font-semibold text-gray-800">{unit.name}</span>
                                                            <span className="text-xs text-gray-400">{unit.weeks.length} semanas</span>
                                                        </div>
                                                        <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                                                    </button>
                                                    {isOpen && (
                                                        <div className="divide-y divide-gray-50">
                                                            {unit.weeks.map((week) => (
                                                                <div key={week.number} className="px-4 py-3">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="shrink-0 h-5 w-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
                                                                            {week.number}
                                                                        </span>
                                                                        <p className="text-sm font-medium text-gray-800">{week.title}</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1.5 mb-1.5 pl-7">
                                                                        {week.topics.map((t) => (
                                                                            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                                                {t}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    {week.depth && (
                                                                        <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-2.5 py-1 mb-1.5 ml-7">
                                                                            🎯 {week.depth}
                                                                        </p>
                                                                    )}
                                                                    {week.justification && (
                                                                        <p className="text-xs text-gray-400 leading-relaxed pl-7">
                                                                            {week.justification}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
```

Two problems here, both the same class as Target 1: the `▲`/`▼` glyph swaps with a hard cut instead of rotating, and `{isOpen && (...)}` unmounts/mounts the whole unit's week list instead of transitioning a height. This sits one level deeper than Target 1 — it's a secondary collapse nested inside a unit row, inside a modal already covered by `plans/001-ai-modal-entrance.md` — so it gets a lighter, snappier duration than Target 1 rather than copying `duration-300`/`duration-200` verbatim.

## Target

**Target 1 — `WeeksAccordion.tsx`**, exact 1:1 copy of the exemplar's technique and durations:

```tsx
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>

                  <div
                    className="overflow-hidden transition-all duration-300 motion-reduce:transition-none"
                    style={{ maxHeight: isOpen ? '2000px' : '0px' }}
                  >
                    <WeekMaterials materials={week.materials} accentColor={accentColor} />
                  </div>
                </div>
```

(Only the `<svg className>` gains ` duration-200`; the `<path>` and everything above is unchanged. `{isOpen && <WeekMaterials .../>}` is replaced by the always-mounted `<WeekMaterials />` wrapped in the transitioning `<div>`.)

**Target 2 — `CurriculumPlanner.tsx`**, same technique, lighter duration, plus a real rotating chevron replacing the static glyph swap:

```tsx
                                                        <ChevronIcon isOpen={isOpen} />
                                                    </button>
                                                    <div
                                                        className="overflow-hidden transition-all duration-200 motion-reduce:transition-none"
                                                        style={{ maxHeight: isOpen ? '2000px' : '0px' }}
                                                    >
                                                        <div className="divide-y divide-gray-50">
                                                            {unit.weeks.map((week) => (
                                                                <div key={week.number} className="px-4 py-3">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="shrink-0 h-5 w-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
                                                                            {week.number}
                                                                        </span>
                                                                        <p className="text-sm font-medium text-gray-800">{week.title}</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1.5 mb-1.5 pl-7">
                                                                        {week.topics.map((t) => (
                                                                            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                                                {t}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    {week.depth && (
                                                                        <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-2.5 py-1 mb-1.5 ml-7">
                                                                            🎯 {week.depth}
                                                                        </p>
                                                                    )}
                                                                    {week.justification && (
                                                                        <p className="text-xs text-gray-400 leading-relaxed pl-7">
                                                                            {week.justification}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
```

Where `ChevronIcon` is a new tiny local component added near the top of the file (see Steps) rendering PoliciesAccordion's exact chevron SVG at `duration-150` (one notch faster than Target 1's `duration-200`, matching this being the nested/secondary collapse):

```tsx
function ChevronIcon({ isOpen }: { isOpen: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`size-3.5 shrink-0 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        >
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
    );
}
```

Values, and why:
- **`overflow-hidden` + `style={{ maxHeight: isOpen ? '2000px' : '0px' }}` + `transition-all duration-300` (Target 1) / `duration-200` (Target 2)** — copied verbatim from the exemplar's technique. This animates a layout property (`max-height`), which is not GPU-accelerated — normally a performance finding per this skill's own standards, but it is the established, working pattern already shipping in this exact repo for this exact kind of component (`PoliciesAccordion.tsx`), and the user explicitly asked to reuse it rather than introduce a different technique (e.g. `grid-template-rows: 0fr→1fr`). Content blocks here are short (a handful of week rows / a materials list), so the performance cost is negligible in practice — this is a deliberate, scoped exception, not a new regression to flag.
- **`duration-300` for Target 1, `duration-200` for Target 2** — Target 1 (public weeks list) matches its sibling exactly. Target 2 is a secondary collapse nested inside a modal one level deeper and denser — a lighter duration reads as "quicker, less important" motion, appropriate for a nested disclosure, and stays inside the AUDIT.md dropdown/disclosure budget (150–250ms).
- **`motion-reduce:transition-none` on both content wrappers** — the exemplar (`PoliciesAccordion.tsx`) has no `prefers-reduced-motion` handling at all; this is a real, if minor, gap in it. Rather than silently copy that gap into two more places, this plan adds `motion-reduce:transition-none` so a reduced-motion user gets an instant expand/collapse instead of a 200–300ms height animation, without touching `PoliciesAccordion.tsx` itself (out of scope — flagged here for a possible future plan, not fixed now).
- **Target 2's chevron**: replacing a static `▲`/`▼` text glyph with a rotating SVG is a small, deliberate addition beyond the literal two-line diff, because the glyph swap is the exact same "hard cut" problem this plan exists to fix, and the finding this plan is based on explicitly called it out. `size-3.5` (vs. Target 1's `size-4` and the exemplar's `size-5`) keeps it visually proportional to `CurriculumPlanner`'s smaller, denser row (existing `h-5 w-5` unit-order badge on the same row).

## Repo conventions to follow

- The one and only exemplar: `src/app/(public)/subjects/[id]/PoliciesAccordion.tsx:79-93`. Match its `overflow-hidden` + `maxHeight` + `transition-all` technique exactly; do not invent a different collapse mechanism (no `grid-template-rows`, no JS height measurement, no animation library).
- `WeeksAccordion.tsx` already imports `useState`, `useMemo` from React (see its top imports) — no new imports needed for Target 1.
- `CurriculumPlanner.tsx` is still on the `gray-*` Tailwind palette (not yet migrated to `slate-*`/dark mode — that migration only covered the admin CRUD forms, not this component). Keep `ChevronIcon` and everything else in this plan on `gray-*` to match the file's current, consistent palette. Do not introduce `slate-*` classes here — that is a separate, unrelated migration this plan does not perform.
- Do not touch the modal wrapper/backdrop/panel `className`s in `CurriculumPlanner.tsx` (lines ~170-180) — those already carry the entrance-animation classes from `plans/001-ai-modal-entrance.md` and are out of scope here.

## Steps

1. **`src/app/(public)/subjects/[id]/WeeksAccordion.tsx:381`** — add ` duration-200` to the chevron `<svg>`'s className, changing `transition-transform ${isOpen ? 'rotate-180' : ''}` to `transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`. Change nothing else on that line.

2. **`src/app/(public)/subjects/[id]/WeeksAccordion.tsx:387`** — replace the single line `{isOpen && <WeekMaterials materials={week.materials} accentColor={accentColor} />}` with:
   ```tsx
                  <div
                    className="overflow-hidden transition-all duration-300 motion-reduce:transition-none"
                    style={{ maxHeight: isOpen ? '2000px' : '0px' }}
                  >
                    <WeekMaterials materials={week.materials} accentColor={accentColor} />
                  </div>
   ```
   Match the existing indentation of that line (10 spaces / level of the surrounding JSX in this file).

3. **`src/components/CurriculumPlanner.tsx`** — add the `ChevronIcon` component. Place it near the top of the file, immediately after the existing imports and before the main `CurriculumPlanner` function/interface definitions (read the file's top ~30 lines first to find the exact insertion point and match the file's existing function-declaration style):
   ```tsx
   function ChevronIcon({ isOpen }: { isOpen: boolean }) {
       return (
           <svg
               xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 20 20"
               fill="currentColor"
               className={`size-3.5 shrink-0 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
           >
               <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
           </svg>
       );
   }
   ```

4. **`src/components/CurriculumPlanner.tsx:300`** — replace `<span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>` with `<ChevronIcon isOpen={isOpen} />`.

5. **`src/components/CurriculumPlanner.tsx:302-332`** — replace the `{isOpen && ( <div className="divide-y divide-gray-50"> ... </div> )}` block with the always-mounted version:
   ```tsx
                                                    <div
                                                        className="overflow-hidden transition-all duration-200 motion-reduce:transition-none"
                                                        style={{ maxHeight: isOpen ? '2000px' : '0px' }}
                                                    >
                                                        <div className="divide-y divide-gray-50">
                                                            {unit.weeks.map((week) => (
                                                                <div key={week.number} className="px-4 py-3">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="shrink-0 h-5 w-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
                                                                            {week.number}
                                                                        </span>
                                                                        <p className="text-sm font-medium text-gray-800">{week.title}</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1.5 mb-1.5 pl-7">
                                                                        {week.topics.map((t) => (
                                                                            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                                                {t}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    {week.depth && (
                                                                        <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-2.5 py-1 mb-1.5 ml-7">
                                                                            🎯 {week.depth}
                                                                        </p>
                                                                    )}
                                                                    {week.justification && (
                                                                        <p className="text-xs text-gray-400 leading-relaxed pl-7">
                                                                            {week.justification}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
   ```
   Note only the outer `{isOpen && (...)}` → always-mounted `<div style={{maxHeight}}>` wrapper changes — the entire inner content (the `unit.weeks.map(...)` block and everything inside it) is copied through byte-for-byte unchanged, just re-indented one level deeper if your editor auto-formats (indentation depth is not load-bearing here, only valid JSX nesting is).

## Boundaries

- Do NOT touch `src/app/(public)/subjects/[id]/PoliciesAccordion.tsx` — it is the reference exemplar and is already correct; this plan copies its pattern, it does not modify it.
- Do NOT touch the modal wrapper/backdrop/panel classNames in `CurriculumPlanner.tsx` (already covered by `plans/001-ai-modal-entrance.md`).
- Do NOT migrate `CurriculumPlanner.tsx` off the `gray-*` palette — keep every new class on `gray-*`, matching the file's current, unmigrated state.
- Do NOT change `WeekMaterials`'s internals (`WeeksAccordion.tsx:192-230`) — only how it's mounted at line 387.
- Do NOT add any animation library, JS height measurement, or `ResizeObserver` — the `maxHeight` + `overflow-hidden` technique is the whole mechanism, copied from the exemplar.
- Do NOT change the `2000px` cap value — it's an intentional arbitrary safety margin from the exemplar, not a measured value; do not "fix" it to be more precise.
- If the current code at any of the cited line numbers doesn't match what's quoted in "Problem" above, STOP and report the drift instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` (expect clean — this is JSX/className restructuring with no new type surface beyond the trivial `ChevronIcon` prop type) and `npm run lint` (expect the same pre-existing warning/error count as before this change on these two files specifically — grep the lint output for `WeeksAccordion.tsx` and `CurriculumPlanner.tsx` and confirm neither gained a new warning/error).
- **Feel check**: run `npm run dev`, then:
  - Public site: open any subject page with a unit that has weeks (`/subjects/[id]`), expand a week. Confirm the materials list grows into view smoothly over ~300ms rather than popping in, and the chevron rotates 180° in sync. Collapse it and confirm the reverse happens smoothly, not instantly.
  - Admin: open "Planificar con IA" on a subject, generate or view a plan with units, click a unit row. Confirm its week list grows in over ~200ms (visibly quicker/snappier than the public accordion above), and the chevron (now an SVG, not `▲`/`▼`) rotates.
  - Expand multiple weeks/units in quick succession and confirm no visual glitching — since this uses a CSS `transition` (not `@keyframes`), rapidly toggling should retarget smoothly from whatever height it's mid-animation at, never jump or restart from zero.
  - In Chrome DevTools → More tools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce", re-test both accordions and confirm expand/collapse is instant (no visible height animation) rather than gliding.
  - In DevTools → Elements, confirm the content wrapper div's computed `max-height` is `2000px` when open and `0px` when closed (not `none` / `auto`).
- **Done when**: both accordions visibly grow/shrink their content instead of popping it, both chevrons rotate in sync with their content, `prefers-reduced-motion` makes both instant, `tsc`/`lint` are clean relative to the pre-change baseline, and no file outside `WeeksAccordion.tsx` / `CurriculumPlanner.tsx` was touched.
