// Sin Zod/structured outputs a propósito — esta generación sigue pasando por Gemini con JSON
// libre + repairTruncatedJson (ver route.ts), mismo mecanismo que curriculum/guide. No se migró
// a schema estricto en esta ronda.

export interface Exercise {
    titulo: string;
    contexto: string;
    /** Líneas EXACTAS del menú de consola, si el ejercicio tiene uno interactivo (do-while). */
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
