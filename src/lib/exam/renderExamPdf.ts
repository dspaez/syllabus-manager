import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { hexToRgb, resolveAccent } from '@/lib/classKit/palette';
import { ensureSpace } from '@/lib/classKit/pdfHelpers';
import type { Exam, ExamVersion } from './schema';

const LIGHT_BOX_BG: [number, number, number] = [241, 245, 249]; // slate-100
const LIGHT_BOX_BORDER: [number, number, number] = [226, 232, 240]; // slate-200
const TEXT_MAIN: [number, number, number] = [15, 23, 42]; // slate-900
const TEXT_MUTED: [number, number, number] = [100, 116, 139]; // slate-500

function addMetaTable(doc: jsPDF, x: number, y: number, w: number): number {
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

function addSectionHeading(doc: jsPDF, x: number, y: number, accentRgb: [number, number, number], text: string): number {
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...accentRgb);
    doc.text(text, x, y);
    return y + 6;
}

function addBulletList(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, items: string[]): number {
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

function addMenuBox(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, lines: string[]): number {
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

// Requisitos numerados con sub-ítems con guión — paginados uno por uno (no un solo bloque
// de altura fija) porque un examen real puede tener 4-6 requisitos con sub-ítems, fácil de
// subestimar la altura total de antemano. Mismo motivo que renderExercisePdf.ts.
function addRequisitos(doc: jsPDF, x: number, y: number, w: number, pageHeight: number, accentRgb: [number, number, number], requisitos: ExamVersion['requisitos']): number {
    requisitos.forEach((req, i) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...accentRgb);
        const numLabel = `${i + 1}. `;
        const titleLines = doc.splitTextToSize(`${numLabel}${req.titulo}`, w) as string[];
        let needed = titleLines.length * 4.6 + 1;
        y = ensureSpace(doc, y, needed, pageHeight);
        doc.text(titleLines, x, y);
        y += needed;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...TEXT_MAIN);
        const detailLines = doc.splitTextToSize(req.detalle, w - 5) as string[];
        needed = detailLines.length * 4.4 + 2;
        y = ensureSpace(doc, y, needed, pageHeight);
        doc.text(detailLines, x + 5, y);
        y += needed;

        for (const sub of req.subitems ?? []) {
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

function renderVersion(
    doc: jsPDF, version: ExamVersion, exam: Exam,
    subjectName: string, tiempoEstimado: string, puntajeTotal: number,
    accentRgb: [number, number, number], isFirst: boolean,
): void {
    if (!isFirst) doc.addPage();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;
    const contentW = pageWidth - marginX * 2;
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...accentRgb);
    doc.text(`${subjectName.toUpperCase()} · VERSIÓN ${version.version.toUpperCase()}`, marginX, y);
    y += 8;

    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...TEXT_MAIN);
    const titleLines = doc.splitTextToSize(exam.titulo, contentW) as string[];
    doc.text(titleLines, marginX, y);
    y += titleLines.length * 6.5 + 2;

    doc.setFont('times', 'italic');
    doc.setFontSize(10.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('Complete el programa en su editor de código y entregue el archivo solicitado.', marginX, y);
    y += 9;

    y = addMetaTable(doc, marginX, y, contentW) + 8;

    y = addSectionHeading(doc, marginX, y, accentRgb, 'Instrucciones');
    const instrucciones = [
        `Tiempo estimado: ${tiempoEstimado}.`,
        `Puntaje total: ${puntajeTotal} puntos.`,
        ...exam.instrucciones,
    ];
    y = addBulletList(doc, marginX, y, contentW, pageHeight, instrucciones) + 6;

    y = ensureSpace(doc, y, 24, pageHeight);
    y = addSectionHeading(doc, marginX, y, accentRgb, 'Contexto');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT_MAIN);
    const ctxLines = doc.splitTextToSize(version.contexto, contentW) as string[];
    y = ensureSpace(doc, y, ctxLines.length * 4.4 + 2, pageHeight);
    doc.text(ctxLines, marginX, y);
    y += ctxLines.length * 4.4 + 8;

    y = ensureSpace(doc, y, 24, pageHeight);
    y = addSectionHeading(doc, marginX, y, accentRgb, 'Enunciado');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT_MAIN);
    const introLine = `Escriba un programa llamado ${version.nombrePrograma} que muestre el siguiente menú:`;
    const introLines = doc.splitTextToSize(introLine, contentW) as string[];
    y = ensureSpace(doc, y, introLines.length * 4.4 + 2, pageHeight);
    doc.text(introLines, marginX, y);
    y += introLines.length * 4.4 + 4;

    y = addMenuBox(doc, marginX, y, contentW, pageHeight, version.menu) + 8;

    y = ensureSpace(doc, y, 24, pageHeight);
    y = addSectionHeading(doc, marginX, y, accentRgb, 'Requisitos');
    y = addRequisitos(doc, marginX, y, contentW, pageHeight, accentRgb, version.requisitos) + 4;

    y = ensureSpace(doc, y, 20, pageHeight);
    y = addSectionHeading(doc, marginX, y, accentRgb, 'Entregable');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT_MAIN);
    const entregableLines = doc.splitTextToSize(version.entregable, contentW) as string[];
    doc.text(entregableLines, marginX, y);
}

export function renderExamPdf(exam: Exam, subjectName: string, tiempoEstimado: string, puntajeTotal: number, accentColor?: string): Buffer {
    const accentRgb = hexToRgb(resolveAccent(accentColor));
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    exam.versiones.forEach((version, i) => {
        renderVersion(doc, version, exam, subjectName, tiempoEstimado, puntajeTotal, accentRgb, i === 0);
    });

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    return Buffer.from(arrayBuffer);
}
