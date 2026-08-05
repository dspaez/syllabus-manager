import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { GuionDocente } from './schema';
import { hexToRgb, resolveAccent } from './palette';
import { addCallout, addChecklist, ensureSpace } from './pdfHelpers';

function addLabeledParagraph(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, accentRgb: [number, number, number]): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...accentRgb);
    doc.text(label.toUpperCase(), x, y);
    let cursorY = y + 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(value, w) as string[];
    doc.text(lines, x, cursorY);
    cursorY += lines.length * 4.6 + 4;
    return cursorY;
}

export function renderGuionDocentePdf(guionDocente: GuionDocente, accentColor?: string): Buffer {
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
    doc.text('Guión docente', marginX, y);
    y += 10;

    // Resumen de bloques de tiempo de toda la clase, de un vistazo.
    if (guionDocente.resumen.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Momento', 'Tiempo', 'Slides']],
            body: guionDocente.resumen.map((r) => [r.momento, r.tiempoEstimado, r.slidesInvolucradas]),
            theme: 'grid',
            headStyles: { fillColor: accentRgb, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8.5, textColor: [50, 50, 50] },
            margin: { left: marginX, right: marginX },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    // Checklist previo a la clase.
    if (guionDocente.antesDeClase.length > 0) {
        y = ensureSpace(doc, y, 20, pageHeight);
        y = addChecklist(doc, marginX, y, contentW, 'Antes de entrar a clase', guionDocente.antesDeClase, 'amber');
        y += 8;
    }

    for (const item of guionDocente.items) {
        y = ensureSpace(doc, y, 20, pageHeight);

        doc.setFillColor(...accentRgb);
        doc.roundedRect(marginX, y - 5.5, contentW, 8, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`Slide ${item.slideRef}  ·  Minuto ${item.minuto}`, marginX + 3, y);
        y += 12;

        y = ensureSpace(doc, y, 20, pageHeight);
        y = addLabeledParagraph(doc, marginX, y, contentW, 'Qué muestra la slide', item.queMuestra, accentRgb);

        y = ensureSpace(doc, y, 20, pageHeight);
        y = addLabeledParagraph(doc, marginX, y, contentW, 'Cómo presentarlo', item.comoPresentarlo, accentRgb);

        if (item.analogiaNombrada) {
            y = ensureSpace(doc, y, 20, pageHeight);
            y = addCallout(doc, marginX, y, contentW, item.analogiaNombrada.nombre, item.analogiaNombrada.texto, 'teal');
            y += 6;
        }

        if (item.preguntaInteractiva) {
            y = ensureSpace(doc, y, 20, pageHeight);
            y = addCallout(
                doc, marginX, y, contentW, 'Pregunta al grupo',
                `${item.preguntaInteractiva.pregunta}\nRespuesta esperada: ${item.preguntaInteractiva.respuestaEsperada}`,
                'blue',
            );
            y += 6;
        }

        for (const [label, value] of [['Qué decir', item.queDecir], ['Qué hacer', item.queHacer], ['Pausa para', item.pausaPara]] as [string, string][]) {
            if (!value) continue;
            y = ensureSpace(doc, y, 20, pageHeight);
            y = addLabeledParagraph(doc, marginX, y, contentW, label, value, accentRgb);
        }

        if (item.ganchoSiguiente) {
            y = ensureSpace(doc, y, 20, pageHeight);
            y = addCallout(doc, marginX, y, contentW, 'Gancho para la siguiente slide', item.ganchoSiguiente, 'amber');
            y += 6;
        }

        doc.setDrawColor(225, 225, 225);
        doc.setLineWidth(0.2);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 8;
    }

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    return Buffer.from(arrayBuffer);
}
