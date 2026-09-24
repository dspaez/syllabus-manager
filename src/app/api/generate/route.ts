import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SlidesOnlySchema, GuionDocenteSchema, GuiaTecnicaSchema, ExtraSlidesSchema, ICON_NAMES, type ClassKitContent, type ExtraSlideEntry, type Slide } from '@/lib/classKit/schema';
import { ExamSchema, type Exam } from '@/lib/exam/schema';
import { requireUser } from '@/utils/supabase/requireUser';
import { languageConventionsRule, techStackContext } from '@/lib/prompts/shared';
import { buildExercisesPrompt } from '@/lib/prompts/exercises';

// gemini-3.7-flash soporta hasta 65536 tokens de salida. maxOutputTokens sigue compartiéndose
// con los tokens de pensamiento internos del modelo incluso con thinkingLevel LOW (no los
// elimina, solo acota cuánto piensa) — el JSON visible puede truncarse antes del límite
// nominal si el tipo pide contenido extenso.
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;
// "exercises" ya no usa este mapa — su presupuesto se calcula dinámicamente según la cantidad
// de ejercicios pedidos (ver rama `type === 'exercises'` más abajo).
const MAX_OUTPUT_TOKENS: Partial<Record<string, number>> = {};

/**
 * Repara JSON truncado por corte de tokens. Primero intenta cerrar la cadena/objeto/array
 * que quedó abierto sin perder contenido; si eso no basta, recorta hasta el último separador
 * de valor completo (",") fuera de una cadena y reintenta desde ahí — así un objeto ya completo
 * (ej. ejercicioClase) sobrevive aunque el siguiente (ej. una variante de ejerciciosTarea) se
 * haya cortado a medias.
 */
function repairTruncatedJson(raw: string): { value: unknown; repaired: boolean } {
    const text = raw.trim().replace(/```json|```/g, '').trim();

    try {
        return { value: JSON.parse(text), repaired: false };
    } catch {
        // seguir reparando abajo
    }

    const closed = closeOpenJson(text);
    if (closed) {
        try {
            return { value: JSON.parse(closed), repaired: true };
        } catch {
            // seguir reparando abajo
        }
    }

    let cut = lastSafeCommaIndex(text);
    let guard = 0;
    while (cut !== -1 && guard < 20) {
        const candidate = closeOpenJson(text.slice(0, cut));
        if (candidate) {
            try {
                return { value: JSON.parse(candidate), repaired: true };
            } catch {
                // seguir recortando
            }
        }
        cut = lastSafeCommaIndex(text.slice(0, cut));
        guard++;
    }

    throw new Error('JSON inválido');
}

// Cierra cualquier string/objeto/array que haya quedado abierto al final del texto.
// Devuelve null si el texto ya estaba completo (nada que cerrar).
function closeOpenJson(text: string): string | null {
    let inString = false;
    let escaped = false;
    const stack: ('{' | '[')[] = [];

    for (const ch of text) {
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '{' || ch === '[') stack.push(ch);
        else if (ch === '}' || ch === ']') stack.pop();
    }

    if (!inString && stack.length === 0) return null;

    let result = text;
    if (inString) result += '"';
    for (let i = stack.length - 1; i >= 0; i--) result += stack[i] === '{' ? '}' : ']';
    return result;
}

// Índice de la última coma fuera de cualquier cadena — el último punto donde es seguro
// cortar sin partir un string a la mitad.
function lastSafeCommaIndex(text: string): number {
    let inString = false;
    let escaped = false;
    let last = -1;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === ',') last = i;
    }
    return last;
}

// Aviso de truncamiento al cliente: header en vez de un campo en el JSON, porque varios
// componentes guardan ese JSON tal cual en materials.description. Antes, un corte por
// maxOutputTokens se "reparaba" en silencio y el docente recibía menos ejercicios o una
// solucionDocente cortada sin enterarse (o, en technical_doc, un documento incompleto que se
// guardaba como la nueva base del proyecto).
const TRUNCATED_HEADER = 'X-Generation-Truncated';

type GeminiResult = Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>;

// Cualquier finishReason distinto de STOP (MAX_TOKENS, SAFETY, ...) significa que el modelo
// no terminó la respuesta por su cuenta.
function geminiStoppedEarly(result: GeminiResult): boolean {
    const reason = result.candidates?.[0]?.finishReason;
    return Boolean(reason && reason !== 'STOP');
}

function geminiJsonResponse(label: string, result: GeminiResult): NextResponse {
    const text = result.text ?? '';
    let parsed;
    try {
        parsed = repairTruncatedJson(text);
    } catch (err) {
        console.error(`[generate:${label}] parseo falló — finishReason=${result.candidates?.[0]?.finishReason}, length=${text.length}`);
        throw err;
    }
    const truncated = parsed.repaired || geminiStoppedEarly(result);
    if (truncated) {
        console.warn(`[generate:${label}] respuesta truncada — finishReason=${result.candidates?.[0]?.finishReason}, repaired=${parsed.repaired}`);
    }
    return NextResponse.json(parsed.value, truncated ? { headers: { [TRUNCATED_HEADER]: '1' } } : undefined);
}

// El tipo "slides" (presentación en JSON de Gemini) se quitó junto con "Generar contenido de
// toda la unidad" — las slides se generan con Class Kit. Los materiales viejos con ese JSON se
// siguen mostrando en la vista pública (SlidesPresentation en materials/[id]/page.tsx).
const PROMPTS: Record<string, (topic: string, techStack?: string) => string> = {
    guide: (topic) =>
        `Genera una guía de estudio sobre ${topic} con: introducción, ` +
        `conceptos clave, ejemplos y resumen. Responde en español en formato JSON: ` +
        `{ "introduction": "", "concepts": [{ "name": "", "explanation": "" }], "examples": [], "summary": "" }`,
};


function technicalDocPrompt(subjectName: string, weekTopic: string, previousDocument?: string, techStack?: string): string {
    if (previousDocument) {
        return (
            `Eres el arquitecto técnico de un proyecto académico que crece semana a semana en la materia "${subjectName}". ` +
            techStackContext(techStack) +
            `A continuación está el documento técnico actual del proyecto:\n\n---\n${previousDocument}\n---\n\n` +
            `El tema de la semana actual es: ${weekTopic}.\n\n` +
            `Tu tarea: devuelve el documento técnico COMPLETO Y EXTENDIDO, incorporando lo que el proyecto avanza esta semana ` +
            `(nuevas secciones, cambios de arquitectura, modelo de datos, tareas de la semana). ` +
            `REGLAS:\n` +
            `- Devuelve el documento entero, no un fragmento ni solo lo nuevo.\n` +
            `- No borres ni resumas contenido anterior, salvo que sea realmente inconsistente con lo nuevo (en ese caso corrígelo).\n` +
            `- No inventes avances ni historial que no estén ya en el documento o no correspondan a la semana actual.\n` +
            `- Mantén la estructura y el tono del documento existente.\n` +
            `- Responde en español, en markdown plano, sin envolverlo en bloques de código.`
        );
    }
    return (
        `Eres el arquitecto técnico de un proyecto académico que crecerá semana a semana en la materia "${subjectName}". ` +
        techStackContext(techStack) +
        `El tema de la semana actual del curso es: ${weekTopic}.\n\n` +
        `Genera el documento técnico INICIAL del proyecto con estas secciones: ` +
        `visión general del proyecto, stack tecnológico, arquitectura inicial, modelo de datos inicial y tareas de esta semana. ` +
        `REGLAS ESTRICTAS:\n` +
        `- Este es el PRIMER documento del proyecto: NO existe ningún avance previo. No inventes historial de semanas anteriores, ` +
        `changelog, ni trabajo ya realizado.\n` +
        `- El proyecto propuesto debe girar directamente en torno al tema de la semana y a la materia indicada. ` +
        `No propongas un dominio genérico de ejemplo si no se relaciona con el tema.\n` +
        `- Si no se indicó un stack tecnológico y tampoco se deduce del tema o del nombre de la materia, ` +
        `NO asumas uno: márcalo como "por definir con el docente".\n` +
        `- Las tareas corresponden únicamente a la semana actual descrita arriba.\n` +
        `Responde en español, en markdown plano, sin envolverlo en bloques de código.`
    );
}

// thinkingLevel HIGH a propósito: esta llamada tiene que analizar el documento técnico
// ACUMULADO completo (arquitectura + modelo de datos + historial de tareas) antes de decidir
// cómo extenderlo de forma consistente semana a semana — el análisis profundo importa más acá
// que la latencia, a diferencia de exercises/curriculum/guide (ver LOW más abajo).
async function generateTechnicalDoc(subjectName: string, weekTopic: string, previousDocument?: string, techStack?: string): Promise<{ document: string; truncated: boolean }> {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const result = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: technicalDocPrompt(subjectName, weekTopic, previousDocument, techStack),
        config: {
            maxOutputTokens: 16384,
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        },
    });
    let text = (result.text ?? '').trim();
    // Por si el modelo envuelve la respuesta en un bloque de código
    text = text.replace(/^```(?:markdown|md)?\n/, '').replace(/\n```$/, '').trim();
    const truncated = geminiStoppedEarly(result);
    if (truncated) {
        console.warn(`[generate:technical_doc] respuesta truncada — finishReason=${result.candidates?.[0]?.finishReason}, length=${text.length}`);
    }
    return { document: text, truncated };
}

const CLASS_KIT_PEDAGOGY =
    `Eres un docente universitario experto diseñando el kit completo de una clase de programación, con el mismo ` +
    `nivel de detalle y concreción que un docente experimentado escribiría para sí mismo antes de dar la clase — ` +
    `nombres exactos de archivos, rutas, variables y comandos, nunca genérico ni superficial.\n\n` +
    `Principios pedagógicos OBLIGATORIOS, aplican a todas las materias:\n` +
    `- Muestra el problema antes que la solución (ej. el bug o dolor que motiva el concepto nuevo).\n` +
    `- Si en el mensaje te paso un bloque "Clase anterior", conectá explícitamente con ESE contenido real ` +
    `(ej. un bullet de repaso que lo referencie, o una frase de transición en speakerNotes) — nunca lo ` +
    `ignores si está presente. Si NO te paso ese bloque, no inventes ni asumas qué se vio antes: es la ` +
    `primera clase del curso, o el docente no encontró una clase previa real que enlazar.\n` +
    `- Si en el mensaje te paso un bloque "Próxima clase", usalo SOLO para un gancho de cierre breve ` +
    `(ej. la última slide o el cierre de speakerNotes/guionDocente puede adelantar en una frase qué sigue) ` +
    `— nunca desarrolles ese tema hoy, es contenido de otra clase. Si NO te paso ese bloque, no inventes ` +
    `qué viene después.\n` +
    `- Si en el mensaje te paso un bloque "Ejercicio de clase real" o "Documento técnico del proyecto", ` +
    `TODO el código de esta clase (slides de tipo "codigo", guión, guía técnica) tiene que construir ` +
    `exactamente ESE código real — mismos nombres de clases/archivos/variables, mismo dominio de negocio. ` +
    `No inventes un ejercicio o arquitectura paralela aunque se te ocurra uno "mejor". Si NO te paso ` +
    `ninguno de esos bloques, proponé vos un ejercicio o arquitectura razonable, coherente con el tema y ` +
    `el stack — igual que hacías antes de tener este contexto.\n` +
    `- Usa analogías del mundo real cuando ayuden a la intuición — nómbralas (ej. "Analogía del restaurante") ` +
    `para que el docente pueda referenciarlas rápido en clase.\n` +
    `- Prefiere código en vivo sobre slides cargadas de texto: las slides son guía, no el contenido completo. ` +
    `Los bullets deben ser breves; el detalle vive en el guión docente y la guía técnica.\n` +
    `- Notas del ponente (speakerNotes) en CADA slide, sin excepción.\n\n`;

// Dividido en 2 prompts/llamadas (slides / guionDocente+guiaTecnica): el schema combinado
// completo supera el límite de complejidad del compilador de structured outputs de Claude
// ("The compiled grammar is too large") — ver nota en schema.ts junto a SlidesOnlySchema.
const SLIDES_SYSTEM_PROMPT =
    CLASS_KIT_PEDAGOGY +
    `Generá el bloque "slides": cada slide usa uno de 7 layouts fijos (campo "layout"). Vos elegís CUÁL layout ` +
    `según el contenido de esa slide — el diseño, colores y posiciones de cada layout ya están definidos en el ` +
    `renderizador, vos solo llenás el contenido semántico de los campos que le corresponden:\n` +
    `- "portada": la PRIMERA slide siempre. Campos: titulo (título de toda la clase, no de un tema puntual), ` +
    `tags (3 a 5 cortos).\n` +
    `- "bullets": lista de puntos con jerarquía título+detalle. Campos: kicker, titulo, bullets ` +
    `(máximo 5, cada uno {titulo, detalle opcional}). Útil para repasos, planes de clase, resúmenes.\n` +
    `- "codigo": un bloque de código con resaltado de sintaxis. Campos: kicker, titulo, explicacion opcional, ` +
    `code (breve — es una slide, no la guía técnica completa).\n` +
    `- "comparacion": dos columnas lado a lado (ej. antes/después, con/sin, opción A/B). Campos: kicker, ` +
    `titulo, colA y colB ({header, sub opcional, items[]}).\n` +
    `- "analogia": una analogía del mundo real destacada a pantalla completa. Campos: kicker, ` +
    `nombreAnalogia, texto, conexionTecnica opcional (cómo se traduce a código real).\n` +
    `- "mapeoIconos": entre 2 y 5 roles/conceptos en columnas con ícono, ideal para mapear una analogía a ` +
    `sus equivalentes técnicos. Campos: kicker, titulo, contexto opcional, items[] ({icono, nombre, ` +
    `subtitulo opcional, descripcion}).\n` +
    `- "problemaAlertas": un elemento central problemático con 2 a 4 síntomas/consecuencias apuntando hacia ` +
    `él. Campos: kicker, titulo, centro ({icono, nombre, detalle opcional}), sintomas[].\n` +
    `Para "icono" en mapeoIconos y problemaAlertas, elegí SIEMPRE uno de esta lista cerrada, nunca inventes ` +
    `un nombre distinto: ${ICON_NAMES.join(', ')}.\n` +
    `Usa variedad de layouts a lo largo de la clase — no repitas "bullets" en todas las slides. Encadena: ` +
    `portada → (bullets de repaso) → problemaAlertas o codigo (mostrar el problema) → comparacion o analogia ` +
    `(la solución) → mapeoIconos (si hay una analogía con varios roles) → codigo (implementación en vivo). ` +
    `speakerNotes va SIEMPRE presente en cada slide, sin importar el layout.\n\n` +
    `Elegís QUÉ layout usa cada slide y el ícono cuando aplique, pero nunca definas colores, posiciones ni ` +
    `tipografías — eso ya está fijo en la plantilla de renderizado para cada layout.`;

// Segunda llamada aparte, con su propio schema chico (ver ExtraSlidesSchema en schema.ts) —
// nunca combinada con SLIDES_SYSTEM_PROMPT en la misma llamada porque el discriminated union
// de 7 layouts ya está en el límite de complejidad del compilador de structured outputs de
// Claude. Decide si sumar 0-2 slides de tabla/pasos al set principal ya generado.
const EXTRA_SLIDES_SYSTEM_PROMPT =
    `Ya existe la estructura principal de slides de una clase (te paso el resumen numerado en el mensaje). ` +
    `Tu única tarea es decidir si conviene sumar 0, 1 o 2 slides ADICIONALES — nunca reemplaces, edites ni ` +
    `repitas el contenido de las slides existentes:\n` +
    `- "tabla": una tabla de datos real (ej. tipos de excepción, métodos de una clase, comparación de varias ` +
    `opciones con varios atributos). Campos: kicker, titulo, columnas (2 a 4 encabezados), filas (array de ` +
    `arrays de celdas — cada fila es un array con una celda por columna, mismo orden y cantidad que ` +
    `"columnas"). Máximo 6 filas.\n` +
    `- "pasos": una secuencia numerada de 2 a 5 pasos en columnas, para procedimientos donde el ORDEN importa ` +
    `(ej. "así se prueba/depura esto"). Campos: kicker, titulo, contexto opcional, pasos[] ({numero, titulo, ` +
    `detalle opcional}).\n` +
    `Agregá una slide SOLO si el contenido real de la clase genuinamente tiene estructura tabular o un ` +
    `procedimiento secuencial que las slides existentes no representan bien — si ya está bien cubierto, ` +
    `devolvé "extras": [] sin forzar nada por completar el cupo.\n` +
    `Por cada slide que agregues, "insertarDespuesDeSlide" es el número (según el resumen que te paso) de la ` +
    `slide existente después de la cual debería ir — elegí un lugar temáticamente coherente, no el final a ` +
    `secas. speakerNotes va SIEMPRE presente.`;

// El docente puede pedir el kit sin guión y/o sin guía técnica (checkboxes en
// GenerateClassKit.tsx) — el prompt y el schema de esta segunda llamada se arman según
// qué se pidió, en vez de pedir siempre ambos bloques y descartar el que sobra.
const DOCS_INTRO =
    CLASS_KIT_PEDAGOGY +
    `Ya existe la estructura de slides de esta clase (te la paso en el mensaje, con su índice y layout). ` +
    `No inventes slides nuevas ni cambies su contenido — solo generá contenido que las referencie.\n\n`;

const GUION_DOCENTE_INSTRUCTIONS =
    `guionDocente — documento de referencia rápida para el docente durante la clase, no solo texto para leer:\n` +
    `   - resumen: tabla de los bloques de tiempo de TODA la clase (momento, tiempo estimado, slides involucradas), ` +
    `de modo que el docente vea el minutaje completo de un vistazo antes de empezar.\n` +
    `   - antesDeClase: checklist de verificaciones previas concretas — infiere qué tendría que estar listo antes ` +
    `de esta clase específica según el tema y el stack (ej. "servidor de desarrollo corriendo", "archivo ` +
    `components/X.tsx creado y vacío para escribir en vivo", "git status limpio").\n` +
    `   - items: uno o más por slide (slideRef indica a cuál corresponde, según el índice que te paso). Cada item ` +
    `necesita queMuestra (qué contenido visual tiene la slide) y comoPresentarlo (cómo la presenta el docente: ` +
    `demo, pregunta, lectura) siempre; además queDecir, queHacer y pausaPara. Agrega analogiaNombrada, ` +
    `preguntaInteractiva o ganchoSiguiente SOLO en los items donde realmente aplique.`;

const GUIA_TECNICA_INSTRUCTIONS =
    `guiaTecnica — documento reproducible paso a paso, suficientemente detallado para que el docente pueda ` +
    `seguirlo sin improvisar en vivo. Si te pasé un bloque "Ejercicio de clase real" o "Documento técnico ` +
    `del proyecto", los "pasos" deben construir ESE código de forma incremental (dividido en los pasos ` +
    `naturales: clases, métodos, validaciones, demo) — nunca copiarlo entero en un solo paso, ni resolver ` +
    `en su lugar un ejercicio distinto por más razonable que parezca:\n` +
    `   - resumen: tabla de todos los pasos (paso, acción, tiempo estimado).\n` +
    `   - preFlight: checklist a verificar ANTES de empezar el live coding (ej. variables de entorno correctas, ` +
    `dependencias previas instaladas, datos de prueba ya cargados).\n` +
    `   - pasos: cada uno con ubicación exacta (ruta del archivo en el proyecto, o "Terminal" si es solo un ` +
    `comando), el código COMPLETO de ese paso, comandoTerminal si aplica, y advertencia SOLO si hay algo puntual ` +
    `que el docente deba tener presente en ese paso.\n` +
    `   - erroresComunes: mínimo 3-4 errores reales y específicos al tema de esta clase (no genéricos), cada uno ` +
    `con el mensaje de error tal como lo vería el estudiante, su causa y la solución.`;

function buildDocsSystemPrompt(wantsGuion: boolean, wantsGuia: boolean): string {
    const blocks = [
        ...(wantsGuion ? [GUION_DOCENTE_INSTRUCTIONS] : []),
        ...(wantsGuia ? [GUIA_TECNICA_INSTRUCTIONS] : []),
    ];
    const lead = blocks.length === 2 ? 'Generá los siguientes dos bloques' : 'Generá el siguiente bloque';
    return DOCS_INTRO + `${lead} que referencian esas slides EXACTAS:\n\n` + blocks.join('\n\n');
}

// claude-sonnet-5 soporta hasta 128000 tokens de salida (GA, sin beta header — solo requiere
// streaming para evitar timeouts HTTP, que ya usamos). Con 16000 se truncaba a mitad de una
// string del JSON cuando el contenido era extenso.
const CLASS_KIT_MAX_TOKENS = 128000;

interface ClassKitInclude {
    guionDocente: boolean;
    guiaTecnica: boolean;
}

// Bloques de contexto real — nunca se fabrican del lado del modelo. "Clase anterior"/"Próxima
// clase" vienen de las semanas detectadas en el plan (ver previousWeekTopicFor/nextWeekTopicFor
// en units/[unitId]/page.tsx), que el docente puede corregir o vaciar porque el plan es dinámico.
// Si no hay dato real, el bloque se omite del prompt por completo — el system prompt ya instruye
// a no inventar continuidad en ese caso.
function previousClassBlock(previousWeekTopic?: string): string {
    return previousWeekTopic?.trim() ? `\n\nClase anterior: ${previousWeekTopic.trim()}.` : '';
}

function nextClassBlock(nextWeekTopic?: string): string {
    return nextWeekTopic?.trim() ? `\n\nPróxima clase: ${nextWeekTopic.trim()}.` : '';
}

// Contenido REAL de esta misma semana para anclar todo el código del kit — mutuamente
// excluyentes por diseño (ver currentExerciseContextFor en units/[unitId]/page.tsx): 'topics'
// manda exerciseContext (el ejercicioClase ya generado), 'project' manda projectContext (el
// technical_document del subject). Si ninguno llegó, el bloque se omite y el modelo propone
// un ejercicio/arquitectura razonable por su cuenta, como hacía antes de este contexto.
function currentContentBlock(exerciseContext?: string, projectContext?: string): string {
    if (exerciseContext?.trim()) return `\n\nEjercicio de clase real (ya generado para esta semana):\n${exerciseContext.trim()}`;
    if (projectContext?.trim()) return `\n\nDocumento técnico del proyecto (arquitectura y convenciones reales):\n${projectContext.trim()}`;
    return '';
}

// Solo para la llamada de slides: `technical_document` puede crecer sin límite semana a semana
// (se extiende acumulativamente, nunca se resume) y mandarlo en las 2 llamadas de generateClassKit
// paga su costo dos veces. Medido en real: agregarlo a la llamada de slides casi duplica su tiempo
// (97s → 218s con un documento de ~2400 tokens) — con un documento más largo eso es justo lo que
// produjo un 504 real en producción (300s de límite de Vercel). `exerciseContext` no tiene este
// problema (es un solo ejercicio, tamaño acotado) así que las slides de tipo "codigo" lo siguen
// recibiendo — el recorte es específico a `projectContext`.
function slidesContentBlock(exerciseContext?: string): string {
    return exerciseContext?.trim() ? `\n\nEjercicio de clase real (ya generado para esta semana):\n${exerciseContext.trim()}` : '';
}

function summarizeSlides(slides: ClassKitContent['slides']): string {
    return slides
        .map((s, i) => `${i + 1}. [${s.layout}] ${'titulo' in s ? s.titulo : s.nombreAnalogia}`)
        .join('\n');
}

// Inserta las slides "extra" (tabla/pasos, generadas en una llamada aparte — ver nota junto
// a ExtraSlidesSchema en schema.ts) en el punto que indicó el modelo. Se ordenan por posición
// ascendente y se acumula un offset al insertar, para que "insertarDespuesDeSlide" siga
// refiriéndose a la numeración ORIGINAL (la que el modelo vio en el resumen) y no se desalinee
// a medida que se van sumando slides previas en el mismo array.
function mergeExtraSlides(coreSlides: ClassKitContent['slides'], extras: ExtraSlideEntry[]): ClassKitContent['slides'] {
    if (extras.length === 0) return coreSlides;
    const merged: ClassKitContent['slides'] = [...coreSlides];
    const sorted = [...extras].sort((a, b) => a.insertarDespuesDeSlide - b.insertarDespuesDeSlide);
    let offset = 0;
    for (const extra of sorted) {
        const insertAt = Math.min(Math.max(extra.insertarDespuesDeSlide, 0), coreSlides.length) + offset;
        merged.splice(insertAt, 0, extra.slide);
        offset += 1;
    }
    return merged;
}

async function generateClassKit(
    subjectName: string,
    weekTopic: string,
    previousWeekTopic: string | undefined,
    nextWeekTopic: string | undefined,
    exerciseContext: string | undefined,
    projectContext: string | undefined,
    techStack: string | undefined,
    include: ClassKitInclude,
): Promise<ClassKitContent> {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const contextSuffix = techStackContext(techStack);
    const previousSuffix = previousClassBlock(previousWeekTopic);
    const nextSuffix = nextClassBlock(nextWeekTopic);
    const currentContentSuffix = currentContentBlock(exerciseContext, projectContext);
    const slidesContentSuffix = slidesContentBlock(exerciseContext);

    async function callClaude<T>(label: string, system: string, userPrompt: string, schema: Parameters<typeof zodOutputFormat>[0]): Promise<T> {
        // Extended thinking solo en "slides" — probado con una llamada real: ~7% más tokens de
        // salida (fracción de centavo) y ~3s más de latencia, sin riesgo real de costo/timeout.
        // No se activó en "extraSlides" (ya es barata) ni en "docs" (la más pesada, sin medir
        // todavía su impacto real de costo/latencia ahí).
        const stream = anthropic.messages.stream({
            model: 'claude-sonnet-5',
            max_tokens: CLASS_KIT_MAX_TOKENS,
            ...(label === 'slides' ? { thinking: { type: 'adaptive' as const } } : {}),
            system,
            messages: [{ role: 'user', content: userPrompt }],
            output_config: { format: zodOutputFormat(schema) },
        });

        let message;
        try {
            message = await stream.finalMessage();
        } catch (err) {
            // El SDK ya guardó el mensaje crudo (con stop_reason/usage) en receivedMessages
            // ANTES de intentar parsearlo — lo usamos para diagnosticar sin volcar el contenido.
            const raw = stream.receivedMessages.at(-1);
            console.error(
                `[generate:class_kit:${label}] parseo falló — stop_reason=${raw?.stop_reason}, usage=${JSON.stringify(raw?.usage)}`,
            );
            throw err;
        }

        if (message.stop_reason === 'refusal') {
            throw new Error('El modelo rechazó la solicitud');
        }
        if (!message.parsed_output) {
            throw new Error(`No se pudo parsear el contenido del class kit (${label})`);
        }
        return message.parsed_output as T;
    }

    const slidesPrompt = `Materia: ${subjectName}. Tema de la clase de esta semana: ${weekTopic}.` +
        contextSuffix + previousSuffix + nextSuffix + slidesContentSuffix;
    const { slides: coreSlides } = await callClaude<{ slides: ClassKitContent['slides'] }>(
        'slides', SLIDES_SYSTEM_PROMPT, slidesPrompt, SlidesOnlySchema,
    );

    const coreSlidesSummary = summarizeSlides(coreSlides);
    const extrasPrompt =
        `Materia: ${subjectName}. Tema de la clase de esta semana: ${weekTopic}.` + contextSuffix +
        `\n\nSlides ya generadas (índice. [layout] título):\n${coreSlidesSummary}`;
    const { extras } = await callClaude<{ extras: ExtraSlideEntry[] }>(
        'extraSlides', EXTRA_SLIDES_SYSTEM_PROMPT, extrasPrompt, ExtraSlidesSchema,
    );
    const slides = mergeExtraSlides(coreSlides, extras);

    const { guionDocente: wantsGuion, guiaTecnica: wantsGuia } = include;
    if (!wantsGuion && !wantsGuia) {
        // Kit de solo slides: la segunda llamada de docs (guionDocente/guiaTecnica) se omite
        // por completo, no se genera contenido para descartar después.
        return { slides };
    }

    // Recalculada sobre el set YA fusionado (core + extras) — así slideRef en guionDocente
    // referencia la numeración final real, no la de antes de insertar las extras.
    const slidesSummary = summarizeSlides(slides);
    const docsPrompt =
        `Materia: ${subjectName}. Tema de la clase de esta semana: ${weekTopic}.` +
        contextSuffix + previousSuffix + nextSuffix + currentContentSuffix +
        `\n\nSlides ya generadas (índice. [layout] título):\n${slidesSummary}`;
    const docsSchema = wantsGuion && wantsGuia
        ? z.object({ guionDocente: GuionDocenteSchema, guiaTecnica: GuiaTecnicaSchema })
        : wantsGuion
        ? z.object({ guionDocente: GuionDocenteSchema })
        : z.object({ guiaTecnica: GuiaTecnicaSchema });
    const docs = await callClaude<Partial<Pick<ClassKitContent, 'guionDocente' | 'guiaTecnica'>>>(
        'docs', buildDocsSystemPrompt(wantsGuion, wantsGuia), docsPrompt, docsSchema,
    );

    return { slides, ...docs };
}

// Layouts "core" del discriminated union principal — ver nota en schema.ts. tabla/pasos NO
// pueden pasar por esta llamada (mismo límite de "compiled grammar" que obligó a separarlos
// en su propia llamada al generar) — si el deck actual tiene alguna, queda AFUERA del ajuste
// y se reinserta intacta en su posición original después.
const CORE_LAYOUTS = new Set(['portada', 'bullets', 'codigo', 'comparacion', 'analogia', 'mapeoIconos', 'problemaAlertas']);

const ADJUST_SLIDES_SYSTEM_PROMPT =
    `Ya existe un set de slides de una clase (te lo paso completo en JSON). El docente pidió un ` +
    `ajuste puntual — aplicalo y devolvé el array COMPLETO de slides actualizado.\n\n` +
    `Reglas estrictas:\n` +
    `- Mantené EXACTAMENTE la misma cantidad de slides, el mismo layout de cada una y el mismo ` +
    `ORDEN — el ajuste es sobre el CONTENIDO (texto, ejemplos, código, redacción), nunca sobre la ` +
    `estructura. Si el pedido implicara agregar o quitar una slide, hacé el mejor ajuste posible ` +
    `DENTRO de las slides existentes en su lugar, sin cambiar cuántas hay.\n` +
    `- No toques ninguna slide que el pedido no mencione ni afecte — copiala EXACTAMENTE tal cual ` +
    `viene, sin reescribirla "de paso".\n` +
    `- Aplicá el pedido de forma completa y real, no superficial ni a medias.`;

// "Pedile un ajuste a la IA" en vez de regenerar todo de cero — la respuesta a que acá no hay
// forma de decirle a Claude "revisá esto de nuevo" como en una conversación normal. Solo opera
// sobre las slides "core" (ver CORE_LAYOUTS); si el ajuste no toca esas, no hay nada que hacer.
async function adjustSlides(allSlides: ClassKitContent['slides'], instruction: string): Promise<ClassKitContent['slides']> {
    const coreEntries = allSlides
        .map((slide, index) => ({ slide, index }))
        .filter((e): e is { slide: Slide; index: number } => CORE_LAYOUTS.has(e.slide.layout));

    if (coreEntries.length === 0) {
        throw new Error('Este set de slides no tiene ninguna slide ajustable con este mecanismo.');
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const stream = anthropic.messages.stream({
        model: 'claude-sonnet-5',
        max_tokens: CLASS_KIT_MAX_TOKENS,
        thinking: { type: 'adaptive' },
        system: ADJUST_SLIDES_SYSTEM_PROMPT,
        messages: [{
            role: 'user',
            content: `Slides actuales (JSON):\n${JSON.stringify(coreEntries.map((e) => e.slide))}\n\nAjuste pedido: ${instruction}`,
        }],
        output_config: { format: zodOutputFormat(SlidesOnlySchema) },
    });

    let message;
    try {
        message = await stream.finalMessage();
    } catch (err) {
        const raw = stream.receivedMessages.at(-1);
        console.error(
            `[generate:adjust_slides] parseo falló — stop_reason=${raw?.stop_reason}, usage=${JSON.stringify(raw?.usage)}`,
        );
        throw err;
    }
    if (message.stop_reason === 'refusal') {
        throw new Error('El modelo rechazó la solicitud');
    }
    if (!message.parsed_output) {
        throw new Error('No se pudo parsear el ajuste de slides');
    }
    const updatedCore = (message.parsed_output as { slides: Slide[] }).slides;
    if (updatedCore.length !== coreEntries.length) {
        throw new Error('El ajuste cambió la cantidad de slides — probá con una instrucción más puntual.');
    }

    const result = [...allSlides];
    coreEntries.forEach((entry, i) => { result[entry.index] = updatedCore[i]; });
    return result;
}

interface RecentWeekSummary {
    title: string | null;
    description: string | null;
    exerciseTitle: string | null;
    exerciseConcepts: string[];
    dictada: boolean;
}

const SuggestNextWeekSchema = z.object({
    title: z.string().describe('Título breve y concreto de la próxima clase, como un título real de plan curricular.'),
    description: z.string().describe('2 a 4 líneas con los subtemas/contenidos concretos de esa clase.'),
    unit: z.enum(['current', 'next']).describe(
        'A qué unidad pertenece este tema: "current" si continúa la unidad indicada como A, "next" si ' +
        'ya corresponde temáticamente a la unidad indicada como B (recién ahí arranca esa unidad). ' +
        'Si no te paso una unidad B, respondé siempre "current".',
    ),
});

const SUGGEST_NEXT_WEEK_SYSTEM_PROMPT =
    `Sos un docente universitario experto decidiendo qué tema sigue en un curso que se ajusta ` +
    `semana a semana según cómo avanza la clase real — no un plan fijo escrito una sola vez. ` +
    `Proponés SOLO la próxima clase (título + descripción), nunca varias semanas de un plan, ni ` +
    `contenido completo (eso se genera aparte, después).\n\n` +
    `Reglas:\n` +
    `- Si te paso contexto real (documento técnico del proyecto, o semanas/ejercicios anteriores), ` +
    `el tema propuesto tiene que ser la continuación lógica de ESE contenido real — no repitas un ` +
    `concepto ya cubierto ni propongas un salto que no tenga sentido con lo que ya se vio.\n` +
    `- Si NO te paso contexto real (primera clase de la unidad o del curso), proponé un punto de ` +
    `partida razonable según la materia, su descripción y el stack, sin inventar que hay historia previa.\n` +
    `- El título debe ser corto y concreto, como el título de una clase real — no un objetivo genérico.\n` +
    `- La descripción lista subtemas/contenidos concretos de esa clase (mismo estilo que un plan ` +
    `curricular real), no una explicación de por qué la elegiste.\n` +
    `- Entre las semanas recientes que te paso, cada una está marcada como "ya dictada" o "planificada, ` +
    `no dictada aún". Las planificadas son títulos que el docente ya cargó por adelantado pero todavía no ` +
    `dio en clase — tratalas como continuidad temática válida (no repitas su contenido), pero no asumas ` +
    `que el estudiante ya vio ese material en la práctica.\n` +
    `- Cuando una semana reciente tiene "Conceptos ya practicados en ese ejercicio", esos conceptos son ` +
    `la fuente de verdad de lo que el estudiante YA construyó en la práctica — más confiable que el título ` +
    `o la descripción de la semana, que son solo el plan. Es común que un ejercicio real vaya más lejos ` +
    `de lo que su título sugiere (ej. una semana "introductoria" cuyo ejercicio ya construyó una clase ` +
    `completa con constructor y getters). NO propongas como tema nuevo algo que esa lista ya cubre — andá ` +
    `directo al siguiente concepto real que falte, aunque el título de la semana anterior sonara más básico.\n` +
    `- Si te paso información de una unidad B además de la unidad A actual, decidís vos a qué unidad ` +
    `pertenece el tema que proponés, comparando el tema natural que sigue contra la descripción y los ` +
    `temas ya cubiertos de cada unidad — nunca por defecto ni por conteo de semanas. Recién cruzás a la ` +
    `unidad B cuando el tema que corresponde dar a continuación ya es, en contenido real, un tema de esa ` +
    `unidad — no antes.`;

async function generateSuggestNextWeek(params: {
    subjectName: string;
    subjectDescription?: string;
    courseMode: string | null;
    techStack?: string;
    technicalDocument?: string;
    recentWeeks?: RecentWeekSummary[];
    unitAName: string;
    unitADescription?: string;
    unitAWeekTitles: string[];
    unitBName?: string;
    unitBDescription?: string;
}): Promise<{ title: string; description: string; unit: 'current' | 'next' }> {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const parts: string[] = [`Materia: ${params.subjectName}.`];
    if (params.subjectDescription?.trim()) parts.push(`Descripción de la materia: ${params.subjectDescription.trim()}.`);
    if (params.techStack?.trim()) parts.push(`Stack tecnológico: ${params.techStack.trim()}.`);

    const unitABits = [`Unidad actual (A): ${params.unitAName}.`];
    if (params.unitADescription?.trim()) unitABits.push(`Descripción: ${params.unitADescription.trim()}.`);
    if (params.unitAWeekTitles.length > 0) unitABits.push(`Temas ya cargados en esta unidad: ${params.unitAWeekTitles.join(', ')}.`);
    parts.push(unitABits.join(' '));

    if (params.unitBName?.trim()) {
        const unitBBits = [`Próxima unidad (B) del plan, todavía sin empezar: ${params.unitBName.trim()}.`];
        if (params.unitBDescription?.trim()) unitBBits.push(`Descripción: ${params.unitBDescription.trim()}.`);
        parts.push(unitBBits.join(' '));
    }

    // Igual que en class_kit: 'topics' y 'project' nunca se mezclan — cada uno manda su propio
    // contexto real, y si no hay ninguno (primera clase) se lo decimos explícitamente en vez de
    // dejar que el modelo asuma que existe historia previa.
    if (params.courseMode === 'project' && params.technicalDocument?.trim()) {
        parts.push(`Documento técnico actual del proyecto (lo que efectivamente se construyó hasta ahora):\n${params.technicalDocument.trim()}`);
    } else if (params.courseMode === 'topics' && params.recentWeeks && params.recentWeeks.length > 0) {
        const recentText = params.recentWeeks
            .map((w, i) => {
                const estado = w.dictada ? 'ya dictada' : 'planificada, no dictada aún';
                const bits = [`${i + 1}. (${estado}) ${w.title ?? '(sin título)'}`];
                if (w.description) bits.push(`   ${w.description}`);
                if (w.exerciseTitle) bits.push(`   Ejercicio ya dado: ${w.exerciseTitle}`);
                if (w.exerciseConcepts.length > 0) bits.push(`   Conceptos ya practicados en ese ejercicio: ${w.exerciseConcepts.join(', ')}`);
                return bits.join('\n');
            })
            .join('\n');
        parts.push(`Últimas semanas cargadas (de más antigua a más reciente, máximo 4):\n${recentText}`);
    } else {
        parts.push('No hay clases anteriores registradas todavía — es el punto de partida del curso o de la unidad.');
    }

    const stream = anthropic.messages.stream({
        model: 'claude-sonnet-5',
        max_tokens: 2048,
        system: SUGGEST_NEXT_WEEK_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: parts.join('\n\n') }],
        output_config: { format: zodOutputFormat(SuggestNextWeekSchema) },
    });

    let message;
    try {
        message = await stream.finalMessage();
    } catch (err) {
        const raw = stream.receivedMessages.at(-1);
        console.error(
            `[generate:suggest_next_week] parseo falló — stop_reason=${raw?.stop_reason}, usage=${JSON.stringify(raw?.usage)}`,
        );
        throw err;
    }
    if (message.stop_reason === 'refusal') {
        throw new Error('El modelo rechazó la solicitud');
    }
    if (!message.parsed_output) {
        throw new Error('No se pudo parsear la sugerencia de próxima semana');
    }
    return message.parsed_output as { title: string; description: string; unit: 'current' | 'next' };
}

// Examen con N versiones paralelas — pensado para tomar en clase, cada estudiante/fila
// recibe una versión distinta pero de dificultad y alcance técnico IDÉNTICOS (evita copia
// sin volver el examen más fácil o difícil entre versiones). No es un array-of-union como
// los layouts de Class Kit (ver nota junto a ExtraSlidesSchema) — es un array de UN solo
// shape repetido N veces, mucho más barato para el compilador de structured outputs, así
// que no hay riesgo del límite "compiled grammar is too large" acá.
const EXAM_SYSTEM_PROMPT =
    `Sos un docente universitario diseñando una evaluación práctica con MÚLTIPLES VERSIONES ` +
    `paralelas para tomar en clase — cada estudiante o fila recibe una versión distinta pero ` +
    `de dificultad y estructura IDÉNTICA entre sí, para evitar copia sin volver el examen más ` +
    `fácil o difícil según la versión.\n\n` +
    `Reglas estrictas:\n` +
    `- TODAS las versiones deben tener EXACTAMENTE la misma estructura: mismo número de ` +
    `requisitos, mismo nivel de dificultad, mismos conceptos técnicos evaluados (ej. si una ` +
    `versión pide manejar una entrada no numérica y un índice fuera de rango con un bloque de ` +
    `limpieza final, TODAS las versiones piden exactamente esas mismas excepciones) — solo cambia el dominio ` +
    `de negocio (nombres de clase, atributos, mensajes) entre versiones, nunca la dificultad ` +
    `ni el alcance técnico.\n` +
    `- Cada versión necesita un dominio de negocio distinto y realista (ej. consultorio, ` +
    `taller, tienda, servicio técnico, salón) — nunca el mismo dominio en dos versiones, y ` +
    `nunca un dominio genérico tipo "Sistema X".\n` +
    `- menu: texto EXACTO tal como se muestra en consola, mismas opciones en todas las ` +
    `versiones (solo cambia el nombre del dominio en el título del menú).\n` +
    `- requisitos: instrucciones paso a paso, concretas y evaluables, con el mismo nivel de ` +
    `precisión que un enunciado real de examen — nunca descripciones vagas tipo "maneje los ` +
    `errores". Cada "detalle" tiene que especificar, según aplique:\n` +
    `  · Atributos: nombre exacto, tipo exacto y visibilidad/encapsulamiento según el lenguaje ` +
    `(ej. "atributo placa de tipo texto, privado").\n` +
    `  · Constructor: qué parámetros recibe y con qué valores queda inicializado cada ` +
    `atributo.\n` +
    `  · Getters/accesores: nombre exacto de cada uno, siguiendo la convención del lenguaje ` +
    `(incluida la de atributos booleanos).\n` +
    `  · Setters con validación: la condición EXACTA que valida y el mensaje de error LITERAL ` +
    `que imprime si no se cumple (ej. 'si costo <= 0, imprimir "Error: el costo debe ser mayor ` +
    `a cero" y no modificar el atributo').\n` +
    `  · Excepciones a manejar: nombre exacto de cada excepción REAL del lenguaje y el mensaje literal que debe ` +
    `imprimir cada catch (usá "subitems" para listar casos especiales o excepciones puntuales).\n` +
    `- instrucciones: reglas generales del examen (herramientas permitidas, qué entregar, que ` +
    `el programa no debe cerrarse abruptamente ante una entrada inválida) — NUNCA menciones ` +
    `tiempo estimado ni puntaje ahí, esos los define el docente aparte.\n` +
    `- Si te paso contexto real de semanas/ejercicios anteriores, el examen tiene que evaluar ` +
    `contenido YA visto en clase — no un tema que todavía no se dictó.`;

// Materias por proyecto (apps web/móviles completas que crecen semana a semana): el examen no
// es un programa de consola con menú sino una funcionalidad sobre el proyecto REAL del curso.
// Las versiones no pueden cambiar de dominio (el proyecto es uno solo) — cambian la entidad o
// módulo del proyecto sobre el que se aplica la misma técnica.
const EXAM_PROJECT_SYSTEM_PROMPT =
    `Sos un docente universitario diseñando una evaluación práctica para una materia donde los ` +
    `estudiantes construyen una aplicación completa (web o móvil) que crece semana a semana. El ` +
    `examen pide implementar una funcionalidad SOBRE ESE PROYECTO, con MÚLTIPLES VERSIONES ` +
    `paralelas para evitar copia.\n\n` +
    `Reglas estrictas:\n` +
    `- Si te paso el documento técnico del proyecto, el examen tiene que construir sobre ESA ` +
    `arquitectura real: mismas carpetas, convenciones, entidades, rutas y librerías. Nunca ` +
    `propongas un proyecto paralelo ni otra arquitectura. Si no te lo paso, planteá una ` +
    `funcionalidad autocontenida coherente con el tema y el stack, sin inventar que existe ` +
    `código previo concreto.\n` +
    `- NO es un programa de consola: nunca pidas un menú de consola ni "imprimir" en consola. ` +
    `Omití el campo "menu".\n` +
    `- TODAS las versiones evalúan exactamente la misma técnica con la misma dificultad y la ` +
    `misma cantidad de requisitos (ej. si una pide un formulario con validaciones, navegación a ` +
    `un detalle y persistencia vía API, todas piden eso mismo). Solo cambia la entidad o módulo ` +
    `del proyecto sobre el que se aplica (ej. versión A sobre productos, B sobre clientes, C ` +
    `sobre pedidos). Si el proyecto no tiene suficientes entidades, agregá entidades nuevas ` +
    `plausibles para ese mismo dominio, coherentes con la arquitectura.\n` +
    `- nombrePrograma: nombre corto de la funcionalidad de esa versión (ej. "Gestión de categorías").\n` +
    `- contexto: qué funcionalidad se agrega al proyecto y por qué, sobre qué entidad, y qué ` +
    `parte del proyecto existente se reutiliza.\n` +
    `- requisitos: concretos y evaluables, con el mismo nivel de precisión que un enunciado real ` +
    `— nunca vagos tipo "que funcione bien". Cada "detalle" especifica, según aplique: ruta ` +
    `exacta de cada archivo a crear o modificar; pantallas/componentes y los elementos que ` +
    `muestran; rutas o endpoints (método, URL, cuerpo, respuesta); modelo o estado involucrado; ` +
    `validaciones con la condición EXACTA y el mensaje LITERAL que ve el usuario en la interfaz; ` +
    `estados de carga, vacío y error; y el comportamiento esperado de punta a punta. Usá ` +
    `"subitems" para casos especiales.\n` +
    `- entregable: qué entrega exactamente el estudiante (ej. rama o commit con la funcionalidad, ` +
    `archivos modificados, capturas o video corto de la funcionalidad andando).\n` +
    `- instrucciones: reglas generales del examen (herramientas permitidas, qué entregar, que la ` +
    `app no debe romperse ante entradas inválidas) — NUNCA menciones tiempo estimado ni ` +
    `puntaje, esos los define el docente aparte.\n` +
    `- El examen evalúa contenido YA visto en clase según el contexto que te paso — nunca un ` +
    `tema que todavía no se dictó.`;

async function generateExam(params: {
    subjectName: string;
    subjectDescription?: string;
    weekTopic: string;
    techStack?: string;
    numVersiones: number;
    exercisePreviousTitles?: string[];
    courseMode?: string | null;
    projectContext?: string;
}): Promise<Exam> {
    const isProject = params.courseMode === 'project';
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const parts: string[] = [
        `Materia: ${params.subjectName}.`,
        `Tema a evaluar: ${params.weekTopic}.`,
        `Generá EXACTAMENTE ${params.numVersiones} versiones paralelas (campo "version": "A", "B", "C", ...).`,
    ];
    if (params.subjectDescription?.trim()) parts.push(`Descripción de la materia: ${params.subjectDescription.trim()}.`);
    if (params.techStack?.trim()) parts.push(`Stack tecnológico: ${params.techStack.trim()}.`);
    parts.push(languageConventionsRule(params.subjectName, params.techStack).trim());
    if (params.exercisePreviousTitles && params.exercisePreviousTitles.length > 0) {
        parts.push(`Temas ya dictados en semanas anteriores (el examen debe evaluar contenido de esta lista o del tema indicado, nunca algo no visto): ${params.exercisePreviousTitles.join(', ')}.`);
    }
    if (isProject && params.projectContext?.trim()) {
        parts.push(`Documento técnico del proyecto hasta esta semana (arquitectura y convenciones reales):\n${params.projectContext.trim()}`);
    }

    const stream = anthropic.messages.stream({
        model: 'claude-sonnet-5',
        max_tokens: CLASS_KIT_MAX_TOKENS,
        system: isProject ? EXAM_PROJECT_SYSTEM_PROMPT : EXAM_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: parts.join('\n\n') }],
        output_config: { format: zodOutputFormat(ExamSchema) },
    });

    let message;
    try {
        message = await stream.finalMessage();
    } catch (err) {
        const raw = stream.receivedMessages.at(-1);
        console.error(
            `[generate:exam] parseo falló — stop_reason=${raw?.stop_reason}, usage=${JSON.stringify(raw?.usage)}`,
        );
        throw err;
    }
    if (message.stop_reason === 'refusal') {
        throw new Error('El modelo rechazó la solicitud');
    }
    if (!message.parsed_output) {
        throw new Error('No se pudo parsear el examen');
    }
    return message.parsed_output as Exam;
}

export async function POST(request: NextRequest) {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    try {
        const {
            type, topic, subjectName, weekTopic,
            previousWeekTopic, nextWeekTopic, exerciseContext, projectContext,
            previousDocument, techStack, include,
            subjectDescription, courseMode, technicalDocument, recentWeeks,
            exerciseProjectContext, exercisePreviousTitles,
            unitAName, unitADescription, unitAWeekTitles, unitBName, unitBDescription,
            numVersiones, slides, instruction,
            nivelDificultad, cantidadPractica, cantidadTarea,
        } = await request.json() as {
            type: string;
            topic?: string;
            subjectName?: string;
            weekTopic?: string;
            previousWeekTopic?: string;
            nextWeekTopic?: string;
            exerciseContext?: string;
            projectContext?: string;
            previousDocument?: string;
            techStack?: string;
            include?: string[];
            subjectDescription?: string;
            courseMode?: string | null;
            technicalDocument?: string;
            recentWeeks?: RecentWeekSummary[];
            exerciseProjectContext?: string;
            exercisePreviousTitles?: string[];
            unitAName?: string;
            unitADescription?: string;
            unitAWeekTitles?: string[];
            unitBName?: string;
            unitBDescription?: string;
            numVersiones?: number;
            slides?: ClassKitContent['slides'];
            instruction?: string;
            nivelDificultad?: string;
            cantidadPractica?: number;
            cantidadTarea?: number;
        };

        if (type === 'adjust_slides') {
            if (!slides || !slides.length || !instruction?.trim()) {
                return NextResponse.json({ error: 'Missing required fields: slides and instruction' }, { status: 400 });
            }
            const updatedSlides = await adjustSlides(slides, instruction.trim());
            return NextResponse.json({ slides: updatedSlides });
        }

        if (type === 'exam') {
            if (!subjectName || !weekTopic || !numVersiones) {
                return NextResponse.json({ error: 'Missing required fields: subjectName, weekTopic and numVersiones' }, { status: 400 });
            }
            if (numVersiones < 1 || numVersiones > 12) {
                return NextResponse.json({ error: 'numVersiones debe estar entre 1 y 12' }, { status: 400 });
            }
            const exam = await generateExam({
                subjectName,
                subjectDescription: subjectDescription?.trim() || undefined,
                weekTopic,
                techStack: techStack?.trim() || undefined,
                numVersiones,
                exercisePreviousTitles,
                courseMode: courseMode ?? null,
                projectContext: projectContext?.trim() || undefined,
            });
            return NextResponse.json({ exam });
        }

        if (type === 'suggest_next_week') {
            if (!subjectName || !unitAName) {
                return NextResponse.json({ error: 'Missing required fields: subjectName and unitAName' }, { status: 400 });
            }
            const result = await generateSuggestNextWeek({
                subjectName,
                subjectDescription: subjectDescription?.trim() || undefined,
                courseMode: courseMode ?? null,
                techStack: techStack?.trim() || undefined,
                technicalDocument: technicalDocument?.trim() || undefined,
                recentWeeks,
                unitAName,
                unitADescription: unitADescription?.trim() || undefined,
                unitAWeekTitles: unitAWeekTitles ?? [],
                unitBName: unitBName?.trim() || undefined,
                unitBDescription: unitBDescription?.trim() || undefined,
            });
            return NextResponse.json(result);
        }

        if (type === 'class_kit') {
            if (!subjectName || !weekTopic) {
                return NextResponse.json({ error: 'Missing required fields: subjectName and weekTopic' }, { status: 400 });
            }
            // "slides" es siempre el mínimo indispensable — si no se manda `include` (o viene
            // vacío/inválido) se asume el kit completo, igual que antes de este cambio.
            const includeList = Array.isArray(include) && include.length > 0
                ? include
                : ['slides', 'guionDocente', 'guiaTecnica'];
            const content = await generateClassKit(
                subjectName,
                weekTopic,
                previousWeekTopic?.trim() || undefined,
                nextWeekTopic?.trim() || undefined,
                exerciseContext?.trim() || undefined,
                projectContext?.trim() || undefined,
                techStack?.trim() || undefined,
                {
                    guionDocente: includeList.includes('guionDocente'),
                    guiaTecnica: includeList.includes('guiaTecnica'),
                },
            );
            return NextResponse.json({ content });
        }

        if (type === 'technical_doc') {
            if (!subjectName || !weekTopic) {
                return NextResponse.json({ error: 'Missing required fields: subjectName and weekTopic' }, { status: 400 });
            }
            const { document, truncated } = await generateTechnicalDoc(
                subjectName,
                weekTopic,
                previousDocument?.trim() ? previousDocument : undefined,
                techStack?.trim() || undefined,
            );
            return NextResponse.json({ document }, truncated ? { headers: { [TRUNCATED_HEADER]: '1' } } : undefined);
        }

        if (!type || !topic) {
            return NextResponse.json({ error: 'Missing required fields: type and topic' }, { status: 400 });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        // thinkingLevel LOW en curriculum/exercises/guide a propósito — "comportamiento por
        // defecto sin latencia extra": son generaciones de un solo tiro donde la velocidad
        // importa más que el razonamiento profundo (a diferencia de generateTechnicalDoc, que
        // usa HIGH porque analiza el documento acumulado completo antes de extenderlo).
        const LOW_LATENCY_THINKING = { thinkingLevel: ThinkingLevel.LOW };

        if (type === 'curriculum') {
            const prompt =
                `Eres un experto en educación universitaria. Busca en internet las tendencias más actuales de ${topic} en 2026. ` +
                `Genera un plan curricular de 16 semanas para una asignatura universitaria sobre ${topic}, agrupado en unidades temáticas lógicas. ` +
                `Responde SOLO en JSON sin markdown: ` +
                `{ "summary": "máximo 3 líneas sobre tendencias actuales", "units": [{ "name": "nombre de la unidad", "order": 1, "weeks": [{ "number": 1, "title": "título conciso", "topics": ["tema1", "tema2"], "justification": "máximo 1 línea" }] }] }`;
            const result = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: prompt,
                config: {
                    maxOutputTokens: 8192,
                    thinkingConfig: LOW_LATENCY_THINKING,
                    tools: [{ googleSearch: {} }],
                },
            });
            return geminiJsonResponse('curriculum', result);
        }

        if (type === 'exercises') {
            if (!topic) {
                return NextResponse.json({ error: 'Missing required field: topic' }, { status: 400 });
            }
            const practica = cantidadPractica ?? 1;
            const tarea = cantidadTarea ?? 2;
            // Presupuesto escalado por cantidad total de ejercicios — cada uno trae código de
            // solución completo (lo más pesado del payload), así que un pedido de "genera 5 de
            // práctica y 5 de tarea" con el techo fijo de antes (32768) se truncaba seguido.
            const exercisesMaxTokens = Math.min(65536, 8192 + (practica + tarea) * 6000);
            const result = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: buildExercisesPrompt({
                    topic,
                    subjectName: subjectName?.trim() || undefined,
                    techStack: techStack?.trim() || undefined,
                    courseMode,
                    exerciseProjectContext,
                    exercisePreviousTitles,
                    nivelDificultad: nivelDificultad?.trim() || 'intermedio',
                    cantidadPractica: practica,
                    cantidadTarea: tarea,
                }),
                config: {
                    maxOutputTokens: exercisesMaxTokens,
                    thinkingConfig: LOW_LATENCY_THINKING,
                },
            });
            return geminiJsonResponse('exercises', result);
        }

        const promptFn = PROMPTS[type];
        if (!promptFn) {
            return NextResponse.json({ error: `Invalid type. Must be one of: curriculum, exercises, ${Object.keys(PROMPTS).join(', ')}` }, { status: 400 });
        }

        const result = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: promptFn(topic, techStack?.trim() || undefined),
            config: {
                maxOutputTokens: MAX_OUTPUT_TOKENS[type] ?? DEFAULT_MAX_OUTPUT_TOKENS,
                thinkingConfig: LOW_LATENCY_THINKING,
            },
        });
        return geminiJsonResponse(type, result);
    } catch (error) {
        console.error('Generate error:', error)
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
    }
}
