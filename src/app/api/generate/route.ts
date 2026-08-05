import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SlidesOnlySchema, GuionDocenteSchema, GuiaTecnicaSchema, ICON_NAMES, type ClassKitContent } from '@/lib/classKit/schema';

const techStackContext = (techStack?: string) =>
    techStack?.trim()
        ? `\nCONTEXTO DEL CURSO: el stack tecnológico de la materia es "${techStack.trim()}". ` +
          `Todo código, sintaxis y ejemplos deben usar ese stack — no asumas otro lenguaje o tecnología.\n`
        : '';

// gemini-2.5-flash soporta hasta 65536 tokens de salida. El presupuesto se comparte con los
// "thinking tokens" internos del modelo (a veces >90% del total), así que el JSON visible
// puede truncarse mucho antes de acercarse al límite nominal si el tipo pide contenido extenso.
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;
const MAX_OUTPUT_TOKENS: Partial<Record<string, number>> = {
    // ejercicioClase + variantes de tarea con código de solución completo son bastante más
    // extensos que el resto de los tipos; 8192 se truncaba de forma consistente.
    exercises: 32768,
};

/**
 * Repara JSON truncado por corte de tokens. Primero intenta cerrar la cadena/objeto/array
 * que quedó abierto sin perder contenido; si eso no basta, recorta hasta el último separador
 * de valor completo (",") fuera de una cadena y reintenta desde ahí — así un objeto ya completo
 * (ej. ejercicioClase) sobrevive aunque el siguiente (ej. una variante de ejerciciosTarea) se
 * haya cortado a medias.
 */
function repairTruncatedJson(raw: string): unknown {
    const text = raw.trim().replace(/```json|```/g, '').trim();

    try {
        return JSON.parse(text);
    } catch {
        // seguir reparando abajo
    }

    const closed = closeOpenJson(text);
    if (closed) {
        try {
            return JSON.parse(closed);
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
                return JSON.parse(candidate);
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

const PROMPTS: Record<string, (topic: string, techStack?: string) => string> = {
    slides: (topic, techStack) =>
        `Eres un docente universitario experto. Genera una presentación académica COMPLETA sobre ${topic} para estudiantes universitarios de tecnología. ` +
        techStackContext(techStack) +
        `\n\nREGLAS IMPORTANTES:\n` +
        `- NO uses markdown (**negrita**, *itálica*) en ningún punto\n` +
        `- Cada punto debe ser una explicación completa de 1-2 líneas\n` +
        `- Incluye conceptos técnicos precisos con terminología correcta\n` +
        `- Agrega ejemplos concretos y casos de uso reales\n` +
        `- El contenido debe ser de nivel universitario, no básico\n` +
        `\nGenera entre 12 y 15 slides con esta estructura:\n` +
        `1. Introducción y contexto del tema\n` +
        `2. Objetivos de aprendizaje (qué sabrá el estudiante al finalizar)\n` +
        `3-12. Contenido técnico progresivo con ejemplos y aplicaciones\n` +
        `13. Caso práctico o ejercicio aplicado\n` +
        `14. Resumen y conclusiones\n` +
        `15. Referencias y recursos adicionales\n` +
        `\nCada slide: máximo 5 puntos, cada punto máximo 2 líneas, sin markdown, con terminología técnica precisa. ` +
        `Responde SOLO en JSON sin markdown ni bloques de código: ` +
        `{ "slides": [{ "title": "", "points": [], "keyword": "" }] }`,
    exercises: (topic, techStack) =>
        `Eres un docente universitario diseñando el ejercicio principal de una clase de programación sobre ${topic}. ` +
        techStackContext(techStack) +
        `\nGenera:\n` +
        `1. UN ejercicio principal de clase (ejercicioClase), no una lista de ejercicios sueltos. Debe tener:\n` +
        `   - titulo: título breve del ejercicio.\n` +
        `   - contexto: un escenario de negocio realista y pertinente al tema (ej. para encapsulamiento, algo como ` +
        `"billetera digital" o "sistema de pedidos" — inventa uno que encaje con ${topic}, no uses un dominio genérico).\n` +
        `   - requerimientos: lista paso a paso de qué debe crear el estudiante (clases, atributos con su modificador ` +
        `de acceso, constructor, métodos, validaciones específicas de negocio), usando la sintaxis y convenciones del ` +
        `lenguaje/stack indicado.\n` +
        `   - solucionDocente: el código COMPLETO que resuelve el ejercicio, en un campo separado del contexto y los ` +
        `requerimientos (esta parte se oculta/muestra aparte en la interfaz, para poder proyectar solo el enunciado en clase).\n` +
        `2. Opcionalmente HASTA 2 variantes para tarea en casa (ejerciciosTarea, máximo 2 — no más): mismo patrón completo (titulo, contexto, ` +
        `requerimientos, solucionDocente), cada una con un dominio de negocio DISTINTO al del ejercicio de clase y entre sí. ` +
        `No son simplificaciones del ejercicio de clase — son ejercicios paralelos de dificultad equivalente.\n` +
        `Responde en español, SOLO en formato JSON sin markdown ni bloques de código: ` +
        `{ "ejercicioClase": { "titulo": "", "contexto": "", "requerimientos": [], "solucionDocente": "" }, ` +
        `"ejerciciosTarea": [{ "titulo": "", "contexto": "", "requerimientos": [], "solucionDocente": "" }] }`,
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

// TODO(Fase 2): mover este tipo a Claude (claude-sonnet-5) cuando se integre @anthropic-ai/sdk.
async function generateTechnicalDoc(subjectName: string, weekTopic: string, previousDocument?: string, techStack?: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { maxOutputTokens: 16384 },
    });
    const result = await model.generateContent(technicalDocPrompt(subjectName, weekTopic, previousDocument, techStack));
    let text = result.response.text().trim();
    // Por si el modelo envuelve la respuesta en un bloque de código
    text = text.replace(/^```(?:markdown|md)?\n/, '').replace(/\n```$/, '').trim();
    return text;
}

const CLASS_KIT_PEDAGOGY =
    `Eres un docente universitario experto diseñando el kit completo de una clase de programación, con el mismo ` +
    `nivel de detalle y concreción que un docente experimentado escribiría para sí mismo antes de dar la clase — ` +
    `nombres exactos de archivos, rutas, variables y comandos, nunca genérico ni superficial.\n\n` +
    `Principios pedagógicos OBLIGATORIOS, aplican a todas las materias:\n` +
    `- Muestra el problema antes que la solución (ej. el bug o dolor que motiva el concepto nuevo).\n` +
    `- Conecta la clase explícitamente con la anterior cuando aplique (referencia el tema previo si el ` +
    `contexto del tema de la semana lo sugiere).\n` +
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
    `seguirlo sin improvisar en vivo:\n` +
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

async function generateClassKit(
    subjectName: string,
    weekTopic: string,
    techStack: string | undefined,
    include: ClassKitInclude,
): Promise<ClassKitContent> {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const contextSuffix = techStackContext(techStack);

    async function callClaude<T>(label: string, system: string, userPrompt: string, schema: Parameters<typeof zodOutputFormat>[0]): Promise<T> {
        const stream = anthropic.messages.stream({
            model: 'claude-sonnet-5',
            max_tokens: CLASS_KIT_MAX_TOKENS,
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

    const slidesPrompt = `Materia: ${subjectName}. Tema de la clase de esta semana: ${weekTopic}.` + contextSuffix;
    const { slides } = await callClaude<{ slides: ClassKitContent['slides'] }>(
        'slides', SLIDES_SYSTEM_PROMPT, slidesPrompt, SlidesOnlySchema,
    );

    const { guionDocente: wantsGuion, guiaTecnica: wantsGuia } = include;
    if (!wantsGuion && !wantsGuia) {
        // Kit de solo slides: la segunda llamada (guionDocente/guiaTecnica) se omite por
        // completo, no se genera contenido para descartar después.
        return { slides };
    }

    const slidesSummary = slides
        .map((s, i) => `${i + 1}. [${s.layout}] ${'titulo' in s ? s.titulo : s.nombreAnalogia}`)
        .join('\n');
    const docsPrompt =
        `Materia: ${subjectName}. Tema de la clase de esta semana: ${weekTopic}.` + contextSuffix +
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

export async function POST(request: NextRequest) {
    try {
        const { type, topic, modality, hoursPerWeek, subjectName, weekTopic, previousDocument, techStack, include } = await request.json() as {
            type: string;
            topic?: string;
            modality?: string;
            hoursPerWeek?: number;
            subjectName?: string;
            weekTopic?: string;
            previousDocument?: string;
            techStack?: string;
            include?: string[];
        };

        if (type === 'class_kit') {
            if (!subjectName || !weekTopic) {
                return NextResponse.json({ error: 'Missing required fields: subjectName and weekTopic' }, { status: 400 });
            }
            // "slides" es siempre el mínimo indispensable — si no se manda `include` (o viene
            // vacío/inválido) se asume el kit completo, igual que antes de este cambio.
            const includeList = Array.isArray(include) && include.length > 0
                ? include
                : ['slides', 'guionDocente', 'guiaTecnica'];
            const content = await generateClassKit(subjectName, weekTopic, techStack?.trim() || undefined, {
                guionDocente: includeList.includes('guionDocente'),
                guiaTecnica: includeList.includes('guiaTecnica'),
            });
            return NextResponse.json({ content });
        }

        if (type === 'technical_doc') {
            if (!subjectName || !weekTopic) {
                return NextResponse.json({ error: 'Missing required fields: subjectName and weekTopic' }, { status: 400 });
            }
            const document = await generateTechnicalDoc(
                subjectName,
                weekTopic,
                previousDocument?.trim() ? previousDocument : undefined,
                techStack?.trim() || undefined,
            );
            return NextResponse.json({ document });
        }

        if (!type || !topic) {
            return NextResponse.json({ error: 'Missing required fields: type and topic' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

        if (type === 'curriculum') {
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                generationConfig: { maxOutputTokens: 8192 },
                // @ts-expect-error — googleSearch is valid at runtime but missing from SDK types
                tools: [{ googleSearch: {} }],
            });
            const prompt =
                `Eres un experto en educación universitaria. Busca en internet las tendencias más actuales de ${topic} en 2026. ` +
                `Genera un plan curricular de 16 semanas para una asignatura universitaria sobre ${topic}. ` +
                `Modalidad: ${modality ?? 'Presencial'}. Horas semanales: ${hoursPerWeek ?? 4}. ` +
                `IMPORTANTE sobre la modalidad: ` +
                `El contenido y los temas deben ser EXACTAMENTE LOS MISMOS independientemente de la modalidad. ` +
                `Lo que cambia según las horas es la PROFUNDIDAD de cada tema: ` +
                `1 hora (línea): tema introductorio, conceptos clave sin práctica extensa; ` +
                `2 horas (semi): conceptos + ejercicio práctico básico; ` +
                `3-4 horas (presencial): conceptos + práctica + ejercicio aplicado. ` +
                `Agrega un campo 'depth' por semana que indique el nivel de profundidad sugerido según las horas disponibles. ` +
                `Agrupa las semanas en unidades temáticas lógicas. ` +
                `Responde SOLO en JSON sin markdown: ` +
                `{ "summary": "máximo 3 líneas sobre tendencias actuales", "units": [{ "name": "nombre de la unidad", "order": 1, "weeks": [{ "number": 1, "title": "título conciso", "topics": ["tema1", "tema2"], "depth": "descripción de qué tan profundo ir según las horas", "justification": "máximo 1 línea" }] }] }`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();

            let parsed;
            try {
                parsed = repairTruncatedJson(text);
            } catch (err) {
                console.error(`[generate:curriculum] parseo falló — finishReason=${result.response.candidates?.[0]?.finishReason}, length=${text.length}`);
                throw err;
            }
            return NextResponse.json(parsed);
        }

        const promptFn = PROMPTS[type];
        if (!promptFn) {
            return NextResponse.json({ error: `Invalid type. Must be one of: curriculum, ${Object.keys(PROMPTS).join(', ')}` }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS[type] ?? DEFAULT_MAX_OUTPUT_TOKENS }
        });

        const result = await model.generateContent(promptFn(topic, techStack?.trim() || undefined));
        const text = result.response.text();

        let parsed;
        try {
            parsed = repairTruncatedJson(text);
        } catch (err) {
            console.error(`[generate:${type}] parseo falló — finishReason=${result.response.candidates?.[0]?.finishReason}, length=${text.length}`);
            throw err;
        }

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('Generate error:', error)
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
    }
}
