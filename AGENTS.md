<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Syllabus Manager — Agent Guide

## Project overview
Academic materials management app. Stack: **Next.js 16.2 App Router · Supabase (auth + DB) · Tailwind CSS v4 · TypeScript strict**.

## Commands
```bash
npm run dev    # development server (Turbopack, port 3000)
npm run build  # production build
npm run lint   # ESLint
```

## File structure
- **All routes live under `src/app/`** — ignore the root `app_unused/` directory (boilerplate leftover).
- `@/*` resolves to `./src/*` (tsconfig paths alias).

```
src/
  app/
    layout.tsx          # root layout + globals.css
    login/page.tsx      # public — auth form
    admin/page.tsx      # protected — main dashboard
  proxy.ts              # auth guard (Next.js 16: renamed from middleware.ts)
  utils/supabase/
    client.ts           # browser client: createClient()
    server.ts           # server client: createClient(cookieStore)
    middleware.ts       # proxy logic (imported by src/proxy.ts)
```

## Supabase usage patterns

### Browser (Client Components)
```ts
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();
```

### Server (Server Components / Route Handlers)
```ts
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
const supabase = createClient(await cookies());
```

## Auth flow
- Proxy logic in [src/utils/supabase/middleware.ts](src/utils/supabase/middleware.ts), invocada desde [src/proxy.ts](src/proxy.ts) (convención Next.js 16).
- Guards `/admin/*` → redirects unauthenticated users to `/login`, and authenticated users away from `/login` to `/admin`.
- After `signInWithPassword`, use `router.push('/admin')` (client-side redirect).
- After server-side sign-out, use `redirect('/login')` from `next/navigation`.

> **Next.js 16 breaking change**: `middleware.ts` → `proxy.ts`. Export function as `proxy`, not `middleware`.

## Environment variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # used by client.ts and server.ts
NEXT_PUBLIC_SUPABASE_ANON_KEY=          # used by middleware.ts
```
> **Note:** middleware uses `ANON_KEY`; other utilities use `PUBLISHABLE_KEY`. Both should point to the Supabase project's anon/public key.

## Conventions
- New Client Components must start with `'use client'` as the very first line.
- Use Tailwind CSS v4 utility classes — no `tailwind.config.js`, configuration is in `postcss.config.mjs`.
- Server Components are the default; add `'use client'` only when state/browser APIs are needed.
- Use `@supabase/ssr` — never `@supabase/supabase-js` directly for auth in SSR contexts.
