// Paleta fija del class_kit (Fase 2 del plan). El contenido varía, el diseño no.
export const BACKGROUND = '0F172A';

export const ACCENTS = {
    azul: '3B82F6',
    teal: '0D9488',
    ambar: 'F59E0B',
    verde: '22C55E',
    rojo: 'EF4444',
    morado: '8B5CF6',
} as const;

export type AccentName = keyof typeof ACCENTS;

const DEFAULT_ACCENT = ACCENTS.azul;
const HEX_RE = /^[0-9a-fA-F]{6}$/;

// Acepta un nombre de la paleta (ej. "teal") o un hex de 6 dígitos con o sin "#".
// Cualquier otra cosa cae al azul por defecto — nunca dejamos que la IA elija el color.
export function resolveAccent(accentColor?: string): string {
    if (!accentColor) return DEFAULT_ACCENT;
    const clean = accentColor.trim().replace(/^#/, '');
    if (clean in ACCENTS) return ACCENTS[clean as AccentName];
    if (HEX_RE.test(clean)) return clean.toUpperCase();
    return DEFAULT_ACCENT;
}

export const TEXT_LIGHT = 'F8FAFC';
export const TEXT_MUTED = '94A3B8';
export const CODE_BG = '1E293B';
export const CODE_TEXT = 'E2E8F0';
export const CARD_BG = '1E293B';

export function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return [59, 130, 246];
    return [r, g, b];
}
