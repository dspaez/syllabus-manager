import { languageConventionsRule, techStackContext } from './shared';

// Prompts de ejercicios — usados por /api/generate (generación interna con Gemini) y por
// "Copiar prompt para el chat" en GenerateWithAI.tsx: mismo texto en los dos caminos, así lo
// que se importa desde un chat web tiene el mismo formato y el mismo anclaje al contexto real.

const DIFFICULTY_LABELS: Record<string, string> = {
    basico: 'Básico',
    intermedio: 'Intermedio',
    avanzado: 'Avanzado',
};

const DIFFICULTY_GUIDANCE: Record<string, string> = {
    basico: 'conceptos fundamentales del tema únicamente, pocos pasos, SIN combinar varias técnicas a la vez ' +
        'ni agregar un menú interactivo salvo que el tema mismo lo requiera.',
    intermedio: 'combina 2 o 3 técnicas del tema en un solo ejercicio, incluye al menos una validación o caso ' +
        'especial real, y puede tener un menú interactivo simple (bucle que se repite hasta elegir salir) con pocas opciones.',
    avanzado: 'integra el tema con conceptos YA vistos en semanas anteriores (ver contexto más abajo si lo hay), ' +
        'incluye varias validaciones/casos especiales reales, y un flujo de programa más completo — normalmente ' +
        'un menú interactivo (bucle que se repite hasta elegir salir) con varias opciones que ejercitan distintas ' +
        'partes de la arquitectura.',
};

const PROJECT_DIFFICULTY_GUIDANCE: Record<string, string> = {
    basico: 'una sola pieza del proyecto (una pantalla, un componente o un endpoint) aplicando el tema de ' +
        'forma directa, sin combinar varias técnicas a la vez.',
    intermedio: 'una funcionalidad chica de punta a punta (ej. pantalla + validación + llamada a la API o ' +
        'persistencia) que combina 2 o 3 técnicas del tema, con al menos un caso de error real.',
    avanzado: 'una funcionalidad completa que integra el tema con lo ya construido en semanas anteriores, ' +
        'con varios estados (carga, vacío, error), validaciones reales y reutilización de la arquitectura existente.',
};

// Materias por proyecto (apps web/móviles): la plantilla de exercisesPrompt es de consola/POO
// (menú, imprimir, atributos/getters/setters) y no encaja con construir una app. Acá los
// requisitos se escriben en términos de archivos, pantallas, componentes, rutas y estado,
// siempre dentro de la arquitectura del documento técnico si existe.
function projectExercisesPrompt(
    topic: string,
    subjectName: string | undefined,
    techStack: string | undefined,
    exerciseProjectContext: string | undefined,
    nivelDificultad: string,
    cantidadPractica: number,
    cantidadTarea: number,
): string {
    const contextBlock = exerciseProjectContext?.trim()
        ? `\nDocumento técnico real del proyecto hasta este punto del curso — TODOS los ejercicios se construyen ` +
          `sobre esta arquitectura (mismas carpetas, convenciones, entidades y librerías); un proyecto o stack ` +
          `paralelo NO:\n${exerciseProjectContext.trim()}\n`
        : `\nTodavía no hay documento técnico del proyecto: planteá ejercicios autocontenidos coherentes con el ` +
          `tema y el stack, sin inventar que existe código previo concreto.\n`;
    const difficultyKey = PROJECT_DIFFICULTY_GUIDANCE[nivelDificultad] ? nivelDificultad : 'intermedio';

    return (
        `Eres un docente universitario diseñando ejercicios de práctica sobre ${topic}` +
        (subjectName?.trim() ? `, en la materia "${subjectName.trim()}"` : '') +
        `, donde los estudiantes construyen una aplicación completa (web o móvil) que crece semana a semana. ` +
        `Precisión y detalle de un docente experimentado — nunca genérico ni superficial.\n` +
        techStackContext(techStack) +
        languageConventionsRule(subjectName, techStack) +
        contextBlock +
        `\nNivel de dificultad pedido: ${DIFFICULTY_LABELS[difficultyKey]}. ${PROJECT_DIFFICULTY_GUIDANCE[difficultyKey]}\n` +
        `\nIMPORTANTE sobre el alcance: practicar EXACTAMENTE lo que describe "${topic}", ajustado al nivel de ` +
        `dificultad — no te adelantes a técnicas de temas que todavía no se vieron.\n` +
        `\nNO son programas de consola: nunca pidas un menú de consola ni "imprimir" en consola. Omití el campo ` +
        `"menu" por completo.\n` +
        `\nNIVEL DE DETALLE OBLIGATORIO en "requerimientos" — cada ítem preciso y evaluable, según aplique:\n` +
        `- Ruta exacta de cada archivo a crear o modificar dentro del proyecto.\n` +
        `- Pantallas/componentes: qué elementos muestran y cómo responden a la interacción.\n` +
        `- Rutas de navegación o endpoints: método, URL, cuerpo y respuesta esperada.\n` +
        `- Modelo de datos o estado que se agrega o modifica.\n` +
        `- Validaciones: la condición EXACTA y el mensaje LITERAL que ve el usuario en la interfaz.\n` +
        `- Estados de carga, vacío y error cuando haya datos remotos.\n` +
        `\nGenerá:\n` +
        `1. ${cantidadPractica} ejercicio(s) de práctica (ejerciciosPractica) — cada uno sobre una funcionalidad ` +
        `DISTINTA del proyecto. Cada uno debe tener:\n` +
        `   - titulo: título breve.\n` +
        `   - contexto: qué funcionalidad se agrega a la app y por qué, y qué parte existente se reutiliza.\n` +
        `   - requerimientos: lista paso a paso con el nivel de detalle exigido arriba.\n` +
        `   - checklist: 5 a 10 preguntas de autoevaluación tipo "¿Por qué...?" o "¿Qué pasaría si...?" sobre ` +
        `decisiones concretas del ejercicio (ej. "¿Qué ve el usuario si la API responde con error?") — NUNCA ` +
        `reveles la respuesta.\n` +
        `   - conceptos: 3 a 6 conceptos técnicos concretos que se practican (se usa para no repetir contenido ` +
        `en semanas futuras).\n` +
        `   - solucionDocente: el código COMPLETO, organizado por archivo — antes de cada archivo una línea de ` +
        `comentario con su ruta exacta (ej. "// archivo: src/screens/ProductoForm.tsx").\n` +
        `2. ${cantidadTarea} variante(s) para tarea en casa (ejerciciosTarea) — misma técnica y dificultad ` +
        `equivalente, aplicada a OTRA entidad o módulo del mismo proyecto (mismo patrón: titulo, contexto, ` +
        `requerimientos, checklist, solucionDocente — sin "conceptos", ese campo es solo de ejerciciosPractica). ` +
        `No son simplificaciones.\n` +
        `Si ${cantidadPractica} o ${cantidadTarea} es 0, devolvé un array vacío para ese campo, no lo omitas.\n` +
        `Responde en español, SOLO en formato JSON sin markdown ni bloques de código: ` +
        `{ "ejerciciosPractica": [{ "titulo": "", "contexto": "", "requerimientos": [], "checklist": [], "conceptos": [], "solucionDocente": "" }], ` +
        `"ejerciciosTarea": [{ "titulo": "", "contexto": "", "requerimientos": [], "checklist": [], "solucionDocente": "" }] }`
    );
}

// Plantilla de consola/POO para materias por temas (Programación, POO, Fundamentos, IA) —
// las materias por proyecto usan projectExercisesPrompt. Separado del mapa genérico PROMPTS
// (a diferencia de guide) porque ancla a los títulos y conceptos de las últimas semanas ya
// dictadas, para no repetir. Si no hay contexto real, no se inventa que sí existe.
function exercisesPrompt(
    topic: string,
    subjectName: string | undefined,
    techStack: string | undefined,
    exercisePreviousTitles: string[] | undefined,
    nivelDificultad: string,
    cantidadPractica: number,
    cantidadTarea: number,
): string {
    const contextBlock = exercisePreviousTitles && exercisePreviousTitles.length > 0
        ? `\nTemas y ejercicios de semanas anteriores marcadas por el docente como YA DICTADAS (nunca semanas ` +
          `solo planificadas o con título cargado pero sin dar todavía — esas quedan afuera de esta lista a ` +
          `propósito): no repitas los conceptos ya practicados ahí, construí sobre ellos cuando aplique:\n- ${exercisePreviousTitles.join('\n- ')}\n`
        : '';
    const difficultyKey = DIFFICULTY_GUIDANCE[nivelDificultad] ? nivelDificultad : 'intermedio';

    return (
        `Eres un docente universitario diseñando ejercicios de práctica de una clase de programación sobre ${topic}` +
        (subjectName?.trim() ? `, de la materia "${subjectName.trim()}"` : '') +
        `, con el mismo nivel de precisión y detalle que un docente experimentado escribiría para un examen o guía de ` +
        `repaso — nunca genérico ni superficial.\n` +
        techStackContext(techStack) +
        languageConventionsRule(subjectName, techStack) +
        contextBlock +
        `\nNivel de dificultad pedido: ${DIFFICULTY_LABELS[difficultyKey]}. ${DIFFICULTY_GUIDANCE[difficultyKey]}\n` +
        `\nIMPORTANTE sobre el alcance: el ejercicio debe practicar EXACTAMENTE lo que describe "${topic}", ni más ni ` +
        `menos, ajustado al nivel de dificultad de arriba — no te adelantes a incorporar técnicas de temas más ` +
        `avanzados (constructores parametrizados con validaciones, encapsulamiento con getters/setters, herencia, ` +
        `etc.) salvo que el propio tema o el nivel "Avanzado" ya las mencione explícitamente.\n` +
        `\nNIVEL DE DETALLE OBLIGATORIO en "requerimientos" — cada ítem tiene que ser tan preciso y evaluable como ` +
        `esto (no una descripción vaga):\n` +
        `- Atributos: nombre exacto, tipo exacto y visibilidad/encapsulamiento según el lenguaje (ej. "atributo ` +
        `placa de tipo texto, privado").\n` +
        `- Constructor: qué parámetros recibe y con qué valores queda inicializado cada atributo (ej. "el costo ` +
        `inicia en 0.0 porque todavía no se cobró").\n` +
        `- Getters/accesores: nombre exacto de cada uno, siguiendo la convención del lenguaje (incluida la de ` +
        `atributos booleanos — ver CONVENCIONES DEL LENGUAJE).\n` +
        `- Setters con validación: la condición EXACTA que valida y el mensaje de error LITERAL que imprime si no ` +
        `se cumple (ej. 'si costo <= 0, imprimir "Error: el costo debe ser mayor a cero" y no modificar el atributo').\n` +
        `- Si el ejercicio amerita un menú interactivo (ver nivel de dificultad), especificá el menú EXACTO en el ` +
        `campo "menu" (un string por línea, tal como se imprime en consola) y detallá en "requerimientos" qué hace ` +
        `cada opción paso a paso, incluyendo qué excepciones debe manejar cada una y con qué mensaje exacto — igual ` +
        `que un enunciado real de examen. Si el ejercicio NO tiene menú, omití el campo "menu" por completo.\n` +
        `\nGenerá:\n` +
        `1. ${cantidadPractica} ejercicio(s) de práctica (ejerciciosPractica) — NO simplificaciones entre sí, cada ` +
        `uno con dominio de negocio DISTINTO. Cada uno debe tener:\n` +
        `   - titulo: título breve del ejercicio.\n` +
        `   - contexto: un escenario de negocio realista y pertinente al tema (ej. para encapsulamiento, algo como ` +
        `"billetera digital" o "sistema de pedidos" — inventa uno que encaje con ${topic}, no uses un dominio genérico).\n` +
        `   - menu: opcional, ver regla de arriba.\n` +
        `   - requerimientos: lista paso a paso con el nivel de detalle exigido arriba.\n` +
        `   - checklist: lista de 5 a 10 preguntas de autoevaluación tipo "¿Por qué...?" o "¿Qué pasaría si...?" ` +
        `sobre decisiones de diseño concretas del propio ejercicio (ej. "¿Por qué el atributo costo no se puede ` +
        `modificar directamente desde fuera de la clase?") — NUNCA reveles la respuesta, son para que el estudiante se autoevalúe antes de comparar con ` +
        `la solución.\n` +
        `   - conceptos: lista breve (3 a 6 ítems) de los conceptos técnicos concretos que el estudiante practica al ` +
        `resolver este ejercicio (ej. ["instanciación de objetos", "constructores", "getters/setters"]) — se usa ` +
        `para no repetir contenido ya practicado en semanas futuras.\n` +
        `   - solucionDocente: el código COMPLETO (todas las clases/archivos necesarios) que resuelve el ejercicio, ` +
        `en un campo separado del contexto y los requerimientos (esta parte se oculta/muestra aparte en la interfaz).\n` +
        `2. ${cantidadTarea} variante(s) para tarea en casa (ejerciciosTarea) — mismo patrón completo (titulo, ` +
        `contexto, menu opcional, requerimientos, checklist, solucionDocente — sin "conceptos", ese campo es solo de ` +
        `ejerciciosPractica), cada una con un dominio de negocio DISTINTO a los de práctica y entre sí. No son ` +
        `simplificaciones — son ejercicios paralelos de dificultad equivalente.\n` +
        `Si ${cantidadPractica} o ${cantidadTarea} es 0, devolvé un array vacío para ese campo, no lo omitas.\n` +
        `Responde en español, SOLO en formato JSON sin markdown ni bloques de código: ` +
        `{ "ejerciciosPractica": [{ "titulo": "", "contexto": "", "menu": [], "requerimientos": [], "checklist": [], "conceptos": [], "solucionDocente": "" }], ` +
        `"ejerciciosTarea": [{ "titulo": "", "contexto": "", "menu": [], "requerimientos": [], "checklist": [], "solucionDocente": "" }] }`
    );
}

export interface ExercisesPromptParams {
    topic: string;
    subjectName?: string;
    techStack?: string;
    courseMode?: string | null;
    /** 'project': snapshot del documento técnico más reciente hasta esta semana. */
    exerciseProjectContext?: string;
    /** 'topics': semanas anteriores ya dictadas (con sus conceptos practicados). */
    exercisePreviousTitles?: string[];
    nivelDificultad: string;
    cantidadPractica: number;
    cantidadTarea: number;
}

export function buildExercisesPrompt(p: ExercisesPromptParams): string {
    return p.courseMode === 'project'
        ? projectExercisesPrompt(
            p.topic, p.subjectName, p.techStack, p.exerciseProjectContext,
            p.nivelDificultad, p.cantidadPractica, p.cantidadTarea,
        )
        : exercisesPrompt(
            p.topic, p.subjectName, p.techStack, p.exercisePreviousTitles,
            p.nivelDificultad, p.cantidadPractica, p.cantidadTarea,
        );
}

// Solo para el camino del chat web: el docente itera en la conversación ("más difícil",
// "cambiá el dominio") y cada respuesta tiene que seguir siendo importable tal cual.
export const CHAT_ITERATION_NOTE =
    `\n\nIMPORTANTE (conversación): voy a pegar tu respuesta en una aplicación que la valida ` +
    `automáticamente. Respondé solo con el objeto JSON completo, sin texto antes ni después. Si después ` +
    `te pido cambios, devolvé SIEMPRE el JSON completo actualizado (todos los ejercicios, no solo el que ` +
    `cambió), con la misma estructura.`;
