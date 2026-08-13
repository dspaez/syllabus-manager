import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { renderExercisePdf, type ExerciseStatement } from '@/lib/classKit/renderExercisePdf';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as {
            ejercicioClase?: ExerciseStatement;
            ejerciciosTarea?: ExerciseStatement[];
            weekId?: string;
            subjectName?: string;
            weekTopic?: string;
            accentColor?: string | null;
        };
        const { ejercicioClase, ejerciciosTarea, weekId, subjectName, weekTopic, accentColor } = body;

        if (!ejercicioClase?.titulo || !weekId || !subjectName || !weekTopic) {
            return NextResponse.json(
                { error: 'Missing required fields: ejercicioClase, weekId, subjectName, weekTopic' },
                { status: 400 },
            );
        }

        const buffer = renderExercisePdf({
            ejercicioClase,
            ejerciciosTarea,
            subjectName,
            weekTopic,
            accentColor: accentColor ?? undefined,
        });

        const path = `${weekId}/${Date.now()}-ejercicios.pdf`;
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
        console.error('render-exercise-pdf error:', error);
        return NextResponse.json({ error: 'Failed to render exercise PDF' }, { status: 500 });
    }
}
