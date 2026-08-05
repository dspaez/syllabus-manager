// Resaltado de sintaxis ligero (no un parser completo por lenguaje) + saneo de
// caracteres de árbol de carpetas — compartido entre el renderer de PPTX y los de PDF.
// Devuelve TIPOS de token, no colores — cada consumidor aplica su propia paleta
// (PDF usa el esquema VS-Code-ish de palette.ts, PPTX usa el de la plantilla maestra).

export type TokenType = 'comment' | 'string' | 'tag' | 'keyword' | 'number' | 'plain';

export interface CodeToken {
    text: string;
    type: TokenType;
}

// Paleta por defecto (la que ya se usaba antes de separar tipo/color) — consumida por
// los renderers de PDF para no cambiar su apariencia ya validada.
export const DEFAULT_TOKEN_COLORS: Record<TokenType, string> = {
    comment: '6A9955',
    string: 'CE9178',
    tag: '4EC9B0',
    keyword: '569CD6',
    number: 'B5CEA8',
    plain: 'E2E8F0',
};
export const PLAIN = DEFAULT_TOKEN_COLORS.plain;

const KEYWORDS = [
    'const', 'let', 'var', 'function', 'return', 'import', 'export', 'default', 'from', 'as',
    'async', 'await', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'class', 'extends', 'implements', 'new', 'try', 'catch', 'finally', 'throw', 'typeof',
    'instanceof', 'in', 'of', 'void', 'null', 'undefined', 'true', 'false', 'this', 'super',
    'static', 'public', 'private', 'protected', 'readonly', 'interface', 'type', 'enum',
    'namespace', 'declare', 'def', 'self', '__init__', 'None', 'True', 'False', 'elif', 'with',
    'lambda', 'yield', 'pass', 'raise', 'except', 'global', 'nonlocal', 'print',
];

const TOKEN_REGEX = new RegExp(
    [
        '(//.*)',
        '(#.*)',
        '("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`)',
        '(</?[A-Za-z][\\w.]*)',
        '\\b(' + KEYWORDS.join('|') + ')\\b',
        '\\b(\\d+(?:\\.\\d+)?)\\b',
    ].join('|'),
    'g',
);

function tokenizeLine(line: string): CodeToken[] {
    const tokens: CodeToken[] = [];
    let lastIndex = 0;
    TOKEN_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = TOKEN_REGEX.exec(line)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ text: line.slice(lastIndex, match.index), type: 'plain' });
        }
        const type: TokenType = match[1] ? 'comment'
            : match[2] ? 'comment'
            : match[3] ? 'string'
            : match[4] ? 'tag'
            : match[5] ? 'keyword'
            : 'number';
        tokens.push({ text: match[0], type });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
        tokens.push({ text: line.slice(lastIndex), type: 'plain' });
    }
    return tokens.length > 0 ? tokens : [{ text: line, type: 'plain' }];
}

// Convierte caracteres de árbol de carpetas (├── └── │ ─) a ASCII plano.
// El font "Courier" base14 de jsPDF no tiene métricas para estos glifos Unicode,
// lo que descuadra el cálculo de ancho de línea y produce espaciado erróneo entre letras.
export function sanitizeCodeText(code: string): string {
    return code
        .replace(/├/g, '|')
        .replace(/└/g, '`')
        .replace(/│/g, '|')
        .replace(/─/g, '-');
}

// Devuelve un array de líneas, cada una como su propio array de tokens tipados.
export function tokenizeCode(code: string): CodeToken[][] {
    return sanitizeCodeText(code).split('\n').map(tokenizeLine);
}
