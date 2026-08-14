import jsPDF from 'jspdf';
import { hexToRgb, resolveAccent } from '@/lib/classKit/palette';
import { ensureSpace } from '@/lib/classKit/pdfHelpers';
import { TEXT_MAIN, TEXT_MUTED, addSectionHeading, addParagraph } from '@/lib/pdf/formalDoc';
import type { Exercise } from './schema';

const WARNING_RGB: [number, number, number] = [180, 83, 9]; // amber-700

// Código completo paginado línea por línea — sin caja de fondo (a diferencia de addMonoBox,
// pensado para menús cortos que siempre entran en una sola página): una solución real puede
// pasar largo de una página, y una caja con fondo no se puede partir limpio entre páginas en
// jsPDF sin repetirla manualmente. Claridad > flourish acá, es un documento de uso interno.
function addCode(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, code: string): number {
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MAIN);
    const lineH = 4;
    for (const rawLine of code.split('\n')) {
        const wrapped = doc.splitTextToSize(rawLine || ' ', w) as string[];
        for (const line of wrapped) {
            y = ensureSpace(doc, y, lineH + 1, pageHeight);
            doc.text(line, x, y);
            y += lineH;
        }
    }
    return y + 4;
}

function addExerciseSolutionBody(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, accentRgb: [number, number, number], label: string, ex: Exercise): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...accentRgb);
    doc.text(`${label} — ${ex.titulo}`, x, y);
    y += 8;

    if (ex.contexto) {
        y = addParagraph(doc, x, y, w, pageHeight, ex.contexto) + 6;
    }

    y = ensureSpace(doc, y, 20, pageHeight);
    y = addSectionHeading(doc, x, y, accentRgb, 'Solución completa');
    return addCode(doc, x, y, w, pageHeight, ex.solucionDocente);
}

// Documento SEPARADO del enunciado del estudiante — incluye solucionDocente completo. Nunca se
// guarda como fila en `materials` (ver /api/render-docente-solution-pdf): no tiene URL pública
// descubrible desde ningún lado de la app, es la única forma de mantenerlo "solo para el
// docente" con la arquitectura de Storage actual (el archivo en sí no tiene otra protección
// más que no estar enlazado — no es una garantía criptográfica, ver aviso al usuario).
export function renderDocenteSolutionPdf(params: {
    ejerciciosPractica: Exercise[];
    ejerciciosTarea?: Exercise[];
    subjectName: string;
    weekTopic: string;
    accentColor?: string;
}): Buffer {
    const accentRgb = hexToRgb(resolveAccent(params.accentColor));
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;
    const contentW = pageWidth - marginX * 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...WARNING_RGB);
    doc.text('SOLO PARA DOCENTE — NO DISTRIBUIR', marginX, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`${params.subjectName} — ${params.weekTopic}`, marginX, 25);

    let y = 34;
    let isFirst = true;

    params.ejerciciosPractica.forEach((ex, i) => {
        const label = params.ejerciciosPractica.length > 1 ? `Práctica ${i + 1}` : 'Ejercicio de práctica';
        if (!isFirst) doc.addPage();
        y = addExerciseSolutionBody(doc, marginX, isFirst ? y : 18, contentW, pageHeight, accentRgb, label, ex);
        isFirst = false;
    });

    (params.ejerciciosTarea ?? []).forEach((ex, i) => {
        if (!isFirst) doc.addPage();
        y = addExerciseSolutionBody(doc, marginX, isFirst ? y : 18, contentW, pageHeight, accentRgb, `Tarea — Variante ${i + 1}`, ex);
        isFirst = false;
    });

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    return Buffer.from(arrayBuffer);
}
