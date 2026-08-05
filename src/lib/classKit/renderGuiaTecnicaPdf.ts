import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { GuiaTecnica } from './schema';
import { hexToRgb, resolveAccent } from './palette';
import { addCallout, addChecklist, addHighlightedCodeBox, ensureSpace } from './pdfHelpers';

export function renderGuiaTecnicaPdf(guiaTecnica: GuiaTecnica, accentColor?: string): Buffer {
    const accentRgb = hexToRgb(resolveAccent(accentColor));
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 16;
    const contentW = pageWidth - marginX * 2;
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...accentRgb);
    doc.text('Guía técnica', marginX, y);
    y += 10;

    if (guiaTecnica.resumen.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Paso', 'Acción', 'Tiempo']],
            body: guiaTecnica.resumen.map((r) => [String(r.paso), r.accion, r.tiempoEstimado]),
            theme: 'grid',
            headStyles: { fillColor: accentRgb, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8.5, textColor: [50, 50, 50] },
            columnStyles: { 0: { cellWidth: 16, halign: 'center' } },
            margin: { left: marginX, right: marginX },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    if (guiaTecnica.preFlight.length > 0) {
        y = ensureSpace(doc, y, 20, pageHeight);
        y = addChecklist(doc, marginX, y, contentW, 'Pre-flight — antes de empezar', guiaTecnica.preFlight, 'blue');
        y += 8;
    }

    for (const paso of guiaTecnica.pasos) {
        y = ensureSpace(doc, y, 25, pageHeight);

        doc.setFillColor(...accentRgb);
        doc.roundedRect(marginX, y - 5.5, contentW, 8, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`Paso ${paso.paso} — ${paso.titulo}`, marginX + 3, y);
        y += 8;

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(paso.ubicacion, marginX, y);
        y += 6;

        if (paso.codigo && paso.codigo.trim()) {
            y = ensureSpace(doc, y, 30, pageHeight);
            y = addHighlightedCodeBox(doc, paso.codigo.trim(), marginX, y, contentW);
            y += 6;
        }

        if (paso.comandoTerminal && paso.comandoTerminal.trim()) {
            y = ensureSpace(doc, y, 25, pageHeight);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('Terminal:', marginX, y);
            y += 5;
            y = addHighlightedCodeBox(doc, `$ ${paso.comandoTerminal.trim()}`, marginX, y, contentW);
            y += 6;
        }

        if (paso.advertencia) {
            y = ensureSpace(doc, y, 20, pageHeight);
            y = addCallout(doc, marginX, y, contentW, 'Ojo con esto', paso.advertencia, 'red');
            y += 6;
        }

        doc.setDrawColor(225, 225, 225);
        doc.setLineWidth(0.2);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 8;
    }

    if (guiaTecnica.erroresComunes.length > 0) {
        y = ensureSpace(doc, y, 30, pageHeight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...accentRgb);
        doc.text('Errores frecuentes', marginX, y);
        y += 8;

        autoTable(doc, {
            startY: y,
            head: [['Error', 'Causa', 'Solución']],
            body: guiaTecnica.erroresComunes.map((e) => [e.error, e.causa, e.solucion]),
            theme: 'grid',
            headStyles: { fillColor: accentRgb, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8.5, textColor: [50, 50, 50] },
            styles: { overflow: 'linebreak' },
            margin: { left: marginX, right: marginX },
        });
    }

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    return Buffer.from(arrayBuffer);
}
