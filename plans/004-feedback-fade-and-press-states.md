# 004 — Fade in inline save/error feedback; add press feedback to form submit buttons

- **Status**: TODO
- **Commit**: 8d52bd3
- **Severity**: LOW-MEDIUM (feedback gap, not feel-breaking — no HIGH-severity finding here)
- **Category**: Feedback / Interruptibility
- **Estimated scope**: 16 files (11 for the button fix, 15 for the feedback fix, with 10 files appearing in both lists)

## Problem

Two related, but distinct, feedback gaps. Both were re-verified against the current code (post the slate/dark-mode migration in commit `4a88149`) immediately before writing this plan — every location below was read fresh, not carried over from the original sweep.

### Part A — Inline save/error feedback appears with a hard cut

This app has no toast library. Save confirmations and error messages are plain conditionally-rendered `<span>`/`<p>`/`<div>` elements that pop into existence the instant React mounts them, then vanish instantly when the state resets. There are four distinct visual shapes, all with the same underlying problem:

**Shape 1 — form error banner, byte-identical across 9 files:**

```tsx
{error && (
    <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2">
        {error}
    </p>
)}
```

Occurrences (exact file:line, verified current):
- `src/app/admin/subjects/new/page.tsx:193-197`
- `src/app/admin/semesters/new/page.tsx:103-107`
- `src/app/admin/subjects/[id]/edit/page.tsx:222-226`
- `src/app/admin/semesters/[id]/edit/page.tsx:142-146`
- `src/app/admin/subjects/[id]/units/new/page.tsx:111-115`
- `src/app/admin/subjects/[id]/units/[unitId]/edit/page.tsx:142-146`
- `src/app/admin/subjects/[id]/units/[unitId]/weeks/new/page.tsx:117-121`
- `src/app/admin/subjects/[id]/units/[unitId]/weeks/[weekId]/edit/page.tsx:146-150`
- `src/app/admin/subjects/[id]/units/[unitId]/weeks/[weekId]/materials/new/page.tsx:182-186`

(Indentation varies slightly file to file — some use 4-space, some 2-space base indent, matching each file's own existing style. Match each file's own indentation when editing; do not reformat.)

**Shape 2a — `src/app/admin/profile/page.tsx:205-212`:**

```tsx
                    {status === 'saved' && (
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">✓ Cambios guardados</span>
                    )}
                    {status === 'error' && (
                        <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                            Error: {errorMsg}
                        </span>
                    )}
```

**Shape 2b — `src/app/admin/settings/EditSetting.tsx:52-57`:**

```tsx
                {status === 'saved' && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Guardado</span>
                )}
                {status === 'error' && (
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">Error al guardar</span>
                )}
```

**Shape 3 — modal error paragraph, byte-identical across 4 files** (these components were never migrated to `slate`/dark-mode, so there is no `dark:` variant to preserve here — do not add one):

```tsx
{error && (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">{error}</p>
)}
```

Occurrences:
- `src/components/GenerateWithAI.tsx:351-353`
- `src/components/GenerateClassKit.tsx:219-221`
- `src/components/GenerateTechnicalDoc.tsx:214-216`
- `src/components/SuggestNextWeek.tsx:175-177`

**Shape 4 — `src/components/CurriculumPlanner.tsx:272-277`:**

```tsx
                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                                    {error}
                                </div>
                            )}
```

None of these 15 occurrences (9 + 2 + 4 + 1... — wait: Shape 1 is 9 files, Shape 2 is 2 files, Shape 3 is 4 files, Shape 4 is 1 file = **16 occurrences total**) has any transition. All are plain conditional mounts (`{condition && <element>}`) with no exit-animation state machine, no library — the same shape this repo already solved once, for the 5 AI-generation modals in `plans/001-ai-modal-entrance.md`, using `@starting-style`. This plan reuses that exact, already-proven technique and its `--ease-snappy` token (`cubic-bezier(0.23, 1, 0.32, 1)`, defined in `src/app/globals.css`'s `@theme inline` block) rather than inventing a new one.

`profile/page.tsx` and `EditSetting.tsx` auto-reset `status` back to `'idle'` after a `setTimeout` (3000ms and 2500ms respectively) — this plan does **not** touch that logic and does **not** add an exit animation; consistent with plan 001's precedent, only the entrance is animated, and removal stays an instant unmount.

### Part B — Form submit buttons have no press feedback

Frequency check, done at plan-writing time, not carried over from the original sweep: `grep -c "active:" src/**/*.tsx` across the whole repo returns zero real matches (the only `active:` string in the codebase is the unrelated `is_active` database field name). Every primary submit button in the 11 CRUD forms relies solely on `hover:bg-blue-700` and `transition-colors` — clicking gives no tactile confirmation before the async save resolves.

**9 of the 11 buttons are byte-identical:**

```tsx
className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
```

Occurrences:
- `src/app/admin/subjects/new/page.tsx:204`
- `src/app/admin/semesters/new/page.tsx:114`
- `src/app/admin/subjects/[id]/edit/page.tsx:233`
- `src/app/admin/semesters/[id]/edit/page.tsx:153`
- `src/app/admin/subjects/[id]/units/new/page.tsx:122`
- `src/app/admin/subjects/[id]/units/[unitId]/edit/page.tsx:153`
- `src/app/admin/subjects/[id]/units/[unitId]/weeks/new/page.tsx:128`
- `src/app/admin/subjects/[id]/units/[unitId]/weeks/[weekId]/edit/page.tsx:157`
- `src/app/admin/subjects/[id]/units/[unitId]/weeks/[weekId]/materials/new/page.tsx:193`

**The other 2 are shaped differently:**

`src/app/admin/profile/page.tsx:195`:
```tsx
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:cursor-not-allowed"
```

`src/app/admin/settings/EditSetting.tsx:43`:
```tsx
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
```

**Important — a real Tailwind gotcha, not optional to get right:** `transition-colors` and a hypothetical `transition-transform` both set the *same* CSS property (`transition-property`) to different values. Applying both classes on one element does not merge them — one silently wins and the other is dropped, so a naive `transition-colors transition-transform` would break either the hover-color fade or the press-scale (whichever utility loses the cascade). The fix is one combined arbitrary property list, `transition-[background-color,transform]`, replacing `transition-colors` outright — see Target below.

## Target

### Part A — feedback entrance

Wrap every occurrence's className with the entrance-transition classes, keeping every existing class exactly as-is (colors, padding, borders, `dark:` variants where present) and adding only the ones shown in **bold-equivalent** (there's no bold in code blocks, so read: everything after the original className content, before the closing quote, is new):

**Shape 1** (9 files) — before → after:
```tsx
<p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2">
```
→
```tsx
<p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2 transition-[opacity,transform] duration-150 ease-snappy starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0">
```

**Shape 2a** (`profile/page.tsx`) — before → after, both spans:
```tsx
<span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">✓ Cambios guardados</span>
```
→
```tsx
<span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium transition-[opacity,transform] duration-150 ease-snappy starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0">✓ Cambios guardados</span>
```
and
```tsx
<span className="text-sm text-red-600 dark:text-red-400 font-medium">
```
→
```tsx
<span className="text-sm text-red-600 dark:text-red-400 font-medium transition-[opacity,transform] duration-150 ease-snappy starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0">
```

**Shape 2b** (`EditSetting.tsx`) — same pattern, both spans:
```tsx
<span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Guardado</span>
```
→
```tsx
<span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium transition-[opacity,transform] duration-150 ease-snappy starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0">✓ Guardado</span>
```
and
```tsx
<span className="text-xs text-red-600 dark:text-red-400 font-medium">Error al guardar</span>
```
→
```tsx
<span className="text-xs text-red-600 dark:text-red-400 font-medium transition-[opacity,transform] duration-150 ease-snappy starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0">Error al guardar</span>
```

**Shape 3** (4 files) — before → after:
```tsx
<p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">{error}</p>
```
→
```tsx
<p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200 transition-[opacity,transform] duration-150 ease-snappy starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0">{error}</p>
```

**Shape 4** (`CurriculumPlanner.tsx`) — before → after:
```tsx
<div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
```
→
```tsx
<div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl transition-[opacity,transform] duration-150 ease-snappy starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0">
```

Values, and why:
- **`duration-150`** — inside the AUDIT.md "tooltips, small popovers" budget (125–200ms); these are small, transient inline messages, not modals, so they get the fast end.
- **`ease-snappy`** — reuses the token this repo already established in `plans/001-ai-modal-entrance.md` rather than introducing a second custom curve or falling back to Tailwind's weak built-in `ease-out`.
- **`starting:opacity-0 starting:-translate-y-1`** — `-translate-y-1` is Tailwind's `-0.25rem` (`-4px`) step, matching the original finding's suggested offset exactly and landing on a real default utility (no arbitrary value needed). Entering elements settle downward into place, which reads as "arriving," not "falling."
- **`motion-reduce:starting:translate-y-0`** — overrides the starting translate back to `0` under `prefers-reduced-motion: reduce`, so only the opacity fade plays, per this skill's accessibility rule (gentler, not zero).
- **No exit animation added anywhere** — every one of these unmounts instantly today (React conditional render, no library, no delay). This plan only adds an entrance via `@starting-style`, which requires zero new JS state — exactly the same scope discipline `plans/001` used.

### Part B — button press feedback

**The 9 identical buttons** — before → after:
```tsx
className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
```
→
```tsx
className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-[background-color,transform] duration-100 ease-snappy active:scale-[0.98]"
```

**`profile/page.tsx:195`** — before → after:
```tsx
className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:cursor-not-allowed"
```
→
```tsx
className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-[background-color,transform] duration-100 ease-snappy active:scale-[0.98] disabled:cursor-not-allowed"
```

**`EditSetting.tsx:43`** — before → after:
```tsx
className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
```
→
```tsx
className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-[background-color,transform] duration-100 ease-snappy active:scale-[0.98] disabled:cursor-not-allowed"
```

Values, and why:
- **`transition-[background-color,transform]` replacing `transition-colors`** — the Tailwind gotcha explained in Problem: two separate `transition-*` property utilities don't merge, they silently override each other. One combined arbitrary property list is the only correct way to animate both the existing hover color change and the new press scale on the same element. This is a small, deliberate widening of `transition-colors` (which also covered `border-color`/`color`, unused by these particular buttons — solid `bg-blue-600`/`text-white` only) down to just `background-color` (the property actually changing on hover here) plus `transform`.
- **`duration-100`** — the fast end of AUDIT.md's press-feedback budget (100–160ms); this also becomes the hover-color transition's new speed (previously Tailwind's unstated default, effectively 150ms) — a minor, disclosed, harmless side effect: hover feedback gets slightly snappier, not slower.
- **`ease-snappy`** — same reused token, for cohesion with the rest of this app's motion.
- **`active:scale-[0.98]`** — inside AUDIT.md's recommended 0.95–0.98 press-scale range, at the subtle end since these are wide, dense-form buttons where a bigger scale would feel heavy. `:active` never fires on a genuinely `disabled` button in any browser, so no `disabled:` guard is needed to prevent it firing on disabled buttons.

## Repo conventions to follow

- `--ease-snappy` is defined once, in `src/app/globals.css`'s `@theme inline` block. It already exists (added in `plans/001-ai-modal-entrance.md`) — do **not** add it again or redefine it. If it's missing, STOP and report; do not silently re-add it (that would indicate drift worth flagging, not fixing blind).
- The `@starting-style`/`starting:` technique for animating a conditionally-rendered element without new JS state is precedented in this exact repo: `plans/001-ai-modal-entrance.md` (5 AI-generation modals) and `plans/003-subject-content-week-collapse.md` (indirectly, via the same `motion-reduce:` pairing pattern). Follow the same shape: `starting:<from-state>` + a `motion-reduce:starting:<neutral-state>` override, never a from-scratch keyframe or animation library.
- Tailwind version is confirmed `4.2.2` in this repo (`node_modules/tailwindcss/package.json`) — the `starting:` variant and arbitrary `transition-[...]` property lists are both supported; this was verified directly against the installed engine while writing `plans/001`.
- Shape 3's 4 files (the AI-generation modals) have no `dark:` classes anywhere in them — do not add any as part of this plan; that's a separate, unrelated migration.

## Steps

Work through Part A first (15 files, 16 edit sites — profile.tsx and EditSetting.tsx each have 2 sites), then Part B (11 files, 11 edit sites). 10 files appear in both parts (all except profile.tsx and EditSetting.tsx, which appear in both anyway, so really all 11 Part-B files overlap with Part A) — when a file needs both edits, make them in the same pass over that file rather than opening it twice.

1. For each of the 9 Shape-1 files listed in Problem/Part A, locate the exact quoted `<p className="text-sm text-red-600...">` block and replace its className with the Shape 1 "after" string above. Confirm the surrounding `{error && (...)}` structure matches before editing; if not, stop and report.
2. In `src/app/admin/profile/page.tsx`, locate both spans quoted under Shape 2a (lines ~205-212) and apply both replacements.
3. In `src/app/admin/settings/EditSetting.tsx`, locate both spans quoted under Shape 2b (lines ~52-57) and apply both replacements.
4. For each of the 4 Shape-3 files (`GenerateWithAI.tsx`, `GenerateClassKit.tsx`, `GenerateTechnicalDoc.tsx`, `SuggestNextWeek.tsx`), locate the exact quoted error `<p>` and replace its className with the Shape 3 "after" string.
5. In `src/components/CurriculumPlanner.tsx`, locate the error `<div>` quoted under Shape 4 (lines ~272-277) and replace its className with the Shape 4 "after" string.
6. For each of the 9 identical Part-B buttons, replace the className with the Part B "9 identical buttons" after-string.
7. In `src/app/admin/profile/page.tsx`, replace the submit button's className (line ~195) with its Part B after-string.
8. In `src/app/admin/settings/EditSetting.tsx`, replace the submit button's className (line ~43) with its Part B after-string.

## Boundaries

- Do NOT touch any file not explicitly listed above.
- Do NOT change any color, padding, border-radius, font-size, or `dark:` class beyond what's shown in the "after" strings — every edit is additive (new transition/starting/motion-reduce/active classes) except the one deliberate replacement of `transition-colors` → `transition-[background-color,transform]` on the 11 buttons, which is explicitly called out above, not a silent change.
- Do NOT add `--ease-snappy` again — it already exists in `src/app/globals.css`. If it's missing, stop and report instead of re-adding it.
- Do NOT add exit animations, `setTimeout` delays, or new `useState`/`useEffect` anywhere — entrance-only, zero new JS state, exactly like `plans/001`.
- Do NOT add `dark:` classes to the 4 Shape-3 modal files — they are intentionally unmigrated; that's out of scope here.
- Do NOT touch `status`/`error` state logic, the `setTimeout` auto-reset in `profile.tsx`/`EditSetting.tsx`, or any handler function — className-only edits.
- If any quoted "current" excerpt doesn't match the code you find at its cited location (line numbers shifted, className already different), STOP and report the drift for that specific location — do not improvise a fix, and do not let one drifted location block progress on the other 26 (report all drift at the end, applying every location that did match).

## Verification

- **Mechanical**: `npx tsc --noEmit` (expect clean — className-only edits, no type surface change) and `npm run lint` (expect the same pre-existing warning/error count on every one of the 16 touched files, before vs. after).
- **Feel check**: run `npm run dev`, then:
  - Open any "new"/"edit" admin form, trigger a validation error (e.g. submit `subjects/new` with a name that causes a Supabase error, or just inspect visually by temporarily... actually simplest: submit any form successfully and confirm no error path is needed to check success feedback) — for `profile` and `EditSetting`, save successfully and confirm the "✓ Guardado"/"✓ Cambios guardados" text fades and slides up into place rather than snapping in; wait for the auto-dismiss timeout and confirm it still just disappears instantly on the way out (no exit animation was added, that's correct).
  - Trigger an error path in one of the 9 Shape-1 forms (e.g. temporarily disconnect network, or use an existing validation path) and confirm the red error banner fades/slides in the same way.
  - Open each of the 5 AI-generation modals (`Generar con IA`, `Class Kit`, `Documento técnico`, `Sugerir próxima semana`, `Planificar con IA`) and trigger their error path if reachable; confirm the error message fades in rather than popping.
  - Click (and hold briefly) each type of submit button — the 9 identical ones, `profile`'s, and `EditSetting`'s — and confirm a subtle, fast scale-down on press, releasing back to normal size. Confirm the hover color transition (blue-600 → blue-700) still plays smoothly, just slightly faster than before.
  - In Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce", re-test one feedback message and confirm only the opacity fades (no vertical movement); the button press-scale is a `transform`, not gated by `motion-reduce` in this plan since scale-on-press is closer to tactile feedback than decorative movement — note this as a judgment call in your report if you want to gate it too, but do not add the gate unless explicitly asked, since AUDIT.md's press-feedback guidance doesn't require reduced-motion gating for a 2% scale change this subtle.
  - In DevTools → Elements → Styles on a submit button, confirm computed `transition-property` reads `background-color, transform` (not just one, not `all`).
- **Done when**: all 16 feedback locations fade+slide in on mount instead of popping, all 11 buttons show a visible press-scale on click, reduced motion drops the feedback-message translate but keeps the fade, `tsc`/`lint` are clean relative to the pre-change baseline for every touched file, and no file outside the 16 listed was touched.
