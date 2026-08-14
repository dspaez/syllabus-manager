import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { renderDocenteSolutionPdf } from '@/lib/exercise/renderDocenteSolutionPdf';
import type { Exercise } from '@/lib/exercise/schema';

// A propósito NUNCA inserta una fila en `materials` — este PDF incluye la solución completa y
// solo debe llegar al docente. Sin fila en materials no hay URL pública descubrible tipo
// /materials/{id} ni aparece en la lista de materiales del estudiante. El archivo en Storage
// en sí no tiene otra protección más que no estar enlazado desde ningún lado de la app — no es
// una garantía criptográfica, solo "no listado".
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as {
            ejerciciosPractica?: Exercise[];
            ejerciciosTarea?: Exercise[];
            weekId?: string;
            subjectName?: string;
            weekTopic?: string;
            accentColor?: string | null;
        };
        const { ejerciciosPractica, ejerciciosTarea, weekId, subjectName, weekTopic, accentColor } = body;

        if (!ejerciciosPractica?.length || !weekId || !subjectName || !weekTopic) {
            return NextResponse.json(
                { error: 'Missing required fields: ejerciciosPractica, weekId, subjectName, weekTopic' },
                { status: 400 },
            );
        }

        const buffer = renderDocenteSolutionPdf({
            ejerciciosPractica,
            ejerciciosTarea,
            subjectName,
            weekTopic,
            accentColor: accentColor ?? undefined,
        });

        const path = `${weekId}/${Date.now()}-solucion-docente.pdf`;
        const supabase = createClient(await cookies());
        const { error: uploadError } = await supabase.storage
            .from('materials')
            .upload(path, buffer, { contentType: 'application/pdf' });
        if (uploadError) {
            return NextResponse.json({ error: `Error al subir ${path}: ${uploadError.message}` }, { status: 500 });
        }

        const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path);
        return NextResponse.json({ url: urlData.publicUrl });
    } catch (error) {
        console.error('render-docente-solution-pdf error:', error);
        return NextResponse.json({ error: 'Failed to render docente solution PDF' }, { status: 500 });
    }
}
