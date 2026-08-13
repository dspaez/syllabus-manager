import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ExamSchema } from '@/lib/exam/schema';
import { renderExamPdf } from '@/lib/exam/renderExamPdf';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as {
            exam?: unknown;
            weekId?: string;
            subjectName?: string;
            tiempoEstimado?: string;
            puntajeTotal?: number;
            accentColor?: string | null;
        };
        const { exam, weekId, subjectName, tiempoEstimado, puntajeTotal, accentColor } = body;

        if (!weekId || !subjectName || !tiempoEstimado || typeof puntajeTotal !== 'number') {
            return NextResponse.json(
                { error: 'Missing required fields: weekId, subjectName, tiempoEstimado, puntajeTotal' },
                { status: 400 },
            );
        }

        const parsed = ExamSchema.safeParse(exam);
        if (!parsed.success) {
            return NextResponse.json({ error: 'El contenido del examen no tiene el formato esperado' }, { status: 400 });
        }

        const buffer = renderExamPdf(parsed.data, subjectName, tiempoEstimado, puntajeTotal, accentColor ?? undefined);

        const path = `${weekId}/${Date.now()}-examen.pdf`;
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
        console.error('render-exam-pdf error:', error);
        return NextResponse.json({ error: 'Failed to render exam PDF' }, { status: 500 });
    }
}
