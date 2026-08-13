# Animation plans — Syllabus Manager

Plans written by `improve-animations`. Each is self-contained; see the individual file for full detail. Execute with `improve-animations execute <plan>` (or hand the file to any agent).

| # | Title | Severity | Status |
|---|-------|----------|--------|
| 001 | [Animate the entrance of the 5 AI-generation modals](001-ai-modal-entrance.md) | MEDIUM | DONE (commit `f157103`) |
| 002 | [Bridge the accordion/collapse content teleport in WeeksAccordion and CurriculumPlanner](002-accordion-height-transition.md) | MEDIUM | PARTIALLY MOOT — Target 1 superseded by 003 (DONE); Target 2 (`CurriculumPlanner.tsx`) DONE (commit `cbd535b`) |
| 003 | [Bridge the week-collapse content teleport in SubjectContent.tsx (the real, live component)](003-subject-content-week-collapse.md) | MEDIUM | DONE (commit `5dca295`) |
| 004 | [Fade in inline save/error feedback; add press feedback to form submit buttons](004-feedback-fade-and-press-states.md) | LOW-MEDIUM | DONE (commit `fc7f6eb`) |

## Execution order

- Plan 001: done and merged (`f157103`).
- Plan 002: only its `CurriculumPlanner.tsx` half was real; merged (`cbd535b`). `WeeksAccordion.tsx` no longer exists.
- Plan 003: done and merged (`5dca295`), browser-verified live (expand/collapse, dark mode).
- Plan 004: done and merged (`fc7f6eb`). Reused the `--ease-snappy` token from plan 001 across all 27 edit sites.

## Notes

- This app has no motion library and, before plan 001, no custom easing/duration tokens — `--ease-snappy` is the first such token and is intended to be reused by future plans rather than each one inventing its own cubic-bezier. Plans 002 and 003 do *not* use `ease-snappy`: both deliberately copy `PoliciesAccordion.tsx`'s existing (bare, default-eased) `transition-all` pattern instead, per that pattern's own reasoning.
- **Lesson learned, now standard practice**: when `execute`'s isolated worktree comes back with a suspiciously old HEAD (missing commits that should obviously be there, like a token a *previous* plan added), don't assume the plan or the code drifted — check `git log --oneline -3` in the worktree first. Plan 004 hit this twice (the harness's `isolation: "worktree"` provisioned from a stale session-start snapshot both times) before creating the worktree manually via `git worktree add` from current `main` and pointing a non-isolated agent at that exact path worked. Also: a plan file that was never committed doesn't exist in a freshly-cut worktree either — copy it in explicitly if it's still sitting uncommitted in the main checkout.
- `find-animation-opportunities` finds a pattern in a file; it does not check whether that file is ever imported. Plan 002's Target 1 was correctly identified and correctly fixed, but in a component (`WeeksAccordion.tsx`) that turned out to be orphaned dead code from an earlier, superseded redesign. This was only caught by an actual browser feel-check after execution — grep for the component's usage (not just its existence) before or during planning next time a plan targets a file that "sounds like" the thing rendering some UI, especially in a codebase with more than one component of a similar name/shape (`WeeksAccordion.tsx` vs. `SubjectContent.tsx`'s `WeekCollapsible`, both accordion-shaped, only one wired in).
- Source sweep plans 001 and 002 came from: a `find-animation-opportunities` pass across the whole app (see conversation history) identified 6 opportunities total.
  - #1 → plan 001. DONE.
  - #2 (weeks height transition) + #6 (CurriculumPlanner nested unit-collapse) → merged into plan 002. #2 corrected and re-targeted as plan 003 after the dead-code discovery; #6 (in plan 002) stands.
  - #3 (inline save/error feedback fade) + #4 (form submit press feedback) → merged into plan 004, since both reuse `--ease-snappy` and touch a heavily-overlapping file set (10 of 16 files appear in both parts).
  - #5 (ThemeToggle icon crossfade) is not yet planned — ask for `improve-animations plan <description>` when ready.
