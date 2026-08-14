import jsPDF from 'jspdf';
import { hexToRgb, resolveAccent } from './palette';
import { ensureSpace } from './pdfHelpers';
import { addDocHeader, addMetaTable, addSectionHeading, addAccentBox, addBadgeNumberedList } from '@/lib/pdf/formalDoc';

export interface ExerciseStatement {
    titulo: string;
    contexto: string;
    requerimientos: string[];
}

// Mismo lenguaje visual que el examen (src/lib/exam/renderExamPdf.ts, via
// src/lib/pdf/formalDoc.ts) — el usuario pidió explícitamente que el PDF de ejercicios
// siguiera la misma estructura que los ejemplos de referencia (metadata table, títulos
// serif, secciones formales), no el estilo de callouts de colores que tenía antes.
function renderExercise(
    doc: jsPDF, ex: ExerciseStatement, kicker: string, weekTopic: string,
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

    if (ex.requerimientos.length > 0) {
        y = ensureSpace(doc, y, 24, pageHeight);
        y = addSectionHeading(doc, marginX, y, accentRgb, 'Requerimientos');
        addBadgeNumberedList(doc, marginX, y, contentW, pageHeight, accentRgb, ex.requerimientos);
    }
}

// Solo el enunciado (contexto + requerimientos) — nunca solucionDocente, esto es lo que se
// entrega/imprime para el estudiante. La solución sigue viviendo únicamente en el JSON guardado
// en `description` del material (usado para la vista admin y como contexto real de Class Kit).
export function renderExercisePdf(params: {
    ejercicioClase: ExerciseStatement;
    ejerciciosTarea?: ExerciseStatement[];
    subjectName: string;
    weekTopic: string;
    accentColor?: string;
}): Buffer {
    const accentRgb = hexToRgb(resolveAccent(params.accentColor));
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    renderExercise(doc, params.ejercicioClase, `${params.subjectName} · Ejercicio de clase`, params.weekTopic, accentRgb, true);

    (params.ejerciciosTarea ?? []).forEach((ex, i) => {
        renderExercise(doc, ex, `${params.subjectName} · Tarea — Variante ${i + 1}`, params.weekTopic, accentRgb, false);
    });

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    return Buffer.from(arrayBuffer);
}
