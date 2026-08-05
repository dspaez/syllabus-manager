const pptxgen = require("pptxgenjs");

// ── Sistema de temas: oscuro (default) y claro (proyectores/aulas con mucha luz) ──
const THEMES = {
    dark: {
        bg: "0F172A", cardBg: "1E293B", cardBorder: "334155",
        textMain: "F8FAFC", textMuted: "94A3B8",
        accentBlue: "3B82F6", accentTeal: "0D9488", accentAmber: "F59E0B",
        accentGreen: "22C55E", accentRed: "EF4444", accentPurple: "8B5CF6",
    },
    light: {
        // Mismo patrón que las guías técnicas en PDF ya validadas: fondo claro,
        // texto oscuro, tarjetas gris muy sutil, acentos más saturados/oscuros
        // para mantener contraste AA sobre blanco.
        bg: "FFFFFF", cardBg: "F1F5F9", cardBorder: "E2E8F0",
        textMain: "0F172A", textMuted: "64748B",
        accentBlue: "2563EB", accentTeal: "0F766E", accentAmber: "B45309",
        accentGreen: "15803D", accentRed: "DC2626", accentPurple: "7C3AED",
    },
};
let T = THEMES.dark;
function setTheme(name) {
    if (!THEMES[name]) throw new Error(`Tema desconocido: ${name}`);
    T = THEMES[name];
}

// Sintaxis de código (fondo tipo VS Code, sobre T.cardBg)
const CODE_BG = "0B1220";
const CODE_KEYWORD = "C084FC";   // class, def, return, if
const CODE_STRING = "86EFAC";    // strings
const CODE_COMMENT = "64748B";   // comentarios
const CODE_DEFAULT = "E2E8F0";   // texto normal de código
const CODE_FUNC = "60A5FA";      // nombres de función/método

// ── Helper: renderizar un ícono de react-icons a PNG base64 ───────
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

async function iconToPngDataUrl(IconComponent, colorHex, pxSize = 256) {
    const svg = ReactDOMServer.renderToStaticMarkup(
        React.createElement(IconComponent, { size: pxSize, color: `#${colorHex}` })
    );
    const svgBuffer = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${pxSize}" height="${pxSize}" viewBox="0 0 24 24">${svg.replace(/<svg[^>]*>|<\/svg>/g, "")}</svg>`
    );
    const pngBuffer = await sharp(svgBuffer).resize(pxSize, pxSize).png().toBuffer();
    return "image/png;base64," + pngBuffer.toString("base64");
}

function newDeck() {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_WIDE"; // 13.3" x 7.5"
    return pres;
}

function bgFill(slide) {
    slide.background = { color: T.bg };
}

function addAccentPill(slide, text, color, x, y) {
    slide.addShape("roundRect", {
        x, y, w: 1.7, h: 0.35,
        rectRadius: 0.18,
        fill: { color },
        line: { type: "none" },
    });
    slide.addText(text.toUpperCase(), {
        x, y, w: 1.7, h: 0.35,
        align: "center", valign: "middle",
        fontFace: "Calibri", fontSize: 11, bold: true,
        color: "FFFFFF", charSpacing: 1,
    });
}

// ── Layout 1: Portada ──────────────────────────────────────────────
function layoutPortada(pres, { materia, semana, titulo, tags }) {
    const slide = pres.addSlide();
    bgFill(slide);

    // círculo decorativo grande, motivo visual repetido (no stripe)
    slide.addShape("ellipse", {
        x: 9.8, y: -1.5, w: 5.5, h: 5.5,
        fill: { color: T.cardBg }, line: { type: "none" },
    });
    slide.addShape("ellipse", {
        x: 11.3, y: 3.5, w: 3.2, h: 3.2,
        fill: { color: T.cardBg }, line: { type: "none" },
    });

    addAccentPill(slide, `Semana ${semana}`, T.accentTeal, 0.6, 0.6);

    slide.addText(materia, {
        x: 0.6, y: 1.15, w: 8, h: 0.4,
        fontFace: "Calibri", fontSize: 15, color: T.textMuted, margin: 0,
    });

    slide.addText(titulo, {
        x: 0.6, y: 1.6, w: 8.2, h: 2.6,
        fontFace: "Cambria", fontSize: 40, bold: true, color: T.textMain,
        margin: 0, valign: "top", lineSpacingMultiple: 1.05,
    });

    // tags tipo píldora al pie, motivo repetido en toda la deck
    const palette = [T.accentTeal, T.accentBlue, T.accentAmber, T.accentPurple];
    let tx = 0.6;
    tags.forEach((tag, i) => {
        const w = 0.35 + tag.length * 0.09;
        slide.addShape("roundRect", {
            x: tx, y: 6.5, w, h: 0.42, rectRadius: 0.21,
            fill: { color: T.cardBg },
            line: { color: palette[i % palette.length], width: 1 },
        });
        slide.addText(tag, {
            x: tx, y: 6.5, w, h: 0.42, align: "center", valign: "middle",
            fontFace: "Calibri", fontSize: 12, bold: true,
            color: palette[i % palette.length], margin: 0,
        });
        tx += w + 0.25;
    });

    slide.addNotes("Slide de portada. Presentar el tema y conectar con la clase anterior antes de avanzar.");
    return slide;
}

// ── Layout 2: Bullets con jerarquía + iconos-círculo ───────────────
function layoutBullets(pres, { kicker, titulo, bullets, notes }) {
    const slide = pres.addSlide();
    bgFill(slide);

    slide.addText(kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: "Calibri", fontSize: 12, bold: true, color: T.accentTeal,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.9,
        fontFace: "Cambria", fontSize: 30, bold: true, color: T.textMain, margin: 0,
    });

    const palette = [T.accentBlue, T.accentTeal, T.accentAmber, T.accentPurple, T.accentGreen];
    let y = 2.05;
    bullets.forEach((b, i) => {
        const color = palette[i % palette.length];
        // círculo numerado
        slide.addShape("ellipse", {
            x: 0.6, y, w: 0.5, h: 0.5,
            fill: { color: T.cardBg }, line: { color, width: 1.5 },
        });
        slide.addText(String(i + 1), {
            x: 0.6, y, w: 0.5, h: 0.5, align: "center", valign: "middle",
            fontFace: "Calibri", fontSize: 16, bold: true, color, margin: 0,
        });
        // título del bullet + detalle en pesos distintos
        slide.addText(
            [
                { text: b.titulo + "  ", options: { bold: true, color: T.textMain, fontSize: 16 } },
                { text: b.detalle || "", options: { color: T.textMuted, fontSize: 14 } },
            ],
            { x: 1.35, y: y - 0.03, w: 10.8, h: 0.7, valign: "middle", fontFace: "Calibri", margin: 0 }
        );
        y += 0.92;
    });

    slide.addNotes(notes || "");
    return slide;
}

// ── Layout 3: Código en tarjeta con syntax highlighting real ───────
function highlightPythonLine(line) {
    // tokenizer simple línea por línea: comentario > string > keyword > default
    const runs = [];
    const commentIdx = line.indexOf("#");
    let code = line, comment = "";
    if (commentIdx !== -1) {
        code = line.slice(0, commentIdx);
        comment = line.slice(commentIdx);
    }
    const keywords = ["def", "class", "return", "self", "if", "else", "elif", "import", "from", "for", "while", "in", "None", "True", "False", "super", "__init__"];
    const tokens = code.split(/(\s+|\(|\)|:|,|\.)/);
    tokens.forEach((tok) => {
        if (tok === "") return;
        if (/^["'].*["']$/.test(tok)) {
            runs.push({ text: tok, options: { color: CODE_STRING } });
        } else if (keywords.includes(tok.trim())) {
            runs.push({ text: tok, options: { color: CODE_KEYWORD, bold: true } });
        } else {
            runs.push({ text: tok, options: { color: CODE_DEFAULT } });
        }
    });
    if (comment) runs.push({ text: comment, options: { color: CODE_COMMENT, italic: true } });
    if (runs.length === 0) runs.push({ text: " ", options: { color: CODE_DEFAULT } });
    runs.forEach((r) => (r.options.breakLine = false));
    runs[runs.length - 1].options.breakLine = true;
    return runs;
}

function layoutCodigo(pres, { kicker, titulo, explicacion, code, notes }) {
    const slide = pres.addSlide();
    bgFill(slide);

    slide.addText(kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: "Calibri", fontSize: 12, bold: true, color: T.accentBlue,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.7,
        fontFace: "Cambria", fontSize: 26, bold: true, color: T.textMain, margin: 0,
    });

    if (explicacion) {
        slide.addText(explicacion, {
            x: 0.6, y: 1.55, w: 11.5, h: 0.5,
            fontFace: "Calibri", fontSize: 14, color: T.textMuted, margin: 0,
        });
    }

    // tarjeta de código
    const codeY = explicacion ? 2.15 : 1.7;
    const codeH = 7.0 - codeY - 0.5;
    slide.addShape("roundRect", {
        x: 0.6, y: codeY, w: 12.1, h: codeH, rectRadius: 0.1,
        fill: { color: CODE_BG }, line: { color: T.cardBorder, width: 1 },
    });

    const lines = code.split("\n");
    const paras = lines.map((line) => highlightPythonLine(line.length ? line : " "));

    slide.addText(paras, {
        x: 0.9, y: codeY + 0.25, w: 11.5, h: codeH - 0.5,
        fontFace: "Courier New", fontSize: 13.5, valign: "top",
        margin: 0, lineSpacingMultiple: 1.15,
    });

    slide.addNotes(notes || "");
    return slide;
}

// ── Layout 4: Comparación 2 columnas ───────────────────────────────
function layoutComparacion(pres, { kicker, titulo, colA, colB, notes }) {
    const slide = pres.addSlide();
    bgFill(slide);

    slide.addText(kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: "Calibri", fontSize: 12, bold: true, color: T.accentAmber,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.7,
        fontFace: "Cambria", fontSize: 26, bold: true, color: T.textMain, margin: 0,
    });

    const colY = 1.75, colW = 5.75, colH = 5.0, gap = 0.55;
    [{ col: colA, x: 0.6, accent: T.accentBlue }, { col: colB, x: 0.6 + colW + gap, accent: T.accentTeal }]
        .forEach(({ col, x, accent }) => {
            slide.addShape("roundRect", {
                x, y: colY, w: colW, h: colH, rectRadius: 0.12,
                fill: { color: T.cardBg }, line: { color: T.cardBorder, width: 1 },
            });
            // encabezado de columna, tipo tag de código
            slide.addShape("roundRect", {
                x: x + 0.3, y: colY + 0.3, w: 2.2, h: 0.45, rectRadius: 0.08,
                fill: { color: accent }, line: { type: "none" },
            });
            slide.addText(col.header, {
                x: x + 0.3, y: colY + 0.3, w: 2.2, h: 0.45,
                align: "center", valign: "middle", fontFace: "Courier New",
                fontSize: 14, bold: true, color: T.bg, margin: 0,
            });
            slide.addText(col.sub || "", {
                x: x + 2.7, y: colY + 0.3, w: colW - 3.0, h: 0.45,
                valign: "middle", fontFace: "Calibri", fontSize: 12,
                color: T.textMuted, margin: 0,
            });

            let iy = colY + 0.95;
            (col.items || []).forEach((item) => {
                slide.addShape("ellipse", {
                    x: x + 0.3, y: iy + 0.05, w: 0.16, h: 0.16,
                    fill: { color: accent }, line: { type: "none" },
                });
                slide.addText(item, {
                    x: x + 0.62, y: iy - 0.08, w: colW - 0.9, h: 0.55,
                    fontFace: "Calibri", fontSize: 13.5, color: T.textMain,
                    valign: "top", margin: 0,
                });
                iy += 0.62;
            });
        });

    slide.addNotes(notes || "");
    return slide;
}

// ── Layout 5: Analogía destacada ───────────────────────────────────
function layoutAnalogia(pres, { kicker, nombreAnalogia, texto, conexionTecnica, notes }) {
    const slide = pres.addSlide();
    bgFill(slide);

    slide.addText(kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: "Calibri", fontSize: 12, bold: true, color: T.accentPurple,
        charSpacing: 1.2, margin: 0,
    });

    // tarjeta central grande, motivo de círculo de ícono a la izquierda
    slide.addShape("roundRect", {
        x: 0.6, y: 1.1, w: 12.1, h: 3.1, rectRadius: 0.12,
        fill: { color: T.cardBg }, line: { color: T.accentPurple, width: 1 },
    });
    slide.addShape("ellipse", {
        x: 1.0, y: 1.5, w: 0.9, h: 0.9,
        fill: { color: T.bg }, line: { color: T.accentPurple, width: 1.5 },
    });
    slide.addText("?", {
        x: 1.0, y: 1.5, w: 0.9, h: 0.9, align: "center", valign: "middle",
        fontFace: "Cambria", fontSize: 28, bold: true, color: T.accentPurple, margin: 0,
    });

    slide.addText(nombreAnalogia, {
        x: 2.15, y: 1.45, w: 10.2, h: 0.5,
        fontFace: "Cambria", fontSize: 20, bold: true, color: T.accentPurple, margin: 0,
    });
    slide.addText(texto, {
        x: 2.15, y: 1.95, w: 10.2, h: 2.05,
        fontFace: "Calibri", fontSize: 16, color: T.textMain, margin: 0,
        valign: "top", lineSpacingMultiple: 1.25,
    });

    if (conexionTecnica) {
        slide.addText([
            { text: "Conexión técnica:  ", options: { bold: true, color: T.accentTeal } },
            { text: conexionTecnica, options: { color: T.textMuted } },
        ], {
            x: 0.6, y: 4.55, w: 12.1, h: 1.5,
            fontFace: "Calibri", fontSize: 14, margin: 0, valign: "top", lineSpacingMultiple: 1.2,
        });
    }

    slide.addNotes(notes || "");
    return slide;
}

// ── Layout 6: Mapeo de roles con íconos (N elementos en fila) ──────
async function layoutMapeoIconos(pres, { kicker, titulo, contexto, items }) {
    const slide = pres.addSlide();
    bgFill(slide);

    slide.addText(kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: "Calibri", fontSize: 12, bold: true, color: T.accentGreen,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.6,
        fontFace: "Cambria", fontSize: 26, bold: true, color: T.textMain, margin: 0,
    });
    if (contexto) {
        slide.addText(contexto, {
            x: 0.6, y: 1.45, w: 11.5, h: 0.5,
            fontFace: "Calibri", fontSize: 13.5, color: T.textMuted, margin: 0,
        });
    }

    const n = items.length;
    const colW = 2.75, gap = (12.1 - colW * n) / (n - 1);
    const palette = [T.accentBlue, T.accentTeal, T.accentAmber, T.accentPurple, T.accentGreen];
    const topY = 2.25;

    for (let i = 0; i < n; i++) {
        const item = items[i];
        const color = palette[i % palette.length];
        const x = 0.6 + i * (colW + gap);

        // tarjeta
        slide.addShape("roundRect", {
            x, y: topY, w: colW, h: 4.1, rectRadius: 0.1,
            fill: { color: T.cardBg }, line: { color: T.cardBorder, width: 1 },
        });
        // círculo de ícono
        const iconPng = await iconToPngDataUrl(item.icono, color, 256);
        slide.addShape("ellipse", {
            x: x + colW / 2 - 0.5, y: topY + 0.35, w: 1.0, h: 1.0,
            fill: { color: T.bg }, line: { color, width: 1.5 },
        });
        slide.addImage({
            data: iconPng,
            x: x + colW / 2 - 0.28, y: topY + 0.63, w: 0.56, h: 0.56,
        });
        // nombre (rol conocido)
        slide.addText(item.nombre, {
            x: x + 0.15, y: topY + 1.55, w: colW - 0.3, h: 0.4,
            align: "center", fontFace: "Calibri", fontSize: 15, bold: true,
            color: T.textMain, margin: 0,
        });
        // subtítulo (rol técnico real, monoespaciado)
        if (item.subtitulo) {
            slide.addText(item.subtitulo, {
                x: x + 0.15, y: topY + 1.95, w: colW - 0.3, h: 0.35,
                align: "center", fontFace: "Courier New", fontSize: 11.5,
                color, margin: 0,
            });
        }
        // descripción
        slide.addText(item.descripcion, {
            x: x + 0.2, y: topY + 2.4, w: colW - 0.4, h: 1.5,
            align: "center", fontFace: "Calibri", fontSize: 12, color: T.textMuted,
            margin: 0, valign: "top", lineSpacingMultiple: 1.15,
        });

        // flecha conectora entre tarjetas (excepto tras la última)
        if (i < n - 1) {
            slide.addShape("rightArrow", {
                x: x + colW, y: topY + 1.85, w: gap, h: 0.25,
                fill: { color: T.cardBorder }, line: { type: "none" },
            });
        }
    }

    slide.addNotes(items.map((it) => it.notaDocente || "").filter(Boolean).join(" / "));
    return slide;
}

// ── Layout 7: Problema con alertas (elemento central + síntomas) ──
async function layoutProblemaAlertas(pres, { kicker, titulo, centro, sintomas, notes }) {
    const slide = pres.addSlide();
    bgFill(slide);

    slide.addText(kicker.toUpperCase(), {
        x: 0.6, y: 0.5, w: 8, h: 0.35,
        fontFace: "Calibri", fontSize: 12, bold: true, color: T.accentRed,
        charSpacing: 1.2, margin: 0,
    });
    slide.addText(titulo, {
        x: 0.6, y: 0.85, w: 11.5, h: 0.7,
        fontFace: "Cambria", fontSize: 26, bold: true, color: T.textMain, margin: 0,
    });

    // tarjeta central a la izquierda
    const centroX = 0.6, centroY = 2.0, centroW = 3.6, centroH = 4.0;
    slide.addShape("roundRect", {
        x: centroX, y: centroY, w: centroW, h: centroH, rectRadius: 0.12,
        fill: { color: T.cardBg }, line: { color: T.accentRed, width: 1.5 },
    });
    const centroIconPng = await iconToPngDataUrl(centro.icono, T.accentRed, 256);
    slide.addShape("ellipse", {
        x: centroX + centroW / 2 - 0.55, y: centroY + 0.4, w: 1.1, h: 1.1,
        fill: { color: T.bg }, line: { color: T.accentRed, width: 1.5 },
    });
    slide.addImage({
        data: centroIconPng,
        x: centroX + centroW / 2 - 0.3, y: centroY + 0.65, w: 0.6, h: 0.6,
    });
    slide.addText(centro.nombre, {
        x: centroX + 0.2, y: centroY + 1.75, w: centroW - 0.4, h: 0.45,
        align: "center", fontFace: "Calibri", fontSize: 16, bold: true,
        color: T.textMain, margin: 0,
    });
    slide.addText(centro.detalle || "", {
        x: centroX + 0.2, y: centroY + 2.25, w: centroW - 0.4, h: 0.5,
        align: "center", fontFace: "Calibri", fontSize: 13, italic: true,
        color: T.accentRed, margin: 0,
    });

    // flechas + síntomas a la derecha
    const symX = centroX + centroW + 1.0;
    const symW = 12.1 - (symX - 0.6);
    const rowH = 4.0 / sintomas.length;
    sintomas.forEach((s, i) => {
        const sy = centroY + i * rowH;
        // flecha desde el centro
        slide.addShape("rightArrow", {
            x: centroX + centroW, y: sy + rowH / 2 - 0.12, w: 0.8, h: 0.24,
            fill: { color: T.cardBorder }, line: { type: "none" },
        });
        // ícono de alerta
        slide.addShape("ellipse", {
            x: symX, y: sy + rowH / 2 - 0.28, w: 0.56, h: 0.56,
            fill: { color: T.cardBg }, line: { color: T.accentAmber, width: 1.2 },
        });
        slide.addText("!", {
            x: symX, y: sy + rowH / 2 - 0.28, w: 0.56, h: 0.56,
            align: "center", valign: "middle", fontFace: "Cambria",
            fontSize: 20, bold: true, color: T.accentAmber, margin: 0,
        });
        slide.addText(s, {
            x: symX + 0.75, y: sy + 0.08, w: symW - 0.85, h: rowH - 0.16,
            valign: "middle", fontFace: "Calibri", fontSize: 14,
            color: T.textMain, margin: 0,
        });
    });

    slide.addNotes(notes || "");
    return slide;
}

// ── Construcción del deck de muestra: Herencia en Python (POO) ─────
const { FiUser, FiUsers, FiBookOpen, FiCopy } = require("react-icons/fi");

async function build(themeName) {
setTheme(themeName);
const pres = newDeck();

layoutPortada(pres, {
    materia: "Programación Orientada a Objetos",
    semana: 10,
    titulo: "Herencia en Python: reutilizar y extender clases",
    tags: ["Python 3.11", "POO", "super()", "Herencia"],
});

layoutBullets(pres, {
    kicker: "Repaso",
    titulo: "De dónde venimos: clases y objetos",
    bullets: [
        { titulo: "Clase = plantilla,", detalle: "objeto = instancia concreta" },
        { titulo: "__init__ y self", detalle: "constructor y referencia a la instancia" },
        { titulo: "Encapsulamiento", detalle: "atributos privados con _ y __" },
        { titulo: "Hoy:", detalle: "¿cómo evitar repetir código entre clases parecidas?" },
    ],
    notes: "Conectar explícitamente con la clase anterior antes de introducir el problema de hoy.",
});

layoutCodigo(pres, {
    kicker: "El problema",
    titulo: "Código duplicado entre Estudiante y Profesor",
    explicacion: "Ambas clases repiten nombre, email y el método de saludo — casi idéntico",
    code:
`class Estudiante:
    def __init__(self, nombre: str, email: str, carrera: str):
        self.nombre = nombre
        self.email = email
        self.carrera = carrera

    def saludar(self) -> str:
        return f"Hola, soy {self.nombre}"


class Profesor:
    def __init__(self, nombre: str, email: str, departamento: str):
        self.nombre = nombre          # repetido
        self.email = email            # repetido
        self.departamento = departamento

    def saludar(self) -> str:         # repetido
        return f"Hola, soy {self.nombre}"`,

    notes: "Mostrar en vivo cómo nombre/email/saludar() se repiten casi igual en ambas clases. Preguntar: '¿cómo evitarían esta duplicación?' antes de revelar herencia.",
});

layoutComparacion(pres, {
    kicker: "La solución",
    titulo: "Sin herencia vs. con herencia",
    colA: {
        header: "Sin herencia",
        sub: "código repetido",
        items: [
            "Cada clase define nombre/email por su cuenta",
            "Cambiar saludar() implica editar 2+ clases",
            "Difícil mantener consistencia",
        ],
    },
    colB: {
        header: "Con herencia",
        sub: "class Profesor(Persona)",
        items: [
            "Persona centraliza nombre y email",
            "super().__init__() reutiliza el constructor",
            "Un solo lugar para corregir errores",
        ],
    },
    notes: "Pausa para preguntar cuál de las dos columnas preferirían mantener en un proyecto real de 6 meses.",
});

layoutAnalogia(pres, {
    kicker: "Analogía",
    nombreAnalogia: "La analogía del formulario base",
    texto: "Persona es como un formulario base de datos personales (nombre, email) que ya viene impreso. Estudiante y Profesor son ese mismo formulario, con una hoja extra grapada encima para los datos específicos de cada uno — no vuelven a copiar los campos que ya existían.",
    conexionTecnica: "class Profesor(Persona) hereda los atributos de Persona; super().__init__(nombre, email) llama al constructor del formulario base antes de agregar los campos propios.",
    notes: "Dejar que la analogía respire unos segundos antes de saltar al código en vivo.",
});

await layoutMapeoIconos(pres, {
    kicker: "Analogía",
    titulo: "Persona como formulario base: quién hereda de quién",
    contexto: "Cada rol reutiliza los datos del formulario base y agrega su propia hoja adicional",
    items: [
        {
            icono: FiUser,
            nombre: "Formulario base",
            subtitulo: "class Persona",
            descripcion: "Define nombre y email una sola vez",
            notaDocente: "Persona es el formulario base, con los campos comunes.",
        },
        {
            icono: FiBookOpen,
            nombre: "Hoja de estudiante",
            subtitulo: "class Estudiante(Persona)",
            descripcion: "Agrega carrera y matrícula sobre el formulario base",
            notaDocente: "Estudiante hereda de Persona y agrega sus propios campos.",
        },
        {
            icono: FiUsers,
            nombre: "Hoja de profesor",
            subtitulo: "class Profesor(Persona)",
            descripcion: "Agrega departamento sobre el mismo formulario base",
            notaDocente: "Profesor también hereda de Persona, sin duplicar nombre/email.",
        },
    ],
});

await layoutProblemaAlertas(pres, {
    kicker: "El problema",
    titulo: "Clases sin jerarquía común",
    centro: {
        icono: FiCopy,
        nombre: "Estudiante y Profesor",
        detalle: "cada una por su cuenta",
    },
    sintomas: [
        "Atributos nombre/email repetidos en cada clase",
        "Corregir un error implica editar 2+ clases distintas",
        "Ningún lugar único que garantice consistencia",
    ],
    notes: "Mismo problema motivador de la slide 3, ahora en formato de diagrama para reforzar el concepto antes de pasar a la solución.",
});

await pres.writeFile({ fileName: `/home/claude/master_template/plantilla_maestra_${themeName}.pptx` });
console.log(`done: ${themeName}`);
}

async function main() {
    // secuencial, no Promise.all: build() muta el estado global T (tema activo),
    // correr ambos en paralelo causaría mezcla de colores entre temas.
    await build("dark");
    await build("light");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
