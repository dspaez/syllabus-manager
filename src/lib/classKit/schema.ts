import { z } from 'zod';

// Lista cerrada de íconos — el modelo elige de acá, nunca texto libre.
// Cada nombre se mapea a un componente real de react-icons/fi en el renderer.
export const ICON_NAMES = [
    'user', 'users', 'book-open', 'copy', 'alert-triangle', 'code', 'database', 'server',
    'terminal', 'settings', 'link', 'layers', 'git-branch', 'shield', 'zap', 'file-text',
    'folder', 'cpu', 'globe', 'lock', 'box', 'key', 'clock', 'check-circle', 'package',
] as const;
export type IconName = (typeof ICON_NAMES)[number];

// NOTA: en pruebas reales, el SDK de Anthropic degrada z.enum()/z.literal() a un
// `description` de texto en el JSON schema del structured output (no emite un `enum`
// real) — Claude lo trata como guía fuerte, no como restricción forzada por el schema.
// Por eso "icono" es z.string() aquí: la lista cerrada se aplica en el prompt Y en el
// mapeo del renderer (con fallback si llega un nombre fuera de lista), no en la
// validación zod — así un ícono inesperado no tumba todo el kit al validar antes de
// renderizar. "layout" sí se mantiene como z.literal() porque es la columna vertebral
// del discriminated union: si no coincide, el contenido ya es estructuralmente inválido.
const IconNameField = z.string().describe(
    `Uno de: ${ICON_NAMES.join(', ')}.`,
);

// ── Los 7 layouts de slide ──────────────────────────────────────────────────

const PortadaSlideSchema = z.object({
    layout: z.literal('portada'),
    titulo: z.string().describe('Título llamativo de TODA la clase — no el tema puntual de una slide suelta.'),
    tags: z.array(z.string()).describe('3 a 5 tags cortos de temas/tecnologías clave de la clase.'),
    speakerNotes: z.string(),
});

const BulletItemSchema = z.object({
    titulo: z.string().describe('Frase corta y fuerte del punto.'),
    detalle: z.string().optional().describe('Detalle complementario en el mismo bullet.'),
});

const BulletsSlideSchema = z.object({
    layout: z.literal('bullets'),
    kicker: z.string().describe('Etiqueta corta arriba del título, ej. "Repaso" o "Plan de hoy".'),
    titulo: z.string(),
    bullets: z.array(BulletItemSchema).describe('Máximo 5 — no entran más en la tarjeta.'),
    speakerNotes: z.string(),
});

const CodigoSlideSchema = z.object({
    layout: z.literal('codigo'),
    kicker: z.string(),
    titulo: z.string(),
    explicacion: z.string().optional().describe('Una frase de contexto arriba del bloque de código.'),
    code: z.string().describe('Código COMPLETO y correcto en el stack de la materia, breve — es una slide, no la guía técnica.'),
    speakerNotes: z.string(),
});

const ComparacionColumnaSchema = z.object({
    header: z.string().describe('Título corto de la columna, ej. "Sin herencia".'),
    sub: z.string().optional().describe('Subtítulo breve, ej. un fragmento de código.'),
    items: z.array(z.string()),
});

const ComparacionSlideSchema = z.object({
    layout: z.literal('comparacion'),
    kicker: z.string(),
    titulo: z.string(),
    colA: ComparacionColumnaSchema,
    colB: ComparacionColumnaSchema,
    speakerNotes: z.string(),
});

const AnalogiaSlideSchema = z.object({
    layout: z.literal('analogia'),
    kicker: z.string(),
    nombreAnalogia: z.string().describe('Nombre corto de la analogía, ej. "La analogía del formulario base".'),
    texto: z.string(),
    conexionTecnica: z.string().optional().describe('Cómo la analogía se traduce a código/conceptos reales.'),
    speakerNotes: z.string(),
});

const MapeoItemSchema = z.object({
    icono: IconNameField,
    nombre: z.string(),
    subtitulo: z.string().optional().describe('Referencia técnica corta, ej. "class Persona".'),
    descripcion: z.string(),
});

const MapeoIconosSlideSchema = z.object({
    layout: z.literal('mapeoIconos'),
    kicker: z.string(),
    titulo: z.string(),
    contexto: z.string().optional(),
    items: z.array(MapeoItemSchema).describe('Entre 2 y 5 elementos — se distribuyen en columnas iguales.'),
    speakerNotes: z.string(),
});

const ProblemaAlertasSlideSchema = z.object({
    layout: z.literal('problemaAlertas'),
    kicker: z.string(),
    titulo: z.string(),
    centro: z.object({
        icono: IconNameField,
        nombre: z.string(),
        detalle: z.string().optional(),
    }),
    sintomas: z.array(z.string()).describe('2 a 4 síntomas o consecuencias del problema.'),
    speakerNotes: z.string(),
});

export const SlideSchema = z.discriminatedUnion('layout', [
    PortadaSlideSchema,
    BulletsSlideSchema,
    CodigoSlideSchema,
    ComparacionSlideSchema,
    AnalogiaSlideSchema,
    MapeoIconosSlideSchema,
    ProblemaAlertasSlideSchema,
]);

export type Slide = z.infer<typeof SlideSchema>;
export type PortadaSlide = z.infer<typeof PortadaSlideSchema>;
export type BulletsSlide = z.infer<typeof BulletsSlideSchema>;
export type CodigoSlide = z.infer<typeof CodigoSlideSchema>;
export type ComparacionSlide = z.infer<typeof ComparacionSlideSchema>;
export type AnalogiaSlide = z.infer<typeof AnalogiaSlideSchema>;
export type MapeoIconosSlide = z.infer<typeof MapeoIconosSlideSchema>;
export type ProblemaAlertasSlide = z.infer<typeof ProblemaAlertasSlideSchema>;

// ── Guión docente y guía técnica (sin cambios en Fase 2 / Parte 2) ─────────

const AnalogiaGuionSchema = z.object({
    nombre: z.string().describe('Nombre corto de la analogía, ej. "Analogía del restaurante".'),
    texto: z.string(),
});

const PreguntaInteractivaSchema = z.object({
    pregunta: z.string().describe('Pregunta literal para hacerle al grupo.'),
    respuestaEsperada: z.string(),
});

const ResumenMomentoSchema = z.object({
    momento: z.string().describe('Nombre del bloque de la clase, ej. "Arranque y revisión tarea".'),
    tiempoEstimado: z.string().describe('Ej. "3 min".'),
    slidesInvolucradas: z.string().describe('Rango o número de slide(s), ej. "1-2" o "4".'),
});

export const GuionItemSchema = z.object({
    slideRef: z.number(),
    minuto: z.string().describe('Rango de tiempo dentro de la clase, ej. "00:00-05:00".'),
    queMuestra: z.string().describe('Qué contenido visual tiene la slide — descripción corta, no el contenido completo.'),
    comoPresentarlo: z.string().describe('Cómo presentar esta slide en clase: demo, pregunta, lectura directa, etc.'),
    queDecir: z.string(),
    queHacer: z.string(),
    pausaPara: z.string(),
    analogiaNombrada: AnalogiaGuionSchema.optional().describe('Solo si esta slide se apoya en una analogía del mundo real.'),
    preguntaInteractiva: PreguntaInteractivaSchema.optional().describe('Solo si hay una pregunta concreta para activar al grupo aquí.'),
    ganchoSiguiente: z.string().optional().describe('Frase de transición hacia la próxima slide, si aplica.'),
});

const ResumenPasoSchema = z.object({
    paso: z.number(),
    accion: z.string(),
    tiempoEstimado: z.string(),
});

const ErrorComunSchema = z.object({
    error: z.string().describe('Mensaje de error tal como lo vería el estudiante.'),
    causa: z.string(),
    solucion: z.string(),
});

export const GuiaPasoSchema = z.object({
    paso: z.number(),
    titulo: z.string(),
    ubicacion: z.string().describe('Ruta del archivo en el proyecto, o "Terminal" si el paso es solo un comando.'),
    codigo: z.string(),
    comandoTerminal: z.string().optional(),
    advertencia: z.string().optional().describe('Callout tipo "Ojo con..." — solo si hay algo puntual que advertir en este paso.'),
});

export const GuionDocenteSchema = z.object({
    resumen: z.array(ResumenMomentoSchema).describe('Tabla resumen de los bloques de tiempo de toda la clase.'),
    antesDeClase: z.array(z.string()).describe('Checklist de verificaciones previas a la clase (servidor corriendo, archivo vacío para vivo, git status limpio, etc. — infiere según el tema y el stack).'),
    items: z.array(GuionItemSchema),
});

export const GuiaTecnicaSchema = z.object({
    resumen: z.array(ResumenPasoSchema).describe('Tabla resumen de todos los pasos técnicos.'),
    preFlight: z.array(z.string()).describe('Checklist a verificar antes de empezar el live coding.'),
    pasos: z.array(GuiaPasoSchema),
    erroresComunes: z.array(ErrorComunSchema).describe('Mínimo 3-4 errores frecuentes y relevantes al tema de esta clase específica.'),
});

// Separado en 2 sub-schemas usables de forma independiente (SlidesOnlySchema / DocsOnlySchema):
// el schema combinado completo excede el límite de complejidad del compilador de structured
// outputs de Claude ("The compiled grammar is too large") una vez que se suma el discriminated
// union de 7 layouts a guionDocente+guiaTecnica — la generación real se divide en 2 llamadas
// (ver generateClassKit en api/generate/route.ts).
export const SlidesOnlySchema = z.object({ slides: z.array(SlideSchema) });
export const DocsOnlySchema = z.object({ guionDocente: GuionDocenteSchema, guiaTecnica: GuiaTecnicaSchema });

// guionDocente/guiaTecnica son opcionales: el docente puede pedir un kit de solo slides
// (ver GenerateClassKit.tsx — checkboxes de qué partes generar). "slides" es el único
// bloque siempre presente, el mínimo indispensable de un class kit.
export const ClassKitContentSchema = z.object({
    slides: z.array(SlideSchema),
    guionDocente: GuionDocenteSchema.optional(),
    guiaTecnica: GuiaTecnicaSchema.optional(),
});

export type GuionItem = z.infer<typeof GuionItemSchema>;
export type GuiaPaso = z.infer<typeof GuiaPasoSchema>;
export type GuionDocente = z.infer<typeof GuionDocenteSchema>;
export type GuiaTecnica = z.infer<typeof GuiaTecnicaSchema>;
export type ClassKitContent = z.infer<typeof ClassKitContentSchema>;
