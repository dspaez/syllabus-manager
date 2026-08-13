import jsPDF from 'jspdf';
import { hexToRgb, resolveAccent } from './palette';
import { addCallout, ensureSpace } from './pdfHelpers';

export interface ExerciseStatement {
    titulo: string;
    contexto: string;
    requerimientos: string[];
}

// `addCallout` dibuja un solo bloque de altura fija sin partir página — seguro acá porque el
// contexto es un párrafo corto, pero medimos la altura real ANTES de reservar espacio (en vez
// de un margen fijo) para no dejar pasar un contexto inusualmente largo.
function addContextoCallout(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, contexto: string): number {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const bodyLines = doc.splitTextToSize(contexto, w - 8) as string[];
    const height = 4.2 + bodyLines.length * 4.4 + 6;
    y = ensureSpace(doc, y, height, pageHeight);
    return addCallout(doc, x, y, w, 'Contexto', contexto, 'blue');
}

// A diferencia de `addChecklist` (un solo bloque de altura fija), los requerimientos reales de
// un ejercicio pueden pasar de 30 ítems — un solo bloque se saldría de la página sin avisar.
// Se pagina ítem por ítem, así el fondo de color siempre queda contenido dentro de cada página.
function addRequerimientosList(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, items: string[]): number {
    y = ensureSpace(doc, y, 14, pageHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 94, 89);
    doc.text('REQUERIMIENTOS', x, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    for (const item of items) {
        const lines = doc.splitTextToSize(`[ ] ${item}`, w) as string[];
        const needed = lines.length * 4.6 + 1.5;
        y = ensureSpace(doc, y, needed, pageHeight);
        doc.text(lines, x, y);
        y += needed;
    }
    return y + 3;
}

function addExerciseSection(
    doc: jsPDF, x: number, y: number, w: number, pageHeight: number,
    label: string, ex: ExerciseStatement, accentRgb: [number, number, number],
): number {
    y = ensureSpace(doc, y, 25, pageHeight);

    doc.setFillColor(...accentRgb);
    doc.roundedRect(x, y - 5.5, w, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`${label} — ${ex.titulo}`, x + 3, y);
    y += 12;

    y = addContextoCallout(doc, x, y, w, pageHeight, ex.contexto);
    y += 6;

    if (ex.requerimientos.length > 0) {
        y = addRequerimientosList(doc, x, y, w, pageHeight, ex.requerimientos);
        y += 5;
    }

    return y;
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
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 16;
    const contentW = pageWidth - marginX * 2;
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...accentRgb);
    doc.text('Ejercicios', marginX, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const subLines = doc.splitTextToSize(`${params.subjectName} — ${params.weekTopic}`, contentW) as string[];
    doc.text(subLines, marginX, y);
    y += subLines.length * 4.6 + 8;

    y = addExerciseSection(doc, marginX, y, contentW, pageHeight, 'Ejercicio de clase', params.ejercicioClase, accentRgb);

    if (params.ejerciciosTarea && params.ejerciciosTarea.length > 0) {
        y = ensureSpace(doc, y, 16, pageHeight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...accentRgb);
        doc.text('Tarea en casa', marginX, y);
        y += 8;

        for (let i = 0; i < params.ejerciciosTarea.length; i++) {
            y = addExerciseSection(doc, marginX, y, contentW, pageHeight, `Variante ${i + 1}`, params.ejerciciosTarea[i], accentRgb);
        }
    }

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    return Buffer.from(arrayBuffer);
}
