# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single docente (instructor) managing their own teaching load — semesters, subjects/materias, units, weeks, and class materials. Not multi-tenant: the `profile` table holds exactly one row, and there are no roles or per-institution accounts today.

## Product Purpose

Syllabus Manager lets one instructor structure a full course hierarchy (semester → subject → unit → week → material) and, from that same structure, generate real class content with AI — exercises, "Class Kit" slide decks, and technical guides — then publish the finished materials to a public, student-facing view. Organizing the syllabus and generating material with AI are equally central; neither is a bolt-on to the other.

## Positioning

The AI generation is grounded in the instructor's actual course structure (subject, week, topic, `course_mode`, `tech_stack`) rather than producing generic content — the generation prompts pull real context (e.g. current week's topic, the subject's declared tech stack) so output matches what is actually being taught, instead of inventing a plausible-sounding but unrelated example.

## Operating Context

- **Admin dashboard** (`/admin`, auth-protected via Supabase + `src/proxy.ts`): the instructor's private workspace for CRUD on semesters, subjects, units, weeks, and materials, plus profile and general settings (academic policies applied across all subjects).
- **Public site** (`(public)` route group): unauthenticated, student-facing view of published subjects/materials only.
- **AI generation** (`/api/generate`): uses Gemini and Claude (via Anthropic SDK structured outputs / zod schemas) to produce exercises, Class Kit slide content, and technical guides scoped to a specific week/subject.
- **Class Kit rendering/export** (`/api/render-class-kit`, `src/lib/classKit/`): turns generated structured content into exportable slide decks (pptxgenjs) and PDFs (jspdf/jspdf-autotable), following a fixed layout/icon system (see `src/lib/classKit/schema.ts`).
- **Storage**: generated/exported materials are saved via a Supabase Storage bucket in a two-stage save flow (generate → review → persist), per prior project notes.

## Capabilities and Constraints

- Single-instructor tool: no multi-user auth roles, no institution-level tenancy.
- Subjects carry a `course_mode` (e.g. project-based vs. traditional) and optional `tech_stack`; AI prompts must respect these — e.g. a project-mode subject with a declared stack should get code/examples in that stack, not an assumed default.
- Structured AI outputs are validated with zod, but some fields (e.g. icon names) are enforced by prompt + renderer fallback rather than hard schema constraints, because the Anthropic SDK degrades certain zod constructs (enum/literal) to descriptive text rather than enforced schema — noted directly in `src/lib/classKit/schema.ts`.
- UI copy and AI-generated content observed in Spanish throughout the current codebase; not confirmed as a hard product requirement, but treat as the existing convention unless told otherwise.
- No confirmed institution name, product name for external users, or brand identity yet — this is presently an internal/personal tool. The public site header (`src/app/(public)/PublicShell.tsx`) currently shows "AulaVirtual" and a dark blue mark (`#0f2a5e`) — **this is a known, intentional generic placeholder, not an unresolved pending decision.** It exists so the public-facing UI has *some* name and mark instead of shipping unbranded, and is expected to be swapped once (if) a real institution name/brand is confirmed. Do not treat it as a bug to fix or a TODO to chase; do not invent product-copy or design work assuming "AulaVirtual" is the real, final name.

## Product Principles

1. Generated content must reflect the real course context (subject, week, stack, mode) — never generic placeholder material passed off as course-specific.
2. The syllabus structure (semester/subject/unit/week/material) is the source of truth that both the admin CRUD and the AI generation flows build on — don't let generation drift from it.
3. Admin and public are distinct surfaces with distinct concerns: admin optimizes for the instructor's authoring speed; public optimizes for a student scanning/finding published material.
4. It's a single-user tool today — don't design multi-tenant/role complexity into UI or data assumptions unless the user asks for it.
