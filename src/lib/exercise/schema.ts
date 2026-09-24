import { z } from 'zod';

// La generación INTERNA no usa Zod/structured outputs a propósito — sigue pasando por Gemini con JSON
// libre + repairTruncatedJson (ver route.ts), mismo mecanismo que curriculum/guide. No se migró
// a schema estricto en esta ronda.

export interface Exercise {
    titulo: string;
    contexto: string;
    /** Líneas EXACTAS del menú de consola, si el ejercicio tiene uno interactivo. */
    menu?: string[];
    requerimientos: string[];
    /** Preguntas de autoevaluación — nunca revelan la respuesta, seguras para el estudiante. */
    checklist?: string[];
    /** Solo se completa en ejercicios de práctica — ver exercisesPrompt en route.ts. */
    conceptos?: string[];
    solucionDocente: string;
}

export interface ExercisesContent {
    ejerciciosPractica: Exercise[];
    ejerciciosTarea: Exercise[];
}

// Formato viejo (previo a esta migración): un solo `ejercicioClase` en vez de un array
// `ejerciciosPractica`. Los materiales ya guardados en producción con ese formato tienen que
// seguir leyéndose — nunca perder acceso a contenido real ya generado por el usuario.
interface LegacyExercisesContent {
    ejercicioClase: Exercise;
    ejerciciosTarea?: Exercise[];
}

// Único punto de lectura de un material de tipo "exercises" — todo el resto del código (Class
// Kit, Sugerir próxima semana, próximos ejercicios, vista pública) pasa por acá en vez de
// parsear el JSON a mano, para que el formato viejo/nuevo se resuelva en un solo lugar.
export function parseExercisesContent(raw: string | null | undefined): ExercisesContent | null {
    if (!raw) return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }
    if (!parsed || typeof parsed !== 'object') return null;

    if (Array.isArray((parsed as ExercisesContent).ejerciciosPractica)) {
        const content = parsed as ExercisesContent;
        return { ejerciciosPractica: content.ejerciciosPractica, ejerciciosTarea: content.ejerciciosTarea ?? [] };
    }
    if ((parsed as LegacyExercisesContent).ejercicioClase) {
        const legacy = parsed as LegacyExercisesContent;
        return { ejerciciosPractica: [legacy.ejercicioClase], ejerciciosTarea: legacy.ejerciciosTarea ?? [] };
    }
    return null;
}

// ── Importar desde un chat web ─────────────────────────────────────────────
// La generación interna sigue sin Zod (ver nota arriba), pero lo que el docente pega desde un
// chat web sí se valida: viene de afuera, puede traer texto alrededor o un campo mal escrito,
// y un error acá tiene que decir QUÉ falta en vez de romper el PDF más adelante.

const ImportedExerciseSchema = z.object({
    titulo: z.string().min(1),
    contexto: z.string().min(1),
    // Los chats a veces mandan "menu": [] o null en ejercicios sin menú — se normaliza a ausente.
    menu: z.array(z.string()).nullish().transform((m) => (m && m.length > 0 ? m : undefined)),
    requerimientos: z.array(z.string()).min(1),
    checklist: z.array(z.string()).nullish().transform((c) => c ?? undefined),
    conceptos: z.array(z.string()).nullish().transform((c) => c ?? undefined),
    solucionDocente: z.string().min(1),
});

const ImportedExercisesSchema = z.object({
    ejerciciosPractica: z.array(ImportedExerciseSchema),
    ejerciciosTarea: z.array(ImportedExerciseSchema).default([]),
});

export type ImportResult = { ok: true; content: ExercisesContent } | { ok: false; error: string };

// Toma lo que el docente pegó (con o sin ```json, con o sin texto alrededor) y devuelve el
// contenido validado o un mensaje de error en español que señala el campo problemático.
export function parseImportedExercises(raw: string): ImportResult {
    const text = raw.trim().replace(/```(?:json)?/gi, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) {
        return { ok: false, error: 'No encontré un objeto JSON en lo que pegaste. Copia la respuesta completa del chat.' };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(text.slice(start, end + 1));
    } catch {
        return {
            ok: false,
            error: 'El JSON está incompleto o mal formado (¿se cortó la respuesta del chat?). Pídele al chat que ' +
                'devuelva el JSON completo otra vez.',
        };
    }

    // Formato viejo (un solo ejercicioClase): se acepta igual, mismo criterio que parseExercisesContent.
    if (parsed && typeof parsed === 'object' && 'ejercicioClase' in parsed && !('ejerciciosPractica' in parsed)) {
        const legacy = parsed as { ejercicioClase: unknown; ejerciciosTarea?: unknown };
        parsed = { ejerciciosPractica: [legacy.ejercicioClase], ejerciciosTarea: legacy.ejerciciosTarea ?? [] };
    }

    const result = ImportedExercisesSchema.safeParse(parsed);
    if (!result.success) {
        const issue = result.error.issues[0];
        const path = issue.path.map((p) => (typeof p === 'number' ? `[${p + 1}]` : `.${String(p)}`)).join('').replace(/^\./, '');
        return {
            ok: false,
            error: `Al JSON le falta algo o tiene un campo inválido en "${path || 'raíz'}". Pídele al chat que ` +
                'respete exactamente la estructura del prompt y devuelva el JSON completo.',
        };
    }
    if (result.data.ejerciciosPractica.length === 0 && result.data.ejerciciosTarea.length === 0) {
        return { ok: false, error: 'El JSON no trae ningún ejercicio.' };
    }
    return { ok: true, content: result.data };
}
