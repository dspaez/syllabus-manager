import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ClassKitContentSchema } from '@/lib/classKit/schema';
import { renderClassKitPptx, type ClassKitTheme } from '@/lib/classKit/renderClassKitPptx';
import { renderGuionDocentePdf } from '@/lib/classKit/renderGuionDocentePdf';
import { renderGuiaTecnicaPdf } from '@/lib/classKit/renderGuiaTecnicaPdf';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as {
            content: unknown;
            accentColor?: string | null;
            theme?: ClassKitTheme;
            weekId?: string;
            subjectName?: string;
            weekNumber?: number;
        };
        const { accentColor, theme, weekId, subjectName, weekNumber } = body;

        if (!weekId || !subjectName || typeof weekNumber !== 'number') {
            return NextResponse.json({ error: 'Missing required fields: weekId, subjectName, weekNumber' }, { status: 400 });
        }

        const parsed = ClassKitContentSchema.safeParse(body.content);
        if (!parsed.success) {
            return NextResponse.json({ error: 'El contenido del class kit no tiene el formato esperado' }, { status: 400 });
        }
        const content = parsed.data;

        // Qué partes renderizar/subir se decide por lo que realmente vino en el contenido
        // (slides siempre presente; guionDocente/guiaTecnica opcionales según lo que el
        // docente haya pedido generar) — no por un flag aparte que podría desincronizarse.
        type Upload = { key: 'pptx' | 'guion' | 'guia'; path: string; buffer: Buffer; contentType: string };
        const stamp = Date.now();
        const uploads: Upload[] = [
            {
                key: 'pptx',
                path: `${weekId}/${stamp}-class-kit-slides.pptx`,
                buffer: await renderClassKitPptx(content, { accentColor, theme, subjectName, weekNumber }),
                contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            },
        ];
        if (content.guionDocente) {
            uploads.push({
                key: 'guion',
                path: `${weekId}/${stamp}-class-kit-guion-docente.pdf`,
                buffer: renderGuionDocentePdf(content.guionDocente, accentColor ?? undefined),
                contentType: 'application/pdf',
            });
        }
        if (content.guiaTecnica) {
            uploads.push({
                key: 'guia',
                path: `${weekId}/${stamp}-class-kit-guia-tecnica.pdf`,
                buffer: renderGuiaTecnicaPdf(content.guiaTecnica, accentColor ?? undefined),
                contentType: 'application/pdf',
            });
        }

        const supabase = createClient(await cookies());
        const result: { pptxUrl?: string; guionUrl?: string; guiaUrl?: string } = {};
        for (const upload of uploads) {
            const { error: uploadError } = await supabase.storage
                .from('materials')
                .upload(upload.path, upload.buffer, { contentType: upload.contentType });
            if (uploadError) {
                return NextResponse.json({ error: `Error al subir ${upload.path}: ${uploadError.message}` }, { status: 500 });
            }
            const { data: urlData } = supabase.storage.from('materials').getPublicUrl(upload.path);
            if (upload.key === 'pptx') result.pptxUrl = urlData.publicUrl;
            if (upload.key === 'guion') result.guionUrl = urlData.publicUrl;
            if (upload.key === 'guia') result.guiaUrl = urlData.publicUrl;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('render-class-kit error:', error);
        return NextResponse.json({ error: 'Failed to render class kit' }, { status: 500 });
    }
}
