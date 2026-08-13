import PptxGenJS from 'pptxgenjs';
import type {
    ClassKitContent, PortadaSlide, BulletsSlide, CodigoSlide, ComparacionSlide,
    AnalogiaSlide, MapeoIconosSlide, ProblemaAlertasSlide, TablaSlide, PasosSlide,
} from './schema';
import { resolveAccent } from './palette';
import { tokenizeCode } from './syntaxHighlight';
import { iconToPngDataUrl } from './iconMap';

export type ClassKitTheme = 'dark' | 'light';

// ── Sistema de temas: oscuro (default) y claro (proyectores/aulas con mucha luz) ──
// Adaptado de plantilla_maestra_referencia.js. A diferencia del original (que usaba un
// `T` mutable a nivel de módulo vía setTheme()), acá el tema resuelto se pasa como
// parámetro explícito a cada función de layout — el módulo global mutable no es seguro
// en un servidor Next.js donde dos requests pueden renderizar temas distintos a la vez.
interface Theme {
    bg: string; cardBg: string; cardBorder: string;
    textMain: string; textMuted: string;
    accentBlue: string; accentTeal: string; accentAmber: string;
    accentGreen: string; accentRed: string; accentPurple: string;
}

const THEMES: Record<ClassKitTheme, Theme> = {
    dark: {
        bg: '0F172A', cardBg: '1E293B', cardBorder: '334155',
        textMain: 'F8FAFC', textMuted: '94A3B8',
        accentBlue: '3B82F6', accentTeal: '0D9488', accentAmber: 'F59E0B',
        accentGreen: '22C55E', accentRed: 'EF4444', accentPurple: '8B5CF6',
    },
    light: {
        bg: 'FFFFFF', cardBg: 'F1F5F9', cardBorder: 'E2E8F0',
        textMain: '0F172A', textMuted: '64748B',
        accentBlue: '2563EB', accentTeal: '0F766E', accentAmber: 'B45309',
        accentGreen: '15803D', accentRed: 'DC2626', accentPurple: '7C3AED',
    },
};

// Sintaxis de código (fondo tipo VS Code, sobre CODE_BG) — colores funcionales fijos,
// no varían con el tema ni con el acento de la materia.
const CODE_BG = '0B1220';
const CODE_KEYWORD = 'C084FC';
const CODE_STRING = '86EFAC';
const CODE_COMMENT = '64748B';
const CODE_DEFAULT = 'E2E8F0';

function codeTokenColor(type: 'comment' | 'string' | 'tag' | 'keyword' | 'number' | 'plain'): string {
    switch (type) {
        case 'comment': return CODE_COMMENT;
        case 'string': return CODE_STRING;
        case 'keyword': return CODE_KEYWORD;
        case 'tag': return CODE_KEYWORD;
        default: return CODE_DEFAULT;
    }
}

function newDeck(): PptxGenJS {
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE'; // 13.3" x 7.5"
    return pres;
}

function bgFill(slide: PptxGenJS.Slide, T: Theme) {
    slide.background = { color: T.bg };
}

function addAccentPill(slide: PptxGenJS.Slide, text: string, color: string, x: number, y: number) {
    slide.addShape('roundRect', {
        x, y, w: 1.7, h: 0.35,
        rectRadius: 0.18,
        fill: { color },
        line: { type: 'none' },
    });
    slide.addText(text.toUpperCase(), {
        x, y, w: 1.7, h: 0.35,
        align: 'center', valign: 'middle',
        fontFace: 'Calibri', fontSize: 11, bold: true,
        color: 'FFFFFF', charSpacing: 1,
    });
}

// ── Layout 1: Portada ───────────────────────────────────────────────────────
// accent = color "protagonista" configurable por materia (subjects.accent_color) —
// reemplaza el T.accentTeal fijo del original solo en este layout, según lo pedido:
// el resto de los layouts mantiene sus colores funcionales fijos por tipo de slide.
function layoutPortada(pres: PptxGenJS, T: Theme, accent: string, materia: string, semana: number, slide_: PortadaSlide) {
    const slide = pres.addSlide();
    bgFill(slide, T);

    slide.addShape('ellipse', {
        x: 9.8, y: -1.5, w: 5.5, h: 5.5,
        fill: { color: T.cardBg }, line: { type: 'none' },
    });
    slide.addShape('ellipse', {
        x: 11.3, y: 3.5, w: 3.2, h: 3.2,
        fill: { color: T.cardBg }, line: { type: 'none' },
    });

    addAccentPill(slide, `Semana ${semana}`, accent, 0.6, 0.6);

    slide.addText(materia, {
        x: 0.6, y: 1.15, w: 8, h: 0.4,
        fontFace: 'Calibri', fontSize: 15, color: T.textMuted, margin: 0,
    });

    slide.addText(slide_.titulo, {
        x: 0.6, y: 1.6, w: 8.2, h: 2.6,
        fontFace: 'Cambria', fontSize: 40, bold: true, color: T.textMain,
        margin: 0, valign: 'top', lineSpacingMultiple: 1.05,
    });

    const palette = [accent, T.accentBlue, T.accentAmber, T.accentPurple];
    let tx = 0.6;
    slide_.tags.forEach((tag, i) => {
        const w = 0.35 + tag.length * 0.09;
        slide.addShape('roundRect', {
            x: tx, y: 6.5, w, h: 0.42, rectRadius: 0.21,
            fill: { color: T.cardBg },
            line: { color: palette[i % palette.length], width: 1 },
        });
        slide.addText(tag, {
            x: tx, y: 6.5, w, h: 0.42, align: 'center', valign: 'middle',
            fontFace: 'Calibri', fontSize: 12, bold: true,
            color: palette[i % palette.length], margin: 0,
        });
        tx += w + 0.25;
    });

    slide.addNotes(slide_.speakerNotes);
}

// ── Layout 2: Bullets con jerarquía + círculos numerados ───────────────────
const BULLETS_MAX = 6; // más allá de esto se sale de la tarjeta a 13.3x7.5

function layoutBullets(pres: PptxGenJS, T: Theme, slide_: BulletsSlide) {
    const slide = pres.addSlide();
    bgFill(slide, T);

    slide.addText(slide_.kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: T.accentTeal,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(slide_.titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.9,
        fontFace: 'Cambria', fontSize: 30, bold: true, color: T.textMain, margin: 0,
    });

    const palette = [T.accentBlue, T.accentTeal, T.accentAmber, T.accentPurple, T.accentGreen];
    const bullets = slide_.bullets.slice(0, BULLETS_MAX);
    let y = 2.05;
    bullets.forEach((b, i) => {
        const color = palette[i % palette.length];
        slide.addShape('ellipse', {
            x: 0.6, y, w: 0.5, h: 0.5,
            fill: { color: T.cardBg }, line: { color, width: 1.5 },
        });
        slide.addText(String(i + 1), {
            x: 0.6, y, w: 0.5, h: 0.5, align: 'center', valign: 'middle',
            fontFace: 'Calibri', fontSize: 16, bold: true, color, margin: 0,
        });
        slide.addText(
            [
                { text: b.titulo + '  ', options: { bold: true, color: T.textMain, fontSize: 16 } },
                { text: b.detalle || '', options: { color: T.textMuted, fontSize: 14 } },
            ],
            { x: 1.35, y: y - 0.03, w: 10.8, h: 0.7, valign: 'middle', fontFace: 'Calibri', margin: 0 },
        );
        y += 0.92;
    });

    slide.addNotes(slide_.speakerNotes);
}

// ── Layout 3: Código en tarjeta con syntax highlighting real ───────────────
function codeToParagraphs(code: string, maxLines: number): PptxGenJS.TextProps[][] {
    const lines = tokenizeCode(code);
    const truncated = lines.length > maxLines;
    const visible = truncated ? lines.slice(0, maxLines - 1) : lines;

    const paras: PptxGenJS.TextProps[][] = visible.map((lineTokens) => {
        const runs: PptxGenJS.TextProps[] = lineTokens.length > 0
            ? lineTokens.map((tok) => ({ text: tok.text || ' ', options: { color: codeTokenColor(tok.type) } }))
            : [{ text: ' ', options: { color: CODE_DEFAULT } }];
        runs.forEach((r) => { r.options!.breakLine = false; });
        runs[runs.length - 1].options!.breakLine = true;
        return runs;
    });

    if (truncated) {
        paras.push([{ text: '# … (código completo en la guía técnica)', options: { color: CODE_COMMENT, italic: true, breakLine: true } }]);
    }
    return paras;
}

function layoutCodigo(pres: PptxGenJS, T: Theme, slide_: CodigoSlide) {
    const slide = pres.addSlide();
    bgFill(slide, T);

    slide.addText(slide_.kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: T.accentBlue,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(slide_.titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.7,
        fontFace: 'Cambria', fontSize: 26, bold: true, color: T.textMain, margin: 0,
    });

    if (slide_.explicacion) {
        slide.addText(slide_.explicacion, {
            x: 0.6, y: 1.55, w: 11.5, h: 0.5,
            fontFace: 'Calibri', fontSize: 14, color: T.textMuted, margin: 0,
        });
    }

    const codeY = slide_.explicacion ? 2.15 : 1.7;
    const codeH = 7.0 - codeY - 0.5;
    slide.addShape('roundRect', {
        x: 0.6, y: codeY, w: 12.1, h: codeH, rectRadius: 0.1,
        fill: { color: CODE_BG }, line: { color: T.cardBorder, width: 1 },
    });

    // Salvaguarda: el layout usa un tamaño de fuente fijo (13.5pt) validado visualmente,
    // no autoFit — si el código es más largo de lo que cabe, se trunca en vez de
    // desbordar la tarjeta (mismo tipo de bug que ya corregimos antes en este renderer).
    const lineHeightIn = (13.5 * 1.15) / 72;
    const maxLines = Math.max(1, Math.floor((codeH - 0.5) / lineHeightIn));
    const paras = codeToParagraphs(slide_.code, maxLines).flat();

    slide.addText(paras, {
        x: 0.9, y: codeY + 0.25, w: 11.5, h: codeH - 0.5,
        fontFace: 'Courier New', fontSize: 13.5, valign: 'top',
        margin: 0, lineSpacingMultiple: 1.15,
    });

    slide.addNotes(slide_.speakerNotes);
}

// ── Layout 4: Comparación 2 columnas ────────────────────────────────────────
function layoutComparacion(pres: PptxGenJS, T: Theme, slide_: ComparacionSlide) {
    const slide = pres.addSlide();
    bgFill(slide, T);

    slide.addText(slide_.kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: T.accentAmber,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(slide_.titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.7,
        fontFace: 'Cambria', fontSize: 26, bold: true, color: T.textMain, margin: 0,
    });

    const colY = 1.75, colW = 5.75, colH = 5.0, gap = 0.55;
    ([{ col: slide_.colA, x: 0.6, accent: T.accentBlue }, { col: slide_.colB, x: 0.6 + colW + gap, accent: T.accentTeal }] as const)
        .forEach(({ col, x, accent }) => {
            slide.addShape('roundRect', {
                x, y: colY, w: colW, h: colH, rectRadius: 0.12,
                fill: { color: T.cardBg }, line: { color: T.cardBorder, width: 1 },
            });
            slide.addShape('roundRect', {
                x: x + 0.3, y: colY + 0.3, w: 2.2, h: 0.45, rectRadius: 0.08,
                fill: { color: accent }, line: { type: 'none' },
            });
            slide.addText(col.header, {
                x: x + 0.3, y: colY + 0.3, w: 2.2, h: 0.45,
                align: 'center', valign: 'middle', fontFace: 'Courier New',
                fontSize: 14, bold: true, color: T.bg, margin: 0,
            });
            slide.addText(col.sub || '', {
                x: x + 2.7, y: colY + 0.3, w: colW - 3.0, h: 0.45,
                valign: 'middle', fontFace: 'Calibri', fontSize: 12,
                color: T.textMuted, margin: 0,
            });

            let iy = colY + 0.95;
            (col.items || []).forEach((item) => {
                slide.addShape('ellipse', {
                    x: x + 0.3, y: iy + 0.05, w: 0.16, h: 0.16,
                    fill: { color: accent }, line: { type: 'none' },
                });
                slide.addText(item, {
                    x: x + 0.62, y: iy - 0.08, w: colW - 0.9, h: 0.55,
                    fontFace: 'Calibri', fontSize: 13.5, color: T.textMain,
                    valign: 'top', margin: 0,
                });
                iy += 0.62;
            });
        });

    slide.addNotes(slide_.speakerNotes);
}

// ── Layout 5: Analogía destacada ────────────────────────────────────────────
function layoutAnalogia(pres: PptxGenJS, T: Theme, slide_: AnalogiaSlide) {
    const slide = pres.addSlide();
    bgFill(slide, T);

    slide.addText(slide_.kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: T.accentPurple,
        charSpacing: 1.2, margin: 0,
    });

    slide.addShape('roundRect', {
        x: 0.6, y: 1.1, w: 12.1, h: 3.1, rectRadius: 0.12,
        fill: { color: T.cardBg }, line: { color: T.accentPurple, width: 1 },
    });
    slide.addShape('ellipse', {
        x: 1.0, y: 1.5, w: 0.9, h: 0.9,
        fill: { color: T.bg }, line: { color: T.accentPurple, width: 1.5 },
    });
    slide.addText('?', {
        x: 1.0, y: 1.5, w: 0.9, h: 0.9, align: 'center', valign: 'middle',
        fontFace: 'Cambria', fontSize: 28, bold: true, color: T.accentPurple, margin: 0,
    });

    slide.addText(slide_.nombreAnalogia, {
        x: 2.15, y: 1.45, w: 10.2, h: 0.5,
        fontFace: 'Cambria', fontSize: 20, bold: true, color: T.accentPurple, margin: 0,
    });
    slide.addText(slide_.texto, {
        x: 2.15, y: 1.95, w: 10.2, h: 2.05,
        fontFace: 'Calibri', fontSize: 16, color: T.textMain, margin: 0,
        valign: 'top', lineSpacingMultiple: 1.25,
    });

    if (slide_.conexionTecnica) {
        slide.addText([
            { text: 'Conexión técnica:  ', options: { bold: true, color: T.accentTeal } },
            { text: slide_.conexionTecnica, options: { color: T.textMuted } },
        ], {
            x: 0.6, y: 4.55, w: 12.1, h: 1.5,
            fontFace: 'Calibri', fontSize: 14, margin: 0, valign: 'top', lineSpacingMultiple: 1.2,
        });
    }

    slide.addNotes(slide_.speakerNotes);
}

// ── Layout 6: Mapeo de roles con íconos (N elementos en fila) ──────────────
async function layoutMapeoIconos(pres: PptxGenJS, T: Theme, slide_: MapeoIconosSlide) {
    const slide = pres.addSlide();
    bgFill(slide, T);

    slide.addText(slide_.kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: T.accentGreen,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(slide_.titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.6,
        fontFace: 'Cambria', fontSize: 26, bold: true, color: T.textMain, margin: 0,
    });
    if (slide_.contexto) {
        slide.addText(slide_.contexto, {
            x: 0.6, y: 1.45, w: 11.5, h: 0.5,
            fontFace: 'Calibri', fontSize: 13.5, color: T.textMuted, margin: 0,
        });
    }

    const items = slide_.items;
    const n = items.length;
    if (n === 0) { slide.addNotes(slide_.speakerNotes); return; }

    const colW = 2.75;
    // Salvaguarda: con un solo elemento no hay "entre columnas" que espaciar (evita
    // dividir por cero, que el layout original no contempla porque siempre asume n>=2).
    const gap = n > 1 ? (12.1 - colW * n) / (n - 1) : 0;
    const palette = [T.accentBlue, T.accentTeal, T.accentAmber, T.accentPurple, T.accentGreen];
    const topY = 2.25;
    const startX = n === 1 ? 0.6 + (12.1 - colW) / 2 : 0.6;

    for (let i = 0; i < n; i++) {
        const item = items[i];
        const color = palette[i % palette.length];
        const x = startX + i * (colW + gap);

        slide.addShape('roundRect', {
            x, y: topY, w: colW, h: 4.1, rectRadius: 0.1,
            fill: { color: T.cardBg }, line: { color: T.cardBorder, width: 1 },
        });
        const iconPng = await iconToPngDataUrl(item.icono, color, 256);
        slide.addShape('ellipse', {
            x: x + colW / 2 - 0.5, y: topY + 0.35, w: 1.0, h: 1.0,
            fill: { color: T.bg }, line: { color, width: 1.5 },
        });
        slide.addImage({
            data: iconPng,
            x: x + colW / 2 - 0.28, y: topY + 0.63, w: 0.56, h: 0.56,
        });
        slide.addText(item.nombre, {
            x: x + 0.15, y: topY + 1.55, w: colW - 0.3, h: 0.4,
            align: 'center', fontFace: 'Calibri', fontSize: 15, bold: true,
            color: T.textMain, margin: 0,
        });
        if (item.subtitulo) {
            slide.addText(item.subtitulo, {
                x: x + 0.15, y: topY + 1.95, w: colW - 0.3, h: 0.35,
                align: 'center', fontFace: 'Courier New', fontSize: 11.5,
                color, margin: 0,
            });
        }
        slide.addText(item.descripcion, {
            x: x + 0.2, y: topY + 2.4, w: colW - 0.4, h: 1.5,
            align: 'center', fontFace: 'Calibri', fontSize: 12, color: T.textMuted,
            margin: 0, valign: 'top', lineSpacingMultiple: 1.15,
        });

        if (i < n - 1) {
            slide.addShape('rightArrow', {
                x: x + colW, y: topY + 1.85, w: gap, h: 0.25,
                fill: { color: T.cardBorder }, line: { type: 'none' },
            });
        }
    }

    slide.addNotes(slide_.speakerNotes);
}

// ── Layout 7: Problema con alertas (elemento central + síntomas) ──────────
async function layoutProblemaAlertas(pres: PptxGenJS, T: Theme, slide_: ProblemaAlertasSlide) {
    const slide = pres.addSlide();
    bgFill(slide, T);

    slide.addText(slide_.kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: T.accentRed,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(slide_.titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.7,
        fontFace: 'Cambria', fontSize: 26, bold: true, color: T.textMain, margin: 0,
    });

    const centroX = 0.6, centroY = 2.0, centroW = 3.6, centroH = 4.0;
    slide.addShape('roundRect', {
        x: centroX, y: centroY, w: centroW, h: centroH, rectRadius: 0.12,
        fill: { color: T.cardBg }, line: { color: T.accentRed, width: 1.5 },
    });
    const centroIconPng = await iconToPngDataUrl(slide_.centro.icono, T.accentRed, 256);
    slide.addShape('ellipse', {
        x: centroX + centroW / 2 - 0.55, y: centroY + 0.4, w: 1.1, h: 1.1,
        fill: { color: T.bg }, line: { color: T.accentRed, width: 1.5 },
    });
    slide.addImage({
        data: centroIconPng,
        x: centroX + centroW / 2 - 0.3, y: centroY + 0.65, w: 0.6, h: 0.6,
    });
    slide.addText(slide_.centro.nombre, {
        x: centroX + 0.2, y: centroY + 1.75, w: centroW - 0.4, h: 0.45,
        align: 'center', fontFace: 'Calibri', fontSize: 16, bold: true,
        color: T.textMain, margin: 0,
    });
    slide.addText(slide_.centro.detalle || '', {
        x: centroX + 0.2, y: centroY + 2.25, w: centroW - 0.4, h: 0.5,
        align: 'center', fontFace: 'Calibri', fontSize: 13, italic: true,
        color: T.accentRed, margin: 0,
    });

    const sintomas = slide_.sintomas;
    if (sintomas.length > 0) {
        const symX = centroX + centroW + 1.0;
        const symW = 12.1 - (symX - 0.6);
        const rowH = 4.0 / sintomas.length;
        sintomas.forEach((s, i) => {
            const sy = centroY + i * rowH;
            slide.addShape('rightArrow', {
                x: centroX + centroW, y: sy + rowH / 2 - 0.12, w: 0.8, h: 0.24,
                fill: { color: T.cardBorder }, line: { type: 'none' },
            });
            slide.addShape('ellipse', {
                x: symX, y: sy + rowH / 2 - 0.28, w: 0.56, h: 0.56,
                fill: { color: T.cardBg }, line: { color: T.accentAmber, width: 1.2 },
            });
            slide.addText('!', {
                x: symX, y: sy + rowH / 2 - 0.28, w: 0.56, h: 0.56,
                align: 'center', valign: 'middle', fontFace: 'Cambria',
                fontSize: 20, bold: true, color: T.accentAmber, margin: 0,
            });
            slide.addText(s, {
                x: symX + 0.75, y: sy + 0.08, w: symW - 0.85, h: rowH - 0.16,
                valign: 'middle', fontFace: 'Calibri', fontSize: 14,
                color: T.textMain, margin: 0,
            });
        });
    }

    slide.addNotes(slide_.speakerNotes);
}

// ── Layout extra 1: Tabla de datos ─────────────────────────────────────────
// No vive en el discriminated union principal de 7 layouts — ver nota junto a
// TablaSlideSchema en schema.ts (límite de complejidad del compilador de Claude).
function layoutTabla(pres: PptxGenJS, T: Theme, slide_: TablaSlide) {
    const slide = pres.addSlide();
    bgFill(slide, T);

    slide.addText(slide_.kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: T.accentBlue,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(slide_.titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.7,
        fontFace: 'Cambria', fontSize: 26, bold: true, color: T.textMain, margin: 0,
    });

    const columnas = slide_.columnas;
    if (columnas.length === 0) { slide.addNotes(slide_.speakerNotes); return; }
    // Salvaguarda: más de 6 filas no entra en una sola slide de 13.3x7.5 con texto legible.
    const filas = slide_.filas.slice(0, 6);
    const colW = 12.1 / columnas.length;

    const headerRow: PptxGenJS.TableRow = columnas.map((c) => ({
        text: c,
        options: { fill: { color: T.accentBlue }, color: 'FFFFFF', bold: true, fontFace: 'Calibri', fontSize: 13 },
    }));
    const bodyRows: PptxGenJS.TableRow[] = filas.map((f, i) =>
        columnas.map((_, colIdx) => ({
            text: f[colIdx] ?? '',
            options: {
                fill: { color: i % 2 === 0 ? T.cardBg : T.bg },
                color: T.textMain, fontFace: 'Calibri', fontSize: 12.5,
            },
        })),
    );

    slide.addTable([headerRow, ...bodyRows], {
        x: 0.6, y: 1.75, w: 12.1,
        colW: Array(columnas.length).fill(colW),
        border: { type: 'solid', color: T.cardBorder, pt: 0.5 },
        autoPage: false,
        valign: 'middle',
        margin: [4, 8, 4, 8],
    });

    slide.addNotes(slide_.speakerNotes);
}

// ── Layout extra 2: Pasos numerados en columnas ────────────────────────────
// Mismo esqueleto de columnas que mapeoIconos, con un círculo numerado en vez de un
// ícono — para secuencias/procedimientos donde el orden importa más que un rol.
function layoutPasos(pres: PptxGenJS, T: Theme, slide_: PasosSlide) {
    const slide = pres.addSlide();
    bgFill(slide, T);

    slide.addText(slide_.kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: T.accentTeal,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(slide_.titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.6,
        fontFace: 'Cambria', fontSize: 26, bold: true, color: T.textMain, margin: 0,
    });
    if (slide_.contexto) {
        slide.addText(slide_.contexto, {
            x: 0.6, y: 1.45, w: 11.5, h: 0.5,
            fontFace: 'Calibri', fontSize: 13.5, color: T.textMuted, margin: 0,
        });
    }

    const pasos = slide_.pasos;
    const n = pasos.length;
    if (n === 0) { slide.addNotes(slide_.speakerNotes); return; }

    const colW = 2.75;
    const gap = n > 1 ? (12.1 - colW * n) / (n - 1) : 0;
    const topY = 2.25;
    const startX = n === 1 ? 0.6 + (12.1 - colW) / 2 : 0.6;

    for (let i = 0; i < n; i++) {
        const item = pasos[i];
        const x = startX + i * (colW + gap);

        slide.addShape('roundRect', {
            x, y: topY, w: colW, h: 4.1, rectRadius: 0.1,
            fill: { color: T.cardBg }, line: { color: T.cardBorder, width: 1 },
        });
        slide.addShape('ellipse', {
            x: x + colW / 2 - 0.5, y: topY + 0.35, w: 1.0, h: 1.0,
            fill: { color: T.bg }, line: { color: T.accentTeal, width: 1.5 },
        });
        slide.addText(String(item.numero), {
            x: x + colW / 2 - 0.5, y: topY + 0.35, w: 1.0, h: 1.0,
            align: 'center', valign: 'middle', fontFace: 'Cambria',
            fontSize: 26, bold: true, color: T.accentTeal, margin: 0,
        });
        slide.addText(item.titulo, {
            x: x + 0.15, y: topY + 1.55, w: colW - 0.3, h: 0.55,
            align: 'center', fontFace: 'Calibri', fontSize: 15, bold: true,
            color: T.textMain, margin: 0, valign: 'top',
        });
        if (item.detalle) {
            slide.addText(item.detalle, {
                x: x + 0.2, y: topY + 2.2, w: colW - 0.4, h: 1.7,
                align: 'center', fontFace: 'Calibri', fontSize: 12, color: T.textMuted,
                margin: 0, valign: 'top', lineSpacingMultiple: 1.15,
            });
        }

        if (i < n - 1) {
            slide.addShape('rightArrow', {
                x: x + colW, y: topY + 1.85, w: gap, h: 0.25,
                fill: { color: T.cardBorder }, line: { type: 'none' },
            });
        }
    }

    slide.addNotes(slide_.speakerNotes);
}

export interface RenderClassKitOptions {
    theme?: ClassKitTheme;
    accentColor?: string | null;
    subjectName: string;
    weekNumber: number;
}

export async function renderClassKitPptx(content: ClassKitContent, options: RenderClassKitOptions): Promise<Buffer> {
    const T = THEMES[options.theme ?? 'dark'];
    const accent = resolveAccent(options.accentColor ?? undefined);
    const pres = newDeck();

    for (const slide of content.slides) {
        switch (slide.layout) {
            case 'portada':
                layoutPortada(pres, T, accent, options.subjectName, options.weekNumber, slide);
                break;
            case 'bullets':
                layoutBullets(pres, T, slide);
                break;
            case 'codigo':
                layoutCodigo(pres, T, slide);
                break;
            case 'comparacion':
                layoutComparacion(pres, T, slide);
                break;
            case 'analogia':
                layoutAnalogia(pres, T, slide);
                break;
            case 'mapeoIconos':
                await layoutMapeoIconos(pres, T, slide);
                break;
            case 'problemaAlertas':
                await layoutProblemaAlertas(pres, T, slide);
                break;
            case 'tabla':
                layoutTabla(pres, T, slide);
                break;
            case 'pasos':
                layoutPasos(pres, T, slide);
                break;
        }
    }

    const buffer = await pres.write({ outputType: 'nodebuffer' });
    return buffer as Buffer;
}
