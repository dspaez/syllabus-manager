import jsPDF from 'jspdf';
import { hexToRgb, resolveAccent } from './palette';
import { ensureSpace } from './pdfHelpers';
import { addDocHeader, addMetaTable, addSectionHeading, addAccentBox, addBadgeNumberedList, addMonoBox, addChecklist } from '@/lib/pdf/formalDoc';
import type { Exercise } from '@/lib/exercise/schema';

// Mismo lenguaje visual que el examen (src/lib/exam/renderExamPdf.ts, via
// src/lib/pdf/formalDoc.ts) — el usuario pidió explícitamente que el PDF de ejercicios
// siguiera la misma estructura que los ejemplos de referencia (metadata table, títulos
// serif, secciones formales, menú en caja, checklist de autoevaluación).
function renderExercise(
    doc: jsPDF, ex: Exercise, kicker: string, weekTopic: string,
    accentRgb: [number, number, number], isFirst: boolean,
): void {
    if (!isFirst) doc.addPage();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;
    const contentW = pageWidth - marginX * 2;

    let y = addDocHeader(doc, marginX, contentW, 18, accentRgb, kicker, ex.titulo, weekTopic);

    y = addMetaTable(doc, marginX, y, contentW) + 8;

    y = ensureSpace(doc, y, 24, pageHeight);
    y = addSectionHeading(doc, marginX, y, accentRgb, 'Contexto');
    y = addAccentBox(doc, marginX, y, contentW, pageHeight, accentRgb, ex.contexto) + 8;

    if (ex.menu && ex.menu.length > 0) {
        y = ensureSpace(doc, y, 20, pageHeight);
        y = addSectionHeading(doc, marginX, y, accentRgb, 'Menú');
        y = addMonoBox(doc, marginX, y, contentW, pageHeight, ex.menu) + 8;
    }

    if (ex.requerimientos.length > 0) {
        y = ensureSpace(doc, y, 24, pageHeight);
        y = addSectionHeading(doc, marginX, y, accentRgb, 'Requerimientos');
        y = addBadgeNumberedList(doc, marginX, y, contentW, pageHeight, accentRgb, ex.requerimientos) + 4;
    }

    if (ex.checklist && ex.checklist.length > 0) {
        y = ensureSpace(doc, y, 24, pageHeight);
        y = addSectionHeading(doc, marginX, y, accentRgb, 'Checklist de repaso');
        addChecklist(doc, marginX, y, contentW, pageHeight, ex.checklist);
    }
}

// Solo el enunciado (contexto + menú + requerimientos + checklist) — nunca solucionDocente,
// esto es lo que se entrega/imprime para el estudiante. La solución sigue viviendo únicamente
// en el JSON guardado en `description` del material, y en el PDF aparte "solo docente" (ver
// renderDocenteSolutionPdf.ts) — nunca en este archivo.
export function renderExercisePdf(params: {
    ejerciciosPractica: Exercise[];
    ejerciciosTarea?: Exercise[];
    subjectName: string;
    weekTopic: string;
    accentColor?: string;
}): Buffer {
    const accentRgb = hexToRgb(resolveAccent(params.accentColor));
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    let isFirst = true;
    params.ejerciciosPractica.forEach((ex, i) => {
        const label = params.ejerciciosPractica.length > 1 ? `Práctica ${i + 1}` : 'Ejercicio de práctica';
        renderExercise(doc, ex, `${params.subjectName} · ${label}`, params.weekTopic, accentRgb, isFirst);
        isFirst = false;
    });

    (params.ejerciciosTarea ?? []).forEach((ex, i) => {
        renderExercise(doc, ex, `${params.subjectName} · Tarea — Variante ${i + 1}`, params.weekTopic, accentRgb, isFirst);
        isFirst = false;
    });

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    return Buffer.from(arrayBuffer);
}
