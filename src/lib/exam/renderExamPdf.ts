import jsPDF from 'jspdf';
import { hexToRgb, resolveAccent } from '@/lib/classKit/palette';
import { ensureSpace } from '@/lib/classKit/pdfHelpers';
import {
    TEXT_MAIN, addDocHeader, addMetaTable, addSectionHeading, addBulletList, addParagraph, addMonoBox, addNumberedList,
} from '@/lib/pdf/formalDoc';
import type { Exam, ExamVersion } from './schema';

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

    let y = addDocHeader(
        doc, marginX, contentW, 18, accentRgb,
        `${subjectName} · Versión ${version.version.toUpperCase()}`,
        exam.titulo,
        'Complete el programa en su editor de código y entregue el archivo solicitado.',
    );

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
    y = addParagraph(doc, marginX, y, contentW, pageHeight, version.contexto) + 8;

    y = ensureSpace(doc, y, 24, pageHeight);
    y = addSectionHeading(doc, marginX, y, accentRgb, 'Enunciado');
    y = addParagraph(doc, marginX, y, contentW, pageHeight, `Escriba un programa llamado ${version.nombrePrograma} que muestre el siguiente menú:`) + 4;
    y = addMonoBox(doc, marginX, y, contentW, pageHeight, version.menu) + 8;

    y = ensureSpace(doc, y, 24, pageHeight);
    y = addSectionHeading(doc, marginX, y, accentRgb, 'Requisitos');
    y = addNumberedList(doc, marginX, y, contentW, pageHeight, accentRgb, version.requisitos) + 4;

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
