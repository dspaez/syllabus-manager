# Animation plans — Syllabus Manager

Plans written by `improve-animations`. Each is self-contained; see the individual file for full detail. Execute with `improve-animations execute <plan>` (or hand the file to any agent).

| # | Title | Severity | Status |
|---|-------|----------|--------|
| 001 | [Animate the entrance of the 5 AI-generation modals](001-ai-modal-entrance.md) | MEDIUM | TODO |

## Execution order

Just one plan so far — no ordering dependencies. Plan 001 touches `src/app/globals.css` (adds one `--ease-snappy` token to the existing `@theme inline` block) plus 5 independent components (`GenerateWithAI.tsx`, `GenerateClassKit.tsx`, `GenerateTechnicalDoc.tsx`, `SuggestNextWeek.tsx`, `CurriculumPlanner.tsx`) — the 5 component edits can be done in any order or in parallel; the globals.css token should land first (or simultaneously) since all 5 reference `ease-snappy`.

## Notes

- This app has no motion library and, before plan 001, no custom easing/duration tokens — `--ease-snappy` is the first such token and is intended to be reused by future plans rather than each one inventing its own cubic-bezier.
- Source sweep this plan came from: a `find-animation-opportunities` pass across the whole app (see conversation history) identified 6 opportunities total; only opportunity #1 (the 5 modal entrances) has been turned into a plan so far. The other 5 (WeeksAccordion height transition, inline save/error feedback fade, form submit press feedback, ThemeToggle icon crossfade, CurriculumPlanner's nested unit-collapse) are not yet planned — ask for `improve-animations plan <description>` on any of them when ready.
