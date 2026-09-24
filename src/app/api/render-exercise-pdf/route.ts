import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/utils/supabase/requireUser';
import { renderExercisePdf } from '@/lib/classKit/renderExercisePdf';
import type { Exercise } from '@/lib/exercise/schema';

export async function POST(request: NextRequest) {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { supabase } = auth;

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

        const buffer = renderExercisePdf({
            ejerciciosPractica,
            ejerciciosTarea,
            subjectName,
            weekTopic,
            accentColor: accentColor ?? undefined,
        });

        const path = `${weekId}/${Date.now()}-ejercicios.pdf`;
        const { error: uploadError } = await supabase.storage
            .from('materials')
            .upload(path, buffer, { contentType: 'application/pdf' });
        if (uploadError) {
            return NextResponse.json({ error: `Error al subir ${path}: ${uploadError.message}` }, { status: 500 });
        }

        const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path);
        return NextResponse.json({ url: urlData.publicUrl });
    } catch (error) {
        console.error('render-exercise-pdf error:', error);
        return NextResponse.json({ error: 'Failed to render exercise PDF' }, { status: 500 });
    }
}
