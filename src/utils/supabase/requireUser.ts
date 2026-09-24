import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

// Guard para Route Handlers bajo src/app/api/ — el matcher de src/proxy.ts no cubre /api/*, y
// aunque lo cubriera, cada Route Handler se trata como endpoint público (ver guía de auth de
// Next.js 16): sin esto cualquiera con la URL podía llamar a /api/generate y gastar créditos de
// Anthropic/Gemini, o subir archivos al bucket. Devuelve el cliente ya creado para que las rutas
// que suben a Storage lo reutilicen en vez de crear otro.
export async function requireUser(): Promise<
    | { supabase: SupabaseClient; user: User; response?: never }
    | { supabase?: never; user?: never; response: NextResponse }
> {
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
    }
    return { supabase, user };
}
