import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ensureSpace } from '@/lib/classKit/pdfHelpers';

// Lenguaje visual compartido por los documentos "formales" que se imprimen/entregan
// (examen, ejercicios) — deliberadamente distinto del estilo oscuro con callouts de color
// de Class Kit: fondo claro, títulos serif, tabla de metadata, tipografía de examen real.
// Ver ExamPdf (primero en pedirlo, con un PDF de referencia real del usuario) — este módulo
// se extrajo de ahí para que Ejercicios siguiera la MISMA estructura, no una parecida.

export const LIGHT_BOX_BG: [number, number, number] = [241, 245, 249]; // slate-100
export const LIGHT_BOX_BORDER: [number, number, number] = [226, 232, 240]; // slate-200
export const TEXT_MAIN: [number, number, number] = [15, 23, 42]; // slate-900
export const TEXT_MUTED: [number, number, number] = [100, 116, 139]; // slate-500

export function addDocHeader(
    doc: jsPDF, x: number, w: number, y: number,
    accentRgb: [number, number, number], kicker: string, title: string, subtitle: string,
): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...accentRgb);
    doc.text(kicker.toUpperCase(), x, y);
    y += 8;

    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...TEXT_MAIN);
    const titleLines = doc.splitTextToSize(title, w) as string[];
    doc.text(titleLines, x, y);
    y += titleLines.length * 6.5 + 2;

    doc.setFont('times', 'italic');
    doc.setFontSize(10.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(subtitle, x, y);
    return y + 9;
}

export function addMetaTable(doc: jsPDF, x: number, y: number, w: number): number {
    autoTable(doc, {
        startY: y,
        body: [
            ['Nombre:', '', 'Paralelo:', ''],
            ['Fecha:', '', 'Nota:', ''],
        ],
        theme: 'grid',
        styles: { fontSize: 9.5, cellPadding: 3, textColor: TEXT_MAIN, lineColor: LIGHT_BOX_BORDER, lineWidth: 0.3 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: w * 0.16 },
            1: { cellWidth: w * 0.34 },
            2: { fontStyle: 'bold', cellWidth: w * 0.16 },
            3: { cellWidth: w * 0.34 },
        },
        margin: { left: x, right: 0 },
        tableWidth: w,
    });
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

export function addSectionHeading(doc: jsPDF, x: number, y: number, accentRgb: [number, number, number], text: string): number {
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...accentRgb);
    doc.text(text, x, y);
    return y + 6;
}

export function addBulletList(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, items: string[]): number {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT_MUTED);
    for (const item of items) {
        const lines = doc.splitTextToSize(`•  ${item}`, w) as string[];
        const needed = lines.length * 4.4 + 1;
        y = ensureSpace(doc, y, needed, pageHeight);
        doc.text(lines, x, y);
        y += needed;
    }
    return y;
}

// Checklist de autoevaluación — "[ ] pregunta", nunca revela la respuesta (ver
// Exercise.checklist en src/lib/exercise/schema.ts). ASCII literal, no glifo Unicode de
// checkbox: jsPDF con las fuentes base14 no lo mide/renderiza de forma confiable (mismo
// problema de raíz ya documentado en pdfHelpers.ts). Paginado ítem por ítem, mismo motivo
// que addBadgeNumberedList.
export function addChecklist(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, items: string[]): number {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT_MAIN);
    for (const item of items) {
        const lines = doc.splitTextToSize(`[ ]  ${item}`, w) as string[];
        const needed = lines.length * 4.6 + 1.5;
        y = ensureSpace(doc, y, needed, pageHeight);
        doc.text(lines, x, y);
        y += needed;
    }
    return y;
}

export function addParagraph(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, text: string): number {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT_MAIN);
    const lines = doc.splitTextToSize(text, w) as string[];
    y = ensureSpace(doc, y, lines.length * 4.4 + 2, pageHeight);
    doc.text(lines, x, y);
    return y + lines.length * 4.4;
}

export function addMonoBox(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, lines: string[]): number {
    doc.setFont('courier', 'normal');
    doc.setFontSize(9.5);
    const lineH = 4.6;
    const padding = 4;
    const height = lines.length * lineH + padding * 2;
    y = ensureSpace(doc, y, height, pageHeight);

    doc.setFillColor(...LIGHT_BOX_BG);
    doc.setDrawColor(...LIGHT_BOX_BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, height, 1.5, 1.5, 'FD');

    doc.setTextColor(...TEXT_MAIN);
    let cursorY = y + padding + 3;
    for (const line of lines) {
        doc.text(line, x + padding, cursorY);
        cursorY += lineH;
    }
    return y + height;
}

// Mezcla el color de acento hacia blanco — para fondos tenues de tarjetas/cajas sin
// depender de canal alfa (jsPDF lo soporta vía GState, pero mezclar RGB es más simple y
// suficiente acá: 0 = color puro, 1 = blanco puro).
function tint(rgb: [number, number, number], amount: number): [number, number, number] {
    return [
        Math.round(rgb[0] + (255 - rgb[0]) * amount),
        Math.round(rgb[1] + (255 - rgb[1]) * amount),
        Math.round(rgb[2] + (255 - rgb[2]) * amount),
    ];
}

// Caja de contexto con barra de acento a la izquierda — misma idea que los callouts de
// Class Kit (pdfHelpers.ts) pero en paleta clara, para darle un ancla visual al "Contexto"
// sin perder el tono formal del documento.
export function addAccentBox(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, accentRgb: [number, number, number], text: string): number {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(text, w - 10) as string[];
    const height = lines.length * 4.6 + 8;
    y = ensureSpace(doc, y, height, pageHeight);

    doc.setFillColor(...tint(accentRgb, 0.93));
    doc.roundedRect(x, y, w, height, 1.5, 1.5, 'F');
    doc.setFillColor(...accentRgb);
    doc.rect(x, y, 1.2, height, 'F');

    doc.setTextColor(...TEXT_MAIN);
    doc.text(lines, x + 6, y + 6);
    return y + height;
}

// Lista numerada con insignias circulares de acento — para requerimientos planos de una
// sola oración (ej. Ejercicios) donde no hay un título corto separable del detalle, así
// que un numerado tipo "1. texto en negrita" queda demasiado pesado (ver addNumberedList).
// Acá el número vive en un círculo de color, el texto en peso normal al lado.
export function addBadgeNumberedList(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, accentRgb: [number, number, number], items: string[]): number {
    const badgeD = 6;
    const gap = 3;
    const textX = x + badgeD + gap;
    const textW = w - badgeD - gap;

    items.forEach((item, i) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        const lines = doc.splitTextToSize(item, textW) as string[];
        const rowH = Math.max(badgeD + 2, lines.length * 4.6 + 2);
        y = ensureSpace(doc, y, rowH + 3, pageHeight);

        doc.setFillColor(...accentRgb);
        doc.circle(x + badgeD / 2, y + 2.5, badgeD / 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(String(i + 1), x + badgeD / 2, y + 3.6, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...TEXT_MAIN);
        doc.text(lines, textX, y + 3.2);

        y += rowH + 3;
    });
    return y;
}

export interface NumberedItem {
    titulo: string;
    detalle?: string;
    subitems?: string[];
}

// Ítems numerados con sub-ítems con guión, paginados uno por uno (no un solo bloque de
// altura fija) — un examen o ejercicio real puede tener muchos requisitos, fácil de
// subestimar la altura total de antemano. `detalle` es opcional para poder reusar esto
// tanto con Requisito (examen, siempre tiene detalle) como con requerimientos de Ejercicios
// (strings planos, sin detalle separado).
export function addNumberedList(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, accentRgb: [number, number, number], items: NumberedItem[]): number {
    items.forEach((item, i) => {
        // Título corto en negrita/acento SOLO cuando hay un detalle aparte (examen) — un
        // ítem plano de una sola oración (ej. requerimientos de Ejercicios) se ve mejor en
        // peso normal, como un párrafo numerado más, no como un titular por cada línea.
        doc.setFont('helvetica', item.detalle ? 'bold' : 'normal');
        doc.setFontSize(item.detalle ? 10 : 9.5);
        doc.setTextColor(...(item.detalle ? accentRgb : TEXT_MAIN));
        const titleLines = doc.splitTextToSize(`${i + 1}. ${item.titulo}`, w) as string[];
        let needed = titleLines.length * 4.6 + 1;
        y = ensureSpace(doc, y, needed, pageHeight);
        doc.text(titleLines, x, y);
        y += needed;

        if (item.detalle) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(...TEXT_MAIN);
            const detailLines = doc.splitTextToSize(item.detalle, w - 5) as string[];
            needed = detailLines.length * 4.4 + 2;
            y = ensureSpace(doc, y, needed, pageHeight);
            doc.text(detailLines, x + 5, y);
            y += needed;
        }

        for (const sub of item.subitems ?? []) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(...TEXT_MUTED);
            const subLines = doc.splitTextToSize(`–  ${sub}`, w - 9) as string[];
            needed = subLines.length * 4.2 + 1;
            y = ensureSpace(doc, y, needed, pageHeight);
            doc.text(subLines, x + 9, y);
            y += needed;
        }
        y += 2;
    });
    return y;
}
