import jsPDF from 'jspdf';
import { tokenizeCode, DEFAULT_TOKEN_COLORS, type CodeToken } from './syntaxHighlight';
import { CODE_BG, hexToRgb } from './palette';

export type CalloutColor = 'blue' | 'teal' | 'amber' | 'red' | 'green';

const CALLOUT_COLORS: Record<CalloutColor, { bg: [number, number, number]; border: [number, number, number]; text: [number, number, number] }> = {
    blue: { bg: [239, 246, 255], border: [59, 130, 246], text: [30, 58, 138] },
    teal: { bg: [240, 253, 250], border: [13, 148, 136], text: [17, 94, 89] },
    amber: { bg: [255, 251, 235], border: [245, 158, 11], text: [146, 64, 14] },
    red: { bg: [254, 242, 242], border: [239, 68, 68], text: [153, 27, 27] },
    green: { bg: [240, 253, 244], border: [34, 197, 94], text: [22, 101, 52] },
};

// Dispara un salto de página si lo que sigue no cabe en el espacio restante.
export function ensureSpace(doc: jsPDF, y: number, needed: number, pageHeight: number, margin = 20): number {
    if (y + needed > pageHeight - margin) {
        doc.addPage();
        return margin;
    }
    return y;
}

// Callout con barra de color a la izquierda y fondo tenue — mismo patrón visual en
// guión docente y guía técnica, solo cambia el color semántico por tipo de contenido.
export function addCallout(doc: jsPDF, x: number, y: number, w: number, title: string, body: string, color: CalloutColor): number {
    const c = CALLOUT_COLORS[color];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const titleLines = doc.splitTextToSize(title, w - 8) as string[];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const bodyLines = doc.splitTextToSize(body, w - 8) as string[];

    const height = titleLines.length * 4.2 + bodyLines.length * 4.4 + 6;

    doc.setFillColor(...c.bg);
    doc.roundedRect(x, y, w, height, 1.5, 1.5, 'F');
    doc.setFillColor(...c.border);
    doc.rect(x, y, 1.3, height, 'F');

    let cursorY = y + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...c.text);
    doc.text(titleLines, x + 5, cursorY);
    cursorY += titleLines.length * 4.2 + 1;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    doc.text(bodyLines, x + 5, cursorY);

    return y + height;
}

// Envuelve tokens en líneas de máx. maxChars caracteres, cortando dentro de un token si hace
// falta pero sin fusionar/perder ninguno — preserva la alineación de diagramas ASCII (árboles
// de carpetas ya saneados por tokenizeCode) en vez de reflowarlos por palabra.
function wrapTokenLine(tokens: CodeToken[], maxChars: number): CodeToken[][] {
    const flatLen = tokens.reduce((acc, t) => acc + t.text.length, 0);
    if (flatLen <= maxChars) return [tokens];

    const wrapped: CodeToken[][] = [];
    let remaining = tokens.slice();
    while (remaining.length > 0) {
        let count = 0;
        const line: CodeToken[] = [];
        while (remaining.length > 0 && count < maxChars) {
            const tok = remaining[0];
            const space = maxChars - count;
            if (tok.text.length <= space) {
                line.push(tok);
                count += tok.text.length;
                remaining = remaining.slice(1);
            } else {
                line.push({ text: tok.text.slice(0, space), type: tok.type });
                remaining = [{ text: tok.text.slice(space), type: tok.type }, ...remaining.slice(1)];
                count = maxChars;
            }
        }
        wrapped.push(line);
    }
    return wrapped;
}

// Bloque de código con resaltado de sintaxis real (colores por token). Courier es monoespaciado,
// así que cada carácter mide lo mismo — eso permite posicionar cada token por índice de carácter
// en vez de depender de splitTextToSize (que es justo lo que rompía con los caracteres de árbol).
export function addHighlightedCodeBox(doc: jsPDF, code: string, x: number, y: number, w: number): number {
    const fontSize = 9;
    doc.setFont('courier', 'normal');
    doc.setFontSize(fontSize);
    const padding = 4;
    const charWidth = doc.getTextWidth('0');
    const maxChars = Math.max(10, Math.floor((w - padding * 2) / charWidth));
    const lineHeight = 4.3;

    const rawLines = tokenizeCode(code);
    const wrappedLines = rawLines.flatMap((line) => wrapTokenLine(line, maxChars));
    const boxHeight = wrappedLines.length * lineHeight + padding * 2;

    const codeBgRgb = hexToRgb(CODE_BG);
    doc.setFillColor(...codeBgRgb);
    doc.roundedRect(x, y, w, boxHeight, 1.5, 1.5, 'F');

    let cursorY = y + padding + 3;
    for (const line of wrappedLines) {
        let cursorX = x + padding;
        for (const tok of line) {
            if (!tok.text) continue;
            const rgb = hexToRgb(DEFAULT_TOKEN_COLORS[tok.type]);
            doc.setTextColor(...rgb);
            doc.text(tok.text, cursorX, cursorY);
            cursorX += tok.text.length * charWidth;
        }
        cursorY += lineHeight;
    }

    return y + boxHeight;
}

// Checklist estilo "[ ] item" — ASCII literal, no glifos Unicode de checkbox:
// jsPDF con las fuentes base14 no los mide/renderiza de forma confiable (mismo
// problema de raíz que los caracteres de árbol de carpetas).
export function addChecklist(doc: jsPDF, x: number, y: number, w: number, title: string, items: string[], color: CalloutColor): number {
    const c = CALLOUT_COLORS[color];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);

    const lineBlocks = items.map((item) => doc.splitTextToSize(`[ ] ${item}`, w - 8) as string[]);
    const titleH = 6;
    const bodyH = lineBlocks.reduce((acc, lines) => acc + lines.length * 4.6, 0) + 4;
    const height = titleH + bodyH;

    doc.setFillColor(...c.bg);
    doc.roundedRect(x, y, w, height, 1.5, 1.5, 'F');
    doc.setFillColor(...c.border);
    doc.rect(x, y, 1.3, height, 'F');

    let cursorY = y + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...c.text);
    doc.text(title.toUpperCase(), x + 5, cursorY);
    cursorY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    for (const lines of lineBlocks) {
        doc.text(lines, x + 5, cursorY);
        cursorY += lines.length * 4.6;
    }

    return y + height;
}
